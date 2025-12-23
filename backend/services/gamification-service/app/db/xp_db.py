"""
XP database operations for the gamification service.

This module handles all database operations related to XP following the single-table design pattern.
"""

import base64
import json
import time
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Any
from uuid import uuid4
# Lazy import of boto3 components to reduce cold start
# from boto3.dynamodb.conditions import Key, Attr
# from botocore.exceptions import BotoCoreError, ClientError

import sys
from pathlib import Path

# Add common module to path
def _add_common_to_path():
    """Add common module to Python path, supporting both local and container environments."""
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

# Import models at module level (needed for type hints)
from ..models.xp import XPTransaction, XPSummary, LevelEvent
from ..services.level_service import get_level_info

# Initialize logger (lightweight)
logger = get_structured_logger("xp-db", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

# Lazy initialization of settings and DynamoDB client
_settings = None
_dynamodb = None

def _get_settings():
    """Lazy initialization of settings."""
    global _settings
    if _settings is None:
        from ..settings import Settings
        _settings = Settings()
    return _settings

def _get_dynamodb():
    """Lazy initialization of DynamoDB resource."""
    global _dynamodb
    if _dynamodb is None:
        import boto3
        settings = _get_settings()
        _dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return _dynamodb

def _get_dynamodb_table():
    """Get DynamoDB table resource (lazy initialization)."""
    settings = _get_settings()
    dynamodb = _get_dynamodb()
    return dynamodb.Table(settings.core_table_name)


class XPDBError(Exception):
    """Custom exception for XP database operations."""
    pass


def create_xp_summary(user_id: str, initial_xp: int = 0) -> XPSummary:
    """
    Create or update XP summary for a user.
    
    Args:
        user_id: User ID
        initial_xp: Initial XP amount (default 0)
        
    Returns:
        XPSummary object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    level, xp_current, xp_next, progress = get_level_info(initial_xp)

    summary_item = {
        "PK": f"USER#{user_id}",
        "SK": "XP#SUMMARY",
        "type": "XPSummary",
        "userId": user_id,
        "totalXp": initial_xp,
        "currentLevel": level,
        "xpForCurrentLevel": xp_current,
        "xpForNextLevel": xp_next,
        "xpProgress": Decimal(str(progress)),
        "updatedAt": now_ms,
        "createdAt": now_ms,
        # GSI for leaderboard queries
        "GSI1PK": "XP#ALL",
        "GSI1SK": f"{initial_xp:020d}#{user_id}",  # Zero-padded for sorting
    }
    
    try:
        table.put_item(Item=summary_item)
        logger.info("xp.summary.created", user_id=user_id, total_xp=initial_xp)
    except Exception as e:
        logger.error("xp.summary.create_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to create XP summary: {str(e)}") from e
    
    return XPSummary(**summary_item)


def get_xp_summary(user_id: str) -> Optional[XPSummary]:
    """
    Get XP summary for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        XPSummary object or None if not found
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "XP#SUMMARY"
            }
        )
        
        if "Item" not in response:
            return None
        
        item = response["Item"]
        return XPSummary(
            userId=item["userId"],
            totalXp=item.get("totalXp", 0),
            currentLevel=item.get("currentLevel", 1),
            xpForCurrentLevel=item.get("xpForCurrentLevel", 0),
            xpForNextLevel=item.get("xpForNextLevel", 100),
            xpProgress=item.get("xpProgress", 0.0),
            updatedAt=item.get("updatedAt", int(time.time() * 1000))
        )
    except Exception as e:
        logger.error("xp.summary.get_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to get XP summary: {str(e)}") from e


def update_xp_summary(user_id: str, total_xp: int, level: int, xp_for_current: int, 
                     xp_for_next: int, xp_progress: float) -> XPSummary:
    """
    Update XP summary for a user.
    
    Args:
        user_id: User ID
        total_xp: New total XP
        level: Current level
        xp_for_current: XP required for current level
        xp_for_next: XP required for next level
        xp_progress: Progress to next level (0.0-1.0)
        
    Returns:
        Updated XPSummary object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    try:
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "XP#SUMMARY"
            },
            UpdateExpression="SET totalXp = :xp, currentLevel = :level, "
                           "xpForCurrentLevel = :current, xpForNextLevel = :next, "
                           "xpProgress = :progress, updatedAt = :updated, "
                           "GSI1SK = :gsi1sk",
            ExpressionAttributeValues={
                ":xp": total_xp,
                ":level": level,
                ":current": xp_for_current,
                ":next": xp_for_next,
                ":progress": Decimal(str(xp_progress)),
                ":updated": now_ms,
                ":gsi1sk": f"{total_xp:020d}#{user_id}"  # Zero-padded for sorting
            }
        )
        
        logger.info("xp.summary.updated", user_id=user_id, total_xp=total_xp, user_level=level)
        
        return XPSummary(
            userId=user_id,
            totalXp=total_xp,
            currentLevel=level,
            xpForCurrentLevel=xp_for_current,
            xpForNextLevel=xp_for_next,
            xpProgress=xp_progress,
            updatedAt=now_ms
        )
    except Exception as e:
        logger.error("xp.summary.update_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to update XP summary: {str(e)}") from e


def create_xp_transaction(user_id: str, amount: int, source: str, source_id: Optional[str] = None,
                         description: str = "", event_id: Optional[str] = None) -> XPTransaction:
    """
    Create an XP transaction record.
    
    Args:
        user_id: User ID
        amount: XP amount (positive for awards)
        source: Source of XP (task_completion, goal_completion, etc.)
        source_id: ID of the source entity
        description: Human-readable description
        event_id: Unique event ID for idempotency
        
    Returns:
        XPTransaction object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    # Use event_id if provided, otherwise generate one
    if not event_id:
        event_id = str(uuid4())
    
    # Create SK with timestamp and event_id for uniqueness
    timestamp_str = f"{now_ms:020d}"  # Zero-padded timestamp
    sk = f"XP#{timestamp_str}#{event_id}"
    
    transaction_item = {
        "PK": f"USER#{user_id}",
        "SK": sk,
        "type": "XPTransaction",
        "userId": user_id,
        "amount": amount,
        "source": source,
        "description": description,
        "timestamp": now_ms,
        "eventId": event_id,
        "createdAt": now_ms,
    }
    
    if source_id:
        transaction_item["sourceId"] = source_id
    
    try:
        table.put_item(Item=transaction_item)
        logger.info("xp.transaction.created", user_id=user_id, amount=amount, source=source, event_id=event_id)
    except Exception as e:
        logger.error("xp.transaction.create_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to create XP transaction: {str(e)}") from e
    
    return XPTransaction(
        amount=amount,
        source=source,
        sourceId=source_id,
        description=description,
        timestamp=now_ms,
        eventId=event_id
    )


def record_level_event(user_id: str, level: int, total_xp: int, source: Optional[str] = None) -> LevelEvent:
    """
    Append a level-up event for auditing/history.
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    sk = f"LEVEL#EVENT#{now_ms:020d}"
    item = {
        "PK": f"USER#{user_id}",
        "SK": sk,
        "type": "LevelEvent",
        "userId": user_id,
        "level": level,
        "totalXp": total_xp,
        "source": source,
        "awardedAt": now_ms,
    }
    try:
        table.put_item(Item=item)
        logger.info("xp.level_event.recorded", user_id=user_id, level=level, total_xp=total_xp)
    except Exception as e:
        logger.warning("xp.level_event.record_error", user_id=user_id, error=str(e))
    return LevelEvent(
        userId=user_id,
        level=level,
        totalXp=total_xp,
        source=source,
        awardedAt=now_ms,
    )


def get_xp_transactions(user_id: str, limit: int = 50, offset: int = 0) -> List[XPTransaction]:
    """
    Get XP transaction history for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of transactions to return
        offset: Offset for pagination
        
    Returns:
        List of XPTransaction objects, sorted by timestamp descending
    """
    from boto3.dynamodb.conditions import Key
    
    table = _get_dynamodb_table()
    
    try:
        # Query for XP transactions
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("XP#"),
            ScanIndexForward=False,  # Descending order (newest first)
            Limit=limit + offset
        )
        
        items = response.get("Items", [])
        
        # Filter out the summary item and apply offset
        transactions = [
            item for item in items 
            if item.get("SK") != "XP#SUMMARY" and item.get("type") == "XPTransaction"
        ][offset:offset + limit]
        
        result = []
        for item in transactions:
            result.append(XPTransaction(
                amount=item.get("amount", 0),
                source=item.get("source", ""),
                sourceId=item.get("sourceId"),
                description=item.get("description", ""),
                timestamp=item.get("timestamp", item.get("createdAt", 0)),
                eventId=item.get("eventId")
            ))
        
        return result
    except Exception as e:
        logger.error("xp.transactions.get_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to get XP transactions: {str(e)}") from e


def check_event_id_exists(event_id: str) -> bool:
    """
    Check if an event ID already exists (for idempotency).
    
    Args:
        event_id: Event ID to check
        
    Returns:
        True if event ID exists, False otherwise
    """
    from boto3.dynamodb.conditions import Attr
    
    table = _get_dynamodb_table()
    
    try:
        # Query GSI1 for event ID (if we add it) or scan
        # For now, we'll use a simple approach: check if any transaction has this event_id
        # This is not optimal but works for idempotency checks
        response = table.scan(
            FilterExpression=Attr("eventId").eq(event_id) & Attr("type").eq("XPTransaction"),
            Limit=1
        )
        
        return len(response.get("Items", [])) > 0
    except Exception as e:
        logger.warning("xp.event_id.check_error", event_id=event_id, error=str(e))
        # If check fails, assume it doesn't exist to allow the transaction
        return False


def _encode_pagination_key(key: dict | None) -> Optional[str]:
    if not key:
        return None
    return base64.urlsafe_b64encode(json.dumps(key).encode("utf-8")).decode("utf-8")


def _decode_pagination_key(token: str | None) -> Optional[dict]:
    if not token:
        return None
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        return json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return None


def get_level_events(user_id: str, limit: int = 20, next_token: Optional[str] = None) -> tuple[list[LevelEvent], Optional[str]]:
    """
    Retrieve paginated level-up events for a user.
    """
    from boto3.dynamodb.conditions import Key

    table = _get_dynamodb_table()
    exclusive_start = _decode_pagination_key(next_token)

    try:
        query_args = {
            "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("LEVEL#EVENT#"),
            "ScanIndexForward": False,
            "Limit": limit,
        }
        if exclusive_start:
            query_args["ExclusiveStartKey"] = exclusive_start

        response = table.query(**query_args)
        items = response.get("Items", [])
        events: list[LevelEvent] = []
        for item in items:
            events.append(
                LevelEvent(
                    userId=item.get("userId", user_id),
                    level=int(item.get("level", 1)),
                    totalXp=int(item.get("totalXp", 0)),
                    source=item.get("source"),
                    awardedAt=int(item.get("awardedAt", item.get("createdAt", 0))),
                )
            )
        next_key = _encode_pagination_key(response.get("LastEvaluatedKey"))
        return events, next_key
    except Exception as e:
        logger.error("xp.level_events.get_error", user_id=user_id, error=str(e), exc_info=True)
        raise XPDBError(f"Failed to get level events: {str(e)}") from e

