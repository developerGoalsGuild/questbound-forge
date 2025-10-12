"""
Pytest configuration for collaboration service tests.
"""

import pytest
import os
import sys
from unittest.mock import patch

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

# Mock environment variables
@pytest.fixture(autouse=True)
def mock_env():
    """Mock environment variables for all tests."""
    with patch.dict(os.environ, {
        'ENVIRONMENT': 'test',
        'AWS_REGION': 'us-east-1',
        'DYNAMODB_TABLE_NAME': 'gg_core',
        'LOG_LEVEL': 'DEBUG'
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

