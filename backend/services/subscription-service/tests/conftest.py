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

# Set AWS region environment variable before any imports
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
os.environ['AWS_REGION'] = 'us-east-1'

# Create mock settings instance for global use
_mock_settings_instance = Mock()
_mock_settings_instance.environment = 'test'
_mock_settings_instance.aws_region = 'us-east-1'
_mock_settings_instance.cognito_region = 'us-east-1'
_mock_settings_instance.core_table_name = 'gg_core_test'
_mock_settings_instance.allowed_origins = ["http://localhost:3000"]
_mock_settings_instance.jwt_secret = 'test-secret-key-for-testing-only'
_mock_settings_instance.jwt_audience = 'goalsguild'
_mock_settings_instance.jwt_issuer = 'goalsguild'
_mock_settings_instance.use_mock_stripe = True
_mock_settings_instance.stripe_secret_key = None
_mock_settings_instance.stripe_webhook_secret = None
_mock_settings_instance.stripe_publishable_key = None
_mock_settings_instance.stripe_price_id_initiate = None
_mock_settings_instance.stripe_price_id_journeyman = None
_mock_settings_instance.stripe_price_id_sage = None
_mock_settings_instance.stripe_price_id_guildmaster = None
_mock_settings_instance.cognito_user_pool_id = 'test-pool-id'
_mock_settings_instance.frontend_base_url = 'http://localhost:8080'

# Create mock DynamoDB resource and table
mock_dynamodb = Mock()
mock_table = Mock()
mock_table.meta.client.describe_table.return_value = {
    'Table': {'KeySchema': [{'AttributeName': 'PK', 'KeyType': 'HASH'}, {'AttributeName': 'SK', 'KeyType': 'RANGE'}]}
}
mock_dynamodb.Table.return_value = mock_table

# Create mock SSM client
mock_ssm = Mock()
mock_ssm.get_parameter.side_effect = Exception("Parameter not found")

# Patch boto3 and Settings before any imports
# Use side_effect to return appropriate mocks based on service name
def mock_boto3_client(service_name, **kwargs):
    if service_name == 'ssm':
        return mock_ssm
    return Mock()

def mock_boto3_resource(service_name, **kwargs):
    if service_name == 'dynamodb':
        return mock_dynamodb
    return Mock()

# Create mock core_table for main.py
mock_core_table = Mock()
mock_core_table.get_item.return_value = {}  # Default: no founder pass
mock_core_table.query.return_value = {"Items": []}

# Store patches globally so they persist
_global_patches = {
    'boto3_client': patch('boto3.client', side_effect=mock_boto3_client),
    'boto3_resource': patch('boto3.resource', side_effect=mock_boto3_resource),
    'settings': patch('app.settings.Settings', return_value=_mock_settings_instance),
    'main_core_table': patch('app.main.core_table', mock_core_table),
}

# Start patches immediately
for p in _global_patches.values():
    p.start()


def pytest_configure(config):
    """Configure pytest - ensure patches are active before test collection."""
    # Patches are already started at module level, but this ensures they're active
    pass




@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    # Return the global mock settings instance (already patched at module level)
    yield _mock_settings_instance


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
    # Settings and boto3 are already patched at module level
    with patch('app.main.Settings', return_value=mock_settings), \
         patch('app.stripe_client.Settings', return_value=mock_settings):
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

