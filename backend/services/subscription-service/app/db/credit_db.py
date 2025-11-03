"""
Credit database operations.

This module handles DynamoDB operations for credit management,
including balance tracking, top-ups, and atomic consumption.
"""

import os
import boto3
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
core_table_name = os.getenv('CORE_TABLE', 'gg_core')
table = dynamodb.Table(core_table_name)

# Credit quotas by tier (monthly grants)
TIER_CREDIT_QUOTAS = {
    "free": 0,
    "INITIATE": 2,
    "JOURNEYMAN": 5,
    "SAGE": 15,
    "GUILDMASTER": 15,
}


def get_or_create_credits(user_id: str) -> Dict[str, Any]:
    """Get credits record or create if doesn't exist."""
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "CREDITS#BALANCE",
            }
        )
        
        item = response.get("Item")
        if item:
            return item
        
        # Create new credits record
        now = datetime.now(timezone.utc).isoformat()
        new_item = {
            "PK": f"USER#{user_id}",
            "SK": "CREDITS#BALANCE",
            "type": "Credits",
            "balance": 0,
            "lastTopUp": None,
            "lastReset": now,
            "createdAt": now,
            "updatedAt": now,
        }
        
        table.put_item(Item=new_item)
        logger.info(f"Created credits record for user {user_id}")
        return new_item
    except ClientError as e:
        logger.error(f"Error getting/creating credits: {e}")
        raise


def get_credit_balance(user_id: str) -> int:
    """Get current credit balance."""
    credits = get_or_create_credits(user_id)
    return int(credits.get("balance", 0))


def update_credits(
    user_id: str,
    amount: int,
    operation: str = "add",  # "add", "subtract", "set"
    feature: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update credits balance atomically.
    
    Args:
        user_id: User ID
        amount: Credit amount (positive for add, negative for subtract, or absolute for set)
        operation: Operation type - "add", "subtract", or "set"
        feature: Optional feature name for logging
    
    Returns:
        Updated credits record
    """
    now = datetime.now(timezone.utc).isoformat()
    
    if operation == "add":
        update_expr = "SET balance = balance + :amount, updatedAt = :now"
        expr_values = {
            ":amount": amount,
            ":now": now,
        }
    elif operation == "subtract":
        update_expr = "SET balance = balance - :amount, updatedAt = :now"
        expr_values = {
            ":amount": amount,
            ":now": now,
        }
    elif operation == "set":
        update_expr = "SET balance = :amount, updatedAt = :now"
        expr_values = {
            ":amount": amount,
            ":now": now,
        }
    else:
        raise ValueError(f"Invalid operation: {operation}")
    
    try:
        # Ensure credits record exists
        get_or_create_credits(user_id)
        
        # Update credits atomically
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "CREDITS#BALANCE",
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response.get("Attributes", {})
        logger.info(
            f"Updated credits for user {user_id}: {operation} {amount} "
            f"(feature={feature}, new_balance={updated_item.get('balance')})"
        )
        return updated_item
    except ClientError as e:
        logger.error(f"Error updating credits: {e}")
        raise


def consume_credits(
    user_id: str,
    amount: int,
    feature: str
) -> Dict[str, Any]:
    """
    Consume credits atomically with balance check.
    
    Returns:
        Dict with success, remaining_balance, and message
    
    Raises:
        ValueError: If insufficient credits
    """
    try:
        # Ensure credits record exists
        credits = get_or_create_credits(user_id)
        current_balance = int(credits.get("balance", 0))
        
        if current_balance < amount:
            raise ValueError(f"Insufficient credits: {current_balance} < {amount}")
        
        # Atomic decrement with condition
        now = datetime.now(timezone.utc).isoformat()
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "CREDITS#BALANCE",
            },
            UpdateExpression="SET balance = balance - :amount, updatedAt = :now",
            ConditionExpression="balance >= :amount",
            ExpressionAttributeValues={
                ":amount": amount,
                ":now": now,
            },
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response.get("Attributes", {})
        new_balance = int(updated_item.get("balance", 0))
        
        logger.info(
            f"Consumed {amount} credits for {feature} (user={user_id}, "
            f"old_balance={current_balance}, new_balance={new_balance})"
        )
        
        return {
            "success": True,
            "remaining_balance": new_balance,
            "message": f"Consumed {amount} credits for {feature}",
        }
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "ConditionalCheckFailedException":
            raise ValueError(f"Insufficient credits: current balance < {amount}")
        logger.error(f"Error consuming credits: {e}")
        raise
    except ValueError:
        raise


def top_up_credits(user_id: str, amount: int) -> Dict[str, Any]:
    """Top up credits (purchase)."""
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # Ensure credits record exists
        get_or_create_credits(user_id)
        
        # Update credits and lastTopUp
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "CREDITS#BALANCE",
            },
            UpdateExpression="SET balance = balance + :amount, lastTopUp = :now, updatedAt = :now",
            ExpressionAttributeValues={
                ":amount": amount,
                ":now": now,
            },
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response.get("Attributes", {})
        new_balance = int(updated_item.get("balance", 0))
        
        logger.info(f"Topped up {amount} credits for user {user_id} (new_balance={new_balance})")
        return updated_item
    except ClientError as e:
        logger.error(f"Error topping up credits: {e}")
        raise


def grant_monthly_credits(user_id: str, tier: str) -> Dict[str, Any]:
    """Grant monthly credits based on subscription tier."""
    quota = TIER_CREDIT_QUOTAS.get(tier, 0)
    
    if quota == 0:
        logger.info(f"No credits to grant for tier {tier}")
        return get_or_create_credits(user_id)
    
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # Ensure credits record exists
        get_or_create_credits(user_id)
        
        # Grant credits and update lastReset
        response = table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "CREDITS#BALANCE",
            },
            UpdateExpression="SET balance = balance + :amount, lastReset = :now, updatedAt = :now",
            ExpressionAttributeValues={
                ":amount": quota,
                ":now": now,
            },
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response.get("Attributes", {})
        new_balance = int(updated_item.get("balance", 0))
        
        logger.info(
            f"Granted {quota} monthly credits for tier {tier} "
            f"(user={user_id}, new_balance={new_balance})"
        )
        return updated_item
    except ClientError as e:
        logger.error(f"Error granting monthly credits: {e}")
        raise


def check_credit_balance(user_id: str, required_amount: int) -> bool:
    """Check if user has sufficient credits."""
    balance = get_credit_balance(user_id)
    return balance >= required_amount

