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
    Look up a user by email or username.

    Args:
        identifier: Email address or username to look up

    Returns:
        User info dict with userId, username, email if found, None otherwise
    """
    table = _get_dynamodb_table()

    try:
        if "@" in identifier:
            # Look up by email - try multiple approaches for compatibility
            # First try the email lookup index
            response = table.query(
                IndexName="GSI1",
                KeyConditionExpression=Key("GSI1PK").eq("EMAIL_LOOKUP") & Key("GSI1SK").eq(f"EMAIL#{identifier}")
            )

            if not response.get("Items"):
                # Fallback: scan for email in profile records (for tests/backwards compatibility)
                response = table.scan(
                    FilterExpression=Attr("email").eq(identifier) & Attr("SK").eq("PROFILE")
                )
        else:
            # Look up by username - scan for username (works for small user base)
            response = table.scan(
                FilterExpression=Attr("username").eq(identifier) & Attr("SK").eq("PROFILE")
            )

        if response.get("Items"):
            user_item = response["Items"][0]
            return {
                "userId": user_item["userId"],
                "username": user_item.get("username"),
                "email": user_item.get("email")
            }

        return None

    except Exception as e:
        logger.error('collaboration.invitee_lookup_failed',
                    identifier=identifier,
                    error=str(e),
                    exc_info=e)
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


def _get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user profile by user ID (for test compatibility).

    Args:
        user_id: User ID to look up

    Returns:
        User profile dict or None
    """
    return _get_user_by_id(user_id)


def _build_invite_item(inviter_id: str, invitee_id: str, invitee_email: str, 
                      payload: InviteCreatePayload) -> Dict[str, Any]:
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
        updated_at=datetime.fromisoformat(item["updatedAt"])
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

        # Lookup invitee by email or username
        invitee_info = _lookup_invitee(payload.invitee_identifier)
        if not invitee_info:
            raise CollaborationInviteValidationError("Invitee not found")

        invitee_id = invitee_info["userId"]
        invitee_email = invitee_info.get("email")

        # Check for duplicate invites
        if check_duplicate_invite(payload.resource_type, payload.resource_id, invitee_id):
            raise CollaborationInviteValidationError("Invite already exists for this user")

        # Check if user is already a collaborator
        from .collaborator_db import check_collaborator_access
        if check_collaborator_access(invitee_id, payload.resource_type, payload.resource_id):
            raise CollaborationInviteValidationError("User is already a collaborator on this resource")
        
        # Build invite item
        invite_item = _build_invite_item(inviter_id, invitee_id, invitee_email, payload)
        
        # Add placeholder enrichment data
        invite_item["inviterUsername"] = "placeholder-username"
        invite_item["resourceTitle"] = f"Placeholder {payload.resource_type.title()}"
        
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


def get_invite(invite_id: str) -> InviteResponse:
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
        # Query to find the invite (we need to scan since we don't have the resource info)
        response = _ddb_call("scan", "get_invite",
                           FilterExpression=Attr("inviteId").eq(invite_id) & Attr("type").eq("CollaborationInvite"),
                           Limit=1)
        
        if not response.get("Items"):
            logger.warning('collaboration_invite.not_found', invite_id=invite_id)
            raise CollaborationInviteNotFoundError(f"Invite {invite_id} not found")
        
        item = response["Items"][0]
        
        logger.info('collaboration_invite.get_success', invite_id=invite_id)
        
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
        
        if status:
            query_kwargs["FilterExpression"] = Attr("status").eq(status)
        
        response = _ddb_call("query", "list_user_invites", **query_kwargs)
        
        invites = [_invite_item_to_response(item) for item in response.get("Items", [])]
        
        # Get next token for pagination
        next_token = None
        if "LastEvaluatedKey" in response:
            next_token = response["LastEvaluatedKey"]["GSI1SK"]
        
        logger.info('collaboration_invite.list_success', 
                   user_id=user_id, 
                   count=len(invites),
                   status=status)
        
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
        # Get the invite first
        invite = get_invite(invite_id)
        
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
        # Get the invite first
        invite = get_invite(invite_id)
        
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
