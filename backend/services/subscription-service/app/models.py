from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# Subscription Tier Types
SubscriptionTier = Literal["INITIATE", "JOURNEYMAN", "SAGE", "GUILDMASTER"]
SubscriptionStatus = Literal["active", "canceled", "past_due", "trialing", "incomplete", "incomplete_expired"]
FounderPassType = Literal["FOUNDING_MEMBER", "GUILD_BUILDER"]


class SubscriptionResponse(BaseModel):
    """Current user subscription information."""
    subscription_id: Optional[str] = None
    plan_tier: Optional[SubscriptionTier] = None
    status: Optional[SubscriptionStatus] = None
    stripe_customer_id: Optional[str] = None
    current_period_start: Optional[str] = None
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False
    has_active_subscription: bool = False


class CreateCheckoutRequest(BaseModel):
    """Request to create a Stripe checkout session."""
    plan_tier: SubscriptionTier
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect after canceled payment")


class CheckoutSessionResponse(BaseModel):
    """Stripe checkout session response."""
    session_id: str
    url: str


class FounderPassCheckoutRequest(BaseModel):
    """Request to create a founder pass checkout."""
    pass_type: FounderPassType
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect after canceled payment")


class CreditBalanceResponse(BaseModel):
    """Current credit balance information."""
    balance: int = 0
    last_top_up: Optional[str] = None
    last_reset: Optional[str] = None


class TopUpCreditsRequest(BaseModel):
    """Request to top up credits."""
    amount: int = Field(..., gt=0, description="Number of credits to purchase (minimum 10 = $5)")


class ConsumeCreditsRequest(BaseModel):
    """Internal request to consume credits (for feature usage)."""
    feature: str = Field(..., description="Feature name consuming credits")
    amount: int = Field(..., gt=0, description="Number of credits to consume")


class CreditConsumptionResponse(BaseModel):
    """Response after consuming credits."""
    success: bool
    remaining_balance: int
    message: Optional[str] = None


class BillingPortalResponse(BaseModel):
    """Stripe Customer Portal URL response."""
    url: str


class WebhookEvent(BaseModel):
    """Stripe webhook event."""
    id: str
    type: str
    data: dict
    created: int

