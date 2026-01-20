from __future__ import annotations
import logging
from typing import Optional, Literal
import stripe
from .settings import Settings
from .mock_stripe import MockStripe as mock_stripe_module, MockStripeClient

logger = logging.getLogger(__name__)

# Stripe plan tier mapping
TIER_TO_PRICE_ID = {
    "INITIATE": None,  # Will be set from environment or Stripe dashboard
    "JOURNEYMAN": None,
    "SAGE": None,
    "GUILDMASTER": None,  # Custom pricing, handled separately
}

FOUNDER_PASS_PRICES = {
    "FOUNDING_MEMBER": 9900,  # $99 in cents
    "GUILD_BUILDER": 19900,   # $199 in cents
}


class StripeClient:
    """Wrapper for Stripe SDK operations."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.is_mock = settings.use_mock_stripe
        self._stripe = mock_stripe_module if self.is_mock else stripe
        
        if self.is_mock:
            # Use mock client in dev
            self.mock_client = MockStripeClient() if MockStripeClient else None
            self.webhook_secret = None  # Not needed for mock
            logger.info("Initialized StripeClient in mock mode for development")
        else:
            # Real Stripe client
            if not settings.stripe_secret_key:
                raise ValueError("Stripe secret key is required")
            
            self._stripe.api_key = settings.stripe_secret_key
            self.webhook_secret = settings.stripe_webhook_secret
        
        # Initialize price IDs from environment (can be overridden)
        self.price_ids = {
            tier: getattr(settings, f"stripe_price_id_{tier.lower()}", None)
            for tier in TIER_TO_PRICE_ID.keys()
        }

    def get_tier_for_price_id(self, price_id: Optional[str]) -> Optional[str]:
        """Map Stripe price ID to subscription tier."""
        if not price_id:
            return None
        for tier, configured_price_id in self.price_ids.items():
            if configured_price_id == price_id:
                return tier
        return None
    
    def create_customer(
        self,
        user_id: str,
        email: str,
        provider: str = "local",
        metadata: Optional[dict] = None
    ):
        """Create or retrieve Stripe customer for a user."""
        # Check if customer already exists by metadata
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "user_id": user_id,
            "provider": provider,
        })
        
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.create_customer(
                    user_id=user_id,
                    email=email,
                    provider=provider,
                    metadata=metadata
                )
            
            # Real Stripe API
            # Search for existing customer by metadata
            customers = self._stripe.Customer.search(
                query=f"metadata['user_id']:'{user_id}'"
            )
            
            if customers.data:
                logger.info(f"Found existing Stripe customer for user {user_id}")
                return customers.data[0]
            
            # Create new customer
            customer = self._stripe.Customer.create(
                email=email,
                metadata=metadata,
            )
            logger.info(f"Created new Stripe customer for user {user_id}: {customer.id}")
            return customer
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error creating customer: {e}")
            else:
                logger.error(f"Stripe error creating customer: {e}")
            raise
    
    def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None
    ):
        """Create Stripe Checkout session for subscription."""
        if metadata is None:
            metadata = {}
        
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.create_checkout_session(
                    customer_id=customer_id,
                    price_id=price_id,
                    success_url=success_url,
                    cancel_url=cancel_url,
                    metadata=metadata
                )
            
            # Real Stripe API
            session = self._stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata,
                subscription_data={
                    "metadata": metadata,
                },
                allow_promotion_codes=True,
            )
            logger.info(f"Created checkout session: {session.id}")
            return session
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error creating checkout session: {e}")
            else:
                logger.error(f"Stripe error creating checkout session: {e}")
            raise
    
    def create_founder_pass_checkout(
        self,
        customer_id: str,
        pass_type: Literal["FOUNDING_MEMBER", "GUILD_BUILDER"],
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None
    ):
        """Create Stripe Checkout session for founder pass (one-time payment)."""
        if metadata is None:
            metadata = {}
        
        metadata["pass_type"] = pass_type
        
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.create_founder_pass_checkout(
                    customer_id=customer_id,
                    pass_type=pass_type,
                    success_url=success_url,
                    cancel_url=cancel_url,
                    metadata=metadata
                )
            
            # Real Stripe API
            session = self._stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"GoalsGuild {pass_type.replace('_', ' ')}",
                            "description": f"Lifetime access pass: {pass_type}",
                        },
                        "unit_amount": FOUNDER_PASS_PRICES[pass_type],
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata,
            )
            logger.info(f"Created founder pass checkout session: {session.id}")
            return session
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error creating founder pass checkout: {e}")
            else:
                logger.error(f"Stripe error creating founder pass checkout: {e}")
            raise
    
    def get_customer_portal_url(
        self,
        customer_id: str,
        return_url: str
    ) -> str:
        """Create Stripe Customer Portal session URL."""
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.get_customer_portal_url(
                    customer_id=customer_id,
                    return_url=return_url
                )
            
            # Real Stripe API
            session = self._stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            logger.info(f"Created billing portal session for customer {customer_id}")
            return session.url
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error creating portal session: {e}")
            else:
                logger.error(f"Stripe error creating portal session: {e}")
            raise
    
    def cancel_subscription(
        self,
        subscription_id: str,
        cancel_at_period_end: bool = True
    ):
        """Cancel a subscription."""
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.cancel_subscription(
                    subscription_id=subscription_id,
                    cancel_at_period_end=cancel_at_period_end
                )
            
            # Real Stripe API
            if cancel_at_period_end:
                subscription = self._stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True,
                )
            else:
                subscription = self._stripe.Subscription.cancel(subscription_id)
            
            logger.info(f"Canceled subscription {subscription_id} (at_period_end={cancel_at_period_end})")
            return subscription
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error canceling subscription: {e}")
            else:
                logger.error(f"Stripe error canceling subscription: {e}")
            raise

    def update_subscription_plan(
        self,
        subscription_id: str,
        price_id: str,
        proration_behavior: str = "create_prorations",
        billing_cycle_anchor: str = "now"
    ):
        """Update subscription plan."""
        try:
            if self.is_mock and self.mock_client:
                return self.mock_client.update_subscription_plan(
                    subscription_id=subscription_id,
                    price_id=price_id,
                    proration_behavior=proration_behavior,
                    billing_cycle_anchor=billing_cycle_anchor,
                )

            subscription = self._stripe.Subscription.retrieve(subscription_id)
            subscription = self._stripe.Subscription.retrieve(subscription_id)
            items = subscription.get("items", {}).get("data", [])
            if not items:
                raise ValueError("Subscription has no items to update")

            item_id = items[0].get("id")
            if not item_id:
                raise ValueError("Subscription item ID not found")

            updated = self._stripe.Subscription.modify(
                subscription_id,
                items=[{"id": item_id, "price": price_id}],
                proration_behavior=proration_behavior,
                billing_cycle_anchor=billing_cycle_anchor,
            )
            logger.info(f"Updated subscription {subscription_id} to price {price_id}")
            return updated
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error updating subscription plan: {e}")
            else:
                logger.error(f"Stripe error updating subscription plan: {e}")
            raise
    
    def get_subscription(self, subscription_id: str):
        """Retrieve subscription by ID."""
        try:
            if self.is_mock and self.mock_client:
                # Use mock client
                return self.mock_client.get_subscription(subscription_id)
            
            # Real Stripe API
            return stripe.Subscription.retrieve(subscription_id)
        except Exception as e:
            if self.is_mock:
                logger.error(f"Mock Stripe error retrieving subscription: {e}")
            else:
                logger.error(f"Stripe error retrieving subscription: {e}")
            raise
    
    def construct_webhook_event(
        self,
        payload: bytes,
        signature: Optional[str] = None
    ):
        """Construct webhook event and verify signature."""
        try:
            if self.is_mock and self.mock_client:
                # Mock mode: skip signature verification
                logger.info("Using mock webhook verification (dev mode)")
                return self.mock_client.construct_webhook_event(payload, signature)
            
            # Real Stripe: verify signature
            if not self.webhook_secret:
                raise ValueError("Webhook secret is required for signature verification")
            
            if not signature:
                raise ValueError("Webhook signature is required")
            
            return self._stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise
        except Exception as e:
            if not self.is_mock:
                logger.error(f"Invalid webhook signature: {e}")
            raise

