"""
Pytest configuration for collaboration service tests.
"""

import pytest
import os
import sys
from pathlib import Path
from unittest.mock import patch, Mock, MagicMock

# Add the collaboration-service directory to Python path
collaboration_service_dir = Path(__file__).resolve().parents[1]
if str(collaboration_service_dir) not in sys.path:
    sys.path.insert(0, str(collaboration_service_dir))

# Set AWS region environment variable before any imports
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
os.environ['AWS_REGION'] = 'us-east-1'
# Set COLLABORATION_SERVICE_ENV_VARS to avoid SSM calls during Settings initialization
os.environ['COLLABORATION_SERVICE_ENV_VARS'] = '{}'

# Create mock settings instance for global use
_mock_settings_instance = Mock()
_mock_settings_instance.environment = 'test'
_mock_settings_instance.aws_region = 'us-east-1'
_mock_settings_instance.dynamodb_table_name = 'gg_core'
_mock_settings_instance.log_level = 'DEBUG'
_mock_settings_instance.jwt_secret = 'test-secret-key-for-testing-only'
_mock_settings_instance.jwt_audience = 'goalsguild'
_mock_settings_instance.jwt_issuer = 'goalsguild'
_mock_settings_instance.cognito_region = 'us-east-1'
_mock_settings_instance.cognito_user_pool_id = 'test-pool-id'
_mock_settings_instance.cognito_client_id = 'test-client-id'
_mock_settings_instance.cognito_client_secret = None
_mock_settings_instance.api_gateway_key = None
_mock_settings_instance.rate_limit_requests_per_hour = 1000
_mock_settings_instance.cache_ttl_seconds = 300
_mock_settings_instance.max_invites_per_user_per_hour = 20
_mock_settings_instance.max_comments_per_user_per_hour = 100
_mock_settings_instance.is_development = lambda: True
_mock_settings_instance.is_production = lambda: False
_mock_settings_instance.is_staging = lambda: False

# Create mock SSM client
mock_ssm = Mock()
mock_ssm.get_parameter.side_effect = Exception("Parameter not found")

# Mock boto3.client to return mock SSM
def mock_boto3_client(service_name, **kwargs):
    if service_name == 'ssm':
        return mock_ssm
    return Mock()

# Patch boto3.client before settings module is imported (settings creates _SSM at module level)
# Also patch Settings and get_settings to return our mock instance
_global_patches = {
    'boto3_client': patch('boto3.client', side_effect=mock_boto3_client),
    'settings_ssm': patch('app.settings._SSM', mock_ssm),  # Patch the module-level _SSM
    'settings': patch('app.settings.Settings', return_value=_mock_settings_instance),
    'get_settings': patch('app.settings.get_settings', return_value=_mock_settings_instance),
    'main_settings': patch('app.main.settings', _mock_settings_instance),  # Patch settings in main module
}

# Start patches immediately
for p in _global_patches.values():
    p.start()

# Mock environment variables
@pytest.fixture(autouse=True)
def mock_env():
    """Mock environment variables for all tests."""
    with patch.dict(os.environ, {
        'ENVIRONMENT': 'test',
        'AWS_REGION': 'us-east-1',
        'AWS_DEFAULT_REGION': 'us-east-1',
        'DYNAMODB_TABLE_NAME': 'gg_core',
        'LOG_LEVEL': 'DEBUG',
        'COLLABORATION_SERVICE_ENV_VARS': '{}',  # Provide empty JSON to avoid SSM call
    }):
        yield


@pytest.fixture
def mock_cognito():
    """Mock Cognito user lookup functions."""
    with patch('app.db.invite_db._get_user_by_email') as mock_email, \
         patch('app.db.invite_db._get_user_by_username') as mock_username, \
         patch('app.db.invite_db._get_user_by_id') as mock_id, \
         patch('app.db.collaborator_db._get_user_profile') as mock_profile:
        
        # Default mock implementations
        mock_email.return_value = None
        mock_username.return_value = None
        mock_id.return_value = None
        mock_profile.return_value = None
        
        yield {
            'email': mock_email,
            'username': mock_username,
            'id': mock_id,
            'profile': mock_profile
        }


# Map of identifier (email or nickname) -> user dict for _lookup_invitee (create_invite uses this)
LOOKUP_INVITEE_USERS = {
    'jane@example.com': {'userId': 'user-456', 'username': 'jane_smith', 'email': 'jane@example.com'},
    'bob@example.com': {'userId': 'user-789', 'username': 'bob_wilson', 'email': 'bob@example.com'},
    'bob_wilson': {'userId': 'user-789', 'username': 'bob_wilson', 'email': 'bob@example.com'},
    'jane_smith': {'userId': 'user-456', 'username': 'jane_smith', 'email': 'jane@example.com'},
}


@pytest.fixture
def mock_lookup_invitee():
    """Mock _lookup_invitee so create_invite finds test users by email/nickname."""
    def _lookup(identifier):
        return LOOKUP_INVITEE_USERS.get(identifier)
    with patch('app.db.invite_db._lookup_invitee', side_effect=_lookup):
        yield


@pytest.fixture
def sample_invite_data():
    """Sample invite data for testing."""
    return {
        'inviteId': 'invite-123',
        'inviterId': 'user-123',
        'inviteeId': 'user-456',
        'resourceType': 'goal',
        'resourceId': 'goal-123',
        'status': 'pending',
        'message': 'Join me!',
        'expiresAt': '2024-02-01T00:00:00Z',
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def sample_collaborator_data():
    """Sample collaborator data for testing."""
    return {
        'userId': 'user-456',
        'username': 'jane_smith',
        'email': 'jane@example.com',
        'role': 'collaborator',
        'joinedAt': '2024-01-01T00:00:00Z',
        'lastSeenAt': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'userId': 'user-123',
        'username': 'john_doe',
        'email': 'john@example.com',
        'nickname': 'John Doe'
    }

