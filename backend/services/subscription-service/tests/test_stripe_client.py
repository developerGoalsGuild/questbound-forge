"""
Tests for Stripe client wrapper.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock


class TestStripeClient:
    """Tests for StripeClient class."""
    
    @patch('app.stripe_client.Settings')
    def test_stripe_client_mock_mode(self, mock_settings):
        """Test StripeClient in mock mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = True
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        assert client.is_mock is True
        assert client.mock_client is not None
    
    @patch('app.stripe_client.Settings')
    @patch('app.stripe_client.stripe')
    def test_stripe_client_real_mode(self, mock_stripe, mock_settings):
        """Test StripeClient in real Stripe mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = False
        mock_settings_instance.stripe_secret_key = 'sk_test_123'
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        assert client.is_mock is False
    
    @patch('app.stripe_client.Settings')
    def test_create_customer_mock(self, mock_settings):
        """Test customer creation in mock mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = True
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        customer = client.create_customer(email="test@example.com")
        
        assert customer is not None
        assert hasattr(customer, 'id')
    
    @patch('app.stripe_client.Settings')
    def test_create_checkout_session_mock(self, mock_settings):
        """Test checkout session creation in mock mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = True
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        session = client.create_checkout_session(
            customer_id="cus_test123",
            price_id="price_test123",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel"
        )
        
        assert session is not None
        assert hasattr(session, 'id')
        assert hasattr(session, 'url')
    
    @patch('app.stripe_client.Settings')
    def test_get_customer_portal_url_mock(self, mock_settings):
        """Test customer portal URL generation in mock mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = True
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        portal = client.get_customer_portal_url(
            customer_id="cus_test123",
            return_url="https://example.com"
        )
        
        assert portal is not None
        assert hasattr(portal, 'url')
    
    @patch('app.stripe_client.Settings')
    def test_cancel_subscription_mock(self, mock_settings):
        """Test subscription cancellation in mock mode."""
        from app.stripe_client import StripeClient
        
        mock_settings_instance = Mock()
        mock_settings_instance.use_mock_stripe = True
        mock_settings.return_value = mock_settings_instance
        
        client = StripeClient()
        subscription = client.cancel_subscription(
            subscription_id="sub_test123",
            cancel_at_period_end=True
        )
        
        assert subscription is not None
        assert hasattr(subscription, 'id')

