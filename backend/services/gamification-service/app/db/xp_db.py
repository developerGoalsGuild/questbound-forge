"""
XP database operations for the gamification service.

This module handles all database operations related to XP following the single-table design pattern.
"""

import time
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Any
from uuid import uuid4
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import BotoCoreError, ClientError

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

from ..models.xp import XPTransaction, XPSummary
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("xp-db", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily
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
    
    summary_item = {
        "PK": f"USER#{user_id}",
        "SK": "XP#SUMMARY",
        "type": "XPSummary",
        "userId": user_id,
        "totalXp": initial_xp,
        "currentLevel": 1,
        "xpForCurrentLevel": 0,
        "xpForNextLevel": 100,
        "xpProgress": Decimal("0.0"),
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

