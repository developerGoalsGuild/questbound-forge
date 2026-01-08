"""
Challenge database operations for the gamification service.
"""

import time
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import uuid4
# Lazy import of boto3 components to reduce cold start
# from boto3.dynamodb.conditions import Key, Attr
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

from ..models.challenge import Challenge, ChallengeParticipant
from ..settings import Settings

logger = get_structured_logger("challenge-db", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

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


class ChallengeDBError(Exception):
    """Custom exception for challenge database operations."""
    pass


def create_challenge(challenge: Challenge) -> Challenge:
    """
    Create a new challenge.
    
    Args:
        challenge: Challenge object
        
    Returns:
        Challenge object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    challenge_item = {
        "PK": f"CHALLENGE#{challenge.id}",
        "SK": "METADATA",
        "type": "Challenge",
        "id": challenge.id,
        "title": challenge.title,
        "description": challenge.description,
        "challengeType": challenge.type,
        "startDate": challenge.startDate,
        "endDate": challenge.endDate,
        "xpReward": challenge.xpReward,
        "createdBy": challenge.createdBy,
        "status": challenge.status,
        "createdAt": challenge.createdAt or now_ms,
        "updatedAt": challenge.updatedAt or now_ms,
    }
    
    if challenge.targetValue:
        challenge_item["targetValue"] = challenge.targetValue
    
    try:
        table.put_item(Item=challenge_item)
        logger.info("challenge.created", challenge_id=challenge.id, created_by=challenge.createdBy)
    except Exception as e:
        logger.error("challenge.create_error", challenge_id=challenge.id, error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to create challenge: {str(e)}") from e
    
    return challenge


def get_challenge(challenge_id: str) -> Optional[Challenge]:
    """
    Get challenge by ID.
    
    Args:
        challenge_id: Challenge ID
        
    Returns:
        Challenge or None if not found
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.get_item(
            Key={
                "PK": f"CHALLENGE#{challenge_id}",
                "SK": "METADATA"
            }
        )
        
        if "Item" not in response:
            return None
        
        item = response["Item"]
        return Challenge(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            type=item["challengeType"],
            startDate=item["startDate"],
            endDate=item["endDate"],
            xpReward=item.get("xpReward", 0),
            createdBy=item["createdBy"],
            status=item.get("status", "active"),
            targetValue=item.get("targetValue"),
            createdAt=item.get("createdAt", int(time.time() * 1000)),
            updatedAt=item.get("updatedAt", int(time.time() * 1000))
        )
    except Exception as e:
        logger.error("challenge.get_error", challenge_id=challenge_id, error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to get challenge: {str(e)}") from e


def list_challenges(status: Optional[str] = None, limit: int = 50) -> List[Challenge]:
    """
    List challenges.
    
    Args:
        status: Optional status filter
        limit: Maximum number of challenges to return
        
    Returns:
        List of Challenge objects
    """
    from boto3.dynamodb.conditions import Attr
    
    table = _get_dynamodb_table()
    
    try:
        if status:
            response = table.scan(
                FilterExpression=Attr("type").eq("Challenge") & Attr("status").eq(status),
                Limit=limit
            )
        else:
            response = table.scan(
                FilterExpression=Attr("type").eq("Challenge"),
                Limit=limit
            )
        
        challenges = []
        for item in response.get("Items", []):
            challenges.append(Challenge(
                id=item["id"],
                title=item["title"],
                description=item["description"],
                type=item["challengeType"],
                startDate=item["startDate"],
                endDate=item["endDate"],
                xpReward=item.get("xpReward", 0),
                createdBy=item["createdBy"],
                status=item.get("status", "active"),
                targetValue=item.get("targetValue"),
                createdAt=item.get("createdAt", int(time.time() * 1000)),
                updatedAt=item.get("updatedAt", int(time.time() * 1000))
            ))
        
        return challenges
    except Exception as e:
        logger.error("challenge.list_error", error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to list challenges: {str(e)}") from e


def join_challenge(user_id: str, challenge_id: str) -> ChallengeParticipant:
    """
    Join a challenge.
    
    Args:
        user_id: User ID
        challenge_id: Challenge ID
        
    Returns:
        ChallengeParticipant object
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    # Check if already joined
    try:
        existing = table.get_item(
            Key={
                "PK": f"CHALLENGE#{challenge_id}",
                "SK": f"PARTICIPANT#{user_id}"
            }
        )
        if "Item" in existing:
            # Already joined, return existing
            item = existing["Item"]
            return ChallengeParticipant(
                userId=user_id,
                challengeId=challenge_id,
                progress=item.get("progress", 0.0),
                currentValue=item.get("currentValue", 0),
                rank=item.get("rank"),
                joinedAt=item.get("joinedAt", now_ms),
                completedAt=item.get("completedAt")
            )
    except Exception:
        pass
    
    participant_item = {
        "PK": f"CHALLENGE#{challenge_id}",
        "SK": f"PARTICIPANT#{user_id}",
        "type": "ChallengeParticipant",
        "userId": user_id,
        "challengeId": challenge_id,
        "progress": Decimal("0.0"),
        "currentValue": 0,
        "joinedAt": now_ms,
        "createdAt": now_ms,
        # GSI for user challenges
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"CHALLENGE#{challenge_id}",
    }
    
    try:
        table.put_item(Item=participant_item)
        logger.info("challenge.joined", user_id=user_id, challenge_id=challenge_id)
    except Exception as e:
        logger.error("challenge.join_error", user_id=user_id, challenge_id=challenge_id, error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to join challenge: {str(e)}") from e
    
    return ChallengeParticipant(
        userId=user_id,
        challengeId=challenge_id,
        progress=0.0,
        currentValue=0,
        rank=None,
        joinedAt=now_ms,
        completedAt=None
    )


def get_challenge_participants(challenge_id: str) -> List[ChallengeParticipant]:
    """
    Get all participants for a challenge.
    
    Args:
        challenge_id: Challenge ID
        
    Returns:
        List of ChallengeParticipant objects
    """
    from boto3.dynamodb.conditions import Key
    
    table = _get_dynamodb_table()
    
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"CHALLENGE#{challenge_id}") & Key("SK").begins_with("PARTICIPANT#")
        )
        
        participants = []
        for item in response.get("Items", []):
            participants.append(ChallengeParticipant(
                userId=item["userId"],
                challengeId=challenge_id,
                progress=item.get("progress", 0.0),
                currentValue=item.get("currentValue", 0),
                rank=item.get("rank"),
                joinedAt=item.get("joinedAt", item.get("createdAt", int(time.time() * 1000))),
                completedAt=item.get("completedAt")
            ))
        
        # Sort by currentValue descending for ranking
        participants.sort(key=lambda p: p.currentValue, reverse=True)
        for i, participant in enumerate(participants):
            participant.rank = i + 1
        
        return participants
    except Exception as e:
        logger.error("challenge.participants.get_error", challenge_id=challenge_id, error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to get challenge participants: {str(e)}") from e


def update_participant_progress(challenge_id: str, user_id: str, current_value: int, progress: float):
    """
    Update participant progress.
    
    Args:
        challenge_id: Challenge ID
        user_id: User ID
        current_value: Current value
        progress: Progress (0.0-1.0)
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    try:
        table.update_item(
            Key={
                "PK": f"CHALLENGE#{challenge_id}",
                "SK": f"PARTICIPANT#{user_id}"
            },
            UpdateExpression="SET currentValue = :value, progress = :progress, updatedAt = :updated",
            ExpressionAttributeValues={
                ":value": current_value,
                ":progress": Decimal(str(progress)),
                ":updated": now_ms
            }
        )
        logger.info("challenge.progress.updated", challenge_id=challenge_id, user_id=user_id, value=current_value)
    except Exception as e:
        logger.error("challenge.progress.update_error", challenge_id=challenge_id, user_id=user_id, error=str(e), exc_info=True)
        raise ChallengeDBError(f"Failed to update participant progress: {str(e)}") from e

