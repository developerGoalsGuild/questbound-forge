"""
Tests for Pydantic models.
"""
import pytest
from pydantic import ValidationError
from app.models import (
    SubscriptionResponse,
    CreateCheckoutRequest,
    CheckoutSessionResponse,
    CreditBalanceResponse,
    TopUpCreditsRequest,
    FounderPassCheckoutRequest,
    BillingPortalResponse
)


class TestSubscriptionResponse:
    """Tests for SubscriptionResponse model."""
    
    def test_subscription_response_defaults(self):
        """Test SubscriptionResponse with default values."""
        response = SubscriptionResponse()
        assert response.subscription_id is None
        assert response.plan_tier is None
        assert response.status is None
        assert response.has_active_subscription is False
        assert response.cancel_at_period_end is False
    
    def test_subscription_response_with_data(self):
        """Test SubscriptionResponse with data."""
        response = SubscriptionResponse(
            subscription_id="sub_test123",
            plan_tier="INITIATE",
            status="active",
            has_active_subscription=True,
            stripe_customer_id="cus_test123"
        )
        assert response.subscription_id == "sub_test123"
        assert response.plan_tier == "INITIATE"
        assert response.status == "active"
        assert response.has_active_subscription is True
    
    def test_subscription_response_invalid_tier(self):
        """Test SubscriptionResponse with invalid tier."""
        with pytest.raises(ValidationError):
            SubscriptionResponse(plan_tier="INVALID_TIER")
    
    def test_subscription_response_invalid_status(self):
        """Test SubscriptionResponse with invalid status."""
        with pytest.raises(ValidationError):
            SubscriptionResponse(status="invalid_status")


class TestCreateCheckoutRequest:
    """Tests for CreateCheckoutRequest model."""
    
    def test_create_checkout_request_valid(self):
        """Test valid CreateCheckoutRequest."""
        request = CreateCheckoutRequest(
            plan_tier="JOURNEYMAN",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel"
        )
        assert request.plan_tier == "JOURNEYMAN"
        assert request.success_url == "https://example.com/success"
        assert request.cancel_url == "https://example.com/cancel"
    
    def test_create_checkout_request_missing_urls(self):
        """Test CreateCheckoutRequest with missing URLs."""
        with pytest.raises(ValidationError):
            CreateCheckoutRequest(plan_tier="INITIATE")
    
    def test_create_checkout_request_invalid_tier(self):
        """Test CreateCheckoutRequest with invalid tier."""
        with pytest.raises(ValidationError):
            CreateCheckoutRequest(
                plan_tier="INVALID",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel"
            )


class TestCheckoutSessionResponse:
    """Tests for CheckoutSessionResponse model."""
    
    def test_checkout_session_response_valid(self):
        """Test valid CheckoutSessionResponse."""
        response = CheckoutSessionResponse(
            session_id="cs_test123",
            url="https://checkout.stripe.com/test"
        )
        assert response.session_id == "cs_test123"
        assert response.url == "https://checkout.stripe.com/test"
    
    def test_checkout_session_response_missing_fields(self):
        """Test CheckoutSessionResponse with missing fields."""
        with pytest.raises(ValidationError):
            CheckoutSessionResponse(session_id="cs_test123")


class TestCreditBalanceResponse:
    """Tests for CreditBalanceResponse model."""
    
    def test_credit_balance_response_defaults(self):
        """Test CreditBalanceResponse with defaults."""
        response = CreditBalanceResponse()
        assert response.balance == 0
        assert response.last_top_up is None
        assert response.last_reset is None
    
    def test_credit_balance_response_with_data(self):
        """Test CreditBalanceResponse with data."""
        response = CreditBalanceResponse(
            balance=100,
            last_top_up="2025-01-01T00:00:00Z",
            last_reset="2025-01-01T00:00:00Z"
        )
        assert response.balance == 100
        assert response.last_top_up == "2025-01-01T00:00:00Z"


class TestTopUpCreditsRequest:
    """Tests for TopUpCreditsRequest model."""
    
    def test_top_up_credits_request_valid(self):
        """Test valid TopUpCreditsRequest."""
        request = TopUpCreditsRequest(amount=10)
        assert request.amount == 10
    
    def test_top_up_credits_request_zero_amount(self):
        """Test TopUpCreditsRequest with zero amount."""
        with pytest.raises(ValidationError):
            TopUpCreditsRequest(amount=0)
    
    def test_top_up_credits_request_negative_amount(self):
        """Test TopUpCreditsRequest with negative amount."""
        with pytest.raises(ValidationError):
            TopUpCreditsRequest(amount=-10)


class TestFounderPassCheckoutRequest:
    """Tests for FounderPassCheckoutRequest model."""
    
    def test_founder_pass_checkout_request_valid(self):
        """Test valid FounderPassCheckoutRequest."""
        request = FounderPassCheckoutRequest(
            pass_type="FOUNDING_MEMBER",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel"
        )
        assert request.pass_type == "FOUNDING_MEMBER"
    
    def test_founder_pass_checkout_request_invalid_type(self):
        """Test FounderPassCheckoutRequest with invalid type."""
        with pytest.raises(ValidationError):
            FounderPassCheckoutRequest(
                pass_type="INVALID",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel"
            )


class TestBillingPortalResponse:
    """Tests for BillingPortalResponse model."""
    
    def test_billing_portal_response_valid(self):
        """Test valid BillingPortalResponse."""
        response = BillingPortalResponse(url="https://billing.stripe.com/test")
        assert response.url == "https://billing.stripe.com/test"
    
    def test_billing_portal_response_missing_url(self):
        """Test BillingPortalResponse with missing URL."""
        with pytest.raises(ValidationError):
            BillingPortalResponse()

