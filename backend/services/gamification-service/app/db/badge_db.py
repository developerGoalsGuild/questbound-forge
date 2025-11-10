"""
Badge database operations for the gamification service.
"""

import time
from typing import Dict, List, Optional
from uuid import uuid4
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import BotoCoreError, ClientError

import sys
from pathlib import Path

def _add_common_to_path():
    """Add common module to Python path."""
    container_common = Path("/app/common")
    if container_common.exists():
        if str(container_common.parent) not in sys.path:
            sys.path.append(str(container_common.parent))
        return
    
    services_dir = Path(__file__).resolve().parents[3]
    if (services_dir / "common").exists():
        if str(services_dir) not in sys.path:
            sys.path.append(str(services_dir))
        return
    
    current_dir = Path(__file__).resolve().parent
    for _ in range(5):
        common_dir = current_dir / "common"
        if common_dir.exists():
            if str(current_dir) not in sys.path:
                sys.path.append(str(current_dir))
            return
        current_dir = current_dir.parent

_add_common_to_path()

from common.logging import get_structured_logger

from ..models.badge import BadgeDefinition, UserBadge
from ..settings import Settings

logger = get_structured_logger("badge-db", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    import boto3
    settings = _get_settings()
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return dynamodb.Table(settings.core_table_name)


class BadgeDBError(Exception):
    """Custom exception for badge database operations."""
    pass


def create_badge_definition(badge: BadgeDefinition) -> BadgeDefinition:
    """
    Create or update a badge definition.
    
    Args:
        badge: Badge definition
        
    Returns:
        BadgeDefinition object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    badge_item = {
        "PK": f"BADGE#{badge.id}",
        "SK": "METADATA",
        "type": "BadgeDefinition",
        "id": badge.id,
        "name": badge.name,
        "description": badge.description,
        "category": badge.category,
        "rarity": badge.rarity,
        "createdAt": badge.createdAt or now_ms,
    }
    
    if badge.icon:
        badge_item["icon"] = badge.icon
    if badge.criteria:
        badge_item["criteria"] = badge.criteria
    
    try:
        table.put_item(Item=badge_item)
        logger.info("badge.definition.created", badge_id=badge.id)
    except Exception as e:
        logger.error("badge.definition.create_error", badge_id=badge.id, error=str(e), exc_info=True)
        raise BadgeDBError(f"Failed to create badge definition: {str(e)}") from e
    
    return badge


def get_badge_definition(badge_id: str) -> Optional[BadgeDefinition]:
    """
    Get badge definition by ID.
    
    Args:
        badge_id: Badge ID
        
    Returns:
        BadgeDefinition or None if not found
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.get_item(
            Key={
                "PK": f"BADGE#{badge_id}",
                "SK": "METADATA"
            }
        )
        
        if "Item" not in response:
            return None
        
        item = response["Item"]
        return BadgeDefinition(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            icon=item.get("icon"),
            category=item["category"],
            rarity=item.get("rarity", "common"),
            criteria=item.get("criteria"),
            createdAt=item.get("createdAt", int(time.time() * 1000))
        )
    except Exception as e:
        logger.error("badge.definition.get_error", badge_id=badge_id, error=str(e), exc_info=True)
        raise BadgeDBError(f"Failed to get badge definition: {str(e)}") from e


def list_badge_definitions(category: Optional[str] = None) -> List[BadgeDefinition]:
    """
    List all badge definitions.
    
    Args:
        category: Optional category filter
        
    Returns:
        List of BadgeDefinition objects
    """
    table = _get_dynamodb_table()
    
    try:
        if category:
            response = table.scan(
                FilterExpression=Attr("type").eq("BadgeDefinition") & Attr("category").eq(category)
            )
        else:
            response = table.scan(
                FilterExpression=Attr("type").eq("BadgeDefinition")
            )
        
        badges = []
        for item in response.get("Items", []):
            badges.append(BadgeDefinition(
                id=item["id"],
                name=item["name"],
                description=item["description"],
                icon=item.get("icon"),
                category=item["category"],
                rarity=item.get("rarity", "common"),
                criteria=item.get("criteria"),
                createdAt=item.get("createdAt", int(time.time() * 1000))
            ))
        
        return badges
    except Exception as e:
        logger.error("badge.definition.list_error", error=str(e), exc_info=True)
        raise BadgeDBError(f"Failed to list badge definitions: {str(e)}") from e


def assign_badge(user_id: str, badge_id: str, metadata: Optional[dict] = None) -> UserBadge:
    """
    Assign a badge to a user.
    
    Args:
        user_id: User ID
        badge_id: Badge ID
        metadata: Optional metadata
        
    Returns:
        UserBadge object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    # Check if badge already assigned
    try:
        existing = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"BADGE#{badge_id}"
            }
        )
        if "Item" in existing:
            # Badge already assigned, return existing
            item = existing["Item"]
            return UserBadge(
                userId=user_id,
                badgeId=badge_id,
                earnedAt=item.get("earnedAt", now_ms),
                progress=item.get("progress"),
                metadata=item.get("metadata")
            )
    except Exception:
        pass
    
    badge_item = {
        "PK": f"USER#{user_id}",
        "SK": f"BADGE#{badge_id}",
        "type": "UserBadge",
        "userId": user_id,
        "badgeId": badge_id,
        "earnedAt": now_ms,
        "createdAt": now_ms,
        # GSI for badge leaderboard
        "GSI1PK": f"BADGE#{badge_id}",
        "GSI1SK": f"{now_ms:020d}#{user_id}",  # Zero-padded for sorting
    }
    
    if metadata:
        badge_item["metadata"] = metadata
    
    try:
        table.put_item(Item=badge_item)
        logger.info("badge.assigned", user_id=user_id, badge_id=badge_id)
    except Exception as e:
        logger.error("badge.assign_error", user_id=user_id, badge_id=badge_id, error=str(e), exc_info=True)
        raise BadgeDBError(f"Failed to assign badge: {str(e)}") from e
    
    return UserBadge(
        userId=user_id,
        badgeId=badge_id,
        earnedAt=now_ms,
        progress=1.0,  # Fully earned
        metadata=metadata
    )


def get_user_badges(user_id: str) -> List[UserBadge]:
    """
    Get all badges for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        List of UserBadge objects
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("BADGE#")
        )
        
        badges = []
        for item in response.get("Items", []):
            badges.append(UserBadge(
                userId=item["userId"],
                badgeId=item["badgeId"],
                earnedAt=item.get("earnedAt", item.get("createdAt", int(time.time() * 1000))),
                progress=item.get("progress", 1.0),
                metadata=item.get("metadata")
            ))
        
        return badges
    except Exception as e:
        logger.error("badge.user_badges.get_error", user_id=user_id, error=str(e), exc_info=True)
        raise BadgeDBError(f"Failed to get user badges: {str(e)}") from e


def has_badge(user_id: str, badge_id: str) -> bool:
    """
    Check if user has a specific badge.
    
    Args:
        user_id: User ID
        badge_id: Badge ID
        
    Returns:
        True if user has the badge, False otherwise
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"BADGE#{badge_id}"
            }
        )
        return "Item" in response
    except Exception:
        return False

