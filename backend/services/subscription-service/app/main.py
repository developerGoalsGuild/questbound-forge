from __future__ import annotations

import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .auth import authenticate, AuthContext
from .settings import Settings

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


@app.post("/subscriptions/create-checkout")
async def create_checkout_session(
    auth: AuthContext = Depends(authenticate)
):
    """Create Stripe checkout session."""
    # TODO: Implement checkout session creation
    raise HTTPException(status_code=501, detail="Not implemented yet")


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

