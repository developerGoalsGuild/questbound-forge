from __future__ import annotations

import logging
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from .auth import authenticate, AuthContext
from .settings import Settings
from .models import CreateCheckoutRequest, CheckoutSessionResponse
from .stripe_client import StripeClient

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

# Initialize Stripe client (will use mock in dev if STRIPE_SECRET_KEY not set)
stripe_client = StripeClient(settings)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"ok": True, "service": "subscription-service"}


@app.get("/subscriptions/current")
async def get_current_subscription(
    auth: AuthContext = Depends(authenticate)
):
    """Get current user's subscription."""
    # TODO: Implement subscription retrieval
    return {
        "subscription_id": None,
        "plan_tier": None,
        "status": None,
        "has_active_subscription": False
    }


@app.post("/subscriptions/create-checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest = Body(...),
    auth: AuthContext = Depends(authenticate)
):
    """Create Stripe checkout session (uses mock Stripe in dev mode)."""
    try:
        # Get user email from auth context
        user_email = auth.claims.get('email') or auth.claims.get('username') or f"user_{auth.user_id}@example.com"
        
        # Create or get Stripe customer
        customer = stripe_client.create_customer(
            user_id=auth.user_id,
            email=user_email,
            provider=auth.claims.get('provider', 'local'),
            metadata={
                "user_id": auth.user_id,
                "plan_tier": request.plan_tier,
            }
        )
        
        # Get price ID for the tier (use mock price_id if not configured)
        price_id = stripe_client.price_ids.get(request.plan_tier) or f"price_mock_{request.plan_tier.lower()}"
        
        # Create checkout session (will use mock in dev)
        session = stripe_client.create_checkout_session(
            customer_id=customer.id,
            price_id=price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "user_id": auth.user_id,
                "plan_tier": request.plan_tier,
                "provider": auth.claims.get('provider', 'local'),
            }
        )
        
        logger.info(f"Created checkout session {session.id} for user {auth.user_id} (tier: {request.plan_tier})")
        
        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@app.post("/subscriptions/cancel")
async def cancel_subscription(
    auth: AuthContext = Depends(authenticate)
):
    """Cancel current subscription."""
    # TODO: Implement subscription cancellation
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/subscriptions/portal")
async def get_billing_portal(
    auth: AuthContext = Depends(authenticate)
):
    """Get Stripe Customer Portal URL."""
    # TODO: Implement billing portal URL generation
    raise HTTPException(status_code=501, detail="Not implemented yet")


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
async def stripe_webhook():
    """Handle Stripe webhook events."""
    # TODO: Implement webhook handler
    raise HTTPException(status_code=501, detail="Not implemented yet")

