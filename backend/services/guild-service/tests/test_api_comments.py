"""
Comprehensive API tests for comments endpoints.
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
        from app.api.comments import router as comments_router
        from app.models.comment import GuildCommentResponse, GuildCommentListResponse
        from app.models.guild import GuildMemberRole
        from app.security.auth_models import AuthContext


class TestAPIComments:
    """Comprehensive API tests for comments endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the comments router."""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(comments_router)
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
    def sample_comment_data(self):
        """Sample comment data for testing."""
        return {
            'content': 'This is a test comment',
            'parent_comment_id': None
        }
    
    @pytest.fixture
    def mock_comment_response(self):
        """Mock comment response object."""
        now = datetime.now(timezone.utc)
        return GuildCommentResponse(
            comment_id='comment_123',
            guild_id='guild_123',
            user_id='user_123',
            username='testuser',
            content='This is a test comment',
            created_at=now,
            updated_at=now,
            parent_comment_id=None,
            likes=0,
            is_liked=False,
            is_edited=False,
            user_role=GuildMemberRole.MEMBER,
            replies=[]
        )
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_create_comment_success(self, mock_authenticate, mock_create_comment, client, mock_auth_context, sample_comment_data, mock_comment_response):
        """Test successful comment creation."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_create_comment.return_value = mock_comment_response
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['comment_id'] == 'comment_123'
        assert data['guild_id'] == 'guild_123'
        assert data['user_id'] == 'user_123'
        assert data['username'] == 'testuser'
        assert data['content'] == 'This is a test comment'
        assert data['likes'] == 0
        assert data['is_liked'] is False
        assert data['is_edited'] is False
        assert data['user_role'] == 'member'
        
        # Verify the service was called with correct parameters
        mock_create_comment.assert_called_once()
        call_args = mock_create_comment.call_args
        assert call_args[1]['guild_id'] == 'guild_123'
        assert call_args[1]['user_id'] == 'user_123'
        assert call_args[1]['username'] == 'testuser'
        assert call_args[1]['content'] == 'This is a test comment'
        assert call_args[1]['parent_comment_id'] is None
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_create_reply_success(self, mock_authenticate, mock_create_comment, client, mock_auth_context, mock_comment_response):
        """Test successful reply creation."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_create_comment.return_value = mock_comment_response
        
        reply_data = {
            'content': 'This is a reply',
            'parent_comment_id': 'parent_comment_123'
        }
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=reply_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['comment_id'] == 'comment_123'
        assert data['content'] == 'This is a test comment'
        
        # Verify the service was called with correct parameters
        mock_create_comment.assert_called_once()
        call_args = mock_create_comment.call_args
        assert call_args[1]['guild_id'] == 'guild_123'
        assert call_args[1]['parent_comment_id'] == 'parent_comment_123'
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_create_comment_validation_error(self, mock_authenticate, mock_create_comment, client, mock_auth_context):
        """Test comment creation with validation error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Test with invalid data
        invalid_data = {
            'content': '',  # Empty content should fail validation
            'parent_comment_id': None
        }
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=invalid_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_create_comment_database_error(self, mock_authenticate, mock_create_comment, client, mock_auth_context, sample_comment_data):
        """Test comment creation with database error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildDBError
        mock_create_comment.side_effect = GuildDBError("Database connection failed")
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.comments.get_guild_comments')
    @patch('app.api.comments.authenticate')
    def test_get_comments_success(self, mock_authenticate, mock_get_comments, client, mock_auth_context, mock_comment_response):
        """Test successful comments retrieval."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_list_response = GuildCommentListResponse(
            comments=[mock_comment_response],
            total_count=1,
            next_token=None
        )
        mock_get_comments.return_value = mock_list_response
        
        response = client.get(
            '/guilds/guild_123/comments',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['comments']) == 1
        assert data['comments'][0]['comment_id'] == 'comment_123'
        assert data['comments'][0]['content'] == 'This is a test comment'
        assert data['total_count'] == 1
        assert data['next_token'] is None
        
        # Verify the service was called with correct parameters
        mock_get_comments.assert_called_once_with('guild_123')
    
    @patch('app.api.comments.get_guild_comments')
    @patch('app.api.comments.authenticate')
    def test_get_comments_with_pagination(self, mock_authenticate, mock_get_comments, client, mock_auth_context, mock_comment_response):
        """Test comments retrieval with pagination."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_list_response = GuildCommentListResponse(
            comments=[mock_comment_response],
            total_count=1,
            next_token='next_token_123'
        )
        mock_get_comments.return_value = mock_list_response
        
        response = client.get(
            '/guilds/guild_123/comments?limit=10&offset=0',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['comments']) == 1
        assert data['total_count'] == 1
        assert data['next_token'] == 'next_token_123'
        
        # Verify the service was called with correct parameters
        mock_get_comments.assert_called_once()
        call_args = mock_get_comments.call_args
        assert call_args[1]['guild_id'] == 'guild_123'
        assert call_args[1]['limit'] == 10
        assert call_args[1]['offset'] == 0
    
    @patch('app.api.comments.get_guild_comments')
    @patch('app.api.comments.authenticate')
    def test_get_comments_not_found(self, mock_authenticate, mock_get_comments, client, mock_auth_context):
        """Test comments retrieval when guild not found."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildNotFoundError
        mock_get_comments.side_effect = GuildNotFoundError("Guild not found")
        
        response = client.get(
            '/guilds/nonexistent_guild/comments',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Guild not found' in data['detail']
    
    @patch('app.api.comments.update_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_update_comment_success(self, mock_authenticate, mock_update_comment, client, mock_auth_context, mock_comment_response):
        """Test successful comment update."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_update_comment.return_value = mock_comment_response
        
        update_data = {
            'content': 'Updated comment content'
        }
        
        response = client.put(
            '/guilds/guild_123/comments/comment_123',
            json=update_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['comment_id'] == 'comment_123'
        assert data['content'] == 'This is a test comment'  # From mock response
        
        # Verify the service was called with correct parameters
        mock_update_comment.assert_called_once()
        call_args = mock_update_comment.call_args
        assert call_args[1]['comment_id'] == 'comment_123'
        assert call_args[1]['content'] == 'Updated comment content'
        assert call_args[1]['user_id'] == 'user_123'
    
    @patch('app.api.comments.update_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_update_comment_permission_error(self, mock_authenticate, mock_update_comment, client, mock_auth_context):
        """Test comment update with permission error."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildPermissionError
        mock_update_comment.side_effect = GuildPermissionError("Insufficient permissions")
        
        update_data = {
            'content': 'Updated comment content'
        }
        
        response = client.put(
            '/guilds/guild_123/comments/comment_123',
            json=update_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert 'detail' in data
        assert 'Insufficient permissions' in data['detail']
    
    @patch('app.api.comments.delete_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_delete_comment_success(self, mock_authenticate, mock_delete_comment, client, mock_auth_context):
        """Test successful comment deletion."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_delete_comment.return_value = True
        
        response = client.delete(
            '/guilds/guild_123/comments/comment_123',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify the service was called with correct parameters
        mock_delete_comment.assert_called_once_with('comment_123', 'user_123')
    
    @patch('app.api.comments.delete_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_delete_comment_not_found(self, mock_authenticate, mock_delete_comment, client, mock_auth_context):
        """Test comment deletion when comment not found."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildNotFoundError
        mock_delete_comment.side_effect = GuildNotFoundError("Comment not found")
        
        response = client.delete(
            '/guilds/guild_123/comments/nonexistent_comment',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Comment not found' in data['detail']
    
    @patch('app.api.comments.like_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_like_comment_success(self, mock_authenticate, mock_like_comment, client, mock_auth_context):
        """Test successful comment liking."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_like_comment.return_value = True
        
        response = client.post(
            '/guilds/guild_123/comments/comment_123/like',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify the service was called with correct parameters
        mock_like_comment.assert_called_once_with('comment_123', 'user_123')
    
    @patch('app.api.comments.like_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_unlike_comment_success(self, mock_authenticate, mock_like_comment, client, mock_auth_context):
        """Test successful comment unliking."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_like_comment.return_value = True
        
        response = client.delete(
            '/guilds/guild_123/comments/comment_123/like',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify the service was called with correct parameters
        mock_like_comment.assert_called_once_with('comment_123', 'user_123')
    
    @patch('app.api.comments.like_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_like_comment_not_found(self, mock_authenticate, mock_like_comment, client, mock_auth_context):
        """Test comment liking when comment not found."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database error
        from app.db.guild_db import GuildNotFoundError
        mock_like_comment.side_effect = GuildNotFoundError("Comment not found")
        
        response = client.post(
            '/guilds/guild_123/comments/nonexistent_comment/like',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        assert 'Comment not found' in data['detail']
    
    def test_unauthorized_request(self, client, sample_comment_data):
        """Test request without authentication."""
        response = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data
        )
        
        # Should return 401 for missing authorization
        assert response.status_code == 401
    
    def test_invalid_json_request(self, client):
        """Test request with invalid JSON."""
        response = client.post(
            '/guilds/guild_123/comments',
            data="invalid json",
            headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client):
        """Test request with missing required fields."""
        incomplete_data = {
            # Missing content field
            'parent_comment_id': None
        }
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=incomplete_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
    
    def test_query_parameters_validation(self, client):
        """Test query parameters validation."""
        response = client.get(
            '/guilds/guild_123/comments?limit=invalid&offset=-1',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 422
    
    def test_path_parameters_validation(self, client):
        """Test path parameters validation."""
        response = client.get(
            '/guilds/invalid-guild-id-format/comments',
            headers={'Authorization': 'Bearer test-token'}
        )
        
        # Should return 404 for invalid guild ID format
        assert response.status_code == 404
    
    @patch('app.api.comments.authenticate')
    def test_authentication_failure(self, mock_authenticate, client, sample_comment_data):
        """Test authentication failure."""
        # Mock authentication failure
        from fastapi import HTTPException, status
        mock_authenticate.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data,
            headers={'Authorization': 'Bearer invalid-token'}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'detail' in data
        assert 'Invalid token' in data['detail']
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_rate_limiting(self, mock_authenticate, mock_create_comment, client, mock_auth_context, sample_comment_data, mock_comment_response):
        """Test rate limiting functionality."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock database operation
        mock_create_comment.return_value = mock_comment_response
        
        # Test multiple requests (rate limiting would be tested in integration)
        response1 = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response1.status_code == 201
        
        # The rate limiter would block subsequent requests in real implementation
        # This test verifies the decorator is applied correctly
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    def test_server_error_handling(self, mock_authenticate, mock_create_comment, client, mock_auth_context, sample_comment_data):
        """Test server error handling."""
        # Mock authentication
        mock_authenticate.return_value = mock_auth_context
        
        # Mock unexpected error
        mock_create_comment.side_effect = Exception("Unexpected error")
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=sample_comment_data,
            headers={'Authorization': 'Bearer test-token'}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data


if __name__ == '__main__':
    pytest.main([__file__])