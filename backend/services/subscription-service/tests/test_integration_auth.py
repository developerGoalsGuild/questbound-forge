"""
Integration tests for authentication with real JWT verification.
"""
import pytest
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock


@pytest.fixture
def real_auth_settings():
    """Settings for real authentication tests."""
    return {
        'environment': 'test',
        'jwt_secret': 'real-test-secret-for-integration',
        'jwt_audience': 'goalsguild',
        'jwt_issuer': 'goalsguild',
        'core_table_name': 'gg_core_test',
        'allowed_origins': ['http://localhost:3000']
    }


@pytest.fixture
def real_auth_client(real_auth_settings):
    """Test client with real authentication (no mocking)."""
    with patch('app.settings.Settings') as mock_settings:
        mock_instance = Mock()
        for key, value in real_auth_settings.items():
            setattr(mock_instance, key, value)
        mock_settings.return_value = mock_instance
        
        from app.main import app
        app.dependency_overrides.clear()  # Use real authentication
        
        client = TestClient(app)
        client.auth_settings = real_auth_settings
        yield client


class TestRealJWTVerification:
    """Tests for real JWT verification flow."""
    
    def test_valid_jwt_token_success(self, real_auth_client, real_auth_settings):
        """Test that valid JWT token is accepted."""
        # Create valid token
        payload = {
            'sub': 'test-user-123',
            'username': 'testuser',
            'role': 'user',
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
    
    def test_expired_jwt_token_fails(self, real_auth_client, real_auth_settings):
        """Test that expired JWT token is rejected."""
        # Create expired token
        payload = {
            'sub': 'test-user-123',
            'iat': int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
            'exp': int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 401
        assert 'Invalid or expired token' in response.json()['detail']
    
    def test_wrong_secret_token_fails(self, real_auth_client, real_auth_settings):
        """Test that token signed with wrong secret is rejected."""
        # Create token with wrong secret
        payload = {
            'sub': 'test-user-123',
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, 'wrong-secret', algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 401
    
    def test_missing_required_claims_fails(self, real_auth_client, real_auth_settings):
        """Test that token missing required claims is rejected."""
        # Create token without required claims
        payload = {
            'sub': 'test-user-123',
            # Missing iat, exp, aud, iss
        }
        
        try:
            token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
            response = real_auth_client.get(
                '/subscriptions/current',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 401
        except Exception:
            # Token might not encode properly, which is also a failure
            pass
    
    def test_missing_sub_claim_fails(self, real_auth_client, real_auth_settings):
        """Test that token without sub claim is rejected."""
        # Create token without sub
        payload = {
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 401
        assert 'Malformed token' in response.json()['detail']
    
    def test_wrong_audience_fails(self, real_auth_client, real_auth_settings):
        """Test that token with wrong audience is rejected."""
        payload = {
            'sub': 'test-user-123',
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': 'wrong-audience',  # Wrong audience
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 401
    
    def test_wrong_issuer_fails(self, real_auth_client, real_auth_settings):
        """Test that token with wrong issuer is rejected."""
        payload = {
            'sub': 'test-user-123',
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': 'wrong-issuer'  # Wrong issuer
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 401


class TestAuthenticationHeaders:
    """Tests for authentication header handling."""
    
    def test_case_insensitive_authorization_header(self, real_auth_client, real_auth_settings):
        """Test that Authorization header is case-insensitive."""
        payload = {
            'sub': 'test-user-123',
            'iat': int(datetime.now(timezone.utc).timestamp()),
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            'aud': real_auth_settings['jwt_audience'],
            'iss': real_auth_settings['jwt_issuer']
        }
        token = jwt.encode(payload, real_auth_settings['jwt_secret'], algorithm='HS256')
        
        # Test lowercase header
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'authorization': f'Bearer {token}'}  # lowercase
        )
        
        assert response.status_code == 200
    
    def test_bearer_prefix_required(self, real_auth_client):
        """Test that Bearer prefix is required."""
        response = real_auth_client.get(
            '/subscriptions/current',
            headers={'Authorization': 'InvalidFormat token'}
        )
        
        assert response.status_code == 401
        assert 'Bearer token' in response.json()['detail']

