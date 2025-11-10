"""
Tests for authentication in subscription service.
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
import jwt
from datetime import datetime, timedelta, timezone


class TestAuthentication:
    """Tests for authentication functionality."""
    
    def test_authenticate_no_header(self, mock_settings):
        """Test authentication fails without Authorization header."""
        from app.main import app
        from app.auth import authenticate
        
        # Clear dependency overrides
        app.dependency_overrides.clear()
        
        client = TestClient(app)
        
        response = client.get("/subscriptions/current")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Authorization header required" in response.json()["detail"]
    
    def test_authenticate_invalid_format(self, mock_settings):
        """Test authentication fails with invalid header format."""
        from app.main import app
        app.dependency_overrides.clear()
        
        client = TestClient(app)
        
        response = client.get(
            "/subscriptions/current",
            headers={"Authorization": "InvalidFormat token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Bearer token" in response.json()["detail"]
    
    def test_authenticate_valid_token(self, mock_settings, test_token):
        """Test authentication succeeds with valid token."""
        from app.main import app
        app.dependency_overrides.clear()
        
        client = TestClient(app)
        
        response = client.get(
            "/subscriptions/current",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        # Should succeed (even if endpoint returns placeholder data)
        assert response.status_code == status.HTTP_200_OK
    
    def test_authenticate_expired_token(self, mock_settings):
        """Test authentication fails with expired token."""
        from app.main import app
        app.dependency_overrides.clear()
        
        # Create expired token
        payload = {
            "sub": "test-user-123",
            "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
            "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
            "aud": "goalsguild",
            "iss": "goalsguild"
        }
        expired_token = jwt.encode(payload, mock_settings.jwt_secret, algorithm="HS256")
        
        client = TestClient(app)
        
        response = client.get(
            "/subscriptions/current",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_authenticate_invalid_secret(self, mock_settings):
        """Test authentication fails with invalid secret."""
        from app.main import app
        app.dependency_overrides.clear()
        
        # Create token with wrong secret
        payload = {
            "sub": "test-user-123",
            "iat": int(datetime.now(timezone.utc).timestamp()),
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            "aud": "goalsguild",
            "iss": "goalsguild"
        }
        wrong_token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        
        client = TestClient(app)
        
        response = client.get(
            "/subscriptions/current",
            headers={"Authorization": f"Bearer {wrong_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_authenticate_missing_sub_claim(self, mock_settings):
        """Test authentication fails with missing sub claim."""
        from app.main import app
        app.dependency_overrides.clear()
        
        # Create token without sub claim
        payload = {
            "iat": int(datetime.now(timezone.utc).timestamp()),
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            "aud": "goalsguild",
            "iss": "goalsguild"
        }
        invalid_token = jwt.encode(payload, mock_settings.jwt_secret, algorithm="HS256")
        
        client = TestClient(app)
        
        response = client.get(
            "/subscriptions/current",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

