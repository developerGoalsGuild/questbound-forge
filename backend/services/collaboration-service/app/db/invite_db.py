"""
DynamoDB operations for collaboration invitations.

This module provides database operations for invitation management including
creation, acceptance, decline, and listing operations.
"""

import time
from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional, Any
from uuid import uuid4
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import BotoCoreError, ClientError

import sys
from pathlib import Path

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

from ..models.invite import InviteCreatePayload, InviteResponse, InviteListResponse, InviteStatus
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("collaboration-invite-db", env_flag="COLLABORATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


class CollaborationInviteDBError(Exception):
    """Custom exception for collaboration invite database operations."""
    pass


class CollaborationInviteNotFoundError(CollaborationInviteDBError):
    """Exception raised when an invite is not found."""
    pass


class CollaborationInvitePermissionError(CollaborationInviteDBError):
    """Exception raised when user doesn't have permission for the operation."""
    pass


class CollaborationInviteValidationError(CollaborationInviteDBError):
    """Exception raised when invite validation fails."""
    pass


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    settings = _get_settings()
    import boto3
    dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
    return dynamodb.Table(settings.dynamodb_table_name)


def _verify_resource_ownership(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Verify that a user owns a specific resource.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user owns the resource, False otherwise
    """
    table = _get_dynamodb_table()

    try:
        # Check if user is the owner of the resource
        # First check if resource exists under USER#{user_id} (primary ownership)
        pk = f"USER#{user_id}"
        sk = f"{resource_type.upper()}#{resource_id}"

        response = table.get_item(Key={"PK": pk, "SK": sk})
        if "Item" in response:
            return True

        # For backwards compatibility/tests: check if resource exists as a separate entity
        # Only allow if there's an explicit owner record for this user
        resource_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        response = table.query(
            KeyConditionExpression=Key("PK").eq(resource_pk) & Key("SK").begins_with("OWNER#"),
            Limit=1
        )

        # Only allow ownership if there's an explicit owner record for this user
        return any(
            item.get("userId") == user_id for item in response.get("Items", [])
        )

    except Exception as e:
        logger.error('collaboration.verify_ownership_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False


def _lookup_invitee(identifier: str) -> Optional[Dict[str, Any]]:
    """
    Look up a user by email or nickname.

    Args:
        identifier: Email address or nickname to look up

    Returns:
        User info dict with userId, username, email if found, None otherwise
    """
    table = _get_dynamodb_table()

    try:
        if "@" in identifier:
            # Look up by email using GSI3 (email lookup index)
            logger.info(f"collaboration.lookup_invitee_by_email - email={identifier}")
            response = table.query(
                IndexName="GSI3",
                KeyConditionExpression=Key("GSI3PK").eq(f"EMAIL#{identifier}")
            )

            if not response.get("Items"):
                # Fallback: scan for email in profile records (for tests/backwards compatibility)
                logger.info(f"collaboration.lookup_invitee_fallback_scan - email={identifier}")
                response = table.scan(
                    FilterExpression=Attr("email").eq(identifier) & Attr("SK").begins_with("PROFILE#")
                )
        else:
            # Look up by nickname
            logger.info(f"collaboration.lookup_invitee_by_nickname - nickname={identifier}")
            response = table.scan(
                FilterExpression=Attr("nickname").eq(identifier) & Attr("SK").begins_with("PROFILE#")
            )

        if response.get("Items"):
            user_item = response["Items"][0]
            logger.info(f"collaboration.lookup_invitee_success - user_id={user_item.get('id')}, email={user_item.get('email')}, nickname={user_item.get('nickname')}")
            return {
                "userId": user_item.get("id"),
                "username": user_item.get("nickname"),
                "email": user_item.get("email")
            }

        logger.warning(f"collaboration.lookup_invitee_not_found - identifier={identifier}")
        return None

    except Exception as e:
        logger.error(f"collaboration.invitee_lookup_failed - identifier={identifier}, error={str(e)}", exc_info=e)
        return None


def _get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get user by email address (for test compatibility).

    Args:
        email: Email address to look up

    Returns:
        User info dict or None
    """
    return _lookup_invitee(email)


def _get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Get user by username (for test compatibility).

    Args:
        username: Username to look up

    Returns:
        User info dict or None
    """
    return _lookup_invitee(username)


def _get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user by user ID (for test compatibility).

    Args:
        user_id: User ID to look up

    Returns:
        User info dict or None
    """
    table = _get_dynamodb_table()
    try:
        response = table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"})
        if "Item" in response:
            item = response["Item"]
            return {
                "userId": item.get("id") or item.get("userId"),
                "username": item.get("username"),
                "nickname": item.get("nickname"),
                "email": item.get("email")
            }
        return None
    except Exception as e:
        logger.error(f"collaboration.invite.get_user_by_id_failed - user_id={user_id}, error={str(e)}")
        return None


def _get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user profile by user ID (for test compatibility).

    Args:
        user_id: User ID to look up

    Returns:
        User profile dict or None
    """
    return _get_user_by_id(user_id)


def _get_resource_title_with_owner(resource_type: str, resource_id: str, owner_id: str) -> Optional[str]:
    """
    Get the title of a resource by type, ID, and owner ID.
    This is more efficient as it uses the exact PK/SK pattern.
    
    Args:
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource
        owner_id: ID of the resource owner
        
    Returns:
        Resource title or None if not found
    """
    table = _get_dynamodb_table()
    try:
        if resource_type.lower() == "goal":
            logger.info(f"collaboration.invite.get_goal_title_with_owner - goal_id={resource_id}, owner_id={owner_id}")
            response = table.get_item(
                Key={
                    "PK": f"USER#{owner_id}",
                    "SK": f"GOAL#{resource_id}"
                }
            )
            
            if "Item" in response:
                goal_item = response["Item"]
                goal_title = goal_item.get("title")
                goal_status = goal_item.get("status")
                logger.info(f"collaboration.invite.goal_found_with_owner - goal_id={resource_id}, title={goal_title}, status={goal_status}")
                
                # Check if the status is valid for collaboration
                if goal_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.goal_valid_status - goal_id={resource_id}, status={goal_status}")
                    return goal_title
                else:
                    logger.warning(f"collaboration.invite.goal_invalid_status - goal_id={resource_id}, status={goal_status}")
                    return f"INVALID_STATUS:{goal_status}"
            else:
                logger.warning(f"collaboration.invite.goal_not_found_with_owner - goal_id={resource_id}, owner_id={owner_id}")
                return None
                
        elif resource_type.lower() == "quest":
            logger.info(f"collaboration.invite.get_quest_title_with_owner - quest_id={resource_id}, owner_id={owner_id}")
            response = table.get_item(
                Key={
                    "PK": f"USER#{owner_id}",
                    "SK": f"QUEST#{resource_id}"
                }
            )
            
            if "Item" in response:
                quest_item = response["Item"]
                quest_title = quest_item.get("title")
                quest_status = quest_item.get("status")
                logger.info(f"collaboration.invite.quest_found_with_owner - quest_id={resource_id}, title={quest_title}, status={quest_status}")
                
                # Check if the status is valid for collaboration
                if quest_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.quest_valid_status - quest_id={resource_id}, status={quest_status}")
                    return quest_title
                else:
                    logger.warning(f"collaboration.invite.quest_invalid_status - quest_id={resource_id}, status={quest_status}")
                    return f"INVALID_STATUS:{quest_status}"
            else:
                logger.warning(f"collaboration.invite.quest_not_found_with_owner - quest_id={resource_id}, owner_id={owner_id}")
                return None
                
        elif resource_type.lower() == "task":
            logger.info(f"collaboration.invite.get_task_title_with_owner - task_id={resource_id}, owner_id={owner_id}")
            response = table.get_item(
                Key={
                    "PK": f"USER#{owner_id}",
                    "SK": f"TASK#{resource_id}"
                }
            )
            
            if "Item" in response:
                task_item = response["Item"]
                task_title = task_item.get("title")
                task_status = task_item.get("status")
                logger.info(f"collaboration.invite.task_found_with_owner - task_id={resource_id}, title={task_title}, status={task_status}")
                
                # Check if the status is valid for collaboration
                if task_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.task_valid_status - task_id={resource_id}, status={task_status}")
                    return task_title
                else:
                    logger.warning(f"collaboration.invite.task_invalid_status - task_id={resource_id}, status={task_status}")
                    return f"INVALID_STATUS:{task_status}"
            else:
                logger.warning(f"collaboration.invite.task_not_found_with_owner - task_id={resource_id}, owner_id={owner_id}")
                return None
        else:
            return None
    except Exception as e:
        logger.error(f"collaboration.invite.get_resource_title_with_owner_failed - resource_type={resource_type}, resource_id={resource_id}, owner_id={owner_id}, error={str(e)}")
        return None


def _get_resource_title(resource_type: str, resource_id: str) -> Optional[str]:
    """
    Get the title of a resource by type and ID.
    
    Args:
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource
        
    Returns:
        Resource title or None if not found
    """
    table = _get_dynamodb_table()
    try:
        # Different resource types have different key patterns
        if resource_type.lower() == "goal":
            # Goals are stored with USER# as PK and GOAL# as SK
            # We need to find the goal owner first, then look up the goal
            logger.info(f"collaboration.invite.get_goal_title - goal_id={resource_id}")
            
            # First, scan to find which user owns this goal
            owner_scan = table.scan(
                FilterExpression=Attr("type").eq("Goal") & Attr("id").eq(resource_id),
                ProjectionExpression="PK",
                Limit=1
            )
            
            if not owner_scan.get("Items"):
                logger.warning(f"collaboration.invite.goal_not_found - goal_id={resource_id}")
                return None
                
            # Extract user_id from PK (USER#{user_id})
            pk = owner_scan["Items"][0]["PK"]
            user_id = pk.replace("USER#", "")
            logger.info(f"collaboration.invite.goal_owner_found - goal_id={resource_id}, user_id={user_id}")
            
            # Now get the goal using the exact PK/SK pattern
            goal_response = table.get_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": f"GOAL#{resource_id}"
                }
            )
            
            if "Item" in goal_response:
                goal_item = goal_response["Item"]
                goal_title = goal_item.get("title")
                goal_status = goal_item.get("status")
                logger.info(f"collaboration.invite.goal_found - goal_id={resource_id}, title={goal_title}, status={goal_status}")
                
                # Check if the status is valid for collaboration
                if goal_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.goal_valid_status - goal_id={resource_id}, status={goal_status}")
                    return goal_title
                else:
                    logger.warning(f"collaboration.invite.goal_invalid_status - goal_id={resource_id}, status={goal_status}")
                    # Return a special indicator that the goal exists but has invalid status
                    return f"INVALID_STATUS:{goal_status}"
            else:
                logger.warning(f"collaboration.invite.goal_get_item_failed - goal_id={resource_id}, user_id={user_id}")
                return None
        elif resource_type.lower() == "quest":
            # Quests are stored with USER# as PK and QUEST# as SK
            # We need to find the quest owner first, then look up the quest
            logger.info(f"collaboration.invite.get_quest_title - quest_id={resource_id}")
            
            # First, scan to find which user owns this quest
            owner_scan = table.scan(
                FilterExpression=Attr("type").eq("Quest") & Attr("id").eq(resource_id),
                ProjectionExpression="PK",
                Limit=1
            )
            
            if not owner_scan.get("Items"):
                logger.warning(f"collaboration.invite.quest_not_found - quest_id={resource_id}")
                return None
                
            # Extract user_id from PK (USER#{user_id})
            pk = owner_scan["Items"][0]["PK"]
            user_id = pk.replace("USER#", "")
            logger.info(f"collaboration.invite.quest_owner_found - quest_id={resource_id}, user_id={user_id}")
            
            # Now get the quest using the exact PK/SK pattern
            quest_response = table.get_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": f"QUEST#{resource_id}"
                }
            )
            
            if "Item" in quest_response:
                quest_item = quest_response["Item"]
                quest_title = quest_item.get("title")
                quest_status = quest_item.get("status")
                logger.info(f"collaboration.invite.quest_found - quest_id={resource_id}, title={quest_title}, status={quest_status}")
                
                # Check if the status is valid for collaboration
                if quest_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.quest_valid_status - quest_id={resource_id}, status={quest_status}")
                    return quest_title
                else:
                    logger.warning(f"collaboration.invite.quest_invalid_status - quest_id={resource_id}, status={quest_status}")
                    # Return a special indicator that the quest exists but has invalid status
                    return f"INVALID_STATUS:{quest_status}"
            else:
                logger.warning(f"collaboration.invite.quest_get_item_failed - quest_id={resource_id}, user_id={user_id}")
                return None
        elif resource_type.lower() == "task":
            # Tasks are stored with USER# as PK and TASK# as SK
            # We need to find the task owner first, then look up the task
            logger.info(f"collaboration.invite.get_task_title - task_id={resource_id}")
            
            # First, scan to find which user owns this task
            owner_scan = table.scan(
                FilterExpression=Attr("type").eq("Task") & Attr("id").eq(resource_id),
                ProjectionExpression="PK",
                Limit=1
            )
            
            if not owner_scan.get("Items"):
                logger.warning(f"collaboration.invite.task_not_found - task_id={resource_id}")
                return None
                
            # Extract user_id from PK (USER#{user_id})
            pk = owner_scan["Items"][0]["PK"]
            user_id = pk.replace("USER#", "")
            logger.info(f"collaboration.invite.task_owner_found - task_id={resource_id}, user_id={user_id}")
            
            # Now get the task using the exact PK/SK pattern
            task_response = table.get_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": f"TASK#{resource_id}"
                }
            )
            
            if "Item" in task_response:
                task_item = task_response["Item"]
                task_title = task_item.get("title")
                task_status = task_item.get("status")
                logger.info(f"collaboration.invite.task_found - task_id={resource_id}, title={task_title}, status={task_status}")
                
                # Check if the status is valid for collaboration
                if task_status in ["draft", "active"]:
                    logger.info(f"collaboration.invite.task_valid_status - task_id={resource_id}, status={task_status}")
                    return task_title
                else:
                    logger.warning(f"collaboration.invite.task_invalid_status - task_id={resource_id}, status={task_status}")
                    # Return a special indicator that the task exists but has invalid status
                    return f"INVALID_STATUS:{task_status}"
            else:
                logger.warning(f"collaboration.invite.task_get_item_failed - task_id={resource_id}, user_id={user_id}")
                return None
        else:
            return None
    except Exception as e:
        logger.error(f"collaboration.invite.get_resource_title_failed - resource_type={resource_type}, resource_id={resource_id}, error={str(e)}")
        return None


def _build_invite_item(inviter_id: str, invitee_id: str, invitee_email: str, 
                      payload: InviteCreatePayload, owner_id: str) -> Dict[str, Any]:
    """Build DynamoDB item for collaboration invite."""
    invite_id = str(uuid4())
    created_at = datetime.now(UTC)
    expires_at = created_at + timedelta(days=30)
    
    # Primary key
    pk = f"RESOURCE#{payload.resource_type.upper()}#{payload.resource_id}"
    sk = f"INVITE#{invite_id}"
    
    # GSI1 key for user queries
    gsi1pk = f"USER#{invitee_id}"
    gsi1sk = f"INVITE#pending#{created_at.isoformat()}"
    
    # TTL for automatic cleanup
    ttl = int(expires_at.timestamp())
    
    return {
        "PK": pk,
        "SK": sk,
        "GSI1PK": gsi1pk,
        "GSI1SK": gsi1sk,
        "type": "CollaborationInvite",
        "inviteId": invite_id,
        "inviterId": inviter_id,
        "ownerId": owner_id,  # Store the resource owner ID
        "inviteeId": invitee_id,
        "inviteeEmail": invitee_email,
        "resourceType": payload.resource_type,
        "resourceId": payload.resource_id,
        "status": "pending",
        "message": payload.message,
        "expiresAt": expires_at.isoformat(),
        "createdAt": created_at.isoformat(),
        "updatedAt": created_at.isoformat(),
        "ttl": ttl
    }


def _invite_item_to_response(item: Dict[str, Any]) -> InviteResponse:
    """Convert DynamoDB item to InviteResponse."""
    return InviteResponse(
        invite_id=item["inviteId"],
        inviter_id=item["inviterId"],
        inviter_username=item.get("inviterUsername", "Unknown"),
        invitee_id=item.get("inviteeId"),
        invitee_email=item.get("inviteeEmail"),
        resource_type=item["resourceType"],
        resource_id=item["resourceId"],
        resource_title=item.get("resourceTitle", "Unknown"),
        status=item["status"],
        message=item.get("message"),
        expires_at=datetime.fromisoformat(item["expiresAt"]),
        created_at=datetime.fromisoformat(item["createdAt"]),
        updated_at=datetime.fromisoformat(item["updatedAt"]),
        owner_id=item.get("ownerId")  # Include owner_id if available
    )


def _ddb_call(operation, op: str, **kwargs):
    """Execute DynamoDB operation with error handling and retries."""
    table = _get_dynamodb_table()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            if operation == "put_item":
                return table.put_item(**kwargs)
            elif operation == "get_item":
                return table.get_item(**kwargs)
            elif operation == "update_item":
                return table.update_item(**kwargs)
            elif operation == "delete_item":
                return table.delete_item(**kwargs)
            elif operation == "query":
                return table.query(**kwargs)
            elif operation == "scan":
                return table.scan(**kwargs)
            else:
                raise CollaborationInviteDBError(f"Unknown operation: {operation}")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 0.1  # Exponential backoff
                    time.sleep(wait_time)
                    continue
            raise CollaborationInviteDBError(f"DynamoDB {op} failed: {str(e)}")
        except Exception as e:
            raise CollaborationInviteDBError(f"Unexpected error: {str(e)}")


def create_invite(inviter_id: str, payload: InviteCreatePayload) -> InviteResponse:
    """
    Create a collaboration invitation.
    
    Args:
        inviter_id: ID of the user creating the invitation
        payload: Invitation creation payload
        
    Returns:
        InviteResponse object
        
    Raises:
        CollaborationInviteValidationError: If validation fails
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Verify caller owns the resource
        if not _verify_resource_ownership(inviter_id, payload.resource_type, payload.resource_id):
            raise CollaborationInviteValidationError("User does not own this resource")
        
        # Check if resource is in a valid status for collaboration (draft or active only)
        # Use the efficient lookup since we know the owner (inviter_id)
        resource_title = _get_resource_title_with_owner(payload.resource_type, payload.resource_id, inviter_id)
        if not resource_title:
            raise CollaborationInviteValidationError(
                f"Cannot create collaboration invite for {payload.resource_type}. "
                f"Only {payload.resource_type}s in 'draft' or 'active' status can be shared for collaboration."
            )
        
        # Check if resource title indicates invalid status
        if resource_title.startswith("INVALID_STATUS:"):
            status = resource_title.replace("INVALID_STATUS:", "")
            if payload.resource_type.lower() == "quest":
                raise CollaborationInviteValidationError(
                    f"Cannot create collaboration invite for this quest. "
                    f"You can't invite collaborators for completed, failed, or cancelled quests. "
                    f"Current quest status: {status}"
                )
            elif payload.resource_type.lower() == "goal":
                raise CollaborationInviteValidationError(
                    f"Cannot create collaboration invite for this goal. "
                    f"You can't invite collaborators for completed or archived goals. "
                    f"Current goal status: {status}"
                )
            elif payload.resource_type.lower() == "task":
                raise CollaborationInviteValidationError(
                    f"Cannot create collaboration invite for this task. "
                    f"You can't invite collaborators for completed, failed, or cancelled tasks. "
                    f"Current task status: {status}"
                )
            else:
                raise CollaborationInviteValidationError(
                    f"Cannot create collaboration invite for this {payload.resource_type}. "
                    f"Only {payload.resource_type}s in 'draft' or 'active' status can be shared for collaboration. "
                    f"Current status: {status}"
                )

        # Lookup invitee by email or nickname
        invitee_info = _lookup_invitee(payload.invitee_identifier)
        if not invitee_info:
            if "@" in payload.invitee_identifier:
                raise CollaborationInviteValidationError(
                    f"User with email '{payload.invitee_identifier}' not found. "
                    "Please make sure the user has an account and try using their nickname instead."
                )
            else:
                raise CollaborationInviteValidationError(
                    f"User with nickname '{payload.invitee_identifier}' not found. "
                    "Please check the nickname and try again, or use their email address."
                )

        invitee_id = invitee_info["userId"]
        invitee_email = invitee_info.get("email")

        # Check for duplicate invites
        if check_duplicate_invite(payload.resource_type, payload.resource_id, invitee_id):
            invitee_identifier = payload.invitee_identifier
            raise CollaborationInviteValidationError(
                f"You have already sent a collaboration invite to {invitee_identifier}. "
                "Please wait for them to respond to the existing invite, or check if they have already accepted it."
            )

        # Check if user is already a collaborator
        from .collaborator_db import check_collaborator_access
        if check_collaborator_access(invitee_id, payload.resource_type, payload.resource_id):
            invitee_identifier = payload.invitee_identifier
            raise CollaborationInviteValidationError(
                f"{invitee_identifier} is already a collaborator on this resource. "
                "No invitation is needed as they already have access."
            )
        
        # Build invite item (owner_id is the inviter_id since they own the resource)
        invite_item = _build_invite_item(inviter_id, invitee_id, invitee_email, payload, inviter_id)
        
        # Enrich with actual data
        # Get inviter username
        inviter_profile = _get_user_profile(inviter_id)
        if inviter_profile:
            invite_item["inviterUsername"] = inviter_profile.get("nickname") or inviter_profile.get("username", "Unknown User")
        else:
            invite_item["inviterUsername"] = "Unknown User"
        
        # Set resource title (already validated above)
        invite_item["resourceTitle"] = resource_title
        
        # Store in DynamoDB
        _ddb_call("put_item", "create_invite", Item=invite_item)
        
        logger.info('collaboration_invite.create_success', 
                   inviter_id=inviter_id, 
                   invite_id=invite_item["inviteId"],
                   resource_type=payload.resource_type,
                   resource_id=payload.resource_id)
        
        return _invite_item_to_response(invite_item)
        
    except CollaborationInviteValidationError:
        raise
    except Exception as e:
        logger.error('collaboration_invite.create_failed', 
                    inviter_id=inviter_id, 
                    error=str(e),
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to create invite: {str(e)}")


def get_invite(invite_id: str, user_id: Optional[str] = None) -> InviteResponse:
    """
    Get a specific invitation by ID.
    
    Args:
        invite_id: Invitation ID
        
    Returns:
        InviteResponse object
        
    Raises:
        CollaborationInviteNotFoundError: If invite is not found
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        logger.info('collaboration_invite.get_start', invite_id=invite_id, user_id=user_id)
        
        # If we have user_id, try to use GSI1 for more efficient lookup
        if user_id:
            gsi1pk = f"USER#{user_id}"
            logger.info('collaboration_invite.using_gsi1', invite_id=invite_id, gsi1pk=gsi1pk)
            
            # Query GSI1 to find invites for this user
            gsi_response = _ddb_call("query", "get_invite_gsi1",
                                   IndexName="GSI1",
                                   KeyConditionExpression=Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with("INVITE#"),
                                   FilterExpression=Attr("inviteId").eq(invite_id))
            
            logger.info('collaboration_invite.gsi1_result', 
                       invite_id=invite_id,
                       items_found=len(gsi_response.get("Items", [])),
                       count=gsi_response.get("Count", 0))
            
            if gsi_response.get("Items"):
                item = gsi_response["Items"][0]
                logger.info('collaboration_invite.gsi1_success', 
                           invite_id=invite_id,
                           pk=item.get("PK"),
                           sk=item.get("SK"))
                return _invite_item_to_response(item)
        
        # Fallback to scan if GSI1 didn't work or user_id not provided
        logger.info('collaboration_invite.fallback_to_scan', invite_id=invite_id)
        response = _ddb_call("scan", "get_invite_scan",
                           FilterExpression=Attr("inviteId").eq(invite_id),
                           Limit=1)
        
        logger.info('collaboration_invite.scan_result', 
                   invite_id=invite_id, 
                   items_found=len(response.get("Items", [])),
                   scan_count=response.get("Count", 0),
                   scanned_count=response.get("ScannedCount", 0))
        
        if not response.get("Items"):
            logger.warning('collaboration_invite.not_found', 
                         invite_id=invite_id,
                         scan_count=response.get("Count", 0),
                         scanned_count=response.get("ScannedCount", 0))
            raise CollaborationInviteNotFoundError(f"Invite {invite_id} not found")
        
        item = response["Items"][0]
        
        # Now that we have the item, let's try to use direct get_item for future lookups
        # This is more efficient than scanning
        pk = item.get("PK")
        sk = item.get("SK")
        
        if pk and sk:
            logger.info('collaboration_invite.using_direct_get', 
                       invite_id=invite_id,
                       pk=pk,
                       sk=sk)
            
            # Try direct get_item for verification
            direct_response = _ddb_call("get_item", "get_invite_direct",
                                      Key={"PK": pk, "SK": sk})
            
            if "Item" in direct_response:
                item = direct_response["Item"]
                logger.info('collaboration_invite.direct_get_success', invite_id=invite_id)
            else:
                logger.warning('collaboration_invite.direct_get_failed', invite_id=invite_id)
        
        logger.info('collaboration_invite.get_success', 
                   invite_id=invite_id,
                   resource_type=item.get("resourceType"),
                   resource_id=item.get("resourceId"),
                   status=item.get("status"),
                   pk=item.get("PK"),
                   sk=item.get("SK"))
        
        return _invite_item_to_response(item)
        
    except CollaborationInviteNotFoundError:
        raise
    except Exception as e:
        logger.error('collaboration_invite.get_failed', 
                    invite_id=invite_id,
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to get invite: {str(e)}")


def list_user_invites(user_id: str, status: Optional[InviteStatus] = None, 
                     limit: int = 20, next_token: Optional[str] = None) -> InviteListResponse:
    """
    List invitations for a user.
    
    Args:
        user_id: User ID to get invites for
        status: Optional status filter
        limit: Maximum number of invites to return
        next_token: Token for pagination
        
    Returns:
        InviteListResponse object
        
    Raises:
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Query GSI1 for user's invites
        gsi1pk = f"USER#{user_id}"
        
        query_kwargs = {
            "IndexName": "GSI1",
            "KeyConditionExpression": Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with("INVITE#"),
            "ScanIndexForward": False,  # Sort by created_at descending
            "Limit": limit
        }
        
        if next_token:
            query_kwargs["ExclusiveStartKey"] = {"GSI1PK": gsi1pk, "GSI1SK": next_token}
        
        # Build filter expression
        filter_conditions = []
        
        if status:
            # If specific status is requested, filter by that status
            filter_conditions.append(Attr("status").eq(status))
        else:
            # By default, exclude declined and accepted invites (only show actionable invites)
            filter_conditions.append(Attr("status").is_in(["pending", "expired"]))
        
        if filter_conditions:
            if len(filter_conditions) == 1:
                query_kwargs["FilterExpression"] = filter_conditions[0]
            else:
                # Combine multiple conditions with AND
                from functools import reduce
                query_kwargs["FilterExpression"] = reduce(lambda x, y: x & y, filter_conditions)
        
        response = _ddb_call("query", "list_user_invites", **query_kwargs)
        
        invites = [_invite_item_to_response(item) for item in response.get("Items", [])]
        
        # Get next token for pagination
        next_token = None
        if "LastEvaluatedKey" in response:
            next_token = response["LastEvaluatedKey"]["GSI1SK"]
        
        logger.info('collaboration_invite.list_success', 
                   user_id=user_id, 
                   count=len(invites),
                   status=status,
                   excluded_completed=status is None)
        
        # Temporary: Refresh resource titles for existing invites that have "Unknown" titles
        for invite in invites:
            if invite.resource_title and "Unknown" in invite.resource_title:
                logger.info(f"collaboration.invite.refreshing_title - invite_id={invite.invite_id}, current_title={invite.resource_title}")
                new_title = _get_resource_title(invite.resource_type, invite.resource_id)
                if new_title and new_title != invite.resource_title:
                    logger.info(f"collaboration.invite.title_updated - invite_id={invite.invite_id}, old_title={invite.resource_title}, new_title={new_title}")
                    invite.resource_title = new_title
        
        return InviteListResponse(
            invites=invites,
            next_token=next_token,
            total_count=len(invites)  # Note: This is approximate for paginated results
        )
        
    except Exception as e:
        logger.error('collaboration_invite.list_failed', 
                    user_id=user_id, 
                    error=str(e),
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to list invites: {str(e)}")


def accept_invite(user_id: str, invite_id: str) -> InviteResponse:
    """
    Accept a collaboration invitation.
    
    Args:
        user_id: ID of the user accepting the invitation
        invite_id: Invitation ID
        
    Returns:
        Updated InviteResponse object
        
    Raises:
        CollaborationInviteNotFoundError: If invite is not found
        CollaborationInvitePermissionError: If user is not the invitee
        CollaborationInviteValidationError: If invite is not in pending status
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Get the invite first, passing user_id for more efficient lookup
        invite = get_invite(invite_id, user_id)
        
        # Verify user is the invitee
        if invite.invitee_id != user_id:
            raise CollaborationInvitePermissionError("Only the invitee can accept the invitation")
        
        # Verify invite is pending
        if invite.status != "pending":
            raise CollaborationInviteValidationError(f"Cannot accept invite with status: {invite.status}")
        
        # Verify invite is not expired
        if datetime.now(UTC) > invite.expires_at:
            raise CollaborationInviteValidationError("Cannot accept expired invitation")
        
        # Update invite status
        pk = f"RESOURCE#{invite.resource_type.upper()}#{invite.resource_id}"
        sk = f"INVITE#{invite_id}"
        accepted_at = datetime.now(UTC)
        
        _ddb_call("update_item", "accept_invite",
                 Key={"PK": pk, "SK": sk},
                 UpdateExpression="SET #status = :status, #updatedAt = :updatedAt, GSI1SK = :gsi1sk",
                 ExpressionAttributeNames={
                     "#status": "status",
                     "#updatedAt": "updatedAt"
                 },
                 ExpressionAttributeValues={
                     ":status": "accepted",
                     ":updatedAt": accepted_at.isoformat(),
                     ":gsi1sk": f"INVITE#accepted#{accepted_at.isoformat()}"
                 })
        
        # Create collaborator item
        from .collaborator_db import add_collaborator
        add_collaborator(invite.resource_type, invite.resource_id, user_id)
        
        logger.info('collaboration_invite.accept_success', 
                   user_id=user_id, 
                   invite_id=invite_id)
        
        # Return updated invite
        invite.status = "accepted"
        invite.updated_at = accepted_at
        return invite
        
    except (CollaborationInviteNotFoundError, CollaborationInvitePermissionError, 
            CollaborationInviteValidationError):
        raise
    except Exception as e:
        logger.error('collaboration_invite.accept_failed', 
                    user_id=user_id, 
                    invite_id=invite_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to accept invite: {str(e)}")


def decline_invite(user_id: str, invite_id: str) -> InviteResponse:
    """
    Decline a collaboration invitation.
    
    Args:
        user_id: ID of the user declining the invitation
        invite_id: Invitation ID
        
    Returns:
        Updated InviteResponse object
        
    Raises:
        CollaborationInviteNotFoundError: If invite is not found
        CollaborationInvitePermissionError: If user is not the invitee
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Get the invite first, passing user_id for more efficient lookup
        invite = get_invite(invite_id, user_id)
        
        # Verify user is the invitee
        if invite.invitee_id != user_id:
            raise CollaborationInvitePermissionError("Only the invitee can decline the invitation")
        
        # Update invite status
        pk = f"RESOURCE#{invite.resource_type.upper()}#{invite.resource_id}"
        sk = f"INVITE#{invite_id}"
        declined_at = datetime.now(UTC)
        
        _ddb_call("update_item", "decline_invite",
                 Key={"PK": pk, "SK": sk},
                 UpdateExpression="SET #status = :status, #updatedAt = :updatedAt, GSI1SK = :gsi1sk",
                 ExpressionAttributeNames={
                     "#status": "status",
                     "#updatedAt": "updatedAt"
                 },
                 ExpressionAttributeValues={
                     ":status": "declined",
                     ":updatedAt": declined_at.isoformat(),
                     ":gsi1sk": f"INVITE#declined#{declined_at.isoformat()}"
                 })
        
        logger.info('collaboration_invite.decline_success', 
                   user_id=user_id, 
                   invite_id=invite_id)
        
        # Return updated invite
        invite.status = "declined"
        invite.updated_at = declined_at
        return invite
        
    except (CollaborationInviteNotFoundError, CollaborationInvitePermissionError):
        raise
    except Exception as e:
        logger.error('collaboration_invite.decline_failed', 
                    user_id=user_id, 
                    invite_id=invite_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to decline invite: {str(e)}")


def check_duplicate_invite(resource_type: str, resource_id: str, invitee_id: str) -> bool:
    """
    Check if a duplicate invitation exists.
    
    Args:
        resource_type: Type of resource
        resource_id: ID of resource
        invitee_id: ID of invitee
        
    Returns:
        True if duplicate exists, False otherwise
        
    Raises:
        CollaborationInviteDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Query for existing invites for this resource and invitee
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        
        filter_expr = Attr("inviteeId").eq(invitee_id) & Attr("status").is_in(["pending", "accepted"])
        response = _ddb_call("query", "check_duplicate_invite",
                           KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("INVITE#"),
                           FilterExpression=filter_expr)
        
        has_duplicate = len(response.get("Items", [])) > 0
        
        logger.info('collaboration_invite.duplicate_check', 
                   resource_type=resource_type,
                   resource_id=resource_id,
                   invitee_id=invitee_id,
                   has_duplicate=has_duplicate)
        
        return has_duplicate
        
    except Exception as e:
        logger.error('collaboration_invite.duplicate_check_failed', 
                    resource_type=resource_type,
                    resource_id=resource_id,
                    invitee_id=invitee_id,
                    error=str(e),
                    exc_info=e)
        raise CollaborationInviteDBError(f"Failed to check duplicate invite: {str(e)}")
