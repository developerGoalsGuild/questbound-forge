from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Request, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from .auth import authenticate, AuthContext
from .settings import Settings
from .models import (
    CreateCheckoutRequest,
    CheckoutSessionResponse,
    SubscriptionResponse,
    CancelSubscriptionRequest,
    CancelSubscriptionResponse,
    UpdatePlanRequest,
    UpdatePlanResponse,
    BillingPortalResponse,
)
from .stripe_client import StripeClient
from .db import subscription_db
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = FastAPI(
    title="Goals Guild Subscription Service",
    version="1.0.0",
    description="Subscription management service for GoalsGuild"
)

# CORS Configuration
settings = Settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Stripe client
stripe_client = StripeClient(settings)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=settings.cognito_region)
core_table = dynamodb.Table(settings.core_table_name)

TIER_HIERARCHY = {
    "INITIATE": 1,
    "JOURNEYMAN": 2,
    "SAGE": 3,
    "GUILDMASTER": 4,
}


def _get_price_id_for_tier(plan_tier: str) -> Optional[str]:
    tier_lower = plan_tier.lower()
    return getattr(settings, f"stripe_price_id_{tier_lower}", None)


def _get_tier_from_subscription(subscription: dict) -> Optional[str]:
    metadata = _get_value(subscription, "metadata", {}) or {}
    tier = metadata.get("plan_tier")
    if tier:
        return tier
    items = _get_value(subscription, "items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        return stripe_client.get_tier_for_price_id(price_id)
    return None


def _to_iso_timestamp(value: Optional[int]) -> Optional[str]:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _get_value(source: object, key: str, default: Optional[object] = None):
    if isinstance(source, dict):
        return source.get(key, default)
    return getattr(source, key, default)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"ok": True, "service": "subscription-service"}


def get_user_profile(user_id: str) -> Optional[dict]:
    """Get user profile from DynamoDB."""
    try:
        response = core_table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PROFILE#{user_id}'
            }
        )
        
        if 'Item' in response:
            return response['Item']
        return None
    except ClientError as e:
        logger.error(f"Error fetching user profile: {e}")
        return None


def get_active_subscription(user_id: str) -> Optional[dict]:
    """Get active subscription for user from DynamoDB."""
    try:
        # Query for subscription records
        response = core_table.query(
            KeyConditionExpression=Key('PK').eq(f'USER#{user_id}') & Key('SK').begins_with('SUBSCRIPTION#'),
            FilterExpression=Attr('status').is_in(['active', 'trialing'])
        )
        
        items = response.get('Items', [])
        if items:
            # Return the most recent active subscription
            # Sort by updatedAt if available, otherwise by createdAt
            items.sort(
                key=lambda x: x.get('updatedAt', x.get('createdAt', '')),
                reverse=True
            )
            return items[0]
        
        return None
    except ClientError as e:
        logger.error(f"Error fetching subscription: {e}")
        return None


def get_founder_pass(user_id: str) -> Optional[dict]:
    """Get founder pass for user from DynamoDB."""
    try:
        # Check for FOUNDING_MEMBER
        response = core_table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': 'FOUNDER#FOUNDING_MEMBER'
            }
        )
        
        if 'Item' in response:
            return response['Item']
        
        # Check for GUILD_BUILDER
        response = core_table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': 'FOUNDER#GUILD_BUILDER'
            }
        )
        
        if 'Item' in response:
            return response['Item']
        
        return None
    except ClientError as e:
        logger.error(f"Error fetching founder pass: {e}")
        return None


@app.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    auth: AuthContext = Depends(authenticate)
):
    """Get current user's subscription.
    
    Priority:
    1. Founder pass (lifetime access)
    2. Active subscription record
    3. Pending subscription tier from profile
    4. Default to free
    """
    try:
        user_id = auth.user_id
        
        # 1. Check for founder pass (highest priority)
        founder_pass = get_founder_pass(user_id)
        if founder_pass:
            granted_tier = founder_pass.get('grantedTier', 'SAGE')
            return {
                "subscription_id": None,
                "plan_tier": granted_tier,
                "status": "active",
                "stripe_customer_id": None,
                "current_period_start": None,
                "current_period_end": None,
                "cancel_at_period_end": False,
                "has_active_subscription": True
            }
        
        # 2. Check for active subscription
        subscription = get_active_subscription(user_id)
        if subscription:
            from datetime import datetime
            now = datetime.utcnow().isoformat() + 'Z'
            current_period_end = subscription.get('currentPeriodEnd', '')
            
            # Check if subscription is still valid (not past period end)
            is_active = (
                subscription.get('status') in ['active', 'trialing'] and
                (not current_period_end or current_period_end > now)
            )
            
            return {
                "subscription_id": subscription.get('subscriptionId'),
                "plan_tier": subscription.get('planTier'),
                "status": subscription.get('status'),
                "stripe_customer_id": subscription.get('stripeCustomerId'),
                "current_period_start": subscription.get('currentPeriodStart'),
                "current_period_end": subscription.get('currentPeriodEnd'),
                "cancel_at_period_end": subscription.get('cancelAtPeriodEnd', False),
                "has_active_subscription": is_active
            }
        
        # 3. Check for pending subscription tier in profile
        profile = get_user_profile(user_id)
        if profile:
            selected_tier = profile.get('selected_subscription_tier')
            selected_updated_at = profile.get('selected_subscription_tier_updated_at')
            if selected_tier:
                if subscription_db.is_selected_tier_stale(selected_updated_at):
                    subscription_db.clear_selected_subscription_tier(user_id)
                else:
                    # User has selected a tier but hasn't completed checkout yet
                    # Return the selected tier but mark as inactive (no active subscription)
                    return {
                        "subscription_id": None,
                        "plan_tier": selected_tier,
                        "status": "incomplete",  # Use incomplete status for pending checkout
                        "stripe_customer_id": None,
                        "current_period_start": None,
                        "current_period_end": None,
                        "cancel_at_period_end": False,
                        "has_active_subscription": False
                    }
        
        # 4. Default to free
        return {
            "subscription_id": None,
            "plan_tier": None,
            "status": None,
            "stripe_customer_id": None,
            "current_period_start": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
            "has_active_subscription": False
        }
        
    except Exception as e:
        logger.error(f"Error getting current subscription: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get subscription: {str(e)}"
        )


def get_user_email(user_id: str) -> str:
    """Get user email from DynamoDB."""
    try:
        response = core_table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PROFILE#{user_id}'
            }
        )
        
        if 'Item' in response:
            return response['Item'].get('email', '')
        
        logger.warning(f"Could not find email for user {user_id} in profile")
        return ''
    except ClientError as e:
        logger.error(f"Error fetching user email: {e}")
        return ''


@app.post("/subscriptions/create-checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest = Body(...),
    auth: AuthContext = Depends(authenticate)
):
    """Create Stripe checkout session."""
    try:
        # Get user email
        user_email = get_user_email(auth.user_id)
        if not user_email:
            # Try to get email from JWT claims
            user_email = auth.claims.get('email', '')
            if not user_email:
                raise HTTPException(
                    status_code=400,
                    detail="User email not found. Please ensure your profile is complete."
                )
        
        # Get price ID for the selected tier
        tier_lower = request.plan_tier.lower()
        price_id = getattr(settings, f'stripe_price_id_{tier_lower}', None)
        
        if not price_id:
            raise HTTPException(
                status_code=500,
                detail=f"Price ID not configured for tier {request.plan_tier}. Please contact support."
            )
        
        # Create or get Stripe customer
        customer = stripe_client.create_customer(
            user_id=auth.user_id,
            email=user_email,
            provider=auth.provider,
            metadata={
                'plan_tier': request.plan_tier,
                'user_id': auth.user_id,
            }
        )
        
        # Create checkout session
        session = stripe_client.create_checkout_session(
            customer_id=customer.id,
            price_id=price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                'user_id': auth.user_id,
                'plan_tier': request.plan_tier,
            }
        )
        
        logger.info(
            f"Created checkout session {session.id} for user {auth.user_id} "
            f"(tier: {request.plan_tier})"
        )

        try:
            subscription_db.update_selected_subscription_tier(auth.user_id, request.plan_tier)
        except Exception as e:
            logger.warning(f"Failed to update selected subscription tier for {auth.user_id}: {e}")
        
        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@app.post("/subscriptions/cancel", response_model=CancelSubscriptionResponse)
async def cancel_subscription(
    payload: Optional[CancelSubscriptionRequest] = Body(default=None),
    auth: AuthContext = Depends(authenticate),
    request: Request = None
):
    """Cancel current subscription."""
    try:
        correlation_id = request.headers.get("x-correlation-id") if request else None
        cancel_at_period_end = payload.cancel_at_period_end if payload else True
        subscription = subscription_db.get_active_subscription(auth.user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        stripe_subscription = stripe_client.cancel_subscription(
            subscription_id=subscription.get("subscriptionId"),
            cancel_at_period_end=cancel_at_period_end
        )

        status = _get_value(stripe_subscription, "status", subscription.get("status"))
        current_period_start = _to_iso_timestamp(_get_value(stripe_subscription, "current_period_start"))
        current_period_end = _to_iso_timestamp(_get_value(stripe_subscription, "current_period_end"))
        cancel_at_period_end = bool(_get_value(stripe_subscription, "cancel_at_period_end", cancel_at_period_end))

        plan_tier = subscription.get("planTier")
        profile_tier = subscription_db.determine_profile_tier(plan_tier, status, current_period_end)
        subscription_db.transact_upsert_subscription_and_profile(
            user_id=auth.user_id,
            subscription_id=subscription.get("subscriptionId"),
            plan_tier=plan_tier,
            status=status,
            stripe_customer_id=subscription.get("stripeCustomerId"),
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            provider=subscription.get("provider", auth.provider),
            profile_tier=profile_tier,
        )

        return CancelSubscriptionResponse(
            subscription_id=subscription.get("subscriptionId"),
            status=status,
            cancel_at_period_end=cancel_at_period_end
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error canceling subscription: {e}",
            exc_info=True,
            extra={"correlation_id": correlation_id, "user_id": auth.user_id}
        )
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


@app.get("/subscriptions/portal", response_model=BillingPortalResponse)
async def get_billing_portal(
    return_url: str = Query(..., description="URL to return to after portal"),
    auth: AuthContext = Depends(authenticate),
    request: Request = None
):
    """Get Stripe Customer Portal URL."""
    try:
        correlation_id = request.headers.get("x-correlation-id") if request else None
        subscription = subscription_db.get_active_subscription(auth.user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        customer_id = subscription.get("stripeCustomerId")
        if not customer_id:
            raise HTTPException(status_code=400, detail="Stripe customer ID missing")

        portal_url = stripe_client.get_customer_portal_url(
            customer_id=customer_id,
            return_url=return_url
        )
        return BillingPortalResponse(url=portal_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error creating billing portal URL: {e}",
            exc_info=True,
            extra={"correlation_id": correlation_id, "user_id": auth.user_id}
        )
        raise HTTPException(status_code=500, detail="Failed to create billing portal URL")


@app.post("/subscriptions/update-plan", response_model=UpdatePlanResponse)
async def update_subscription_plan(
    payload: UpdatePlanRequest = Body(...),
    auth: AuthContext = Depends(authenticate),
    request: Request = None
):
    """Update subscription plan."""
    try:
        correlation_id = request.headers.get("x-correlation-id") if request else None
        subscription = subscription_db.get_active_subscription(auth.user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        current_tier = subscription.get("planTier")
        if current_tier == payload.plan_tier:
            raise HTTPException(status_code=400, detail="Already on selected plan")

        price_id = _get_price_id_for_tier(payload.plan_tier)
        if not price_id:
            raise HTTPException(
                status_code=500,
                detail=f"Price ID not configured for tier {payload.plan_tier}. Please contact support."
            )

        current_rank = TIER_HIERARCHY.get(current_tier, 0)
        next_rank = TIER_HIERARCHY.get(payload.plan_tier, 0)
        is_upgrade = next_rank > current_rank
        change_timing = payload.change_timing or ("immediate" if is_upgrade else "period_end")
        proration_behavior = "create_prorations" if is_upgrade else "none"
        billing_cycle_anchor = "now" if change_timing == "immediate" else "unchanged"

        updated_subscription = stripe_client.update_subscription_plan(
            subscription_id=subscription.get("subscriptionId"),
            price_id=price_id,
            proration_behavior=proration_behavior,
            billing_cycle_anchor=billing_cycle_anchor,
        )

        status = _get_value(updated_subscription, "status", subscription.get("status"))
        current_period_start = _to_iso_timestamp(_get_value(updated_subscription, "current_period_start"))
        current_period_end = _to_iso_timestamp(_get_value(updated_subscription, "current_period_end"))
        cancel_at_period_end = bool(_get_value(updated_subscription, "cancel_at_period_end", False))
        profile_tier = subscription_db.determine_profile_tier(
            payload.plan_tier,
            status,
            current_period_end
        )
        subscription_db.transact_upsert_subscription_and_profile(
            user_id=auth.user_id,
            subscription_id=subscription.get("subscriptionId"),
            plan_tier=payload.plan_tier,
            status=status,
            stripe_customer_id=subscription.get("stripeCustomerId"),
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            provider=subscription.get("provider", auth.provider),
            profile_tier=profile_tier,
        )

        return UpdatePlanResponse(
            subscription_id=subscription.get("subscriptionId"),
            plan_tier=payload.plan_tier,
            status=status,
            cancel_at_period_end=cancel_at_period_end
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error updating subscription plan: {e}",
            exc_info=True,
            extra={"correlation_id": correlation_id, "user_id": auth.user_id}
        )
        raise HTTPException(status_code=500, detail="Failed to update subscription plan")


@app.get("/credits/balance")
async def get_credit_balance(
    auth: AuthContext = Depends(authenticate)
):
    """Get current credit balance."""
    # TODO: Implement credit balance retrieval
    return {"balance": 0, "last_top_up": None, "last_reset": None}


@app.post("/credits/topup")
async def top_up_credits(
    auth: AuthContext = Depends(authenticate)
):
    """Top up credits."""
    # TODO: Implement credit top-up
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    signature = request.headers.get("stripe-signature") or request.headers.get("Stripe-Signature")
    try:
        if not signature:
            logger.warning(
                "Stripe webhook signature missing",
                extra={"headers": list(request.headers.keys())}
            )
        event = stripe_client.construct_webhook_event(payload, signature)
    except Exception as e:
        logger.error(
            f"Webhook signature verification failed: {e}",
            extra={
                "has_signature": bool(signature),
                "payload_len": len(payload),
                "webhook_secret_configured": bool(stripe_client.webhook_secret),
            }
        )
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    event_id = event.get("id")
    logger.info(f"Received Stripe webhook event: {event_type} ({event_id})")

    def handle_subscription_update(subscription: dict, user_id: str, fallback_tier: Optional[str] = None):
        plan_tier = _get_tier_from_subscription(subscription) or fallback_tier
        if not plan_tier:
            logger.warning(f"Missing plan tier for subscription {_get_value(subscription, 'id')}")
            return

        current_period_start = _to_iso_timestamp(_get_value(subscription, "current_period_start"))
        current_period_end = _to_iso_timestamp(_get_value(subscription, "current_period_end"))
        status = _get_value(subscription, "status")
        cancel_at_period_end = bool(_get_value(subscription, "cancel_at_period_end", False))
        stripe_customer_id = _get_value(subscription, "customer")
        if not stripe_customer_id or not status:
            logger.warning(
                "Missing required subscription fields",
                extra={
                    "subscription_id": _get_value(subscription, "id"),
                    "stripe_customer_id": stripe_customer_id,
                    "status": status,
                }
            )
            return
        provider = subscription_db.get_user_provider(user_id)
        profile_tier = subscription_db.determine_profile_tier(plan_tier, status, current_period_end)
        existing = subscription_db.get_subscription(user_id, _get_value(subscription, "id"))
        if existing and not subscription_db.is_valid_status_transition(existing.get("status"), status):
            logger.warning(
                f"Ignoring invalid status transition for {existing.get('subscriptionId')}: "
                f"{existing.get('status')} -> {status}"
            )
            return
        logger.warning(
            "Processing subscription update: user_id=%r (type=%s) subscription_id=%r (type=%s) "
            "plan_tier=%r status=%r stripe_customer_id=%r current_period_start=%r "
            "current_period_end=%r cancel_at_period_end=%r event_id=%r",
            user_id,
            type(user_id).__name__,
            _get_value(subscription, "id"),
            type(_get_value(subscription, "id")).__name__,
            plan_tier,
            status,
            stripe_customer_id,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            event_id,
        )
        subscription_db.transact_upsert_subscription_and_profile(
            user_id=user_id,
            subscription_id=_get_value(subscription, "id"),
            plan_tier=plan_tier,
            status=status,
            stripe_customer_id=stripe_customer_id,
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            provider=provider,
            profile_tier=profile_tier,
            event_id=event_id,
            clear_selected_tier=True
        )

    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        if session.get("mode") != "subscription":
            return {"received": True}
        subscription_id = session.get("subscription")
        user_id = session.get("metadata", {}).get("user_id")
        plan_tier = session.get("metadata", {}).get("plan_tier")
        if not subscription_id or not user_id:
            logger.warning("Missing subscription_id or user_id in checkout session")
            return {"received": True}
        subscription = stripe_client.get_subscription(subscription_id)
        handle_subscription_update(subscription, user_id, plan_tier)
        return {"received": True}

    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        subscription = event.get("data", {}).get("object", {})
        user_id = subscription.get("metadata", {}).get("user_id")
        if not user_id:
            logger.warning("Missing user_id in subscription metadata")
            return {"received": True}
        handle_subscription_update(subscription, user_id)
        return {"received": True}

    if event_type in {"invoice.payment_succeeded", "invoice.payment_failed"}:
        invoice = event.get("data", {}).get("object", {})
        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return {"received": True}
        subscription = stripe_client.get_subscription(subscription_id)
        user_id = subscription.get("metadata", {}).get("user_id")
        if not user_id:
            logger.warning("Missing user_id in subscription metadata for invoice event")
            return {"received": True}
        handle_subscription_update(subscription, user_id)
        return {"received": True}

    return {"received": True}

