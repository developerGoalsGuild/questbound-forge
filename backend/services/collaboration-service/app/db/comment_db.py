"""
DynamoDB operations for comments.

This module provides database operations for comment management including
creation, retrieval, updates, and deletion with threading support.
"""

import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, UTC
from uuid import uuid4
from boto3.dynamodb.conditions import Key

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
from ..models.comment import CommentCreatePayload, CommentUpdatePayload, CommentResponse, CommentListResponse
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("collaboration-comment-db", env_flag="COLLABORATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

class CommentDBError(Exception):
    """Custom exception for comment database operations."""
    pass

class CommentNotFoundError(CommentDBError):
    """Exception raised when a comment is not found."""
    pass

class CommentPermissionError(CommentDBError):
    """Exception raised when user doesn't have permission for the operation."""
    pass

class CommentValidationError(CommentDBError):
    """Exception raised when comment validation fails."""
    pass

def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    settings = _get_settings()
    import boto3
    dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
    return dynamodb.Table(settings.dynamodb_table_name)


def _comment_item_to_response(item: Dict[str, Any]) -> CommentResponse:
    """Convert DynamoDB comment item to CommentResponse."""
    return CommentResponse(
        comment_id=item["commentId"],
        parent_id=item.get("parentId"),
        user_id=item["userId"],
        username=item.get("username", "Unknown"),
        user_avatar=item.get("userAvatar"),
        text=item["text"],
        mentions=item.get("mentions", []),
        reactions=item.get("reactions", {}),
        user_reaction=item.get("userReaction"),
        reply_count=item.get("replyCount", 0),
        is_edited=item.get("isEdited", False),
        created_at=datetime.fromisoformat(item["createdAt"]),
        updated_at=datetime.fromisoformat(item["updatedAt"]) if item.get("updatedAt") else None
    )


def create_comment(user_id: str, payload: CommentCreatePayload) -> CommentResponse:
    """
    Create a new comment.

    Args:
        user_id: ID of the user creating the comment
        payload: Comment creation payload

    Returns:
        CommentResponse object

    Raises:
        CommentValidationError: If validation fails
        CommentDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Generate comment ID
        comment_id = str(uuid4())
        created_at = datetime.now(UTC)
        created_at_str = created_at.isoformat()

        # Extract mentions from text
        mentions = extract_mentions(payload.text)

        # Get user profile for enrichment
        user_profile = table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"})
        logger.info(f"collaboration.comment.user_profile_lookup - user_id={user_id}, found={user_profile.get('Item') is not None}")

        # Build comment item
        pk = f"RESOURCE#{payload.resource_type.upper()}#{payload.resource_id}"
        sk = f"COMMENT#{created_at_str}#{comment_id}"

        # Build base comment item
        comment_item = {
            "PK": pk,
            "SK": sk,
            "type": "Comment",
            "commentId": comment_id,
            "parentId": payload.parent_id,
            "userId": user_id,
            "resourceType": payload.resource_type,
            "resourceId": payload.resource_id,
            "text": payload.text,
            "mentions": mentions,
            "reactions": {},
            "replyCount": 0,
            "isEdited": False,
            "createdAt": created_at_str,
            "updatedAt": created_at_str
        }

        # GSI1 for threading (only if it's a reply)
        if payload.parent_id:
            comment_item.update({
                "GSI1PK": f"COMMENT#{payload.parent_id}",
                "GSI1SK": created_at_str
            })

        # Add user profile data if available
        if "Item" in user_profile:
            profile = user_profile["Item"]
            username = profile.get("nickname", profile.get("username", "Unknown"))
            logger.info(f"collaboration.comment.user_profile_data - user_id={user_id}, nickname={profile.get('nickname')}, username={profile.get('username')}, final_username={username}")
            comment_item.update({
                "username": username,
                "userAvatar": profile.get("avatarUrl")
            })
        else:
            logger.warning(f"collaboration.comment.user_profile_not_found - user_id={user_id}")

        # Store in DynamoDB
        table.put_item(Item=comment_item)

        # If this is a reply, increment parent's reply count
        if payload.parent_id:
            try:
                table.update_item(
                    Key={"PK": f"COMMENT#{payload.parent_id}", "SK": f"REACTION#{payload.parent_id}#count"},
                    UpdateExpression="ADD replyCount :inc",
                    ExpressionAttributeValues={":inc": 1}
                )
            except Exception as e:
                # Log but don't fail - reply count is not critical
                logger.warning('comment.reply_count_update_failed',
                             parent_id=payload.parent_id,
                             error=str(e))

        logger.info('comment.create_success',
                   user_id=user_id,
                   comment_id=comment_id,
                   resource_type=payload.resource_type,
                   resource_id=payload.resource_id,
                   parent_id=payload.parent_id)

        return _comment_item_to_response(comment_item)

    except Exception as e:
        logger.error('comment.create_failed',
                    user_id=user_id,
                    resource_type=payload.resource_type,
                    resource_id=payload.resource_id,
                    error=str(e),
                    exc_info=e)
        raise CommentDBError(f"Failed to create comment: {str(e)}")


def get_comment(comment_id: str) -> CommentResponse:
    """
    Get a specific comment by ID.

    Args:
        comment_id: Comment ID to retrieve

    Returns:
        CommentResponse object

    Raises:
        CommentNotFoundError: If comment is not found
        CommentDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # Query to find the comment (we need to scan since we don't have the resource info)
        # Note: Don't use Limit with Scan + FilterExpression - Limit restricts items evaluated,
        # not items returned, so it may return empty even if matches exist
        response = table.scan(
            FilterExpression="commentId = :comment_id AND #type = :comment_type",
            ExpressionAttributeNames={"#type": "type"},
            ExpressionAttributeValues={
                ":comment_id": comment_id,
                ":comment_type": "Comment"
            }
        )

        if not response.get("Items"):
            logger.warning('comment.not_found', comment_id=comment_id)
            raise CommentNotFoundError(f"Comment {comment_id} not found")

        item = response["Items"][0]

        logger.info('comment.get_success', comment_id=comment_id)

        return _comment_item_to_response(item)

    except CommentNotFoundError:
        raise
    except Exception as e:
        logger.error('comment.get_failed',
                    comment_id=comment_id,
                    error=str(e),
                    exc_info=e)
        raise CommentDBError(f"Failed to get comment: {str(e)}")


def list_comments(resource_type: str, resource_id: str, parent_id: Optional[str] = None,
                 limit: int = 50, next_token: Optional[str] = None) -> CommentListResponse:
    """
    List comments for a resource.

    Args:
        resource_type: Type of resource
        resource_id: ID of the resource
        parent_id: Optional parent comment ID for threaded replies
        limit: Maximum number of comments to return
        next_token: Token for pagination

    Returns:
        CommentListResponse object

    Raises:
        CommentDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"

        if parent_id:
            # List replies to a specific comment
            response = table.query(
                IndexName="GSI1",
                KeyConditionExpression=Key("GSI1PK").eq(f"COMMENT#{parent_id}"),
                ScanIndexForward=True,  # Oldest first
                Limit=limit
            )
        else:
            # List top-level comments for the resource
            query_kwargs = {
                "KeyConditionExpression": Key("PK").eq(pk) & Key("SK").begins_with("COMMENT#"),
                "ScanIndexForward": False,  # Newest first
                "Limit": limit
            }

            if next_token:
                query_kwargs["ExclusiveStartKey"] = {"PK": pk, "SK": next_token}

            response = table.query(**query_kwargs)

        comments = [_comment_item_to_response(item) for item in response.get("Items", [])]

        # Get next token for pagination
        next_page_token = None
        if "LastEvaluatedKey" in response:
            next_page_token = response["LastEvaluatedKey"]["SK"]

        logger.info('comment.list_success',
                   resource_type=resource_type,
                   resource_id=resource_id,
                   parent_id=parent_id,
                   count=len(comments))

        return CommentListResponse(
            comments=comments,
            next_token=next_page_token,
            total_count=len(comments)  # Approximate for paginated results
        )

    except Exception as e:
        logger.error('comment.list_failed',
                    resource_type=resource_type,
                    resource_id=resource_id,
                    parent_id=parent_id,
                    error=str(e),
                    exc_info=e)
        raise CommentDBError(f"Failed to list comments: {str(e)}")


def update_comment(user_id: str, comment_id: str, payload: CommentUpdatePayload) -> CommentResponse:
    """
    Update a comment.

    Args:
        user_id: ID of the user updating the comment
        comment_id: Comment ID to update
        payload: Update payload

    Returns:
        Updated CommentResponse object

    Raises:
        CommentNotFoundError: If comment is not found
        CommentPermissionError: If user doesn't own the comment
        CommentDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # First get the comment to verify ownership
        comment = get_comment(comment_id)

        if comment.userId != user_id:
            raise CommentPermissionError("Only the comment author can update the comment")

        # Extract new mentions
        new_mentions = extract_mentions(payload.text)
        updated_at = datetime.now(UTC)

        # Find the comment item to update (we need the full key)
        # Note: Don't use Limit with Scan + FilterExpression
        response = table.scan(
            FilterExpression="commentId = :comment_id AND #type = :comment_type",
            ExpressionAttributeNames={"#type": "type"},
            ExpressionAttributeValues={
                ":comment_id": comment_id,
                ":comment_type": "Comment"
            }
        )

        if not response.get("Items"):
            raise CommentNotFoundError(f"Comment {comment_id} not found")

        item_key = {k: v for k, v in response["Items"][0].items() if k in ["PK", "SK"]}

        # Update the comment
        table.update_item(
            Key=item_key,
            UpdateExpression="SET #text = :text, mentions = :mentions, #updatedAt = :updatedAt, isEdited = :isEdited",
            ExpressionAttributeNames={
                "#text": "text",
                "#updatedAt": "updatedAt"
            },
            ExpressionAttributeValues={
                ":text": payload.text,
                ":mentions": new_mentions,
                ":updatedAt": updated_at.isoformat(),
                ":isEdited": True
            }
        )

        logger.info('comment.update_success',
                   user_id=user_id,
                   comment_id=comment_id)

        # Return updated comment
        comment.text = payload.text
        comment.mentions = new_mentions
        comment.updated_at = updated_at
        comment.is_edited = True
        return comment

    except (CommentNotFoundError, CommentPermissionError):
        raise
    except Exception as e:
        logger.error('comment.update_failed',
                    user_id=user_id,
                    comment_id=comment_id,
                    error=str(e),
                    exc_info=e)
        raise CommentDBError(f"Failed to update comment: {str(e)}")


def delete_comment(user_id: str, comment_id: str) -> None:
    """
    Delete a comment (soft delete by marking as deleted).

    Args:
        user_id: ID of the user deleting the comment
        comment_id: Comment ID to delete

    Raises:
        CommentNotFoundError: If comment is not found
        CommentPermissionError: If user doesn't own the comment
        CommentDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        # First get the comment to verify ownership
        comment = get_comment(comment_id)

        if comment.userId != user_id:
            raise CommentPermissionError("Only the comment author can delete the comment")

        # Find the comment item to update
        # Note: Don't use Limit with Scan + FilterExpression
        response = table.scan(
            FilterExpression="commentId = :comment_id AND #type = :comment_type",
            ExpressionAttributeNames={"#type": "type"},
            ExpressionAttributeValues={
                ":comment_id": comment_id,
                ":comment_type": "Comment"
            }
        )

        if not response.get("Items"):
            raise CommentNotFoundError(f"Comment {comment_id} not found")

        item_key = {k: v for k, v in response["Items"][0].items() if k in ["PK", "SK"]}

        # Soft delete by updating text and marking as deleted
        deleted_at = datetime.now(UTC)
        table.update_item(
            Key=item_key,
            UpdateExpression="SET #text = :deleted_text, deletedAt = :deletedAt, isEdited = :isEdited, #updatedAt = :updatedAt",
            ExpressionAttributeNames={
                "#text": "text",
                "#updatedAt": "updatedAt"
            },
            ExpressionAttributeValues={
                ":deleted_text": "[Comment deleted]",
                ":deletedAt": deleted_at.isoformat(),
                ":isEdited": True,
                ":updatedAt": deleted_at.isoformat()
            }
        )

        logger.info('comment.delete_success',
                   user_id=user_id,
                   comment_id=comment_id)

    except (CommentNotFoundError, CommentPermissionError):
        raise
    except Exception as e:
        logger.error('comment.delete_failed',
                    user_id=user_id,
                    comment_id=comment_id,
                    error=str(e),
                    exc_info=e)
        raise CommentDBError(f"Failed to delete comment: {str(e)}")


def extract_mentions(text: str) -> List[str]:
    """
    Extract @username mentions from comment text.

    Args:
        text: Comment text to analyze

    Returns:
        List of usernames mentioned in the text
    """
    import re

    # Find all @username patterns
    mention_pattern = r'@([a-zA-Z0-9_]+)'
    mentions = re.findall(mention_pattern, text)

    # Remove duplicates and limit count
    unique_mentions = list(dict.fromkeys(mentions))[:10]  # Max 10 mentions

    return unique_mentions

