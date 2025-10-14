"""
DynamoDB operations for reactions.

This module provides database operations for reaction management including
adding, removing, and querying reactions on comments.
"""

import sys
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime, UTC
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
from ..models.reaction import ReactionSummaryResponse, ReactionPayload
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("collaboration-reaction-db", env_flag="COLLABORATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

class ReactionDBError(Exception):
    """Custom exception for reaction database operations."""
    pass


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    settings = _get_settings()
    import boto3
    dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
    return dynamodb.Table(settings.dynamodb_table_name)


def toggle_reaction(user_id: str, comment_id: str, payload: ReactionPayload) -> ReactionSummaryResponse:
    """
    Toggle (add/remove) a reaction on a comment.

    Args:
        user_id: ID of the user reacting
        comment_id: Comment ID to react to
        payload: Reaction payload with emoji

    Returns:
        ReactionSummaryResponse with updated reaction counts

    Raises:
        ReactionDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        emoji = payload.emoji
        pk = f"COMMENT#{comment_id}"
        sk = f"REACTION#{user_id}#{emoji}"

        # Check if reaction already exists
        existing_reaction = table.get_item(Key={"PK": pk, "SK": sk})

        if "Item" in existing_reaction:
            # Remove the reaction
            table.delete_item(Key={"PK": pk, "SK": sk})
            action = "removed"
        else:
            # Add the reaction
            reaction_item = {
                "PK": pk,
                "SK": sk,
                "type": "Reaction",
                "commentId": comment_id,
                "userId": user_id,
                "emoji": emoji,
                "createdAt": datetime.now(UTC).isoformat()
            }
            table.put_item(Item=reaction_item)
            action = "added"

        # Get updated reaction summary
        reaction_summary = _get_reaction_summary(comment_id)

        logger.info('reaction.toggle_success',
                   user_id=user_id,
                   comment_id=comment_id,
                   emoji=emoji,
                   action=action)

        return ReactionSummaryResponse(
            reactions=reaction_summary["reactions"],
            user_reaction=reaction_summary["user_reactions"].get(user_id) if user_id in reaction_summary.get("user_reactions", {}) else None
        )

    except Exception as e:
        logger.error('reaction.toggle_failed',
                    user_id=user_id,
                    comment_id=comment_id,
                    emoji=payload.emoji,
                    error=str(e),
                    exc_info=e)
        raise ReactionDBError(f"Failed to toggle reaction: {str(e)}")


def get_comment_reactions(comment_id: str, user_id: Optional[str] = None) -> ReactionSummaryResponse:
    """
    Get reaction summary for a comment.

    Args:
        comment_id: Comment ID to get reactions for
        user_id: Optional user ID to check if they reacted

    Returns:
        ReactionSummaryResponse with reaction counts

    Raises:
        ReactionDBError: If database operation fails
    """
    table = _get_dynamodb_table()

    try:
        reaction_summary = _get_reaction_summary(comment_id)

        # Determine user's reaction if user_id provided
        user_reaction = None
        if user_id and user_id in reaction_summary.get("user_reactions", {}):
            user_reaction = reaction_summary["user_reactions"][user_id]

        logger.info('reaction.get_success',
                   comment_id=comment_id,
                   reaction_count=sum(reaction_summary["reactions"].values()))

        return ReactionSummaryResponse(
            reactions=reaction_summary["reactions"],
            user_reaction=user_reaction
        )

    except Exception as e:
        logger.error('reaction.get_failed',
                    comment_id=comment_id,
                    error=str(e),
                    exc_info=e)
        raise ReactionDBError(f"Failed to get comment reactions: {str(e)}")


def _get_reaction_summary(comment_id: str) -> Dict:
    """
    Get detailed reaction summary for a comment.

    Args:
        comment_id: Comment ID to get reactions for

    Returns:
        Dict with 'reactions' (emoji -> count) and 'user_reactions' (user_id -> emoji)
    """
    table = _get_dynamodb_table()

    pk = f"COMMENT#{comment_id}"

    # Query all reactions for this comment
    response = table.query(
        KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("REACTION#")
    )

    reactions = {}
    user_reactions = {}

    for item in response.get("Items", []):
        emoji = item["emoji"]
        user_id = item["userId"]

        # Count reactions by emoji
        reactions[emoji] = reactions.get(emoji, 0) + 1

        # Track which emoji each user reacted with
        user_reactions[user_id] = emoji

    return {
        "reactions": reactions,
        "user_reactions": user_reactions
    }

