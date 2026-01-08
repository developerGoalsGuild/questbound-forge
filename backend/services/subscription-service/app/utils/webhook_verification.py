"""
Stripe webhook signature verification.
"""

import logging
from typing import Optional
from fastapi import HTTPException, Request
from ..stripe_client import StripeClient
from ..settings import Settings

logger = logging.getLogger(__name__)


def verify_webhook_signature(
    request: Request,
    stripe_client: StripeClient,
    body: bytes
) -> dict:
    """
    Verify Stripe webhook signature and return event data.
    
    In dev/mock mode, signature verification is skipped.
    
    Args:
        request: FastAPI request object
        stripe_client: Initialized StripeClient instance
        body: Raw request body bytes
    
    Returns:
        Parsed Stripe event
    
    Raises:
        HTTPException: If signature verification fails (production only)
    """
    signature = request.headers.get("stripe-signature")
    
    # In mock mode, signature is optional
    if stripe_client.is_mock:
        logger.info("Skipping webhook signature verification (mock mode)")
        try:
            event = stripe_client.construct_webhook_event(body, signature)
            logger.info(f"Processed mock webhook event: {event.get('type', 'unknown')}")
            return event
        except Exception as e:
            logger.error(f"Error processing mock webhook: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid mock webhook payload: {e}")
    
    # Production mode: require signature
    if not signature:
        logger.warning("Missing stripe-signature header")
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        event = stripe_client.construct_webhook_event(body, signature)
        logger.info(f"Verified webhook event: {event['type']} (id={event['id']})")
        return event
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook payload")
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=401, detail="Webhook signature verification failed")

