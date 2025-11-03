"""
Subscription database operations.

This module handles all DynamoDB operations related to subscriptions,
including CRUD operations and subscription state management.
"""

import os
import boto3
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger(__name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
core_table_name = os.getenv('CORE_TABLE', 'gg_core')
table = dynamodb.Table(core_table_name)

# Subscription tier hierarchy for access control
TIER_HIERARCHY = {
    "free": 0,
    "INITIATE": 1,
    "JOURNEYMAN": 2,
    "SAGE": 3,
    "GUILDMASTER": 4,
}


def create_subscription(
    user_id: str,
    subscription_id: str,
    plan_tier: str,
    stripe_customer_id: str,
    status: str,
    current_period_start: str,
    current_period_end: str,
    provider: str = "local",
    cancel_at_period_end: bool = False
) -> Dict[str, Any]:
    """Create a subscription record in DynamoDB."""
    now = datetime.now(timezone.utc).isoformat()
    
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"SUBSCRIPTION#{subscription_id}",
        "type": "Subscription",
        "subscriptionId": subscription_id,
        "planTier": plan_tier,
        "status": status,
        "stripeCustomerId": stripe_customer_id,
        "currentPeriodStart": current_period_start,
        "currentPeriodEnd": current_period_end,
        "cancelAtPeriodEnd": cancel_at_period_end,
        "provider": provider,
        "createdAt": now,
        "updatedAt": now,
    }
    
    try:
        table.put_item(Item=item)
        logger.info(f"Created subscription record: {subscription_id} for user {user_id}")
        return item
    except ClientError as e:
        logger.error(f"Error creating subscription: {e}")
        raise


def update_subscription(
    user_id: str,
    subscription_id: str,
    updates: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Update subscription record."""
    now = datetime.now(timezone.utc).isoformat()
    
    # Build update expression
    update_expr_parts = ["SET updatedAt = :now"]
    expr_attr_values = {":now": now}
    
    for key, value in updates.items():
        attr_name = key
        update_expr_parts.append(f"{attr_name} = :{attr_name}")
        expr_attr_values[f":{attr_name}"] = value
    
    update_expression = ", ".join(update_expr_parts)
    
    try:
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"SUBSCRIPTION#{subscription_id}",
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expr_attr_values,
            ReturnValues="ALL_NEW"
        )
        logger.info(f"Updated subscription: {subscription_id}")
        return response.get("Attributes")
    except ClientError as e:
        logger.error(f"Error updating subscription: {e}")
        raise


def get_subscription(
    user_id: str,
    subscription_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Get subscription record(s) for a user."""
    try:
        if subscription_id:
            # Get specific subscription
            response = table.get_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": f"SUBSCRIPTION#{subscription_id}",
                }
            )
            return response.get("Item")
        else:
            # Get all subscriptions for user, find active one
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("SUBSCRIPTION#")
            )
            
            items = response.get("Items", [])
            
            # Find active subscription (prioritize active status)
            active_sub = None
            for item in items:
                status = item.get("status")
                if status == "active":
                    active_sub = item
                    break
            
            # If no active, return most recent
            if not active_sub and items:
                active_sub = sorted(items, key=lambda x: x.get("createdAt", ""), reverse=True)[0]
            
            return active_sub
    except ClientError as e:
        logger.error(f"Error getting subscription: {e}")
        return None


def get_active_subscription(user_id: str) -> Optional[Dict[str, Any]]:
    """Get active subscription for user (checks period end for grace period)."""
    subscription = get_subscription(user_id)
    
    if not subscription:
        return None
    
    status = subscription.get("status")
    current_period_end = subscription.get("currentPeriodEnd")
    
    # Check if subscription is active or in grace period
    if status == "active":
        return subscription
    
    # Grace period: canceled but period hasn't ended
    if status == "canceled" and current_period_end:
        period_end_dt = datetime.fromisoformat(current_period_end.replace('Z', '+00:00'))
        now_dt = datetime.now(timezone.utc)
        
        if period_end_dt > now_dt:
            return subscription
    
    return None


def update_user_profile_tier(
    user_id: str,
    tier: str
) -> bool:
    """Update user profile tier field."""
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
            },
            UpdateExpression="SET tier = :tier, updatedAt = :now",
            ExpressionAttributeValues={
                ":tier": tier,
                ":now": now,
            }
        )
        logger.info(f"Updated user {user_id} tier to {tier}")
        return True
    except ClientError as e:
        logger.error(f"Error updating user tier: {e}")
        return False


def get_user_provider(user_id: str) -> Optional[str]:
    """Get user's authentication provider from profile."""
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
            },
            ProjectionExpression="#provider",
            ExpressionAttributeNames={
                "#provider": "provider"
            }
        )
        item = response.get("Item")
        return item.get("provider", "local") if item else "local"
    except ClientError as e:
        logger.error(f"Error getting user provider: {e}")
        return "local"  # Default to local


def get_user_tier(user_id: str) -> str:
    """
    Get effective user tier following priority:
    1. Founder pass (lifetime access)
    2. Active subscription
    3. Profile tier field
    4. Default to "free"
    """
    # Check for founder pass first
    founder_pass = get_founder_pass(user_id)
    if founder_pass:
        return founder_pass.get("grantedTier", "SAGE")
    
    # Check active subscription
    subscription = get_active_subscription(user_id)
    if subscription:
        return subscription.get("planTier", "free")
    
    # Fallback to profile tier
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
            },
            ProjectionExpression="#tier",
            ExpressionAttributeNames={
                "#tier": "tier"
            }
        )
        item = response.get("Item")
        return item.get("tier", "free") if item else "free"
    except ClientError:
        return "free"


def get_founder_pass(user_id: str) -> Optional[Dict[str, Any]]:
    """Get founder pass for user if exists."""
    try:
        # Check for FOUNDING_MEMBER first (higher tier)
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "FOUNDER#GUILD_BUILDER",
            }
        )
        item = response.get("Item")
        if item:
            return item
        
        # Check for FOUNDING_MEMBER
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "FOUNDER#FOUNDING_MEMBER",
            }
        )
        return response.get("Item")
    except ClientError:
        return None


def create_founder_pass(
    user_id: str,
    pass_type: str,
    payment_intent_id: str,
    granted_tier: str
) -> Dict[str, Any]:
    """Create founder pass record."""
    now = datetime.now(timezone.utc).isoformat()
    
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"FOUNDER#{pass_type}",
        "type": "FounderPass",
        "passType": pass_type,
        "stripePaymentIntentId": payment_intent_id,
        "purchasedAt": now,
        "lifetimeAccess": True,
        "grantedTier": granted_tier,
        "createdAt": now,
        "updatedAt": now,
    }
    
    try:
        table.put_item(Item=item)
        logger.info(f"Created founder pass {pass_type} for user {user_id}")
        
        # Update user tier
        update_user_profile_tier(user_id, granted_tier)
        
        return item
    except ClientError as e:
        logger.error(f"Error creating founder pass: {e}")
        raise

