"""
Pytest configuration and fixtures for subscription-service tests.
"""
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import pytest
from fastapi.testclient import TestClient
import jwt
from datetime import datetime, timedelta, timezone

# Add the services directory to Python path
services_dir = Path(__file__).resolve().parents[2]
if str(services_dir) not in sys.path:
    sys.path.insert(0, str(services_dir))

# Add common module path
common_dir = services_dir.parent / "common"
if str(common_dir) not in sys.path:
    sys.path.insert(0, str(common_dir))


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    with patch('app.settings.Settings') as mock_settings:
        mock_instance = Mock()
        mock_instance.environment = 'test'
        mock_instance.aws_region = 'us-east-1'
        mock_instance.core_table_name = 'gg_core_test'
        mock_instance.allowed_origins = ["http://localhost:3000"]
        mock_instance.jwt_secret = 'test-secret-key-for-testing-only'
        mock_instance.jwt_audience = 'goalsguild'
        mock_instance.jwt_issuer = 'goalsguild'
        mock_instance.use_mock_stripe = True
        mock_instance.stripe_secret_key = None
        mock_instance.stripe_webhook_secret = None
        mock_instance.stripe_publishable_key = None
        mock_instance.cognito_user_pool_id = 'test-pool-id'
        mock_settings.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_auth_context():
    """Mock authentication context."""
    from app.auth import AuthContext
    return AuthContext(
        user_id="test-user-123",
        claims={"sub": "test-user-123", "username": "testuser", "role": "user"},
        provider="local"
    )


@pytest.fixture
def test_token(mock_settings):
    """Generate a test JWT token."""
    payload = {
        "sub": "test-user-123",
        "username": "testuser",
        "role": "user",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
        "aud": "goalsguild",
        "iss": "goalsguild"
    }
    return jwt.encode(payload, mock_settings.jwt_secret, algorithm="HS256")


@pytest.fixture
def app_client(mock_settings, test_token):
    """Create test client with mocked dependencies."""
    with patch('app.settings.Settings', return_value=mock_settings):
        from app.main import app
        from app.auth import authenticate, AuthContext
        
        # Override authenticate dependency
        def fake_auth():
            return AuthContext(
                user_id="test-user-123",
                claims={"sub": "test-user-123", "username": "testuser", "role": "user"},
                provider="local"
            )
        
        app.dependency_overrides[authenticate] = fake_auth
        
        client = TestClient(app)
        yield client
        
        # Cleanup
        app.dependency_overrides.clear()


@pytest.fixture
def mock_dynamodb_table():
    """Mock DynamoDB table."""
    mock_table = Mock()
    mock_table.get_item.return_value = {"Item": {}}
    mock_table.put_item.return_value = {}
    mock_table.update_item.return_value = {}
    return mock_table


@pytest.fixture
def mock_stripe_client():
    """Mock Stripe client."""
    with patch('app.stripe_client.StripeClient') as mock_client:
        mock_instance = Mock()
        mock_instance.is_mock = True
        mock_instance.create_customer.return_value = Mock(id="cus_test123")
        mock_instance.create_checkout_session.return_value = Mock(
            id="cs_test123",
            url="https://checkout.stripe.com/test"
        )
        mock_instance.get_customer_portal_url.return_value = Mock(
            url="https://billing.stripe.com/test"
        )
        mock_client.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_subscription_db():
    """Mock subscription database operations."""
    with patch('app.db.subscription_db') as mock_db:
        yield mock_db


@pytest.fixture
def mock_credit_db():
    """Mock credit database operations."""
    with patch('app.db.credit_db') as mock_db:
        yield mock_db


@pytest.fixture
def mock_cognito_helper():
    """Mock Cognito helper functions."""
    with patch('app.utils.cognito_helper') as mock_helper:
        mock_helper.add_user_to_group.return_value = True
        mock_helper.remove_user_from_group.return_value = True
        mock_helper.set_tier_group.return_value = True
        yield mock_helper


@pytest.fixture(scope='session')
def integration_test_user_id():
    """Generate a unique user ID for integration tests."""
    import uuid
    return f"integration-test-{uuid.uuid4().hex[:12]}"


@pytest.fixture
def real_dynamodb_table():
    """Fixture for real DynamoDB table operations (can use local DynamoDB or test table)."""
    import boto3
    from botocore.exceptions import ClientError
    
    # For integration tests, use a test table
    # In CI/CD, this could point to a real test DynamoDB table
    table_name = os.getenv('TEST_DYNAMODB_TABLE', 'gg_core_test')
    
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table(table_name)
        # Test connection
        table.meta.client.describe_table(TableName=table_name)
        yield table
    except (ClientError, Exception):
        # Fallback to mock if table doesn't exist
        from unittest.mock import Mock
        mock_table = Mock()
        yield mock_table

