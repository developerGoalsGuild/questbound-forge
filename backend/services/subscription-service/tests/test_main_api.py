"""
Tests for subscription service API endpoints.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import status
from datetime import datetime, timezone


class TestHealthCheck:
    """Tests for health check endpoint."""
    
    def test_health_check_success(self, app_client):
        """Test health check returns success."""
        response = app_client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["ok"] is True
        assert data["service"] == "subscription-service"


class TestCurrentSubscription:
    """Tests for current subscription endpoint."""
    
    def test_get_current_subscription_no_auth(self, app_client):
        """Test getting subscription without auth fails."""
        # Remove auth override
        from app.main import app
        app.dependency_overrides.clear()
        
        response = app_client.get("/subscriptions/current")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Restore auth override
        from app.auth import authenticate, AuthContext
        def fake_auth():
            return AuthContext(user_id="test-user-123", claims={}, provider="local")
        app.dependency_overrides[authenticate] = fake_auth
    
    def test_get_current_subscription_success(self, app_client):
        """Test getting current subscription."""
        # Mock core_table.get_item to return empty (no founder pass)
        from app.main import core_table
        core_table.get_item.return_value = {}
        
        response = app_client.get(
            "/subscriptions/current",
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "subscription_id" in data
        assert "plan_tier" in data
        assert "status" in data
        assert "has_active_subscription" in data


class TestCreateCheckout:
    """Tests for checkout session creation."""
    
    def test_create_checkout_requires_auth(self, app_client):
        """Test checkout creation requires authentication."""
        from app.main import app
        app.dependency_overrides.clear()
        
        response = app_client.post(
            "/subscriptions/create-checkout",
            json={"plan_tier": "INITIATE"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Restore auth
        from app.auth import authenticate, AuthContext
        def fake_auth():
            return AuthContext(user_id="test-user-123", claims={}, provider="local")
        app.dependency_overrides[authenticate] = fake_auth


class TestCancelSubscription:
    """Tests for subscription cancellation."""
    
    def test_cancel_subscription_requires_auth(self, app_client):
        """Test subscription cancellation requires authentication."""
        from app.main import app
        app.dependency_overrides.clear()
        
        response = app_client.post("/subscriptions/cancel")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Restore auth
        from app.auth import authenticate, AuthContext
        def fake_auth():
            return AuthContext(user_id="test-user-123", claims={}, provider="local")
        app.dependency_overrides[authenticate] = fake_auth


class TestBillingPortal:
    """Tests for billing portal endpoint."""
    
    def test_get_billing_portal_requires_auth(self, app_client):
        """Test billing portal requires authentication."""
        from app.main import app
        app.dependency_overrides.clear()
        
        response = app_client.get("/subscriptions/portal?return_url=https://example.com")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Restore auth
        from app.auth import authenticate, AuthContext
        def fake_auth():
            return AuthContext(user_id="test-user-123", claims={}, provider="local")
        app.dependency_overrides[authenticate] = fake_auth


class TestCreditBalance:
    """Tests for credit balance endpoint."""
    
    def test_get_credit_balance_success(self, app_client):
        """Test getting credit balance."""
        response = app_client.get(
            "/credits/balance",
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "balance" in data
        assert "last_top_up" in data
        assert "last_reset" in data
        assert data["balance"] == 0
    
    def test_get_credit_balance_no_auth(self, app_client):
        """Test getting credit balance without auth fails."""
        from app.main import app
        app.dependency_overrides.clear()
        
        response = app_client.get("/credits/balance")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Restore auth
        from app.auth import authenticate, AuthContext
        def fake_auth():
            return AuthContext(user_id="test-user-123", claims={}, provider="local")
        app.dependency_overrides[authenticate] = fake_auth


class TestTopUpCredits:
    """Tests for credit top-up endpoint."""
    
    def test_top_up_credits_not_implemented(self, app_client):
        """Test credit top-up returns not implemented."""
        response = app_client.post(
            "/credits/topup",
            headers={"Authorization": "Bearer test-token"},
            json={"amount": 10}
        )
        assert response.status_code == status.HTTP_501_NOT_IMPLEMENTED
        assert "Not implemented yet" in response.json()["detail"]


class TestStripeWebhook:
    """Tests for Stripe webhook endpoint."""
    
    def test_webhook_no_auth_required(self, app_client):
        """Test webhook doesn't require authentication."""
        # Webhook endpoint should be public (no auth required)
        # This is expected behavior since Stripe sends webhooks without auth headers
        response = app_client.post(
            "/webhooks/stripe",
            json={"type": "checkout.session.completed", "data": {}}
        )
        # Should not return 401, webhook endpoint is public
        assert response.status_code != status.HTTP_401_UNAUTHORIZED
        # In mock mode, webhook should process successfully
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

