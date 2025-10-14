"""
DynamoDB operations for collaborators.

This module provides database operations for collaborator management including
listing collaborators, adding/removing collaborators, and checking access permissions.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, UTC
from boto3.dynamodb.conditions import Key, Attr

# Add common module to path - works both locally and in containers
def _add_common_to_path():
    """Add common module to Python path, supporting both local and container environments."""
    # Try container path first (common is copied to /app/common)
    container_common = Path("/app/common")
    if container_common.exists():
        if str(container_common.parent) not in sys.path:
            sys.path.append(str(container_common.parent))
        return

    # Try local development path
    services_dir = Path(__file__).resolve().parents[3]
    if (services_dir / "common").exists():
        if str(services_dir) not in sys.path:
            sys.path.append(str(services_dir))
        return

    # Fallback: try relative to current file
    current_dir = Path(__file__).resolve().parent
    for _ in range(5):  # Go up max 5 levels
        common_dir = current_dir / "common"
        if common_dir.exists():
            if str(current_dir) not in sys.path:
                sys.path.append(str(current_dir))
            return
        current_dir = current_dir.parent

_add_common_to_path()

from common.logging import get_structured_logger
from ..models.collaborator import CollaboratorResponse, CollaboratorListResponse
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("collaboration-db", env_flag="COLLABORATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

class CollaborationDBError(Exception):
    """Custom exception for collaboration database operations."""
    pass

class CollaborationNotFoundError(CollaborationDBError):
    """Exception raised when a collaboration is not found."""
    pass

class CollaborationPermissionError(CollaborationDBError):
    """Exception raised when user doesn't have permission for the operation."""
    pass

def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    settings = _get_settings()
    import boto3
    dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
    return dynamodb.Table(settings.dynamodb_table_name)


def _get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user profile by user ID (for test compatibility).

    Args:
        user_id: User ID to look up

    Returns:
        User profile dict or None
    """
    table = _get_dynamodb_table()
    try:
        response = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})
        if "Item" in response:
            item = response["Item"]
            return {
                "userId": item["userId"],
                "username": item.get("username"),
                "email": item.get("email")
            }
        return None
    except Exception:
        return None


def _enrich_collaborator_with_user_data(collaborator: CollaboratorResponse, table) -> CollaboratorResponse:
    """Enrich collaborator data with actual user profile information."""
    try:
        # Get user profile using correct SK pattern
        user_profile = table.get_item(Key={"PK": f"USER#{collaborator.user_id}", "SK": f"PROFILE#{collaborator.user_id}"})
        if "Item" in user_profile:
            profile = user_profile["Item"]
            # Update with actual user data, prioritizing nickname
            collaborator.username = profile.get("nickname") or profile.get("username", "Unknown")
            collaborator.avatar_url = profile.get("avatarUrl")
            
            # Handle lastSeenAt field safely
            last_seen_value = profile.get("lastSeenAt")
            if last_seen_value:
                if isinstance(last_seen_value, str):
                    collaborator.last_seen_at = datetime.fromisoformat(last_seen_value)
                elif isinstance(last_seen_value, datetime):
                    collaborator.last_seen_at = last_seen_value
    except Exception as e:
        logger.warning(f"collaboration.enrich_collaborator_failed - user_id={collaborator.user_id}, error={str(e)}")
    
    return collaborator


def _collaborator_item_to_response(item: Dict[str, Any]) -> CollaboratorResponse:
    """Convert DynamoDB collaborator item to CollaboratorResponse."""
    
    # Handle joinedAt field safely
    joined_at_value = item.get("joinedAt")
    if isinstance(joined_at_value, str):
        try:
            joined_at = datetime.fromisoformat(joined_at_value)
        except (ValueError, TypeError):
            joined_at = datetime.now(UTC)
    elif isinstance(joined_at_value, datetime):
        joined_at = joined_at_value
    else:
        joined_at = datetime.now(UTC)
    
    # Handle lastSeenAt field safely
    last_seen_value = item.get("lastSeenAt")
    last_seen_at = None
    if last_seen_value:
        if isinstance(last_seen_value, str):
            try:
                last_seen_at = datetime.fromisoformat(last_seen_value)
            except (ValueError, TypeError):
                last_seen_at = None
        elif isinstance(last_seen_value, datetime):
            last_seen_at = last_seen_value
    
    return CollaboratorResponse(
        user_id=item["userId"],
        username=item.get("username", "Unknown"),
        avatar_url=item.get("avatarUrl"),
        email=None,  # Don't show email for collaborators
        role=item.get("role", "collaborator"),
        joined_at=joined_at,
        last_seen_at=last_seen_at
    )


def list_collaborators(resource_type: str, resource_id: str) -> CollaboratorListResponse:
    """
    List all collaborators for a specific resource.

    Args:
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        CollaboratorListResponse object

    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Query for all collaborators on this resource
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"

        response = table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("COLLABORATOR#"),
            ScanIndexForward=True  # Sort by joined date (oldest first)
        )

        # Enrich collaborator data with actual user profiles
        collaborators = []
        for item in response.get("Items", []):
            collaborator = _collaborator_item_to_response(item)
            # Enrich with actual user data
            enriched_collaborator = _enrich_collaborator_with_user_data(collaborator, table)
            collaborators.append(enriched_collaborator)

        # Also include the owner if they exist
        # Scan for the resource under USER# to find the owner
        owner_response = table.scan(
            FilterExpression=Attr("SK").eq(f"{resource_type.upper()}#{resource_id}") & Attr("PK").begins_with("USER#")
        )

        if owner_response.get("Items"):
            owner_item = owner_response["Items"][0]
            owner_id = owner_item["PK"].split("#")[1]  # Extract user ID from PK

            # Get owner profile using correct SK pattern
            owner_profile = table.get_item(Key={"PK": f"USER#{owner_id}", "SK": f"PROFILE#{owner_id}"})
            if "Item" in owner_profile:
                profile = owner_profile["Item"]
                # Create owner collaborator entry
                # Handle createdAt field - it might be a datetime object or string
                created_at_value = owner_item.get("createdAt")
                if isinstance(created_at_value, str):
                    joined_at = datetime.fromisoformat(created_at_value)
                elif isinstance(created_at_value, datetime):
                    joined_at = created_at_value
                else:
                    joined_at = datetime.now(UTC)
                
                # Handle lastSeenAt field
                last_seen_value = profile.get("lastSeenAt")
                last_seen_at = None
                if last_seen_value:
                    if isinstance(last_seen_value, str):
                        last_seen_at = datetime.fromisoformat(last_seen_value)
                    elif isinstance(last_seen_value, datetime):
                        last_seen_at = last_seen_value
                
                owner_collaborator = CollaboratorResponse(
                    user_id=owner_id,
                    username=profile.get("nickname") or profile.get("username", "Unknown"),
                    avatar_url=profile.get("avatarUrl"),
                    email=None,  # Don't show email for collaborators
                    role="owner",
                    joined_at=joined_at,
                    last_seen_at=last_seen_at
                )
                collaborators.insert(0, owner_collaborator)  # Insert owner at the beginning

        logger.info('collaboration.list_collaborators_success',
                   resource_type=resource_type,
                   resource_id=resource_id,
                   count=len(collaborators))

        return CollaboratorListResponse(
            collaborators=collaborators,
            resource_type=resource_type,
            resource_id=resource_id,
            total_count=len(collaborators)
        )

    except Exception as e:
        logger.error('collaboration.list_collaborators_failed',
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to list collaborators: {str(e)}")


def remove_collaborator(current_user_id: str, resource_type: str, resource_id: str, user_id: str) -> None:
    """
    Remove a collaborator from a resource.

    Args:
        current_user_id: ID of the user performing the removal
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource
        user_id: ID of the collaborator to remove

    Raises:
        CollaborationNotFoundError: If collaborator is not found
        CollaborationPermissionError: If user doesn't have permission to remove
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Check if current user owns the resource (same logic as invite_db)
        # Check if resource exists under USER#{current_user_id}
        pk = f"USER#{current_user_id}"
        sk = f"{resource_type.upper()}#{resource_id}"
        owner_response = table.get_item(Key={"PK": pk, "SK": sk})
        is_owner = "Item" in owner_response

        # Verify current user has permission (must be resource owner or removing themselves)
        if not is_owner and current_user_id != user_id:
            raise CollaborationPermissionError("Only resource owners can remove other collaborators")

        # Check if collaborator exists
        resource_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        collaborator_sk = f"COLLABORATOR#{user_id}"
        collaborator_response = table.get_item(Key={"PK": resource_pk, "SK": collaborator_sk})
        if "Item" not in collaborator_response:
            raise CollaborationNotFoundError(f"Collaborator {user_id} not found on resource {resource_type}/{resource_id}")

        # Remove collaborator
        table.delete_item(
            Key={"PK": resource_pk, "SK": collaborator_sk},
            ConditionExpression="attribute_exists(PK)"  # Ensure item exists
        )

        # Also clean up any related invite records for this user and resource
        # This prevents the "already invited" error when trying to re-invite
        try:
            invite_filter = Attr("inviteeId").eq(user_id) & Attr("status").is_in(["pending", "accepted"])
            invite_response = table.query(
                KeyConditionExpression=Key("PK").eq(resource_pk) & Key("SK").begins_with("INVITE#"),
                FilterExpression=invite_filter
            )
            
            # Delete any existing invite records for this user
            for invite_item in invite_response.get("Items", []):
                invite_sk = invite_item["SK"]
                table.delete_item(
                    Key={"PK": resource_pk, "SK": invite_sk}
                )
                logger.info('collaboration.cleanup_invite_on_removal',
                           resource_type=resource_type,
                           resource_id=resource_id,
                           removed_user_id=user_id,
                           invite_id=invite_item.get("inviteId"))
                           
        except Exception as cleanup_error:
            # Log cleanup error but don't fail the main operation
            logger.warning('collaboration.invite_cleanup_failed',
                          resource_type=resource_type,
                          resource_id=resource_id,
                          removed_user_id=user_id,
                          error=str(cleanup_error))

        logger.info('collaboration.remove_collaborator_success',
                   current_user_id=current_user_id,
                   resource_type=resource_type,
                   resource_id=resource_id,
                   removed_user_id=user_id)

    except CollaborationNotFoundError:
        raise
    except CollaborationPermissionError:
        raise
    except Exception as e:
        logger.error('collaboration.remove_collaborator_failed',
                    current_user_id=current_user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    user_id=user_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to remove collaborator: {str(e)}")


def cleanup_orphaned_invites(resource_type: str, resource_id: str) -> int:
    """
    Clean up orphaned invite records for users who are no longer collaborators.
    This fixes the issue where removed collaborators cannot be re-invited.
    
    Args:
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource
        
    Returns:
        Number of orphaned invites cleaned up
        
    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        resource_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        
        # Get all current collaborators
        collaborator_response = table.query(
            KeyConditionExpression=Key("PK").eq(resource_pk) & Key("SK").begins_with("COLLABORATOR#"),
            ProjectionExpression="SK"  # Only need the SK to extract user IDs
        )
        
        # Extract current collaborator user IDs
        current_collaborator_ids = set()
        for item in collaborator_response.get("Items", []):
            # SK format: COLLABORATOR#{user_id}
            user_id = item["SK"].replace("COLLABORATOR#", "")
            current_collaborator_ids.add(user_id)
        
        # Get all invite records for this resource
        invite_response = table.query(
            KeyConditionExpression=Key("PK").eq(resource_pk) & Key("SK").begins_with("INVITE#"),
            FilterExpression=Attr("status").is_in(["pending", "accepted"])
        )
        
        # Find orphaned invites (invites for users who are no longer collaborators)
        orphaned_invites = []
        for invite_item in invite_response.get("Items", []):
            invitee_id = invite_item.get("inviteeId")
            if invitee_id and invitee_id not in current_collaborator_ids:
                orphaned_invites.append(invite_item)
        
        # Delete orphaned invites
        cleaned_count = 0
        for invite_item in orphaned_invites:
            invite_sk = invite_item["SK"]
            invitee_id = invite_item.get("inviteeId")
            invite_id = invite_item.get("inviteId")
            
            try:
                table.delete_item(Key={"PK": resource_pk, "SK": invite_sk})
                cleaned_count += 1
                logger.info('collaboration.cleanup_orphaned_invite',
                           resource_type=resource_type,
                           resource_id=resource_id,
                           invitee_id=invitee_id,
                           invite_id=invite_id)
            except Exception as delete_error:
                logger.warning('collaboration.orphaned_invite_delete_failed',
                              resource_type=resource_type,
                              resource_id=resource_id,
                              invitee_id=invitee_id,
                              invite_id=invite_id,
                              error=str(delete_error))
        
        logger.info('collaboration.cleanup_orphaned_invites_complete',
                   resource_type=resource_type,
                   resource_id=resource_id,
                   current_collaborators=len(current_collaborator_ids),
                   total_invites=len(invite_response.get("Items", [])),
                   orphaned_invites=len(orphaned_invites),
                   cleaned_count=cleaned_count)
        
        return cleaned_count
        
    except Exception as e:
        logger.error('collaboration.cleanup_orphaned_invites_failed',
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to cleanup orphaned invites: {str(e)}")


def check_collaborator_access(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Check if a user has collaborator access to a resource.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user has access, False otherwise

    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk = f"COLLABORATOR#{user_id}"

        response = table.get_item(Key={"PK": pk, "SK": sk})

        has_access = "Item" in response

        logger.info('collaboration.check_access',
                   user_id=user_id,
                   resource_type=resource_type,
                   resource_id=resource_id,
                   has_access=has_access)

        return has_access

    except Exception as e:
        logger.error('collaboration.check_access_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to check collaborator access: {str(e)}")


def check_resource_access(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Check if a user has access to a resource (either as owner or collaborator).
    This is the main function that should be used by other services.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user has access (as owner or collaborator), False otherwise

    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # First check if user is the owner
        owner_pk = f"USER#{user_id}"
        owner_sk = f"{resource_type.upper()}#{resource_id}"
        
        owner_response = table.get_item(Key={"PK": owner_pk, "SK": owner_sk})
        if "Item" in owner_response:
            logger.info('collaboration.check_resource_access_owner',
                       user_id=user_id,
                       resource_type=resource_type,
                       resource_id=resource_id,
                       access_type="owner")
            return True

        # If not owner, check if user is a collaborator
        collaborator_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        collaborator_sk = f"COLLABORATOR#{user_id}"
        
        collaborator_response = table.get_item(Key={"PK": collaborator_pk, "SK": collaborator_sk})
        if "Item" in collaborator_response:
            logger.info('collaboration.check_resource_access_collaborator',
                       user_id=user_id,
                       resource_type=resource_type,
                       resource_id=resource_id,
                       access_type="collaborator")
            return True

        # No access found
        logger.info('collaboration.check_resource_access_denied',
                   user_id=user_id,
                   resource_type=resource_type,
                   resource_id=resource_id)
        return False

    except Exception as e:
        logger.error('collaboration.check_resource_access_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to check resource access: {str(e)}")


def list_user_collaborations(user_id: str, resource_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all resources a user collaborates on.

    Args:
        user_id: ID of the user
        resource_type: Optional filter for resource type

    Returns:
        List of collaboration resources with basic info

    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Query GSI1 for user's collaborations
        gsi1pk = f"USER#{user_id}"

        # Build key condition expression based on resource type
        if resource_type:
            # If filtering by resource type, include it in the key condition
            gsi1sk_prefix = f"COLLAB#{resource_type}#"
            key_condition = Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with(gsi1sk_prefix)
        else:
            # If no resource type filter, get all collaborations
            key_condition = Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with("COLLAB#")

        query_params = {
            "IndexName": "GSI1",
            "KeyConditionExpression": key_condition,
            "ScanIndexForward": False  # Most recent first
        }

        logger.info('collaboration.list_user_collaborations_query',
                   user_id=user_id,
                   resource_type=resource_type,
                   gsi1pk=gsi1pk,
                   query_params=query_params)

        response = table.query(**query_params)

        logger.info('collaboration.list_user_collaborations_query_result',
                   user_id=user_id,
                   resource_type=resource_type,
                   items_count=len(response.get("Items", [])),
                   raw_items=response.get("Items", [])[:3])  # Log first 3 items for debugging

        collaborations = []
        for item in response.get("Items", []):
            # Parse the GSI1SK to extract resource info
            # Format: COLLAB#{resourceType}#{joinedAt}
            gsi1sk_parts = item["GSI1SK"].split("#")
            if len(gsi1sk_parts) >= 3:
                collab_resource_type = gsi1sk_parts[1].lower()
                joined_at = gsi1sk_parts[2]

                collaborations.append({
                    "resourceType": collab_resource_type,
                    "resourceId": item.get("resourceId"),
                    "resourceTitle": item.get("resourceTitle", f"Untitled {collab_resource_type}"),
                    "joinedAt": joined_at,
                    "role": item.get("role", "collaborator")
                })

        logger.info('collaboration.list_user_collaborations_success',
                   user_id=user_id,
                   resource_type=resource_type,
                   count=len(collaborations))

        return collaborations

    except Exception as e:
        logger.error('collaboration.list_user_collaborations_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to list user collaborations: {str(e)}")


def add_collaborator(resource_type: str, resource_id: str, user_id: str, role: str = "collaborator") -> None:
    """
    Add a collaborator to a resource (used internally when invites are accepted).

    Args:
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource
        user_id: ID of the user to add as collaborator
        role: Role of the collaborator (default: collaborator)

    Raises:
        CollaborationDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Get user profile information for enrichment
        user_profile = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})

        # Build collaborator item
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk = f"COLLABORATOR#{user_id}"
        gsi1pk = f"USER#{user_id}"
        gsi1sk = f"COLLAB#{resource_type}#{datetime.now(UTC).isoformat()}"

        collaborator_item = {
            "PK": pk,
            "SK": sk,
            "GSI1PK": gsi1pk,
            "GSI1SK": gsi1sk,
            "type": "Collaborator",
            "userId": user_id,
            "resourceType": resource_type,
            "resourceId": resource_id,
            "role": role,
            "joinedAt": datetime.now(UTC).isoformat(),
            "lastSeenAt": datetime.now(UTC).isoformat()
        }

        # Add user profile data if available
        if "Item" in user_profile:
            profile = user_profile["Item"]
            collaborator_item.update({
                "username": profile.get("username", profile.get("nickname", "Unknown")),
                "email": profile.get("email"),
                "avatarUrl": profile.get("avatarUrl")
            })

        # Add resource title for user collaborations
        # TODO: This could be enriched by querying the actual resource
        collaborator_item["resourceTitle"] = f"Untitled {resource_type}"

        # Store in DynamoDB
        table.put_item(Item=collaborator_item)

        logger.info('collaboration.add_collaborator_success',
                   resource_type=resource_type,
                   resource_id=resource_id,
                   user_id=user_id,
                   role=role)

    except Exception as e:
        logger.error('collaboration.add_collaborator_failed',
                    resource_type=resource_type,
                    resource_id=resource_id,
                    user_id=user_id,
                    role=role,
                    error=str(e),
                    exc_info=e)
        raise CollaborationDBError(f"Failed to add collaborator: {str(e)}")

