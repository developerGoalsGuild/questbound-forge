"""
Cognito user group management utilities.

This module handles adding/removing users from Cognito groups
based on subscription tiers. Only applies to Cognito users.
"""

import logging
import boto3
from typing import Optional
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Tier to Cognito group name mapping
TIER_TO_GROUP = {
    "INITIATE": "INITIATE",
    "JOURNEYMAN": "JOURNEYMAN",
    "SAGE": "SAGE",
    "GUILDMASTER": "GUILDMASTER",
}


def get_cognito_client(region: str):
    """Get Cognito Identity Provider client."""
    return boto3.client('cognito-idp', region_name=region)


def add_user_to_group(
    user_pool_id: str,
    username: str,
    group_name: str,
    region: str = "us-east-2"
) -> bool:
    """
    Add user to Cognito group.
    
    Args:
        user_pool_id: Cognito User Pool ID
        username: Cognito username (typically the user_id)
        group_name: Group name to add user to
        region: AWS region
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_cognito_client(region)
        client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName=group_name,
        )
        logger.info(f"Added user {username} to Cognito group {group_name}")
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "UserNotFoundException":
            logger.warning(f"User {username} not found in Cognito pool")
            return False
        logger.error(f"Error adding user to group: {e}")
        return False


def remove_user_from_group(
    user_pool_id: str,
    username: str,
    group_name: str,
    region: str = "us-east-2"
) -> bool:
    """
    Remove user from Cognito group.
    
    Args:
        user_pool_id: Cognito User Pool ID
        username: Cognito username (typically the user_id)
        group_name: Group name to remove user from
        region: AWS region
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_cognito_client(region)
        client.admin_remove_user_from_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName=group_name,
        )
        logger.info(f"Removed user {username} from Cognito group {group_name}")
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "UserNotFoundException":
            logger.warning(f"User {username} not found in Cognito pool")
            return False
        logger.error(f"Error removing user from group: {e}")
        return False


def get_user_groups(
    user_pool_id: str,
    username: str,
    region: str = "us-east-2"
) -> list[str]:
    """
    Get list of groups user belongs to.
    
    Args:
        user_pool_id: Cognito User Pool ID
        username: Cognito username
        region: AWS region
    
    Returns:
        List of group names
    """
    try:
        client = get_cognito_client(region)
        response = client.admin_list_groups_for_user(
            UserPoolId=user_pool_id,
            Username=username,
        )
        return [group["GroupName"] for group in response.get("Groups", [])]
    except ClientError as e:
        logger.error(f"Error getting user groups: {e}")
        return []


def set_tier_group(
    user_pool_id: str,
    username: str,
    old_tier: Optional[str],
    new_tier: str,
    region: str = "us-east-2"
) -> bool:
    """
    Update user's Cognito group based on tier change.
    
    Args:
        user_pool_id: Cognito User Pool ID
        username: Cognito username
        old_tier: Previous tier (None if new user)
        new_tier: New tier
        region: AWS region
    
    Returns:
        True if successful, False otherwise
    """
    # Remove from old tier group if exists
    if old_tier and old_tier != "free" and old_tier in TIER_TO_GROUP:
        old_group = TIER_TO_GROUP[old_tier]
        remove_user_from_group(user_pool_id, username, old_group, region)
    
    # Add to new tier group
    if new_tier != "free" and new_tier in TIER_TO_GROUP:
        new_group = TIER_TO_GROUP[new_tier]
        return add_user_to_group(user_pool_id, username, new_group, region)
    
    return True


def remove_all_tier_groups(
    user_pool_id: str,
    username: str,
    region: str = "us-east-2"
) -> bool:
    """
    Remove user from all subscription tier groups.
    
    Args:
        user_pool_id: Cognito User Pool ID
        username: Cognito username
        region: AWS region
    
    Returns:
        True if successful
    """
    user_groups = get_user_groups(user_pool_id, username, region)
    tier_groups = set(TIER_TO_GROUP.values())
    
    success = True
    for group in user_groups:
        if group in tier_groups:
            if not remove_user_from_group(user_pool_id, username, group, region):
                success = False
    
    return success

