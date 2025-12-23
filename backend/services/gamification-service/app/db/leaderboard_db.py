"""
Leaderboard database operations for the gamification service.
"""

from typing import Dict, List, Optional
# Lazy import of boto3 components to reduce cold start
# from boto3.dynamodb.conditions import Key
# from botocore.exceptions import BotoCoreError, ClientError

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

from ..settings import Settings

logger = get_structured_logger("leaderboard-db", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

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


class LeaderboardEntry:
    """Leaderboard entry."""
    def __init__(self, user_id: str, rank: int, value: int, metadata: Optional[dict] = None):
        self.userId = user_id
        self.rank = rank
        self.value = value
        self.metadata = metadata or {}


def get_global_xp_leaderboard(limit: int = 100) -> List[LeaderboardEntry]:
    """
    Get global XP leaderboard.
    
    Args:
        limit: Maximum number of entries to return
        
    Returns:
        List of LeaderboardEntry objects
    """
    from boto3.dynamodb.conditions import Key
    
    table = _get_dynamodb_table()
    
    try:
        # Query GSI1 for XP summaries sorted by total XP
        response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq("XP#ALL"),
            ScanIndexForward=False,  # Descending order
            Limit=limit
        )
        
        entries = []
        rank = 1
        for item in response.get("Items", []):
            if item.get("type") == "XPSummary":
                entries.append(LeaderboardEntry(
                    user_id=item["userId"],
                    rank=rank,
                    value=item.get("totalXp", 0),
                    metadata={"level": item.get("currentLevel", 1)}
                ))
                rank += 1
        
        return entries
    except Exception as e:
        logger.error("leaderboard.global_xp.error", error=str(e), exc_info=True)
        return []


def get_level_leaderboard(limit: int = 100) -> List[LeaderboardEntry]:
    """
    Get level leaderboard.
    
    Args:
        limit: Maximum number of entries to return
        
    Returns:
        List of LeaderboardEntry objects
    """
    from boto3.dynamodb.conditions import Key
    
    table = _get_dynamodb_table()
    
    try:
        # Query GSI1 for XP summaries, sort by level then XP
        response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq("XP#ALL"),
            ScanIndexForward=False,
            Limit=limit * 2  # Get more to sort by level
        )
        
        # Group by level and sort
        level_groups = {}
        for item in response.get("Items", []):
            if item.get("type") == "XPSummary":
                level = item.get("currentLevel", 1)
                if level not in level_groups:
                    level_groups[level] = []
                level_groups[level].append({
                    "userId": item["userId"],
                    "level": level,
                    "totalXp": item.get("totalXp", 0)
                })
        
        # Sort by level descending, then XP descending
        entries = []
        rank = 1
        for level in sorted(level_groups.keys(), reverse=True):
            level_users = sorted(level_groups[level], key=lambda x: x["totalXp"], reverse=True)
            for user in level_users[:limit]:
                entries.append(LeaderboardEntry(
                    user_id=user["userId"],
                    rank=rank,
                    value=user["level"],
                    metadata={"totalXp": user["totalXp"]}
                ))
                rank += 1
                if rank > limit:
                    break
            if rank > limit:
                break
        
        return entries[:limit]
    except Exception as e:
        logger.error("leaderboard.level.error", error=str(e), exc_info=True)
        return []


def get_badge_leaderboard(limit: int = 100) -> List[LeaderboardEntry]:
    """
    Get badge leaderboard (users with most badges).
    
    Args:
        limit: Maximum number of entries to return
        
    Returns:
        List of LeaderboardEntry objects
    """
    from boto3.dynamodb.conditions import Attr
    
    table = _get_dynamodb_table()
    
    try:
        # Scan for all user badges and count
        response = table.scan(
            FilterExpression=Attr("type").eq("UserBadge"),
            ProjectionExpression="userId"
        )
        
        badge_counts = {}
        for item in response.get("Items", []):
            user_id = item["userId"]
            badge_counts[user_id] = badge_counts.get(user_id, 0) + 1
        
        # Sort by badge count
        sorted_users = sorted(badge_counts.items(), key=lambda x: x[1], reverse=True)
        
        entries = []
        for rank, (user_id, badge_count) in enumerate(sorted_users[:limit], 1):
            entries.append(LeaderboardEntry(
                user_id=user_id,
                rank=rank,
                value=badge_count,
                metadata={}
            ))
        
        return entries
    except Exception as e:
        logger.error("leaderboard.badge.error", error=str(e), exc_info=True)
        return []

