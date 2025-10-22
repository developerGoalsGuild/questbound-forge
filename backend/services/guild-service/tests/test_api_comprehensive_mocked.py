"""
Comprehensive API tests with complete mocking to avoid AWS dependencies.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
import sys
import os

# Add the parent directory to the path to import the app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock the Settings class before importing anything else
with patch.dict('os.environ', {
    'JWT_SECRET': 'test-secret',
    'CORE_TABLE_NAME': 'test-core-table',
    'GUILD_TABLE_NAME': 'test-guild-table',
    'AVATAR_BUCKET': 'test-avatar-bucket',
    'AWS_DEFAULT_REGION': 'us-east-1'
}):
    # Mock boto3 before importing settings
    with patch('boto3.client') as mock_boto3:
        mock_ssm = MagicMock()
        mock_ssm.get_parameter.return_value = {'Parameter': {'Value': 'test-value'}}
        mock_ssm.get_parameters_by_path.return_value = {'Parameters': []}
        mock_boto3.return_value = mock_ssm
        
        # Now import the app
        from app.main import app

class TestAPIComprehensiveMocked:
    """Test API endpoints with comprehensive mocking."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_auth_context(self):
        """Mock authentication context."""
        auth_context = MagicMock()
        auth_context.user_id = 'user_123'
        auth_context.username = 'testuser'
        auth_context.claims = {'sub': 'user_123', 'username': 'testuser'}
        auth_context.provider = 'cognito'
        return auth_context
    
    @pytest.fixture
    def mock_guild_response(self):
        """Mock guild response."""
        from app.models.guild import GuildResponse, GuildUserPermissions
        permissions = GuildUserPermissions(
            can_edit=True,
            can_delete=True,
            can_invite=True,
            can_moderate=True
        )
        return GuildResponse(
            guild_id='guild_123',
            name='Test Guild',
            description='A test guild',
            guild_type='public',
            owner_id='user_123',
            created_at='2024-01-01T00:00:00Z',
            updated_at='2024-01-01T00:00:00Z',
            member_count=1,
            is_owner=True,
            user_permissions=permissions,
            members=[],
            settings={}
        )
    
    @pytest.fixture
    def mock_comment_response(self):
        """Mock comment response."""
        from app.models.comment import GuildCommentResponse
        from app.models.guild import GuildMemberRole
        return GuildCommentResponse(
            comment_id='comment_123',
            guild_id='guild_123',
            user_id='user_123',
            username='testuser',
            content='Test comment',
            user_role=GuildMemberRole.MEMBER.value,
            created_at='2024-01-01T00:00:00Z',
            updated_at='2024-01-01T00:00:00Z',
            is_edited=False,
            likes=0
        )
    
    @pytest.fixture
    def mock_analytics_response(self):
        """Mock analytics response."""
        from app.models.analytics import GuildAnalyticsResponse
        return GuildAnalyticsResponse(
            guild_id='guild_123',
            total_members=10,
            total_comments=25,
            goal_completion_rate=0.75,
            quest_completion_rate=0.60,
            activity_score=85.5,
            last_updated='2024-01-01T00:00:00Z',
            member_leaderboard=[],
            recent_activity=[]
        )
    
    @pytest.fixture
    def mock_ranking_response(self):
        """Mock ranking response."""
        from app.models.analytics import GuildRankingResponse
        return GuildRankingResponse(
            guild_id='guild_123',
            name='Test Guild',
            rank=1,
            score=95.5,
            trend='up',
            badges=['top_performer']
        )
    
    @pytest.fixture
    def mock_avatar_upload_response(self):
        """Mock avatar upload response."""
        from app.models.avatar import AvatarUploadResponse
        return AvatarUploadResponse(
            uploadUrl='https://s3.amazonaws.com/test-bucket/upload-key',
            avatarUrl='https://s3.amazonaws.com/test-bucket/avatar-key',
            avatarKey='avatar-key'
        )
    
    @pytest.fixture
    def mock_join_request_response(self):
        """Mock join request response."""
        from app.models.join_request import GuildJoinRequestResponse
        return GuildJoinRequestResponse(
            guild_id='guild_123',
            user_id='user_456',
            username='newuser',
            status='pending',
            requested_at='2024-01-01T00:00:00Z',
            message='I want to join this guild'
        )

    # Guild endpoint tests
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_create_guild, client, mock_auth_context, mock_guild_response):
        """Test create guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_create_guild.return_value = mock_guild_response
        
        response = client.post(
            "/guilds/",
            json={
                "name": "Test Guild",
                "description": "A test guild",
                "guild_type": "public"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["guild_id"] == "guild_123"
        assert data["name"] == "Test Guild"
        mock_create_guild.assert_called_once()
    
    @patch('app.api.guild.get_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_get_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_guild, client, mock_auth_context, mock_guild_response):
        """Test get guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_guild.return_value = mock_guild_response
        
        response = client.get(
            "/guilds/guild_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["guild_id"] == "guild_123"
        assert data["name"] == "Test Guild"
        mock_get_guild.assert_called_once_with("guild_123", mock_auth_context)
    
    @patch('app.api.guild.update_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_update_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_update_guild, client, mock_auth_context, mock_guild_response):
        """Test update guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_update_guild.return_value = mock_guild_response
        
        response = client.put(
            "/guilds/guild_123",
            json={
                "name": "Updated Guild",
                "description": "An updated guild"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["guild_id"] == "guild_123"
        mock_update_guild.assert_called_once()
    
    @patch('app.api.guild.delete_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_delete_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_delete_guild, client, mock_auth_context):
        """Test delete guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_delete_guild.return_value = True
        
        response = client.delete(
            "/guilds/guild_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Guild deleted successfully"
        mock_delete_guild.assert_called_once_with("guild_123", mock_auth_context)
    
    @patch('app.api.guild.list_guilds')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_list_guilds_endpoint(self, mock_rate_limit, mock_authenticate, mock_list_guilds, client, mock_auth_context):
        """Test list guilds endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_list_guilds.return_value = {
            "guilds": [],
            "total": 0,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "guilds" in data
        mock_list_guilds.assert_called_once()
    
    @patch('app.api.guild.join_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_join_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_join_guild, client, mock_auth_context):
        """Test join guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_join_guild.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully joined guild"
        mock_join_guild.assert_called_once_with("guild_123", mock_auth_context)
    
    @patch('app.api.guild.leave_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_leave_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_leave_guild, client, mock_auth_context):
        """Test leave guild endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_leave_guild.return_value = True
        
        response = client.post(
            "/guilds/guild_123/leave",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully left guild"
        mock_leave_guild.assert_called_once_with("guild_123", mock_auth_context)
    
    # Comments endpoint tests
    @patch('app.api.comments.create_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_create_comment, client, mock_auth_context, mock_comment_response):
        """Test create comment endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_create_comment.return_value = mock_comment_response
        
        response = client.post(
            "/guilds/guild_123/comments",
            json={
                "content": "Test comment"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["comment_id"] == "comment_123"
        assert data["content"] == "Test comment"
        mock_create_comment.assert_called_once()
    
    @patch('app.api.comments.get_comments')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_get_comments_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_comments, client, mock_auth_context):
        """Test get comments endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_comments.return_value = {
            "comments": [],
            "total": 0,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/guild_123/comments",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "comments" in data
        mock_get_comments.assert_called_once()
    
    @patch('app.api.comments.delete_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_delete_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_delete_comment, client, mock_auth_context):
        """Test delete comment endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_delete_comment.return_value = True
        
        response = client.delete(
            "/guilds/guild_123/comments/comment_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Comment deleted successfully"
        mock_delete_comment.assert_called_once()
    
    @patch('app.api.comments.like_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_like_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_like_comment, client, mock_auth_context):
        """Test like comment endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_like_comment.return_value = True
        
        response = client.post(
            "/guilds/guild_123/comments/comment_123/like",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Comment liked successfully"
        mock_like_comment.assert_called_once()
    
    # Analytics endpoint tests
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_analytics, client, mock_auth_context, mock_analytics_response):
        """Test get guild analytics endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_analytics.return_value = mock_analytics_response
        
        response = client.get(
            "/guilds/guild_123/analytics",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["guild_id"] == "guild_123"
        assert data["total_members"] == 10
        mock_get_analytics.assert_called_once_with("guild_123", auth_context=mock_auth_context)
    
    @patch('app.api.analytics.get_guild_rankings')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_rankings_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_rankings, client, mock_auth_context):
        """Test get guild rankings endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_rankings.return_value = {
            "rankings": [],
            "total": 0,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/rankings",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rankings" in data
        mock_get_rankings.assert_called_once()
    
    # Moderation endpoint tests
    @patch('app.api.moderation.get_join_requests')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_get_join_requests_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_requests, client, mock_auth_context):
        """Test get join requests endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_requests.return_value = {
            "requests": [],
            "total": 0,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/guild_123/join-requests",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        mock_get_requests.assert_called_once()
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint(self, mock_rate_limit, mock_authenticate, mock_approve_request, client, mock_auth_context):
        """Test approve join request endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_approve_request.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/approve",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Join request approved successfully"
        mock_approve_request.assert_called_once()
    
    @patch('app.api.moderation.reject_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_reject_join_request_endpoint(self, mock_rate_limit, mock_authenticate, mock_reject_request, client, mock_auth_context):
        """Test reject join request endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_reject_request.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/reject",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Join request rejected successfully"
        mock_reject_request.assert_called_once()
    
    # Avatar endpoint tests
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_upload_url_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_upload_url, client, mock_auth_context, mock_avatar_upload_response):
        """Test get upload URL endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_upload_url.return_value = mock_avatar_upload_response
        
        response = client.post(
            "/guilds/guild_123/avatar/upload-url",
            json={
                "file_type": "image/jpeg"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "uploadUrl" in data
        mock_get_upload_url.assert_called_once()
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_confirm_avatar_upload_endpoint(self, mock_rate_limit, mock_authenticate, mock_confirm_upload, client, mock_auth_context):
        """Test confirm avatar upload endpoint."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_confirm_upload.return_value = True
        
        response = client.post(
            "/guilds/guild_123/avatar/confirm",
            json={
                "avatar_key": "avatar-key"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Avatar uploaded successfully"
        mock_confirm_upload.assert_called_once()
    
    # Error handling tests
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_guild, client, mock_auth_context):
        """Test create guild endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_create_guild.side_effect = GuildDBError("Database error")
        
        response = client.post(
            "/guilds/",
            json={
                "name": "Test Guild",
                "description": "A test guild",
                "guild_type": "public"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "Database error" in data["detail"]
    
    @patch('app.api.comments.create_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_comment, client, mock_auth_context):
        """Test create comment endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_create_comment.side_effect = GuildDBError("Database error")
        
        response = client.post(
            "/guilds/guild_123/comments",
            json={
                "content": "Test comment"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "Database error" in data["detail"]
    
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_get_analytics, client, mock_auth_context):
        """Test get guild analytics endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_get_analytics.side_effect = GuildDBError("Database error")
        
        response = client.get(
            "/guilds/guild_123/analytics",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "Database error" in data["detail"]
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_approve_request, client, mock_auth_context):
        """Test approve join request endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildNotFoundError
        mock_approve_request.side_effect = GuildNotFoundError("Join request not found")
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/approve",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "Join request not found" in data["detail"]
