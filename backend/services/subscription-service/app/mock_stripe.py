"""
Mock Stripe client for development environment.

This module provides a mock implementation of Stripe operations
that simulates payment processing without requiring real API keys.
"""

from __future__ import annotations
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MockCustomer:
    """Mock Stripe customer."""
    id: str
    email: str
    metadata: dict
    created: int


@dataclass
class MockSubscription:
    """Mock Stripe subscription."""
    id: str
    customer: str
    status: str
    current_period_start: int
    current_period_end: int
    cancel_at_period_end: bool
    items: dict
    metadata: dict


@dataclass
class MockCheckoutSession:
    """Mock Stripe checkout session."""
    id: str
    url: str
    customer: str
    mode: str
    payment_status: str
    metadata: dict


class MockStripeClient:
    """Mock Stripe client for development."""
    
    def __init__(self):
        self.customers: dict[str, MockCustomer] = {}
        self.subscriptions: dict[str, MockSubscription] = {}
        self.checkout_sessions: dict[str, MockCheckoutSession] = {}
        logger.info("Initialized MockStripeClient for development")
    
    def create_customer(
        self,
        user_id: str,
        email: str,
        provider: str = "local",
        metadata: Optional[dict] = None
    ) -> MockCustomer:
        """Create or retrieve mock customer."""
        # Check if customer exists
        for customer in self.customers.values():
            if customer.metadata.get("user_id") == user_id:
                logger.info(f"Found existing mock customer for user {user_id}")
                return customer
        
        # Create new customer
        customer_id = f"cus_mock_{uuid.uuid4().hex[:24]}"
        customer = MockCustomer(
            id=customer_id,
            email=email,
            metadata=metadata or {"user_id": user_id, "provider": provider},
            created=int(datetime.now(timezone.utc).timestamp()),
        )
        self.customers[customer_id] = customer
        logger.info(f"Created mock customer {customer_id} for user {user_id}")
        return customer
    
    def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None
    ) -> MockCheckoutSession:
        """Create mock checkout session - immediately succeeds in dev."""
        session_id = f"cs_mock_{uuid.uuid4().hex[:24]}"
        
        # In dev, create a mock session that simulates successful checkout
        session = MockCheckoutSession(
            id=session_id,
            url=f"{success_url}?session_id={session_id}&mock=true",
            customer=customer_id,
            mode="subscription",
            payment_status="paid",
            metadata=metadata or {},
        )
        self.checkout_sessions[session_id] = session
        
        logger.info(f"Created mock checkout session {session_id} for customer {customer_id}")
        
        # In dev, auto-create subscription after a short delay (simulated)
        # This would normally happen via webhook
        self._auto_create_subscription_from_session(session_id, price_id, metadata)
        
        return session
    
    def create_founder_pass_checkout(
        self,
        customer_id: str,
        pass_type: Literal["FOUNDING_MEMBER", "GUILD_BUILDER"],
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None
    ) -> MockCheckoutSession:
        """Create mock founder pass checkout - immediately succeeds in dev."""
        session_id = f"cs_mock_{uuid.uuid4().hex[:24]}"
        
        session = MockCheckoutSession(
            id=session_id,
            url=f"{success_url}?session_id={session_id}&mock=true&pass_type={pass_type}",
            customer=customer_id,
            mode="payment",
            payment_status="paid",
            metadata={**(metadata or {}), "pass_type": pass_type},
        )
        self.checkout_sessions[session_id] = session
        
        logger.info(f"Created mock founder pass checkout {session_id} for customer {customer_id}")
        
        # In dev, auto-complete payment
        self._auto_complete_founder_pass(session_id, pass_type, metadata)
        
        return session
    
    def get_customer_portal_url(
        self,
        customer_id: str,
        return_url: str
    ) -> str:
        """Create mock billing portal URL."""
        # In dev, return a mock portal page URL
        portal_url = f"{return_url}?portal=mock&customer_id={customer_id}"
        logger.info(f"Created mock billing portal URL for customer {customer_id}")
        return portal_url
    
    def cancel_subscription(
        self,
        subscription_id: str,
        cancel_at_period_end: bool = True
    ) -> MockSubscription:
        """Cancel mock subscription."""
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        subscription = self.subscriptions[subscription_id]
        
        if cancel_at_period_end:
            subscription.cancel_at_period_end = True
            subscription.status = "active"  # Still active until period end
            logger.info(f"Mock subscription {subscription_id} will cancel at period end")
        else:
            subscription.status = "canceled"
            logger.info(f"Mock subscription {subscription_id} canceled immediately")
        
        return subscription
    
    def get_subscription(self, subscription_id: str) -> MockSubscription:
        """Retrieve mock subscription."""
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription {subscription_id} not found")
        return self.subscriptions[subscription_id]
    
    def _auto_create_subscription_from_session(
        self,
        session_id: str,
        price_id: str,
        metadata: Optional[dict] = None
    ):
        """Auto-create subscription from checkout session (dev mode)."""
        session = self.checkout_sessions.get(session_id)
        if not session:
            return
        
        # Determine tier from price_id or metadata
        tier = metadata.get("plan_tier", "INITIATE") if metadata else "INITIATE"
        
        now = datetime.now(timezone.utc)
        period_end = now + timedelta(days=30)  # 30-day subscription period
        
        subscription_id = f"sub_mock_{uuid.uuid4().hex[:24]}"
        subscription = MockSubscription(
            id=subscription_id,
            customer=session.customer,
            status="active",
            current_period_start=int(now.timestamp()),
            current_period_end=int(period_end.timestamp()),
            cancel_at_period_end=False,
            items={"data": [{"price": {"id": price_id}}]},
            metadata=metadata or {},
        )
        self.subscriptions[subscription_id] = subscription
        
        logger.info(
            f"Auto-created mock subscription {subscription_id} "
            f"for customer {session.customer} (tier={tier})"
        )
        
        return subscription
    
    def _auto_complete_founder_pass(
        self,
        session_id: str,
        pass_type: str,
        metadata: Optional[dict] = None
    ):
        """Auto-complete founder pass purchase (dev mode)."""
        session = self.checkout_sessions.get(session_id)
        if not session:
            return
        
        logger.info(
            f"Auto-completed mock founder pass {pass_type} "
            f"for customer {session.customer}"
        )
        # In dev, this is logged and the webhook handler will process it
    
    def construct_webhook_event(
        self,
        payload: bytes,
        signature: Optional[str] = None
    ) -> dict:
        """
        Create a mock webhook event from payload.
        
        In dev, we accept webhook payloads without signature verification.
        """
        import json
        
        try:
            # Parse payload (could be JSON string or already parsed)
            if isinstance(payload, bytes):
                data = json.loads(payload.decode('utf-8'))
            else:
                data = payload
            
            # If it's already an event dict, return it
            if isinstance(data, dict) and "type" in data:
                return data
            
            # Otherwise, wrap it in a mock event structure
            event_type = data.get("type", "checkout.session.completed")
            
            event = {
                "id": f"evt_mock_{uuid.uuid4().hex[:24]}",
                "type": event_type,
                "data": {
                    "object": data,
                },
                "created": int(datetime.now(timezone.utc).timestamp()),
            }
            
            logger.info(f"Constructed mock webhook event: {event_type}")
            return event
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in mock webhook payload: {e}")
            raise ValueError("Invalid webhook payload")


# Global mock client instance (singleton pattern)
_mock_client_instance: Optional['MockStripeClient'] = None


def get_mock_client() -> 'MockStripeClient':
    """Get or create singleton mock client instance."""
    global _mock_client_instance
    if _mock_client_instance is None:
        _mock_client_instance = MockStripeClient()
    return _mock_client_instance


class MockStripe:
    """Mock Stripe module that mimics stripe module interface."""
    
    api_key = None  # Not used in mock mode
    
    class Customer:
        @staticmethod
        def create(**kwargs):
            return get_mock_client().create_customer(**kwargs)
        
        @staticmethod
        def search(**kwargs):
            # Mock search - return empty results
            class MockSearchResult:
                data = []
            return MockSearchResult()
    
    class checkout:
        class Session:
            @staticmethod
            def create(**kwargs):
                return get_mock_client().create_checkout_session(**kwargs)
    
    class billing_portal:
        class Session:
            @staticmethod
            def create(**kwargs):
                return get_mock_client().get_customer_portal_url(
                    customer_id=kwargs.get('customer'),
                    return_url=kwargs.get('return_url', '')
                )
    
    class Subscription:
        @staticmethod
        def modify(subscription_id, **kwargs):
            cancel_at_period_end = kwargs.get('cancel_at_period_end', True)
            return get_mock_client().cancel_subscription(
                subscription_id=subscription_id,
                cancel_at_period_end=cancel_at_period_end
            )
        
        @staticmethod
        def cancel(subscription_id):
            return get_mock_client().cancel_subscription(
                subscription_id=subscription_id,
                cancel_at_period_end=False
            )
        
        @staticmethod
        def retrieve(subscription_id):
            return get_mock_client().get_subscription(subscription_id)
    
    class Webhook:
        @staticmethod
        def construct_event(payload, signature, secret):
            return get_mock_client().construct_webhook_event(payload, signature)
    
    class error:
        class StripeError(Exception):
            pass
        
        class SignatureVerificationError(Exception):
            pass

