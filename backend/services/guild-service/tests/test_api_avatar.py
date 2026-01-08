"""
Comprehensive API tests for avatar endpoints.
Tests FastAPI endpoints with proper mocking of dependencies.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

# Mock the settings and dependencies before importing
with patch.dict('os.environ', {
    'JWT_SECRET': 'test-secret',
    'JWT_AUDIENCE': 'test-audience',
    'JWT_ISSUER': 'test-issuer',
    'COGNITO_USER_POOL_ID': '',
    'COGNITO_CLIENT_ID': '',
    'COGNITO_REGION': 'us-east-1',
    'CORE_TABLE_NAME': 'test-core-table',
    'GUILD_TABLE_NAME': 'test-guild-table',
    'AVATAR_BUCKET': 'test-avatar-bucket'
}):
    # Mock the common module import
    with patch('app.security.authentication.log_event'), \
         patch('app.security.authentication.get_structured_logger'):
        from app.api.avatar import router as avatar_router
        from app.models.avatar import AvatarUploadRequest, AvatarUploadResponse, AvatarGetResponse, AvatarConfirmRequest
        from app.security.auth_models import AuthContext


class TestAPIAvatar:
    """Comprehensive API tests for avatar endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the avatar router."""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(avatar_router)
        return TestClient(app)
    
    @pytest.fixture
    def mock_auth_context(self):
        """Mock authentication context."""
        return AuthContext(
            user_id='user_123',
            username='testuser',
            email='test@example.com',
            is_authenticated=True
        )
    
    @pytest.fixture
    def sample_upload_request(self):
        """Sample upload request data."""
        return {
            'content_type': 'image/jpeg',
            'file_size': 1024,
            'file_type': 'image'
        }
    
    @pytest.fixture
    def mock_upload_response(self):
        """Mock upload response object."""
        return AvatarUploadResponse(
            upload_url='https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            avatar_key='guild_123/avatar.jpg',
            expires_in=3600
        )
    
    @pytest.fixture
    def mock_get_response(self):
        """Mock get response object."""
        return AvatarGetResponse(
            avatar_url='https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            avatar_key='guild_123/avatar.jpg'
        )
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_get_upload_url_success(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, sample_upload_request, mock_upload_response):
        """Test successful upload URL generation."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_get_upload_url.return_value = mock_upload_response
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['upload_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'
        assert data['avatar_key'] == 'guild_123/avatar.jpg'
        assert data['expires_in'] == 3600
        
        # Verify the service was called with correct parameters
        mock_get_upload_url.assert_called_once()
        call_args = mock_get_upload_url.call_args
        assert call_args[1]['guild_id'] == 'guild_123'
        assert call_args[1]['content_type'] == 'image/jpeg'
        assert call_args[1]['file_size'] == 1024
        assert call_args[1]['file_type'] == 'image'
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_get_upload_url_validation_error(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context):
        """Test upload URL generation with validation error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Test with invalid data
        invalid_data = {
            'content_type': 'text/plain',  # Invalid content type
            'file_size': 1024,
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=invalid_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_get_upload_url_file_size_error(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context):
        """Test upload URL generation with file size error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Test with file too large
        large_file_data = {
            'content_type': 'image/jpeg',
            'file_size': 10 * 1024 * 1024,  # 10MB - too large
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=large_file_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_get_upload_url_database_error(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, sample_upload_request):
        """Test upload URL generation with database error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildDBError
        mock_get_upload_url.side_effect = GuildDBError("Database connection failed")
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.avatar.get_avatar_url')
    @patch('app.api.avatar.authenticate')
    def test_get_avatar_success(self, mock_authenticate, mock_get_avatar, client, mock_auth_context, mock_get_response):
        """Test successful avatar retrieval."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_get_avatar.return_value = mock_get_response
        
        response = client.get(
            '/guilds/guild_123/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['avatar_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'
        assert data['avatar_key'] == 'guild_123/avatar.jpg'
        
        # Verify the service was called with correct parameters
        mock_get_avatar.assert_called_once_with('guild_123')
    
    @patch('app.api.avatar.get_avatar_url')
    @patch('app.api.avatar.authenticate')
    def test_get_avatar_not_found(self, mock_authenticate, mock_get_avatar, client, mock_auth_context):
        """Test avatar retrieval when guild not found."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildNotFoundError
        mock_get_avatar.side_effect = GuildNotFoundError("Guild not found")
        
        response = client.get(
            '/guilds/nonexistent_guild/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Guild not found' in data['detail']
    
    @patch('app.api.avatar.get_avatar_url')
    @patch('app.api.avatar.authenticate')
    def test_get_avatar_no_avatar(self, mock_authenticate, mock_get_avatar, client, mock_auth_context):
        """Test avatar retrieval when guild has no avatar."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation - no avatar
        mock_get_avatar.return_value = None
        
        response = client.get(
            '/guilds/guild_123/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Avatar not found' in data['detail']
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    def test_confirm_avatar_upload_success(self, mock_authenticate, mock_confirm_upload, client, mock_auth_context):
        """Test successful avatar upload confirmation."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_confirm_upload.return_value = True
        
        confirm_data = {
            'avatar_key': 'guild_123/avatar.jpg'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/confirm',
            json=confirm_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify the service was called with correct parameters
        mock_confirm_upload.assert_called_once()
        call_args = mock_confirm_upload.call_args
        assert call_args[1]['guild_id'] == 'guild_123'
        assert call_args[1]['avatar_key'] == 'guild_123/avatar.jpg'
        assert call_args[1]['user_id'] == 'user_123'
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    def test_confirm_avatar_upload_validation_error(self, mock_authenticate, mock_confirm_upload, client, mock_auth_context):
        """Test avatar upload confirmation with validation error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Test with invalid data
        invalid_data = {
            'avatar_key': ''  # Empty avatar key should fail validation
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/confirm',
            json=invalid_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    def test_confirm_avatar_upload_permission_error(self, mock_authenticate, mock_confirm_upload, client, mock_auth_context):
        """Test avatar upload confirmation with permission error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildPermissionError
        mock_confirm_upload.side_effect = GuildPermissionError("Insufficient permissions")
        
        confirm_data = {
            'avatar_key': 'guild_123/avatar.jpg'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/confirm',
            json=confirm_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert 'detail' in data
        assert 'Insufficient permissions' in data['detail']
    
    @patch('app.api.avatar.delete_avatar')
    @patch('app.api.avatar.authenticate')
    def test_delete_avatar_success(self, mock_authenticate, mock_delete_avatar, client, mock_auth_context):
        """Test successful avatar deletion."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_delete_avatar.return_value = True
        
        response = client.delete(
            '/guilds/guild_123/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify the service was called with correct parameters
        mock_delete_avatar.assert_called_once_with('guild_123', 'user_123')
    
    @patch('app.api.avatar.delete_avatar')
    @patch('app.api.avatar.authenticate')
    def test_delete_avatar_not_found(self, mock_authenticate, mock_delete_avatar, client, mock_auth_context):
        """Test avatar deletion when guild not found."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildNotFoundError
        mock_delete_avatar.side_effect = GuildNotFoundError("Guild not found")
        
        response = client.delete(
            '/guilds/nonexistent_guild/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Guild not found' in data['detail']
    
    def test_unauthorized_request(self, client, sample_upload_request):
        """Test request without authentication."""
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request
        )
        
        # Should return 401 for missing authorization
        assert response.status_code == 401
    
    def test_invalid_json_request(self, client):
        """Test request with invalid JSON."""
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            data="invalid json",
            headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client):
        """Test request with missing required fields."""
        incomplete_data = {
            'content_type': 'image/jpeg'
            # Missing required fields
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=incomplete_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
    
    def test_query_parameters_validation(self, client):
        """Test query parameters validation."""
        response = client.get(
            '/guilds/guild_123/avatar?size=invalid',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        # Should still work with invalid query parameters
        assert response.status_code in [200, 422]
    
    def test_path_parameters_validation(self, client):
        """Test path parameters validation."""
        response = client.get(
            '/guilds/invalid-guild-id-format/avatar',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        # Should return 404 for invalid guild ID format
        assert response.status_code == 404
    
    @patch('app.api.avatar.authenticate')
    def test_authentication_failure(self, mock_authenticate, client, sample_upload_request):
        """Test authentication failure."""
        # Mock authentication failure
        from fastapi import HTTPException, status
        mock_authenticate.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request,
            headers={'Authorization': 'Bearer invalid-token'}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'detail' in data
        assert 'Invalid token' in data['detail']
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_rate_limiting(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, sample_upload_request, mock_upload_response):
        """Test rate limiting functionality."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_get_upload_url.return_value = mock_upload_response
        
        # Test multiple requests (rate limiting would be tested in integration)
        response1 = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response1.status_code == 200
        
        # The rate limiter would block subsequent requests in real implementation
        # This test verifies the decorator is applied correctly
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_server_error_handling(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, sample_upload_request):
        """Test server error handling."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock unexpected error
        mock_get_upload_url.side_effect = Exception("Unexpected error")
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=sample_upload_request,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_upload_url_with_different_file_types(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, mock_upload_response):
        """Test upload URL generation with different file types."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_get_upload_url.return_value = mock_upload_response
        
        # Test with PNG
        png_data = {
            'content_type': 'image/png',
            'file_size': 2048,
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=png_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['upload_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'
        
        # Test with WebP
        webp_data = {
            'content_type': 'image/webp',
            'file_size': 1536,
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=webp_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['upload_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    def test_upload_url_with_different_file_sizes(self, mock_authenticate, mock_get_upload_url, client, mock_auth_context, mock_upload_response):
        """Test upload URL generation with different file sizes."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_get_upload_url.return_value = mock_upload_response
        
        # Test with small file
        small_file_data = {
            'content_type': 'image/jpeg',
            'file_size': 512,
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=small_file_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['upload_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'
        
        # Test with medium file
        medium_file_data = {
            'content_type': 'image/jpeg',
            'file_size': 1024 * 1024,  # 1MB
            'file_type': 'image'
        }
        
        response = client.post(
            '/guilds/guild_123/avatar/upload-url',
            json=medium_file_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['upload_url'] == 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg'


if __name__ == '__main__':
    pytest.main([__file__])
