"""
DynamoDB helper functions for Quest operations.

This module provides comprehensive database operations for Quest entities
following the single-table design pattern and existing quest-service conventions.
"""

import time
from datetime import datetime
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

from ..models.quest import QuestCreatePayload, QuestUpdatePayload, QuestResponse, QuestStatus, QuestKind
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
        "GSI1SK": f"QUEST#{now_ms}",
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
        startedAt=item.get("startedAt"),
        completedAt=item.get("completedAt"),
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
        
        # Build update expression - include startedAt when transitioning to active
        update_expression = "SET #status = :new_status, updatedAt = :updatedAt, version = version + :inc, auditTrail = list_append(auditTrail, :audit_entry)"
        expression_attribute_values = {
            ":new_status": new_status,
            ":updatedAt": now_ms,
            ":inc": 1,
            ":audit_entry": [audit_entry]
        }
        
        # Add startedAt when transitioning to active
        if new_status == "active":
            update_expression += ", startedAt = :startedAt"
            expression_attribute_values[":startedAt"] = now_ms
        
        # Update quest status
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues=expression_attribute_values,
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
        # Query GSI1 for user's quests with strong consistency (SK starts with "QUEST#")
        response = table.query(
            #IndexName="GSI1",
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") &
                                 Key("SK").begins_with("QUEST#"),
            ConsistentRead=True
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


# Rate limiting for quest completion checks
_quest_completion_checks = {}  # {user_id: {last_check: timestamp, count: int}}
RATE_LIMIT_WINDOW = 60  # 1 minute
MAX_CHECKS_PER_WINDOW = 10  # Max 10 checks per minute per user


def _is_rate_limited(user_id: str) -> bool:
    """Check if user has exceeded rate limit for quest completion checks"""
    now = time.time()
    
    if user_id not in _quest_completion_checks:
        _quest_completion_checks[user_id] = {'last_check': now, 'count': 0}
        return False
    
    user_checks = _quest_completion_checks[user_id]
    
    # Reset counter if window has passed
    if now - user_checks['last_check'] > RATE_LIMIT_WINDOW:
        user_checks['count'] = 0
        user_checks['last_check'] = now
    
    # Check if rate limited
    if user_checks['count'] >= MAX_CHECKS_PER_WINDOW:
        return True
    
    # Increment counter
    user_checks['count'] += 1
    return False


async def check_and_complete_quests(
    user_id: str, 
    completed_task_id: str, 
    completed_goal_id: str
) -> dict:
    """
    Check and auto-complete quests when a task is completed.
    
    Args:
        user_id: ID of the user who completed the task
        completed_task_id: ID of the completed task
        completed_goal_id: ID of the goal containing the completed task
        
    Returns:
        dict: {
            'completed_quests': [quest_id1, quest_id2, ...],
            'errors': [error1, error2, ...]
        }
    """
    try:
        logger.info('quest.auto_completion_started', 
                   user_id=user_id,
                   task_id=completed_task_id,
                   goal_id=completed_goal_id,
                   timestamp=time.time())
        
        # Check rate limiting
        if _is_rate_limited(user_id):
            logger.warning('quest.auto_completion_rate_limited', 
                         user_id=user_id,
                         task_id=completed_task_id,
                         rate_limit_window=RATE_LIMIT_WINDOW,
                         max_checks=MAX_CHECKS_PER_WINDOW)
            return {'completed_quests': [], 'errors': ['Rate limited']}
        
        logger.info('quest.auto_completion_rate_limit_passed', user_id=user_id)
        
        # Get all active quests for the user
        logger.info('quest.auto_completion_fetching_active_quests', user_id=user_id)
        active_quests = list_user_quests(user_id, status="active")
        
        logger.info('quest.auto_completion_active_quests_found', 
                   user_id=user_id,
                   active_quest_count=len(active_quests),
                   quest_ids=[q.id for q in active_quests])
        
        if not active_quests:
            logger.info('quest.auto_completion_no_active_quests', user_id=user_id)
            return {'completed_quests': [], 'errors': []}
        
        completed_quests = []
        errors = []
        
        # Check each active quest for completion
        logger.info('quest.auto_completion_checking_quests', 
                   user_id=user_id,
                   quest_count=len(active_quests))
        
        for i, quest in enumerate(active_quests):
            try:
                logger.info('quest.auto_completion_checking_quest', 
                           user_id=user_id,
                           quest_id=quest.id,
                           quest_kind=quest.kind,
                           quest_status=quest.status,
                           quest_index=i+1,
                           total_quests=len(active_quests))
                
                should_complete = await _check_quest_completion(quest, user_id, completed_task_id, completed_goal_id)
                
                logger.info('quest.auto_completion_quest_check_result', 
                           user_id=user_id,
                           quest_id=quest.id,
                           should_complete=should_complete)
                
                if should_complete:
                    # Mark quest as completed
                    logger.info('quest.auto_completion_marking_complete', 
                               user_id=user_id,
                               quest_id=quest.id)
                    
                    await _complete_quest(quest.id, user_id)
                    completed_quests.append(quest.id)
                    
                    logger.info('quest.auto_completed', 
                              quest_id=quest.id,
                              user_id=user_id,
                              task_id=completed_task_id,
                              completed_at=time.time())
                else:
                    logger.info('quest.auto_completion_quest_not_ready', 
                               user_id=user_id,
                               quest_id=quest.id,
                               reason="Completion conditions not met")
                    
            except Exception as e:
                error_msg = f"Failed to check quest {quest.id}: {str(e)}"
                errors.append(error_msg)
                logger.error('quest.auto_completion_error', 
                           quest_id=quest.id,
                           user_id=user_id,
                           error=str(e),
                           error_type=type(e).__name__,
                           exc_info=e)
        
        logger.info('quest.auto_completion_finished', 
                   user_id=user_id,
                   completed_count=len(completed_quests),
                   error_count=len(errors),
                   completed_quest_ids=completed_quests,
                   error_messages=errors)
        
        return {
            'completed_quests': completed_quests,
            'errors': errors
        }
        
    except Exception as e:
        logger.error('quest.auto_completion_failed', 
                    user_id=user_id,
                    task_id=completed_task_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        return {'completed_quests': [], 'errors': [f"Auto-completion failed: {str(e)}"]}


async def _check_quest_completion(
    quest: QuestResponse, 
    user_id: str, 
    completed_task_id: str, 
    completed_goal_id: str
) -> bool:
    """
    Check if a quest should be completed based on its type and current state.
    
    Args:
        quest: The quest to check
        user_id: ID of the user
        completed_task_id: ID of the recently completed task
        completed_goal_id: ID of the goal containing the completed task
        
    Returns:
        bool: True if quest should be completed, False otherwise
    """
    try:
        logger.info('quest.completion_check_started', 
                   quest_id=quest.id,
                   user_id=user_id,
                   quest_kind=quest.kind,
                   quest_status=quest.status,
                   completed_task_id=completed_task_id,
                   completed_goal_id=completed_goal_id)
        
        # Check dependencies first
        if quest.dependsOnQuestIds:
            logger.info('quest.completion_check_dependencies', 
                       quest_id=quest.id,
                       dependency_count=len(quest.dependsOnQuestIds),
                       dependency_ids=quest.dependsOnQuestIds)
            
            for dep_quest_id in quest.dependsOnQuestIds:
                dep_quest = get_quest_by_id(dep_quest_id)
                if not dep_quest:
                    logger.warning('quest.completion_check_dependency_not_found', 
                                 quest_id=quest.id,
                                 dependency_id=dep_quest_id)
                    return False
                
                if dep_quest.status != "completed":
                    logger.info('quest.completion_check_dependency_not_completed', 
                               quest_id=quest.id,
                               dependency_id=dep_quest_id,
                               dependency_status=dep_quest.status)
                    return False
                
                logger.info('quest.completion_check_dependency_completed', 
                           quest_id=quest.id,
                           dependency_id=dep_quest_id)
        else:
            logger.info('quest.completion_check_no_dependencies', quest_id=quest.id)
        
        # Check quest type-specific completion
        if quest.kind == "linked":
            logger.info('quest.completion_check_linked_quest', quest_id=quest.id)
            result = await _check_linked_quest_completion(quest, user_id)
            logger.info('quest.completion_check_linked_result', 
                       quest_id=quest.id,
                       result=result)
            return result
        elif quest.kind == "quantitative":
            logger.info('quest.completion_check_quantitative_quest', quest_id=quest.id)
            result = await _check_quantitative_quest_completion(quest, user_id)
            logger.info('quest.completion_check_quantitative_result', 
                       quest_id=quest.id,
                       result=result)
            return result
        else:
            logger.warning('quest.unknown_kind', quest_id=quest.id, kind=quest.kind)
            return False
            
    except Exception as e:
        logger.error('quest.completion_check_failed', 
                    quest_id=quest.id,
                    user_id=user_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        return False


async def _check_linked_quest_completion(quest: QuestResponse, user_id: str) -> bool:
    """Check if a linked quest is completed"""
    try:
        logger.info('quest.linked_completion_check_started', 
                   quest_id=quest.id,
                   user_id=user_id,
                   linked_task_count=len(quest.linkedTaskIds) if quest.linkedTaskIds else 0,
                   linked_goal_count=len(quest.linkedGoalIds) if quest.linkedGoalIds else 0)
        
        # Check if all linked tasks are completed
        if quest.linkedTaskIds:
            logger.info('quest.linked_tasks_check_started', 
                       quest_id=quest.id,
                       linked_task_ids=quest.linkedTaskIds)
            
            all_tasks_completed = await _check_tasks_completion(quest.linkedTaskIds, user_id)
            logger.info('quest.linked_tasks_check_result', 
                       quest_id=quest.id,
                       all_tasks_completed=all_tasks_completed)
            
            if not all_tasks_completed:
                logger.info('quest.linked_completion_check_result', 
                           quest_id=quest.id,
                           result=False,
                           reason="Not all linked tasks are completed")
                return False
        else:
            logger.info('quest.linked_no_tasks', quest_id=quest.id)
        
        # For linked quests, we only check tasks completion, not goals
        # The goals are just containers for the tasks
        logger.info('quest.linked_goals_check_skipped',
                   quest_id=quest.id,
                   reason="Linked quests only check task completion, not goal completion")
        
        # All linked tasks and goals are completed
        logger.info('quest.linked_completion_check_result', 
                   quest_id=quest.id,
                   result=True,
                   reason="All linked tasks and goals are completed")
        return True
        
    except Exception as e:
        logger.error('quest.linked_completion_check_failed', 
                    quest_id=quest.id,
                    user_id=user_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        return False


async def _check_quantitative_quest_completion(quest: QuestResponse, user_id: str) -> bool:
    """Check if a quantitative quest is completed"""
    try:
        logger.info('quest.quantitative_completion_check_started', 
                   quest_id=quest.id,
                   user_id=user_id,
                   target_count=quest.targetCount,
                   period_days=quest.periodDays,
                   started_at=quest.startedAt,
                   count_scope=quest.countScope)
        
        if not quest.targetCount or not quest.periodDays or not quest.startedAt:
            logger.warning('quest.quantitative_missing_required_fields', 
                          quest_id=quest.id,
                          has_target_count=bool(quest.targetCount),
                          has_period_days=bool(quest.periodDays),
                          has_started_at=bool(quest.startedAt))
            return False
        
        # Check if quest is still within its active period
        now_ms = int(time.time() * 1000)
        quest_end_time = quest.startedAt + (quest.periodDays * 24 * 60 * 60 * 1000)
        
        logger.info('quest.quantitative_time_check', 
                   quest_id=quest.id,
                   now_ms=now_ms,
                   started_at=quest.startedAt,
                   period_days=quest.periodDays,
                   quest_end_time=quest_end_time,
                   time_remaining_ms=quest_end_time - now_ms)
        
        if now_ms > quest_end_time:
            # Quest has expired, should be marked as failed
            logger.info('quest.expired', 
                       quest_id=quest.id, 
                       started_at=quest.startedAt, 
                       period_days=quest.periodDays,
                       expired_by_ms=now_ms - quest_end_time)
            return False
        
        # Check progress based on count scope
        if quest.countScope == "completed_tasks":
            logger.info('quest.quantitative_tasks_check_started',
                       quest_id=quest.id,
                       count_scope=quest.countScope)

            # Count all tasks completed after quest started
            completed_count = await _count_completed_tasks_after_quest_start(user_id, quest.startedAt)
            logger.info('quest.quantitative_tasks_count', 
                       quest_id=quest.id,
                       completed_count=completed_count,
                       target_count=quest.targetCount)
            
            is_completed = completed_count >= quest.targetCount
            logger.info('quest.quantitative_completion_check_result', 
                       quest_id=quest.id,
                       result=is_completed,
                       reason=f"Completed {completed_count}/{quest.targetCount} tasks" if is_completed else f"Only completed {completed_count}/{quest.targetCount} tasks")
            return is_completed
            
        elif quest.countScope == "completed_goals":
            logger.info('quest.quantitative_goals_check_started',
                       quest_id=quest.id,
                       count_scope=quest.countScope)

            # Count all goals completed after quest started
            completed_count = await _count_completed_goals_after_quest_start(user_id, quest.startedAt)
            logger.info('quest.quantitative_goals_count', 
                       quest_id=quest.id,
                       completed_count=completed_count,
                       target_count=quest.targetCount)
            
            is_completed = completed_count >= quest.targetCount
            logger.info('quest.quantitative_completion_check_result', 
                       quest_id=quest.id,
                       result=is_completed,
                       reason=f"Completed {completed_count}/{quest.targetCount} goals" if is_completed else f"Only completed {completed_count}/{quest.targetCount} goals")
            return is_completed
        
        else:
            logger.warning('quest.quantitative_unknown_scope', 
                          quest_id=quest.id,
                          count_scope=quest.countScope)
            return False
        
    except Exception as e:
        logger.error('quest.quantitative_completion_check_failed', 
                    quest_id=quest.id,
                    user_id=user_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        return False


async def _complete_quest(quest_id: str, user_id: str) -> None:
    """Mark a quest as completed"""
    try:
        logger.info('quest.completion_started', 
                   quest_id=quest_id,
                   user_id=user_id,
                   timestamp=time.time())
        
        table = _get_dynamodb_table()
        now_ms = int(time.time() * 1000)
        
        logger.info('quest.completion_updating_status', 
                   quest_id=quest_id,
                   user_id=user_id,
                   new_status="completed",
                   completed_at=now_ms)
        
        # Update quest status to completed
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            },
            UpdateExpression="SET #status = :status, completedAt = :completedAt, updatedAt = :updatedAt, version = version + :inc",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "completed",
                ":completedAt": now_ms,
                ":updatedAt": now_ms,
                ":inc": 1,
                ":activeStatus": "active"
            },
            ConditionExpression="attribute_exists(PK) AND #status = :activeStatus",
            ReturnValues="ALL_NEW"
        )
        
        logger.info('quest.completion_status_updated', 
                   quest_id=quest_id,
                   user_id=user_id,
                   response_attributes=list(response.get('Attributes', {}).keys()))
        
        # Add completion event to audit trail
        audit_event = {
            "event": "quest_completed",
            "timestamp": now_ms,
            "reason": "auto_completion",
            "trigger": "task_completion"
        }
        
        logger.info('quest.completion_adding_audit_event', 
                   quest_id=quest_id,
                   user_id=user_id,
                   audit_event=audit_event)
        
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"QUEST#{quest_id}"
            },
            UpdateExpression="SET auditTrail = list_append(auditTrail, :auditEvent)",
            ExpressionAttributeValues={
                ":auditEvent": [audit_event]
            }
        )
        
        logger.info('quest.completed', 
                   quest_id=quest_id,
                   user_id=user_id,
                   completed_at=now_ms,
                   audit_event_added=True)
        
    except Exception as e:
        logger.error('quest.completion_failed', 
                    quest_id=quest_id,
                    user_id=user_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        raise QuestDBError(f"Failed to complete quest: {str(e)}")


async def _check_tasks_completion(task_ids: list[str], user_id: str) -> bool:
    """Check if all specified tasks are completed"""
    try:
        table = _get_dynamodb_table()
        
        for task_id in task_ids:
            # Query for the task with strong consistency
            response = table.query(
                #IndexName="GSI1",
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").eq(f"TASK#{task_id}"),
                ConsistentRead=True
            )
            
            if not response.get('Items'):
                logger.warning('quest.task_not_found', 
                             task_id=task_id,
                             user_id=user_id)
                return False
            
            task = response['Items'][0]
            task_status = task.get('status', 'pending')
            
            if task_status not in ['completed', 'done']:
                logger.info('quest.task_not_completed', 
                           task_id=task_id,
                           status=task_status)
                return False
        
        logger.info('quest.all_tasks_completed', 
                   task_count=len(task_ids),
                   task_ids=task_ids)
        return True
        
    except Exception as e:
        logger.error('quest.tasks_completion_check_failed', 
                    task_ids=task_ids,
                    user_id=user_id,
                    error=str(e),
                    exc_info=e)
        return False


async def _check_goals_completion(goal_ids: list[str], user_id: str) -> bool:
    """Check if all specified goals are completed"""
    try:
        table = _get_dynamodb_table()
        
        for goal_id in goal_ids:
            # Query for the goal with strong consistency
            response = table.query(
                #IndexName="GSI1",
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").eq(f"GOAL#{goal_id}"),
                ConsistentRead=True
            )
            
            if not response.get('Items'):
                logger.warning('quest.goal_not_found', 
                             goal_id=goal_id,
                             user_id=user_id)
                return False
            
            goal = response['Items'][0]
            goal_status = goal.get('status', 'pending')
            
            if goal_status not in ['completed', 'done']:
                logger.info('quest.goal_not_completed', 
                           goal_id=goal_id,
                           status=goal_status)
                return False
        
        logger.info('quest.all_goals_completed', 
                   goal_count=len(goal_ids),
                   goal_ids=goal_ids)
        return True
        
    except Exception as e:
        logger.error('quest.goals_completion_check_failed', 
                    goal_ids=goal_ids,
                    user_id=user_id,
                    error=str(e),
                    exc_info=e)
        return False


async def _count_completed_tasks_after_quest_start(user_id: str, quest_start_time: int) -> int:
    """Count completed tasks after quest started"""
    try:
        table = _get_dynamodb_table()

        # Query all tasks for the user with strong consistency to avoid eventual consistency issues
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'USER#{user_id}') & Key('SK').begins_with('TASK#'),            
            ConsistentRead=True
        )

   
        completed_count = 0
        logger.info('quest.counting_tasks_debug', user_id=user_id, total_tasks=len(response.get('Items', [])))

        for item in response.get('Items', []):
            task_status = item.get('status', 'pending')
            completed_at = item.get('completedAt') or item.get('updatedAt')
            logger.info('quest.task_debug', task_id=item.get('SK'), status=task_status, completed_at=completed_at)

            if task_status in ['completed', 'done']:
                # Check if task was completed after quest started
                if completed_at and completed_at > quest_start_time:
                    completed_count += 1
                    logger.info('quest.task_counted', task_id=item.get('SK'), completed_at=completed_at, quest_start=quest_start_time)
                else:
                    logger.info('quest.task_not_counted', task_id=item.get('SK'), completed_at=completed_at, quest_start=quest_start_time)

        logger.info('quest.completed_tasks_counted_after_quest_start',
                   user_id=user_id,
                   completed_count=completed_count,
                   quest_start_time=quest_start_time)
        return completed_count

    except Exception as e:
        logger.error('quest.completed_tasks_count_failed',
                    user_id=user_id,
                    error=str(e),
                    exc_info=e)
        return 0


async def _count_completed_goals_after_quest_start(user_id: str, quest_start_time: int) -> int:
    """Count completed goals after quest started"""
    try:
        table = _get_dynamodb_table()

        # Query all goals for the user with strong consistency to avoid eventual consistency issues
        response = table.query(
            #IndexName="GSI1",
            #KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("GOAL#"),         
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",            
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk_prefix": "TASK#"
            },
            ConsistentRead=True
        )
            
        

        completed_count = 0
        for item in response.get('Items', []):
            goal_status = item.get('status', 'pending')
            if goal_status in ['completed', 'done']:
                # Check if goal was completed after quest started
                completed_at = item.get('completedAt') or item.get('updatedAt')
                if completed_at and completed_at > quest_start_time:
                    completed_count += 1
        
        logger.info('quest.completed_goals_counted_after_quest_start',
                   user_id=user_id,
                   completed_count=completed_count,
                   quest_start_time=quest_start_time)
        return completed_count

    except Exception as e:
        logger.error('quest.completed_goals_count_failed',
                    user_id=user_id,
                    error=str(e),
                    exc_info=e)
        return 0
