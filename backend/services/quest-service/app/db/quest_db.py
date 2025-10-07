"""
DynamoDB helper functions for Quest operations.

This module provides comprehensive database operations for Quest entities
following the single-table design pattern and existing quest-service conventions.
"""

import time
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

from ..models.quest import QuestCreatePayload, QuestUpdatePayload, QuestResponse, QuestStatus
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("quest-db", env_flag="QUEST_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


class QuestDBError(Exception):
    """Custom exception for Quest database operations."""
    pass


class QuestNotFoundError(QuestDBError):
    """Raised when a quest is not found."""
    pass


class QuestVersionConflictError(QuestDBError):
    """Raised when optimistic locking version conflict occurs."""
    pass


class QuestPermissionError(QuestDBError):
    """Raised when user doesn't have permission for the operation."""
    pass


class QuestValidationError(QuestDBError):
    """Raised when quest validation fails."""
    pass


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    import boto3
    settings = _get_settings()
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return dynamodb.Table(settings.core_table_name)


def _build_quest_item(user_id: str, payload: QuestCreatePayload) -> Dict[str, Any]:
    """
    Build DynamoDB item for quest creation.
    
    Args:
        user_id: User ID who owns the quest
        payload: Quest creation payload
        
    Returns:
        DynamoDB item dictionary
    """
    now_ms = int(time.time() * 1000)
    quest_id = str(uuid4())
    
    # Build base item
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"QUEST#{quest_id}",
        "type": "Quest",
        "id": quest_id,
        "userId": user_id,
        "title": payload.title,
        "difficulty": payload.difficulty,
        "rewardXp": payload.rewardXp,
        "status": "draft",  # Always create as draft
        "category": payload.category,
        "tags": payload.tags or [],
        "privacy": payload.privacy,
        "kind": payload.kind,
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "version": 1,
        "auditTrail": [],
        # GSI for querying quests by user and creation time
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"ENTITY#Quest#{now_ms}",
    }
    
    # Add optional fields
    if payload.description:
        item["description"] = payload.description
    if payload.deadline:
        item["deadline"] = payload.deadline
    
    # Add linking fields
    if payload.linkedGoalIds:
        item["linkedGoalIds"] = payload.linkedGoalIds
    if payload.linkedTaskIds:
        item["linkedTaskIds"] = payload.linkedTaskIds
    if payload.dependsOnQuestIds:
        item["dependsOnQuestIds"] = payload.dependsOnQuestIds
    
    # Add quantitative quest fields
    if payload.kind == "quantitative":
        if payload.targetCount is not None:
            item["targetCount"] = payload.targetCount
        if payload.countScope:
            item["countScope"] = payload.countScope
        if payload.periodDays:
            item["periodDays"] = payload.periodDays
    
    return item


def _quest_item_to_response(item: Dict[str, Any]) -> QuestResponse:
    """
    Convert DynamoDB item to QuestResponse.
    
    Args:
        item: DynamoDB item
        
    Returns:
        QuestResponse object
    """
    return QuestResponse(
        id=item["id"],
        userId=item["userId"],
        title=item["title"],
        description=item.get("description"),
        difficulty=item["difficulty"],
        rewardXp=item["rewardXp"],
        status=item["status"],
        category=item["category"],
        tags=item.get("tags", []),
        privacy=item["privacy"],
        deadline=item.get("deadline"),
        createdAt=item["createdAt"],
        updatedAt=item["updatedAt"],
        version=item["version"],
        kind=item["kind"],
        linkedGoalIds=item.get("linkedGoalIds"),
        linkedTaskIds=item.get("linkedTaskIds"),
        dependsOnQuestIds=item.get("dependsOnQuestIds"),
        targetCount=item.get("targetCount"),
        countScope=item.get("countScope"),
        periodDays=item.get("periodDays"),
        auditTrail=item.get("auditTrail", [])
    )


def _validate_quest_can_start(quest: QuestResponse) -> None:
    """
    Validate that a quest can be started (has all required fields).
    
    Args:
        quest: QuestResponse object to validate
        
    Raises:
        QuestValidationError: If quest validation fails
    """
    # Check if quest exists
    if not quest:
        raise QuestValidationError("Quest not found. Please refresh the page and try again.")
    
    # Check if quest is in draft status
    if quest.status != "draft":
        status_display = quest.status.replace("_", " ").title()
        raise QuestValidationError(f"Cannot start quest. Quest is currently {status_display}. Only draft quests can be started.")
    
    # Check required fields for all quests
    if not quest.title or not quest.title.strip():
        raise QuestValidationError("Quest title is required. Please add a title to your quest before starting it.")
    
    if not quest.category or not quest.category.strip():
        raise QuestValidationError("Quest category is required. Please select a category for your quest before starting it.")
    
    if not quest.difficulty or quest.difficulty not in ["easy", "medium", "hard"]:
        raise QuestValidationError("Quest difficulty is required. Please select a difficulty level (Easy, Medium, or Hard) before starting your quest.")
    
    if not quest.kind or quest.kind not in ["linked", "quantitative"]:
        raise QuestValidationError("Quest type is required. Please select whether this is a Linked or Quantitative quest before starting it.")
    
    # Validate quantitative quest requirements
    if quest.kind == "quantitative":
        if not quest.targetCount or quest.targetCount <= 0:
            raise QuestValidationError("Quantitative quest requires a target count. Please set how many items you want to complete before starting your quest.")
        
        if not quest.countScope or quest.countScope not in ["completed_tasks", "completed_goals", "any"]:
            raise QuestValidationError("Quantitative quest requires a count scope. Please select what to count (completed tasks or goals) before starting your quest.")
        
        if not quest.periodDays or quest.periodDays <= 0:
            raise QuestValidationError("Quantitative quest requires a time period. Please set how many days you want to complete this quest in before starting it.")
    
    # Validate linked quest requirements
    if quest.kind == "linked":
        if not quest.linkedGoalIds or len(quest.linkedGoalIds) == 0:
            raise QuestValidationError("Linked quest requires at least one goal. Please select the goals you want to work on before starting your quest.")
        
        if not quest.linkedTaskIds or len(quest.linkedTaskIds) == 0:
            raise QuestValidationError("Linked quest requires at least one task. Please select the tasks you want to work on before starting your quest.")


def create_quest(user_id: str, payload: QuestCreatePayload) -> QuestResponse:
    """
    Create a new quest in DynamoDB.
    
    Args:
        user_id: User ID who owns the quest
        payload: Quest creation payload
        
    Returns:
        QuestResponse object
        
    Raises:
        QuestDBError: If quest creation fails
    """
    try:
        table = _get_dynamodb_table()
        item = _build_quest_item(user_id, payload)
    except BotoCoreError as e:
        logger.error('quest.create_failed', 
                    user_id=user_id, 
                    quest_id="unknown",
                    exc_info=e)
        raise QuestDBError(f"Failed to create quest: {str(e)}")
    except Exception as e:
        logger.error('quest.create_failed', 
                    user_id=user_id, 
                    quest_id="unknown",
                    exc_info=e)
        raise QuestDBError(f"Failed to create quest: {str(e)}")
    
    try:
        # Add audit trail entry
        item["auditTrail"].append({
            "action": "created",
            "timestamp": item["createdAt"],
            "userId": user_id,
            "details": {"status": "draft"}
        })
        
        # Put item with condition to prevent duplicates
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)"
        )
        
        logger.info('quest.create_success', 
                   user_id=user_id, 
                   quest_id=item["id"],
                   title=item["title"])
        
        return _quest_item_to_response(item)
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.error('quest.create_duplicate', 
                        user_id=user_id, 
                        quest_id=item["id"],
                        exc_info=e)
            raise QuestDBError("Quest with this ID already exists")
        else:
            logger.error('quest.create_failed', 
                        user_id=user_id, 
                        quest_id=item["id"],
                        exc_info=e)
            raise QuestDBError(f"Failed to create quest: {e.response['Error']['Message']}")
    except BotoCoreError as e:
        logger.error('quest.create_failed', 
                    user_id=user_id, 
                    quest_id=item.get("id"),
                    exc_info=e)
        raise QuestDBError(f"Failed to create quest: {str(e)}")
    except Exception as e:
        logger.error('quest.create_failed', 
                    user_id=user_id, 
                    quest_id=item.get("id"),
                    exc_info=e)
        raise QuestDBError(f"Failed to create quest: {str(e)}")


def get_quest(user_id: str, quest_id: str) -> QuestResponse:
    """
    Get a specific quest by ID.
    
    Args:
        user_id: User ID who owns the quest
        quest_id: Quest ID
        
    Returns:
        QuestResponse object
        
    Raises:
        QuestNotFoundError: If quest is not found
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            }
        )
        
        if "Item" not in response:
            logger.warning('quest.not_found', 
                          user_id=user_id, 
                          quest_id=quest_id)
            raise QuestNotFoundError(f"Quest {quest_id} not found")
        
        logger.info('quest.get_success', 
                   user_id=user_id, 
                   quest_id=quest_id)
        
        return _quest_item_to_response(response["Item"])
        
    except QuestNotFoundError:
        raise
    except Exception as e:
        logger.error('quest.get_failed', 
                    user_id=user_id, 
                    quest_id=quest_id,
                    exc_info=e)
        raise QuestDBError(f"Failed to get quest: {str(e)}")


def update_quest(user_id: str, quest_id: str, payload: QuestUpdatePayload, 
                current_version: int) -> QuestResponse:
    """
    Update a quest (draft only).
    
    Args:
        user_id: User ID who owns the quest
        quest_id: Quest ID
        payload: Quest update payload
        current_version: Current version for optimistic locking
        
    Returns:
        QuestResponse object
        
    Raises:
        QuestNotFoundError: If quest is not found
        QuestVersionConflictError: If version conflict occurs
        QuestPermissionError: If quest is not in draft status
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    try:
        # First, get the current quest to check status
        current_quest = get_quest(user_id, quest_id)
        
        # Only allow updates to draft quests
        if current_quest.status != "draft":
            logger.warning('quest.update_not_draft', 
                          user_id=user_id, 
                          quest_id=quest_id,
                          current_status=current_quest.status)
            raise QuestPermissionError("Only draft quests can be updated")
        
        # Build update expression
        update_expression = "SET updatedAt = :updatedAt, version = :new_version"
        expression_attribute_values = {
            ":updatedAt": now_ms,
            ":new_version": current_version + 1,
            ":current_version": current_version
        }
        
        # Add fields to update
        update_fields = []
        for field, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                expression_attribute_values[f":{field}"] = value
        
        if update_fields:
            update_expression += ", " + ", ".join(update_fields)
        
        # Add audit trail entry
        audit_entry = {
            "action": "updated",
            "timestamp": now_ms,
            "userId": user_id,
            "details": {"updatedFields": list(payload.model_dump(exclude_unset=True).keys())}
        }
        
        update_expression += ", auditTrail = list_append(auditTrail, :audit_entry)"
        expression_attribute_values[":audit_entry"] = [audit_entry]
        
        # Perform update with optimistic locking
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression="version = :current_version",
            ReturnValues="ALL_NEW"
        )
        
        logger.info('quest.update_success', 
                   user_id=user_id, 
                   quest_id=quest_id,
                   updated_fields=list(payload.model_dump(exclude_unset=True).keys()))
        
        return _quest_item_to_response(response["Attributes"])
        
    except QuestNotFoundError:
        raise
    except QuestPermissionError:
        raise
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning('quest.update_version_conflict', 
                          user_id=user_id, 
                          quest_id=quest_id,
                          current_version=current_version)
            raise QuestVersionConflictError("Quest was modified by another operation")
        else:
            logger.error('quest.update_failed', 
                        user_id=user_id, 
                        quest_id=quest_id,
                        exc_info=e)
            raise QuestDBError(f"Failed to update quest: {e.response['Error']['Message']}")
    except Exception as e:
        logger.error('quest.update_failed', 
                    user_id=user_id, 
                    quest_id=quest_id,
                    exc_info=e)
        raise QuestDBError(f"Failed to update quest: {str(e)}")


def change_quest_status(user_id: str, quest_id: str, new_status: QuestStatus, 
                       reason: Optional[str] = None) -> QuestResponse:
    """
    Change quest status (draft -> active, active -> completed/cancelled/failed).
    
    Args:
        user_id: User ID who owns the quest
        quest_id: Quest ID
        new_status: New quest status
        reason: Optional reason for status change
        
    Returns:
        QuestResponse object
        
    Raises:
        QuestNotFoundError: If quest is not found
        QuestPermissionError: If status change is not allowed
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    now_ms = int(time.time() * 1000)
    
    try:
        # Get current quest
        current_quest = get_quest(user_id, quest_id)
        
        # Validate status transition
        valid_transitions = {
            "draft": ["active"],
            "active": ["completed", "cancelled", "failed"],
            "completed": [],  # Terminal state
            "cancelled": [],  # Terminal state
            "failed": []      # Terminal state
        }
        
        if new_status not in valid_transitions.get(current_quest.status, []):
            logger.warning('quest.invalid_status_transition', 
                          user_id=user_id, 
                          quest_id=quest_id,
                          current_status=current_quest.status,
                          new_status=new_status)
            raise QuestPermissionError(f"Cannot change status from {current_quest.status} to {new_status}")
        
        # Validate quest can be started (only when transitioning to active)
        if new_status == "active":
            try:
                _validate_quest_can_start(current_quest)
            except QuestValidationError as e:
                logger.warning('quest.start_validation_failed', 
                              user_id=user_id, 
                              quest_id=quest_id,
                              validation_error=str(e))
                raise QuestValidationError(f"Cannot start quest: {str(e)}")
        
        # Build audit entry
        audit_entry = {
            "action": "status_changed",
            "timestamp": now_ms,
            "userId": user_id,
            "details": {
                "from": current_quest.status,
                "to": new_status,
                "reason": reason
            }
        }
        
        # Update quest status
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            },
            UpdateExpression="SET #status = :new_status, updatedAt = :updatedAt, version = version + :inc, auditTrail = list_append(auditTrail, :audit_entry)",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":new_status": new_status,
                ":updatedAt": now_ms,
                ":inc": 1,
                ":audit_entry": [audit_entry]
            },
            ReturnValues="ALL_NEW"
        )
        
        logger.info('quest.status_change_success', 
                   user_id=user_id, 
                   quest_id=quest_id,
                   from_status=current_quest.status,
                   to_status=new_status)
        
        return _quest_item_to_response(response["Attributes"])
        
    except QuestNotFoundError:
        raise
    except QuestPermissionError:
        raise
    except QuestValidationError:
        raise
    except Exception as e:
        logger.error('quest.status_change_failed', 
                    user_id=user_id, 
                    quest_id=quest_id,
                    new_status=new_status,
                    exc_info=e)
        raise QuestDBError(f"Failed to change quest status: {str(e)}")


def list_user_quests(user_id: str, goal_id: Optional[str] = None, 
                    status: Optional[QuestStatus] = None) -> List[QuestResponse]:
    """
    List all quests for a user, optionally filtered by goal or status.
    
    Args:
        user_id: User ID
        goal_id: Optional goal ID to filter by
        status: Optional status to filter by
        
    Returns:
        List of QuestResponse objects
        
    Raises:
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Query GSI1 for user's quests
        response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & 
                                 Key("GSI1SK").begins_with("ENTITY#Quest#")
        )
        
        quests = []
        for item in response.get("Items", []):
            # Apply filters
            if goal_id and goal_id not in item.get("linkedGoalIds", []):
                continue
            if status and item.get("status") != status:
                continue
            
            quests.append(_quest_item_to_response(item))
        
        # Sort by creation time (newest first)
        quests.sort(key=lambda x: x.createdAt, reverse=True)
        
        logger.info('quest.list_success', 
                   user_id=user_id, 
                   quest_count=len(quests),
                   goal_id=goal_id,
                   status=status)
        
        return quests
        
    except Exception as e:
        logger.error('quest.list_failed', 
                    user_id=user_id,
                    goal_id=goal_id,
                    status=status,
                    exc_info=e)
        raise QuestDBError(f"Failed to list quests: {str(e)}")


def delete_quest(user_id: str, quest_id: str, admin_user: bool = False) -> bool:
    """
    Delete a quest (admin only for active+ quests).
    
    Args:
        user_id: User ID who owns the quest
        quest_id: Quest ID
        admin_user: Whether the user has admin privileges
        
    Returns:
        True if quest was deleted
        
    Raises:
        QuestNotFoundError: If quest is not found
        QuestPermissionError: If user doesn't have permission to delete
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Get current quest
        current_quest = get_quest(user_id, quest_id)
        
        # Check permissions
        if current_quest.status != "draft" and not admin_user:
            logger.warning('quest.delete_not_draft_no_admin', 
                          user_id=user_id, 
                          quest_id=quest_id,
                          status=current_quest.status)
            raise QuestPermissionError("Only draft quests can be deleted by non-admin users")
        
        # Delete the quest
        table.delete_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            }
        )
        
        logger.info('quest.delete_success', 
                   user_id=user_id, 
                   quest_id=quest_id,
                   status=current_quest.status,
                   admin_user=admin_user)
        
        return True
        
    except QuestNotFoundError:
        raise
    except QuestPermissionError:
        raise
    except Exception as e:
        logger.error('quest.delete_failed', 
                    user_id=user_id, 
                    quest_id=quest_id,
                    exc_info=e)
        raise QuestDBError(f"Failed to delete quest: {str(e)}")


def get_quest_by_id(quest_id: str) -> Optional[QuestResponse]:
    """
    Get a quest by ID without user ownership check (for admin operations).
    
    Args:
        quest_id: Quest ID
        
    Returns:
        QuestResponse object or None if not found
        
    Raises:
        QuestDBError: If database operation fails
    """
    table = _get_dynamodb_table()
    
    try:
        # Scan for quest by ID (less efficient but necessary for admin operations)
        response = table.scan(
            FilterExpression=Attr("type").eq("Quest") & Attr("id").eq(quest_id)
        )
        
        items = response.get("Items", [])
        if not items:
            return None
        
        # Return the first match (should be unique)
        return _quest_item_to_response(items[0])
        
    except Exception as e:
        logger.error('quest.get_by_id_failed', 
                    quest_id=quest_id,
                    exc_info=e)
        raise QuestDBError(f"Failed to get quest by ID: {str(e)}")
