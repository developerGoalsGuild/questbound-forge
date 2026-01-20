"""
Subscription database operations.

This module handles all DynamoDB operations related to subscriptions,
including CRUD operations and subscription state management.
"""

import os
import time
import boto3
import logging
from functools import lru_cache
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Set
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from boto3.dynamodb.types import TypeSerializer

logger = logging.getLogger(__name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
core_table_name = os.getenv('CORE_TABLE', 'gg_core')
table = dynamodb.Table(core_table_name)
serializer = TypeSerializer()


@lru_cache(maxsize=1)
def _get_table_key_schema(table_name: str) -> Optional[List[Dict[str, str]]]:
    try:
        response = table.meta.client.describe_table(TableName=table_name)
        return response.get("Table", {}).get("KeySchema", [])
    except ClientError as e:
        logger.error(f"Failed to describe table {table_name}: {e}")
        return None

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
        "version": 1,
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
    updates: Dict[str, Any],
    expected_version: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """Update subscription record."""
    now = datetime.now(timezone.utc).isoformat()
    
    # Build update expression
    update_expr_parts = ["SET updatedAt = :now", "#version = if_not_exists(#version, :zero) + :inc"]
    expr_attr_values = {":now": now, ":zero": 0, ":inc": 1}
    expr_attr_names = {"#version": "version"}
    
    for key, value in updates.items():
        attr_name = key
        update_expr_parts.append(f"{attr_name} = :{attr_name}")
        expr_attr_values[f":{attr_name}"] = value
    
    update_expression = ", ".join(update_expr_parts)
    
    try:
        condition_expression = None
        if expected_version is not None:
            condition_expression = "#version = :expected_version"
            expr_attr_values[":expected_version"] = expected_version

        update_kwargs = {
            "Key": {
                "PK": f"USER#{user_id}",
                "SK": f"SUBSCRIPTION#{subscription_id}",
            },
            "UpdateExpression": update_expression,
            "ExpressionAttributeNames": expr_attr_names,
            "ExpressionAttributeValues": expr_attr_values,
            "ReturnValues": "ALL_NEW",
        }
        if condition_expression:
            update_kwargs["ConditionExpression"] = condition_expression

        response = table.update_item(**update_kwargs)
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


def get_subscription_by_customer_id(
    user_id: str,
    stripe_customer_id: str
) -> Optional[Dict[str, Any]]:
    """Get subscription record by Stripe customer ID."""
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("SUBSCRIPTION#"),
            FilterExpression=Attr("stripeCustomerId").eq(stripe_customer_id)
        )
        items = response.get("Items", [])
        if not items:
            return None
        items.sort(key=lambda x: x.get("updatedAt", x.get("createdAt", "")), reverse=True)
        return items[0]
    except ClientError as e:
        logger.error(f"Error getting subscription by customer ID: {e}")
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


def clear_selected_subscription_tier(user_id: str) -> bool:
    """Remove selected subscription tier from profile."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
            },
            UpdateExpression="REMOVE selected_subscription_tier SET updatedAt = :now",
            ExpressionAttributeValues={
                ":now": now,
            }
        )
        logger.info(f"Cleared selected_subscription_tier for user {user_id}")
        return True
    except ClientError as e:
        logger.error(f"Error clearing selected_subscription_tier: {e}")
        return False


def update_selected_subscription_tier(
    user_id: str,
    tier: str
) -> bool:
    """Update selected subscription tier with timestamp."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
            },
            UpdateExpression="SET selected_subscription_tier = :tier, selected_subscription_tier_updated_at = :now, updatedAt = :now",
            ExpressionAttributeValues={
                ":tier": tier,
                ":now": now,
            }
        )
        logger.info(f"Updated selected_subscription_tier to {tier} for user {user_id}")
        return True
    except ClientError as e:
        logger.error(f"Error updating selected_subscription_tier: {e}")
        return False


def is_selected_tier_stale(updated_at: Optional[str], max_age_hours: int = 48) -> bool:
    """Check if selected subscription tier is stale."""
    if not updated_at:
        return False
    try:
        timestamp = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    except ValueError:
        return False
    now = datetime.now(timezone.utc)
    age_hours = (now - timestamp).total_seconds() / 3600
    return age_hours > max_age_hours


def determine_profile_tier(
    plan_tier: Optional[str],
    status: Optional[str],
    current_period_end: Optional[str]
) -> str:
    """Determine effective profile tier based on subscription status."""
    if status in {"active", "trialing"} and plan_tier:
        return plan_tier
    if status == "canceled" and plan_tier and current_period_end:
        try:
            period_end = datetime.fromisoformat(current_period_end.replace("Z", "+00:00"))
            if period_end > datetime.now(timezone.utc):
                return plan_tier
        except ValueError:
            return "free"
    return "free"


def is_valid_status_transition(current_status: Optional[str], next_status: Optional[str]) -> bool:
    """Validate subscription status transitions."""
    if not current_status or current_status == next_status:
        return True

    transitions: Dict[str, Set[str]] = {
        "incomplete": {"active", "incomplete", "incomplete_expired", "canceled"},
        "trialing": {"active", "canceled", "past_due"},
        "active": {"past_due", "canceled"},
        "past_due": {"active", "canceled"},
        "incomplete_expired": {"canceled"},
        "canceled": {"canceled"},
    }

    return next_status in transitions.get(current_status, set())


def _serialize_item(item: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    return {key: serializer.serialize(value) for key, value in item.items()}


def _is_blank(value: Optional[str]) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    return None if _is_blank(value) else value


def _is_valid_key_value(value: Optional[str]) -> bool:
    if value is None:
        return False
    if not isinstance(value, str):
        return False
    return value.strip() != ""


def transact_upsert_subscription_and_profile(
    user_id: str,
    subscription_id: str,
    plan_tier: str,
    status: str,
    stripe_customer_id: str,
    current_period_start: Optional[str],
    current_period_end: Optional[str],
    cancel_at_period_end: bool,
    provider: str,
    profile_tier: str,
    event_id: Optional[str] = None,
    clear_selected_tier: bool = False
) -> bool:
    """Atomically upsert subscription record and sync profile tier."""
    now = datetime.now(timezone.utc).isoformat()
    client = table.meta.client
    endpoint_url = getattr(client.meta, "endpoint_url", None)
    logger.warning(
        "DynamoDB client endpoint_url=%r region=%r",
        endpoint_url,
        getattr(client.meta, "region_name", None),
    )
    key_schema = _get_table_key_schema(core_table_name)
    if key_schema:
        logger.warning(
            "Using DynamoDB table %r key schema %s (region=%r)",
            core_table_name,
            key_schema,
            getattr(client.meta, "region_name", None),
        )
    required_fields = {
        "user_id": user_id,
        "subscription_id": subscription_id,
        "plan_tier": plan_tier,
        "status": status,
        "stripe_customer_id": stripe_customer_id,
        "provider": provider,
        "profile_tier": profile_tier,
    }
    missing_fields = [
        key
        for key, value in required_fields.items()
        if not _is_valid_key_value(value)
    ]
    if missing_fields:
        logger.warning(
            "Missing required subscription fields for upsert",
            extra={
                "user_id": user_id,
                "subscription_id": subscription_id,
                "missing_fields": missing_fields,
                "field_types": {key: type(value).__name__ for key, value in required_fields.items()},
                "event_id": event_id,
            },
        )
        return False

    current_period_start = _normalize_optional_str(current_period_start)
    current_period_end = _normalize_optional_str(current_period_end)
    subscription_key = {
        "PK": f"USER#{user_id}",
        "SK": f"SUBSCRIPTION#{subscription_id}",
    }
    profile_key = {
        "PK": f"USER#{user_id}",
        "SK": f"PROFILE#{user_id}",
    }
    subscription_update_expression = (
        "SET #type = :type, subscriptionId = :subscription_id, planTier = :plan_tier, "
        "#status = :status, stripeCustomerId = :stripe_customer_id, currentPeriodStart = :current_period_start, "
        "currentPeriodEnd = :current_period_end, cancelAtPeriodEnd = :cancel_at_period_end, "
        "provider = :provider, updatedAt = :now, createdAt = if_not_exists(createdAt, :now), "
        "#version = :version"
    )
    subscription_expression_values_raw = {
        ":type": "Subscription",
        ":subscription_id": subscription_id,
        ":plan_tier": plan_tier,
        ":status": status,
        ":stripe_customer_id": stripe_customer_id,
        ":current_period_start": current_period_start,
        ":current_period_end": current_period_end,
        ":cancel_at_period_end": cancel_at_period_end,
        ":provider": provider,
        ":now": now,
        ":version": 1,
    }
    subscription_expression_values = _serialize_item(subscription_expression_values_raw)
    subscription_expression_names = {
        "#type": "type",
        "#status": "status",
        "#version": "version",
    }

    profile_update_expression = "SET #tier = :tier, updatedAt = :now"
    if clear_selected_tier:
        profile_update_expression += " REMOVE selected_subscription_tier, selected_subscription_tier_updated_at"
    profile_expression_values_raw = {
        ":tier": profile_tier,
        ":now": now,
    }
    profile_expression_values = _serialize_item(profile_expression_values_raw)
    profile_expression_names = {"#tier": "tier"}

    transact_items = [
        {
            "Update": {
                "TableName": core_table_name,
                "Key": _serialize_item(subscription_key),
                "UpdateExpression": subscription_update_expression,
                "ExpressionAttributeNames": subscription_expression_names,
                "ExpressionAttributeValues": subscription_expression_values,
            }
        },
        {
            "Update": {
                "TableName": core_table_name,
                "Key": _serialize_item(profile_key),
                "UpdateExpression": profile_update_expression,
                "ExpressionAttributeNames": profile_expression_names,
                "ExpressionAttributeValues": profile_expression_values,
            }
        },
    ]

    if event_id:
        webhook_item = {
            "PK": f"WEBHOOK#{event_id}",
            "SK": f"EVENT#{event_id}",
            "type": "StripeWebhookEvent",
            "eventId": event_id,
            "createdAt": now,
        }
        transact_items.append({
            "Put": {
                "TableName": core_table_name,
                "Item": _serialize_item(webhook_item),
                "ConditionExpression": "attribute_not_exists(PK)",
            }
        })

    max_retries = 3
    for attempt in range(max_retries):
        try:
            client.transact_write_items(TransactItems=transact_items)
            logger.info(f"Upserted subscription {subscription_id} and synced profile tier")
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "TransactionCanceledException":
                cancellation_reasons = e.response.get("CancellationReasons", [])
                if cancellation_reasons:
                    logger.error(
                        "Transaction canceled with reasons: %s core_table=%r subscription_key=%r profile_key=%r region=%r env_region=%r env_default_region=%r",
                        cancellation_reasons,
                        core_table_name,
                        subscription_key,
                        profile_key,
                        getattr(table.meta.client.meta, "region_name", None),
                        os.getenv("AWS_REGION"),
                        os.getenv("AWS_DEFAULT_REGION"),
                    )
                else:
                    logger.error(
                        "Transaction canceled without reasons core_table=%r subscription_key=%r profile_key=%r region=%r env_region=%r env_default_region=%r",
                        core_table_name,
                        subscription_key,
                        profile_key,
                        getattr(table.meta.client.meta, "region_name", None),
                        os.getenv("AWS_REGION"),
                        os.getenv("AWS_DEFAULT_REGION"),
                    )
                if any(reason.get("Code") == "ConditionalCheckFailed" for reason in cancellation_reasons):
                    logger.info(f"Skipping webhook event {event_id} (already processed)")
                    return False
                if any(reason.get("Code") == "ValidationError" for reason in cancellation_reasons):
                    try:
                        logger.warning(
                            "Falling back to non-transactional updates for subscription %s",
                            subscription_id,
                        )
                        table.update_item(
                            Key=subscription_key,
                            UpdateExpression=subscription_update_expression,
                            ExpressionAttributeNames=subscription_expression_names,
                            ExpressionAttributeValues=subscription_expression_values_raw,
                        )
                        table.update_item(
                            Key=profile_key,
                            UpdateExpression=profile_update_expression,
                            ExpressionAttributeNames=profile_expression_names,
                            ExpressionAttributeValues=profile_expression_values_raw,
                        )
                        if event_id:
                            webhook_item = {
                                "PK": f"WEBHOOK#{event_id}",
                                "SK": f"EVENT#{event_id}",
                                "type": "StripeWebhookEvent",
                                "eventId": event_id,
                                "createdAt": now,
                            }
                            table.put_item(
                                Item=webhook_item,
                                ConditionExpression="attribute_not_exists(PK)",
                            )
                        logger.info(f"Fallback upserted subscription {subscription_id} and synced profile tier")
                        return True
                    except ClientError as fallback_error:
                        logger.error(f"Fallback upsert failed for subscription {subscription_id}: {fallback_error}")
                        raise
                if attempt < max_retries - 1:
                    time.sleep(0.2 * (2 ** attempt))
                    continue
            if error_code in {"TransactionConflictException", "ProvisionedThroughputExceededException"}:
                if attempt < max_retries - 1:
                    time.sleep(0.2 * (2 ** attempt))
                    continue
            logger.error(f"Error in transactional subscription update: {e}")
            raise


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

