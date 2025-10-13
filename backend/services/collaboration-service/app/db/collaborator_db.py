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


def _collaborator_item_to_response(item: Dict[str, Any]) -> CollaboratorResponse:
    """Convert DynamoDB collaborator item to CollaboratorResponse."""
    return CollaboratorResponse(
        user_id=item["userId"],
        username=item.get("username", "Unknown"),
        email=item.get("email"),
        avatar_url=item.get("avatarUrl"),
        role=item.get("role", "collaborator"),
        joined_at=datetime.fromisoformat(item["joinedAt"]),
        last_seen_at=datetime.fromisoformat(item["lastSeenAt"]) if item.get("lastSeenAt") else None
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

        collaborators = [_collaborator_item_to_response(item) for item in response.get("Items", [])]

        # Also include the owner if they exist
        # Scan for the resource under USER# to find the owner
        owner_response = table.scan(
            FilterExpression=Attr("SK").eq(f"{resource_type.upper()}#{resource_id}") & Attr("PK").begins_with("USER#")
        )

        if owner_response.get("Items"):
            owner_item = owner_response["Items"][0]
            owner_id = owner_item["PK"].split("#")[1]  # Extract user ID from PK

            # Get owner profile
            owner_profile = table.get_item(Key={"PK": f"USER#{owner_id}", "SK": "PROFILE"})
            if "Item" in owner_profile:
                profile = owner_profile["Item"]
                # Create owner collaborator entry
                owner_collaborator = CollaboratorResponse(
                    user_id=owner_id,
                    username=profile.get("username", "Unknown"),
                    email=profile.get("email"),
                    avatar_url=profile.get("avatarUrl"),
                    role="owner",
                    joined_at=datetime.fromisoformat(owner_item.get("createdAt", datetime.now(UTC).isoformat())),  # Use resource creation time
                    last_seen_at=datetime.fromisoformat(profile.get("lastSeenAt")) if profile.get("lastSeenAt") else None
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

        # Build filter for resource type if specified
        filter_expr = None
        if resource_type:
            filter_expr = Key("GSI1SK").begins_with(f"COLLAB#{resource_type}#")

        response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with("COLLAB#"),
            FilterExpression=filter_expr,
            ScanIndexForward=False  # Most recent first
        )

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

