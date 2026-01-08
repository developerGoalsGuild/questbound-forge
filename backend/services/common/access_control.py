"""
Shared access control module for checking resource access across services.
This module provides functions to check if a user has access to a resource
either as an owner or as a collaborator.
"""

import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError, BotoCoreError

logger = logging.getLogger(__name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = "gg_core"  # This should be configurable


def check_resource_access(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Check if a user has access to a resource (either as owner or collaborator).
    This is the main function that should be used by all services.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user has access (as owner or collaborator), False otherwise
    """
    table = dynamodb.Table(table_name)

    try:
        # First check if user is the owner
        owner_pk = f"USER#{user_id}"
        owner_sk = f"{resource_type.upper()}#{resource_id}"
        
        owner_response = table.get_item(Key={"PK": owner_pk, "SK": owner_sk})
        if "Item" in owner_response:
            logger.info('access_control.owner_access_granted',
                       user_id=user_id,
                       resource_type=resource_type,
                       resource_id=resource_id,
                       access_type="owner")
            return True

        # If not owner, check if user is a collaborator
        collaborator_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        collaborator_sk = f"COLLABORATOR#{user_id}"
        
        collaborator_response = table.get_item(Key={"PK": collaborator_pk, "SK": collaborator_sk})
        if "Item" in collaborator_response:
            logger.info('access_control.collaborator_access_granted',
                       user_id=user_id,
                       resource_type=resource_type,
                       resource_id=resource_id,
                       access_type="collaborator")
            return True

        # No access found
        logger.info('access_control.access_denied',
                   user_id=user_id,
                   resource_type=resource_type,
                   resource_id=resource_id)
        return False

    except (ClientError, BotoCoreError) as e:
        logger.error('access_control.check_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False
    except Exception as e:
        logger.error('access_control.unexpected_error',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False


def check_owner_access(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Check if a user is the owner of a resource.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user is the owner, False otherwise
    """
    table = dynamodb.Table(table_name)

    try:
        owner_pk = f"USER#{user_id}"
        owner_sk = f"{resource_type.upper()}#{resource_id}"
        
        owner_response = table.get_item(Key={"PK": owner_pk, "SK": owner_sk})
        is_owner = "Item" in owner_response
        
        logger.info('access_control.owner_check',
                   user_id=user_id,
                   resource_type=resource_type,
                   resource_id=resource_id,
                   is_owner=is_owner)
        
        return is_owner

    except (ClientError, BotoCoreError) as e:
        logger.error('access_control.owner_check_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False
    except Exception as e:
        logger.error('access_control.owner_check_unexpected_error',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False


def check_collaborator_access(user_id: str, resource_type: str, resource_id: str) -> bool:
    """
    Check if a user is a collaborator on a resource.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        True if user is a collaborator, False otherwise
    """
    table = dynamodb.Table(table_name)

    try:
        collaborator_pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        collaborator_sk = f"COLLABORATOR#{user_id}"
        
        collaborator_response = table.get_item(Key={"PK": collaborator_pk, "SK": collaborator_sk})
        is_collaborator = "Item" in collaborator_response
        
        logger.info('access_control.collaborator_check',
                   user_id=user_id,
                   resource_type=resource_type,
                   resource_id=resource_id,
                   is_collaborator=is_collaborator)
        
        return is_collaborator

    except (ClientError, BotoCoreError) as e:
        logger.error('access_control.collaborator_check_failed',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False
    except Exception as e:
        logger.error('access_control.collaborator_check_unexpected_error',
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    error=str(e),
                    exc_info=e)
        return False


def get_resource_access_level(user_id: str, resource_type: str, resource_id: str) -> Optional[str]:
    """
    Get the access level for a user on a resource.

    Args:
        user_id: ID of the user to check
        resource_type: Type of resource (goal, quest, task)
        resource_id: ID of the resource

    Returns:
        "owner", "collaborator", or None if no access
    """
    if check_owner_access(user_id, resource_type, resource_id):
        return "owner"
    elif check_collaborator_access(user_id, resource_type, resource_id):
        return "collaborator"
    else:
        return None
