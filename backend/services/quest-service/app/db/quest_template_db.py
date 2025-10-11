"""
DynamoDB helper functions for Quest Template operations.

This module provides comprehensive database operations for Quest Template entities
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

from ..models.quest_template import QuestTemplateCreatePayload, QuestTemplateUpdatePayload, QuestTemplateResponse
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("quest-template-db", env_flag="QUEST_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


class QuestTemplateDBError(Exception):
    """Custom exception for Quest Template database operations."""
    pass


class QuestTemplateNotFoundError(QuestTemplateDBError):
    """Raised when a quest template is not found."""
    pass


class QuestTemplatePermissionError(QuestTemplateDBError):
    """Raised when user doesn't have permission for the operation."""
    pass


class QuestTemplateValidationError(QuestTemplateDBError):
    """Raised when quest template validation fails."""
    pass


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    import boto3
    settings = _get_settings()
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return dynamodb.Table(settings.core_table_name)


def _build_template_item(user_id: str, payload: QuestTemplateCreatePayload) -> Dict[str, Any]:
    """
    Build DynamoDB item for quest template creation.
    
    Args:
        user_id: User ID creating the template
        payload: Template creation payload
        
    Returns:
        DynamoDB item dictionary
    """
    template_id = str(uuid4())
    now = int(time.time() * 1000)
    
    return {
        "PK": f"USER#{user_id}",
        "SK": f"TEMPLATE#{template_id}",
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"TEMPLATE#{now}",
        "type": "QuestTemplate",
        "id": template_id,
        "userId": user_id,
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "difficulty": payload.difficulty,
        "rewardXp": payload.rewardXp,
        "tags": payload.tags,
        "privacy": payload.privacy,
        "kind": payload.kind,
        "targetCount": payload.targetCount,
        "countScope": payload.countScope,
        "createdAt": now,
        "updatedAt": now,
    }


def _ddb_call(operation, op: str, **kwargs):
    """Wrapper for DynamoDB operations with error handling and logging."""
    try:
        logger.debug(f"Executing DynamoDB operation: {op}", extra={"operation": op, "kwargs": kwargs})
        result = operation(**kwargs)
        logger.debug(f"DynamoDB operation successful: {op}", extra={"operation": op})
        return result
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error(f"DynamoDB operation failed: {op}", extra={
            "operation": op,
            "error_code": error_code,
            "error_message": error_message,
            "kwargs": kwargs
        }, exc_info=True)
        raise QuestTemplateDBError(f"DynamoDB operation failed: {error_message}")
    except Exception as e:
        logger.error(f"Unexpected error in DynamoDB operation: {op}", extra={
            "operation": op,
            "error": str(e),
            "kwargs": kwargs
        }, exc_info=True)
        raise QuestTemplateDBError(f"Unexpected error: {str(e)}")


def create_template(user_id: str, payload: QuestTemplateCreatePayload) -> QuestTemplateResponse:
    """
    Create a new quest template.
    
    Args:
        user_id: User ID creating the template
        payload: Template creation payload
        
    Returns:
        Created quest template response
        
    Raises:
        QuestTemplateDBError: If creation fails
        QuestTemplateValidationError: If validation fails
    """
    logger.info("Creating quest template", extra={"user_id": user_id, "title": payload.title})
    
    try:
        table = _get_dynamodb_table()
        item = _build_template_item(user_id, payload)
        
        # Check for duplicate title (optional - can be removed if duplicates are allowed)
        try:
            existing = _ddb_call(
                table.query,
                op="quest_template.check_duplicate_title",
                IndexName="GSI1",
                KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("TEMPLATE#"),
                FilterExpression=Attr("title").eq(payload.title),
                Limit=1
            )
            
            if existing.get("Items"):
                raise QuestTemplateValidationError("Template with this title already exists")
        except QuestTemplateDBError:
            # If query fails, continue with creation (don't fail on duplicate check)
            logger.warning("Could not check for duplicate template title", extra={"user_id": user_id, "title": payload.title})
        
        # Create the template
        _ddb_call(
            table.put_item,
            op="quest_template.create",
            Item=item,
            ConditionExpression="attribute_not_exists(PK)"
        )
        
        logger.info("Quest template created successfully", extra={"user_id": user_id, "template_id": item["id"]})
        
        return QuestTemplateResponse(**item)
        
    except QuestTemplateValidationError:
        raise
    except Exception as e:
        logger.error("Failed to create quest template", extra={"user_id": user_id, "error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to create quest template: {str(e)}")


def get_template(template_id: str, user_id: str) -> QuestTemplateResponse:
    """
    Get a quest template by ID with privacy checks.
    
    Args:
        template_id: Template ID
        user_id: User ID requesting the template
        
    Returns:
        Quest template response
        
    Raises:
        QuestTemplateNotFoundError: If template not found
        QuestTemplatePermissionError: If user doesn't have permission
    """
    logger.info("Getting quest template", extra={"template_id": template_id, "user_id": user_id})
    
    try:
        table = _get_dynamodb_table()
        
        # First, find the template by scanning (since we don't know the user_id)
        # In a production system, you might want to add a GSI for template_id
        response = _ddb_call(
            table.scan,
            op="quest_template.scan_by_id",
            FilterExpression=Attr("type").eq("QuestTemplate") & Attr("id").eq(template_id),
            Limit=1
        )
        
        items = response.get("Items", [])
        if not items:
            raise QuestTemplateNotFoundError(f"Template {template_id} not found")
        
        item = items[0]
        
        # Check privacy permissions
        if item["privacy"] == "private" and item["userId"] != user_id:
            raise QuestTemplatePermissionError("You don't have permission to access this template")
        
        # For followers privacy, you would need to check follower relationships
        # This is a simplified implementation
        if item["privacy"] == "followers" and item["userId"] != user_id:
            # TODO: Implement follower relationship check
            logger.warning("Followers privacy check not implemented", extra={"template_id": template_id, "user_id": user_id})
            raise QuestTemplatePermissionError("Followers privacy check not implemented")
        
        logger.info("Quest template retrieved successfully", extra={"template_id": template_id, "user_id": user_id})
        
        return QuestTemplateResponse(**item)
        
    except (QuestTemplateNotFoundError, QuestTemplatePermissionError):
        raise
    except Exception as e:
        logger.error("Failed to get quest template", extra={"template_id": template_id, "user_id": user_id, "error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to get quest template: {str(e)}")


def update_template(template_id: str, user_id: str, payload: QuestTemplateUpdatePayload) -> QuestTemplateResponse:
    """
    Update an existing quest template.
    
    Args:
        template_id: Template ID
        user_id: User ID updating the template
        payload: Template update payload
        
    Returns:
        Updated quest template response
        
    Raises:
        QuestTemplateNotFoundError: If template not found
        QuestTemplatePermissionError: If user doesn't have permission
    """
    logger.info("Updating quest template", extra={"template_id": template_id, "user_id": user_id})
    
    try:
        table = _get_dynamodb_table()
        
        # First, get the template to verify ownership
        response = _ddb_call(
            table.scan,
            op="quest_template.scan_by_id",
            FilterExpression=Attr("type").eq("QuestTemplate") & Attr("id").eq(template_id),
            Limit=1
        )
        
        items = response.get("Items", [])
        if not items:
            raise QuestTemplateNotFoundError(f"Template {template_id} not found")
        
        item = items[0]
        
        # Check ownership
        if item["userId"] != user_id:
            raise QuestTemplatePermissionError("You don't have permission to update this template")
        
        # Build update expression
        update_expression_parts = []
        expression_attribute_names = {}
        expression_attribute_values = {}
        attr_counter = 0
        
        # Only update provided fields
        update_fields = payload.model_dump(exclude_unset=True, exclude_none=True)
        
        for key, value in update_fields.items():
            attr_name = f"#{key}"
            attr_value = f":val{attr_counter}"
            update_expression_parts.append(f"{attr_name} = {attr_value}")
            expression_attribute_names[attr_name] = key
            expression_attribute_values[attr_value] = value
            attr_counter += 1
        
        # Always update the updatedAt timestamp
        update_expression_parts.append("#updatedAt = :updatedAt")
        expression_attribute_names["#updatedAt"] = "updatedAt"
        expression_attribute_values[":updatedAt"] = int(time.time() * 1000)
        
        if update_expression_parts:
            update_expression = f"SET {', '.join(update_expression_parts)}"
            
            _ddb_call(
                table.update_item,
                op="quest_template.update",
                Key={"PK": item["PK"], "SK": item["SK"]},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ConditionExpression="attribute_exists(PK)"
            )
        
        # Get the updated item
        updated_response = _ddb_call(
            table.get_item,
            op="quest_template.get_updated",
            Key={"PK": item["PK"], "SK": item["SK"]}
        )
        
        updated_item = updated_response.get("Item")
        if not updated_item:
            raise QuestTemplateDBError("Failed to retrieve updated template")
        
        logger.info("Quest template updated successfully", extra={"template_id": template_id, "user_id": user_id})
        
        return QuestTemplateResponse(**updated_item)
        
    except (QuestTemplateNotFoundError, QuestTemplatePermissionError):
        raise
    except Exception as e:
        logger.error("Failed to update quest template", extra={"template_id": template_id, "user_id": user_id, "error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to update quest template: {str(e)}")


def delete_template(template_id: str, user_id: str) -> None:
    """
    Delete a quest template.
    
    Args:
        template_id: Template ID
        user_id: User ID deleting the template
        
    Raises:
        QuestTemplateNotFoundError: If template not found
        QuestTemplatePermissionError: If user doesn't have permission
    """
    logger.info("Deleting quest template", extra={"template_id": template_id, "user_id": user_id})
    
    try:
        table = _get_dynamodb_table()
        
        # First, get the template to verify ownership
        response = _ddb_call(
            table.scan,
            op="quest_template.scan_by_id",
            FilterExpression=Attr("type").eq("QuestTemplate") & Attr("id").eq(template_id),
            Limit=1
        )
        
        items = response.get("Items", [])
        if not items:
            raise QuestTemplateNotFoundError(f"Template {template_id} not found")
        
        item = items[0]
        
        # Check ownership
        if item["userId"] != user_id:
            raise QuestTemplatePermissionError("You don't have permission to delete this template")
        
        # Delete the template
        _ddb_call(
            table.delete_item,
            op="quest_template.delete",
            Key={"PK": item["PK"], "SK": item["SK"]},
            ConditionExpression="attribute_exists(PK)"
        )
        
        logger.info("Quest template deleted successfully", extra={"template_id": template_id, "user_id": user_id})
        
    except (QuestTemplateNotFoundError, QuestTemplatePermissionError):
        raise
    except Exception as e:
        logger.error("Failed to delete quest template", extra={"template_id": template_id, "user_id": user_id, "error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to delete quest template: {str(e)}")


def list_user_templates(user_id: str, limit: int = 50, next_token: Optional[str] = None) -> Dict[str, Any]:
    """
    List quest templates for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of templates to return
        next_token: Pagination token
        
    Returns:
        Dictionary with templates, total count, and pagination info
    """
    logger.info("Listing user quest templates", extra={"user_id": user_id, "limit": limit})
    
    try:
        table = _get_dynamodb_table()
        
        query_kwargs = {
            "IndexName": "GSI1",
            "KeyConditionExpression": Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("TEMPLATE#"),
            "ScanIndexForward": False,  # Sort by creation time descending
            "Limit": limit
        }
        
        if next_token:
            query_kwargs["ExclusiveStartKey"] = {"GSI1PK": f"USER#{user_id}", "GSI1SK": next_token}
        
        response = _ddb_call(
            table.query,
            op="quest_template.list_user",
            **query_kwargs
        )
        
        items = response.get("Items", [])
        templates = [QuestTemplateResponse(**item) for item in items]
        
        # Get total count (this is expensive, so we might want to cache it)
        count_response = _ddb_call(
            table.query,
            op="quest_template.count_user",
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("TEMPLATE#"),
            Select="COUNT"
        )
        
        total = count_response.get("Count", 0)
        has_more = "LastEvaluatedKey" in response
        next_token = response.get("LastEvaluatedKey", {}).get("GSI1SK") if has_more else None
        
        logger.info("User quest templates listed successfully", extra={
            "user_id": user_id, 
            "count": len(templates), 
            "total": total,
            "has_more": has_more
        })
        
        return {
            "templates": templates,
            "total": total,
            "hasMore": has_more,
            "nextToken": next_token
        }
        
    except Exception as e:
        logger.error("Failed to list user quest templates", extra={"user_id": user_id, "error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to list quest templates: {str(e)}")


def list_public_templates(limit: int = 50, next_token: Optional[str] = None) -> Dict[str, Any]:
    """
    List public quest templates.
    
    Args:
        limit: Maximum number of templates to return
        next_token: Pagination token
        
    Returns:
        Dictionary with templates, total count, and pagination info
    """
    logger.info("Listing public quest templates", extra={"limit": limit})
    
    try:
        table = _get_dynamodb_table()
        
        scan_kwargs = {
            "FilterExpression": Attr("type").eq("QuestTemplate") & Attr("privacy").eq("public"),
            "Limit": limit
        }
        
        if next_token:
            scan_kwargs["ExclusiveStartKey"] = {"PK": next_token.split("#")[0], "SK": next_token.split("#")[1]}
        
        response = _ddb_call(
            table.scan,
            op="quest_template.list_public",
            **scan_kwargs
        )
        
        items = response.get("Items", [])
        templates = [QuestTemplateResponse(**item) for item in items]
        
        # Get total count
        count_response = _ddb_call(
            table.scan,
            op="quest_template.count_public",
            FilterExpression=Attr("type").eq("QuestTemplate") & Attr("privacy").eq("public"),
            Select="COUNT"
        )
        
        total = count_response.get("Count", 0)
        has_more = "LastEvaluatedKey" in response
        next_token = f"{response['LastEvaluatedKey']['PK']}#{response['LastEvaluatedKey']['SK']}" if has_more else None
        
        logger.info("Public quest templates listed successfully", extra={
            "count": len(templates), 
            "total": total,
            "has_more": has_more
        })
        
        return {
            "templates": templates,
            "total": total,
            "hasMore": has_more,
            "nextToken": next_token
        }
        
    except Exception as e:
        logger.error("Failed to list public quest templates", extra={"error": str(e)}, exc_info=True)
        raise QuestTemplateDBError(f"Failed to list public quest templates: {str(e)}")
