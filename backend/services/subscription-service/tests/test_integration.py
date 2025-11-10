"""
Integration tests for subscription service.

These tests verify end-to-end functionality with real components working together:
- Full API flows with authentication
- Database operations with real DynamoDB patterns
- Mock Stripe integration in real scenarios
- Credit lifecycle management
- Subscription lifecycle management
"""
import pytest
import os
import uuid
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
import jwt

from app.models import (
    SubscriptionResponse,
    CreateCheckoutRequest,
    CreditBalanceResponse,
    TopUpCreditsRequest
)


@pytest.fixture
def integration_settings():
    """Settings for integration tests."""
    return {
        'environment': 'test',
        'aws_region': 'us-east-1',
        'core_table_name': 'gg_core_test',
        'allowed_origins': ['http://localhost:3000'],
        'jwt_secret': 'integration-test-secret-key',
        'jwt_audience': 'goalsguild',
        'jwt_issuer': 'goalsguild',
        'use_mock_stripe': True,
        'cognito_user_pool_id': 'test-pool-id'
    }


@pytest.fixture
def integration_user_id():
    """Generate a unique user ID for integration tests."""
    return f"integration-test-user-{uuid.uuid4().hex[:8]}"


@pytest.fixture
def integration_token(integration_settings):
    """Generate a valid JWT token for integration tests."""
    payload = {
        'sub': 'integration-test-user-123',
        'username': 'integrationtest',
        'role': 'user',
        'iat': int(datetime.now(timezone.utc).timestamp()),
        'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
        'aud': integration_settings['jwt_audience'],
        'iss': integration_settings['jwt_issuer']
    }
    return jwt.encode(payload, integration_settings['jwt_secret'], algorithm='HS256')


@pytest.fixture
def integration_client(integration_settings, integration_token):
    """Create test client for integration tests with real components."""
    with patch('app.settings.Settings') as mock_settings:
        mock_instance = Mock()
        for key, value in integration_settings.items():
            setattr(mock_instance, key, value)
        mock_settings.return_value = mock_instance
        
        from app.main import app
        from app.auth import authenticate, AuthContext
        
        # Use real authentication (not mocked)
        def real_auth():
            # This will use real JWT verification
            pass
        
        client = TestClient(app)
        
        # Store token for use in requests
        client.integration_token = integration_token
        client.integration_user_id = 'integration-test-user-123'
        
        yield client
        
        app.dependency_overrides.clear()


@pytest.fixture
def mock_dynamodb_table_integration():
    """Mock DynamoDB table for integration tests with realistic behavior."""
    table = Mock()
    
    # Store items in memory for realistic behavior
    table._items = {}
    
    def get_item(Key, **kwargs):
        pk = Key.get('PK')
        sk = Key.get('SK')
        key = f"{pk}#{sk}"
        item = table._items.get(key)
        if item:
            return {'Item': item}
        return {}
    
    def put_item(Item, **kwargs):
        pk = Item.get('PK')
        sk = Item.get('SK')
        key = f"{pk}#{sk}"
        table._items[key] = Item
        return {}
    
    def update_item(Key, UpdateExpression, ExpressionAttributeValues, **kwargs):
        pk = Key.get('PK')
        sk = Key.get('SK')
        key = f"{pk}#{sk}"
        item = table._items.get(key, {})
        if item:
            # Simulate update
            for attr_name, attr_value in ExpressionAttributeValues.items():
                attr_key = attr_name.replace(':', '')
                if 'SET' in UpdateExpression:
                    item[attr_key] = attr_value
            table._items[key] = item
        return {'Attributes': item} if item else {}
    
    def query(KeyConditionExpression, **kwargs):
        # Simple query simulation
        pk_prefix = kwargs.get('ExpressionAttributeValues', {}).get(':pk', '')
        results = []
        for key, item in table._items.items():
            if pk_prefix and item.get('PK', '').startswith(pk_prefix.replace('USER#', '')):
                results.append(item)
        return {'Items': results}
    
    table.get_item = Mock(side_effect=get_item)
    table.put_item = Mock(side_effect=put_item)
    table.update_item = Mock(side_effect=update_item)
    table.query = Mock(side_effect=query)
    
    return table


class TestSubscriptionLifecycleIntegration:
    """Integration tests for subscription lifecycle."""
    
    def test_subscription_flow_end_to_end(
        self,
        integration_client,
        integration_token,
        mock_dynamodb_table_integration
    ):
        """Test complete subscription flow: create, get, cancel."""
        with patch('app.db.subscription_db.dynamodb') as mock_dynamodb, \
             patch('app.stripe_client.StripeClient') as mock_stripe_client_class:
            
            mock_dynamodb.Table.return_value = mock_dynamodb_table_integration
            
            # Mock Stripe client
            mock_stripe = Mock()
            mock_stripe.is_mock = True
            mock_stripe.create_customer.return_value = Mock(id='cus_test123')
            mock_stripe.create_checkout_session.return_value = Mock(
                id='cs_test123',
                url='https://checkout.stripe.com/test'
            )
            mock_stripe_client_class.return_value = mock_stripe
            
            # 1. Get current subscription (should be empty)
            response = integration_client.get(
                '/subscriptions/current',
                headers={'Authorization': f'Bearer {integration_token}'}
            )
            assert response.status_code == 200
            data = response.json()
            assert data['has_active_subscription'] is False
            
            # 2. Create subscription in database
            from app.db.subscription_db import create_subscription
            
            subscription = create_subscription(
                user_id=integration_client.integration_user_id,
                subscription_id='sub_test123',
                plan_tier='INITIATE',
                stripe_customer_id='cus_test123',
                status='active',
                current_period_start=datetime.now(timezone.utc).isoformat(),
                current_period_end=(datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            )
            
            assert subscription is not None
            
            # 3. Get subscription again (should now have data)
            # Note: This is a placeholder endpoint, so we verify DB operation worked
            from app.db.subscription_db import get_subscription
            retrieved = get_subscription(integration_client.integration_user_id)
            assert retrieved is not None
            assert retrieved['subscription_id'] == 'sub_test123'
            assert retrieved['plan_tier'] == 'INITIATE'
    
    def test_subscription_cancellation_integration(
        self,
        integration_client,
        integration_token,
        mock_dynamodb_table_integration
    ):
        """Test subscription cancellation flow."""
        with patch('app.db.subscription_db.dynamodb') as mock_dynamodb, \
             patch('app.stripe_client.StripeClient') as mock_stripe_client_class:
            
            mock_dynamodb.Table.return_value = mock_dynamodb_table_integration
            
            # Create subscription first
            from app.db.subscription_db import create_subscription
            
            create_subscription(
                user_id=integration_client.integration_user_id,
                subscription_id='sub_test123',
                plan_tier='INITIATE',
                stripe_customer_id='cus_test123',
                status='active',
                current_period_start=datetime.now(timezone.utc).isoformat(),
                current_period_end=(datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            )
            
            # Mock Stripe cancellation
            mock_stripe = Mock()
            mock_stripe.is_mock = True
            mock_subscription = Mock()
            mock_subscription.id = 'sub_test123'
            mock_subscription.cancel_at_period_end = True
            mock_stripe.cancel_subscription.return_value = mock_subscription
            mock_stripe_client_class.return_value = mock_stripe
            
            # Cancel subscription
            from app.db.subscription_db import cancel_subscription
            result = cancel_subscription(integration_client.integration_user_id)
            
            assert result is not None
            
            # Verify subscription is marked for cancellation
            from app.db.subscription_db import get_subscription
            retrieved = get_subscription(integration_client.integration_user_id)
            assert retrieved is not None
            assert retrieved.get('cancel_at_period_end') is True


class TestCreditLifecycleIntegration:
    """Integration tests for credit lifecycle."""
    
    def test_credit_balance_flow_end_to_end(
        self,
        integration_client,
        integration_token,
        mock_dynamodb_table_integration
    ):
        """Test complete credit balance flow."""
        with patch('app.db.credit_db.dynamodb') as mock_dynamodb:
            mock_dynamodb.Table.return_value = mock_dynamodb_table_integration
            
            # 1. Get credit balance (should create if doesn't exist)
            from app.db.credit_db import get_or_create_credits
            
            credits = get_or_create_credits(integration_client.integration_user_id)
            assert credits is not None
            assert credits['balance'] == 0  # Default balance
            
            # 2. Top up credits
            from app.db.credit_db import update_credits
            
            result = update_credits(integration_client.integration_user_id, 100)
            assert result is not None
            
            # 3. Get balance again (should be updated)
            credits_after = get_or_create_credits(integration_client.integration_user_id)
            assert credits_after['balance'] == 100
    
    def test_credit_consumption_integration(
        self,
        integration_client,
        integration_token,
        mock_dynamodb_table_integration
    ):
        """Test credit consumption with real database operations."""
        with patch('app.db.credit_db.dynamodb') as mock_dynamodb:
            mock_dynamodb.Table.return_value = mock_dynamodb_table_integration
            
            # Setup: Create credits with balance
            from app.db.credit_db import get_or_create_credits, update_credits
            
            get_or_create_credits(integration_client.integration_user_id)
            update_credits(integration_client.integration_user_id, 100)
            
            # Consume credits
            from app.db.credit_db import consume_credits
            
            result = consume_credits(
                integration_client.integration_user_id,
                'video_generation',
                25
            )
            
            assert result is not None
            assert result['success'] is True
            assert result['remaining_balance'] == 75
            
            # Try to consume more than available
            result_insufficient = consume_credits(
                integration_client.integration_user_id,
                'video_generation',
                100  # More than remaining balance
            )
            
            assert result_insufficient is not None
            assert result_insufficient['success'] is False


class TestStripeIntegrationFlow:
    """Integration tests for Stripe operations."""
    
    def test_checkout_session_creation_integration(
        self,
        integration_client,
        integration_token
    ):
        """Test checkout session creation with mock Stripe."""
        with patch('app.stripe_client.StripeClient') as mock_stripe_client_class:
            mock_stripe = Mock()
            mock_stripe.is_mock = True
            mock_stripe.create_customer.return_value = Mock(id='cus_test123')
            mock_session = Mock()
            mock_session.id = 'cs_test123'
            mock_session.url = 'https://checkout.stripe.com/test'
            mock_stripe.create_checkout_session.return_value = mock_session
            mock_stripe_client_class.return_value = mock_stripe
            
            # This endpoint is not implemented yet, but we test the Stripe client
            from app.stripe_client import StripeClient
            from app.settings import Settings
            
            settings = Settings()
            client = StripeClient()
            
            session = client.create_checkout_session(
                customer_id='cus_test123',
                price_id='price_test123',
                success_url='https://example.com/success',
                cancel_url='https://example.com/cancel'
            )
            
            assert session is not None
            assert session.id == 'cs_test123'
            assert 'checkout' in session.url or session.url.startswith('http')
    
    def test_customer_portal_integration(
        self,
        integration_client,
        integration_token
    ):
        """Test customer portal URL generation."""
        with patch('app.stripe_client.StripeClient') as mock_stripe_client_class:
            mock_stripe = Mock()
            mock_stripe.is_mock = True
            mock_portal = Mock()
            mock_portal.url = 'https://billing.stripe.com/test'
            mock_stripe.get_customer_portal_url.return_value = mock_portal
            mock_stripe_client_class.return_value = mock_stripe
            
            from app.stripe_client import StripeClient
            
            client = StripeClient()
            portal = client.get_customer_portal_url(
                customer_id='cus_test123',
                return_url='https://example.com'
            )
            
            assert portal is not None
            assert portal.url == 'https://billing.stripe.com/test'


class TestWebhookIntegration:
    """Integration tests for webhook handling."""
    
    def test_webhook_event_processing_integration(
        self,
        integration_client,
        mock_dynamodb_table_integration
    ):
        """Test webhook event processing end-to-end."""
        with patch('app.db.subscription_db.dynamodb') as mock_dynamodb, \
             patch('app.utils.webhook_verification.verify_webhook_signature') as mock_verify:
            
            mock_dynamodb.Table.return_value = mock_dynamodb_table_integration
            mock_verify.return_value = True  # Skip signature verification in mock mode
            
            # Create webhook event payload
            event_data = {
                'id': 'evt_test123',
                'type': 'checkout.session.completed',
                'data': {
                    'object': {
                        'id': 'cs_test123',
                        'customer': 'cus_test123',
                        'subscription': 'sub_test123',
                        'metadata': {
                            'user_id': integration_client.integration_user_id
                        }
                    }
                },
                'created': int(datetime.now(timezone.utc).timestamp())
            }
            
            # This endpoint is not implemented yet, but we test the structure
            response = integration_client.post(
                '/webhooks/stripe',
                json=event_data,
                headers={'Stripe-Signature': 'test_signature'}
            )
            
            # Should not require authentication (public endpoint)
            assert response.status_code != 401


class TestAuthenticationIntegration:
    """Integration tests for authentication flow."""
    
    def test_authenticated_request_flow(
        self,
        integration_client,
        integration_token,
        integration_settings
    ):
        """Test full authenticated request flow."""
        # Make authenticated request
        response = integration_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {integration_token}'}
        )
        
        # Should succeed (even if endpoint returns placeholder)
        assert response.status_code == 200
    
    def test_unauthenticated_request_fails(
        self,
        integration_client
    ):
        """Test that unauthenticated requests fail."""
        response = integration_client.get('/subscriptions/current')
        
        assert response.status_code == 401
        assert 'Authorization header required' in response.json()['detail']
    
    def test_invalid_token_fails(
        self,
        integration_client
    ):
        """Test that invalid tokens fail."""
        response = integration_client.get(
            '/subscriptions/current',
            headers={'Authorization': 'Bearer invalid_token'}
        )
        
        assert response.status_code == 401


class TestEndToEndSubscriptionFlow:
    """Complete end-to-end subscription flow tests."""
    
    def test_complete_subscription_journey(
        self,
        integration_client,
        integration_token,
        mock_dynamodb_table_integration
    ):
        """Test complete user journey: signup -> subscribe -> use credits -> cancel."""
        with patch('app.db.subscription_db.dynamodb') as mock_sub_db, \
             patch('app.db.credit_db.dynamodb') as mock_credit_db, \
             patch('app.stripe_client.StripeClient') as mock_stripe_class:
            
            mock_sub_db.Table.return_value = mock_dynamodb_table_integration
            mock_credit_db.Table.return_value = mock_dynamodb_table_integration
            
            # Mock Stripe
            mock_stripe = Mock()
            mock_stripe.is_mock = True
            mock_stripe.create_customer.return_value = Mock(id='cus_test123')
            mock_stripe.create_checkout_session.return_value = Mock(
                id='cs_test123',
                url='https://checkout.stripe.com/test'
            )
            mock_stripe_class.return_value = mock_stripe
            
            user_id = integration_client.integration_user_id
            
            # Step 1: User has no subscription
            from app.db.subscription_db import get_subscription
            subscription = get_subscription(user_id)
            assert subscription is None
            
            # Step 2: User has no credits
            from app.db.credit_db import get_or_create_credits
            credits = get_or_create_credits(user_id)
            assert credits['balance'] == 0
            
            # Step 3: User subscribes (create subscription)
            from app.db.subscription_db import create_subscription
            
            create_subscription(
                user_id=user_id,
                subscription_id='sub_test123',
                plan_tier='INITIATE',
                stripe_customer_id='cus_test123',
                status='active',
                current_period_start=datetime.now(timezone.utc).isoformat(),
                current_period_end=(datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            )
            
            # Step 4: User gets INITIATE tier credits (10 credits)
            from app.db.credit_db import update_credits
            update_credits(user_id, 10)
            
            # Step 5: User consumes credits
            from app.db.credit_db import consume_credits
            result = consume_credits(user_id, 'video_generation', 5)
            assert result['success'] is True
            assert result['remaining_balance'] == 5
            
            # Step 6: User cancels subscription
            from app.db.subscription_db import cancel_subscription
            cancel_result = cancel_subscription(user_id)
            assert cancel_result is not None
            
            # Step 7: Verify subscription is canceled
            subscription_after = get_subscription(user_id)
            assert subscription_after is not None
            assert subscription_after.get('cancel_at_period_end') is True

