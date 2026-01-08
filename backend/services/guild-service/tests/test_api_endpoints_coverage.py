"""
Test FastAPI endpoints directly to improve coverage.
Tests the actual FastAPI endpoints using TestClient.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

# Mock the common module functions before any imports
import sys
sys.modules['common'] = MagicMock()
sys.modules['common.logging'] = MagicMock()
sys.modules['common.logging'].log_event = MagicMock(return_value=None)
sys.modules['common.logging'].get_structured_logger = MagicMock(return_value=MagicMock())

# Mock the settings and dependencies
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
    # Import the main app and API modules
    from app.main import app
    from app.models.guild import GuildType, GuildSettings, GuildResponse, GuildListResponse
    from app.models.comment import GuildCommentResponse, GuildCommentListResponse
    from app.models.analytics import GuildAnalyticsResponse, GuildRankingResponse
    from app.models.join_request import GuildJoinRequestResponse, JoinRequestStatus
    from app.models.avatar import AvatarUploadRequest, AvatarUploadResponse, AvatarGetResponse, AvatarConfirmRequest


class TestAPIEndpointsCoverage:
    """Test FastAPI endpoints directly to improve coverage."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_guild_response(self):
        """Mock guild response object."""
        now = datetime.now(timezone.utc)
        return {
            'guild_id': 'guild_123',
            'name': 'Test Guild',
            'description': 'A test guild',
            'guild_type': 'public',
            'created_by': 'user_123',
            'member_count': 1,
            'goal_count': 0,
            'quest_count': 0,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'settings': {},
            'moderators': [],
            'pending_requests': 0,
            'avatar_url': None,
            'position': None,
            'previous_position': None,
            'total_score': 0,
            'activity_score': 0,
            'growth_rate': 0.0,
            'badges': [],
            'members': [],
            'user_permissions': {}
        }
    
    @pytest.fixture
    def mock_comment_response(self):
        """Mock comment response object."""
        now = datetime.now(timezone.utc)
        return {
            'comment_id': 'comment_123',
            'guild_id': 'guild_123',
            'user_id': 'user_123',
            'username': 'testuser',
            'content': 'Test comment',
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'parent_comment_id': None,
            'likes': 0,
            'is_liked': False,
            'is_edited': False,
            'user_role': 'member',
            'replies': []
        }
    
    @pytest.fixture
    def mock_analytics_response(self):
        """Mock analytics response object."""
        now = datetime.now(timezone.utc)
        return {
            'guild_id': 'guild_123',
            'total_members': 10,
            'active_members': 8,
            'total_goals': 25,
            'completed_goals': 15,
            'total_quests': 12,
            'completed_quests': 8,
            'total_comments': 50,
            'weekly_activity': 5,
            'monthly_activity': 20,
            'goal_completion_rate': 0.6,
            'quest_completion_rate': 0.67,
            'member_growth_rate': 0.15,
            'goal_growth_rate': 0.25,
            'quest_growth_rate': 0.3,
            'activity_score': 85,
            'top_performers': 3,
            'new_members_this_week': 2,
            'goals_created_this_week': 5,
            'quests_completed_this_week': 3,
            'created_at': now.isoformat(),
            'last_updated': now.isoformat(),
            'member_leaderboard': []
        }
    
    @pytest.fixture
    def mock_ranking_response(self):
        """Mock ranking response object."""
        now = datetime.now(timezone.utc)
        return {
            'guild_id': 'guild_123',
            'name': 'Test Guild',
            'position': 1,
            'previous_position': 2,
            'total_score': 1000,
            'member_count': 50,
            'goal_count': 100,
            'quest_count': 25,
            'activity_score': 95,
            'growth_rate': 0.2,
            'trend': 'up',
            'badges': ['top_performer'],
            'calculated_at': now.isoformat()
        }
    
    @pytest.fixture
    def mock_join_request_response(self):
        """Mock join request response object."""
        now = datetime.now(timezone.utc)
        return {
            'request_id': 'request_123',
            'guild_id': 'guild_123',
            'user_id': 'user_456',
            'username': 'requesting_user',
            'status': 'pending',
            'requested_at': now.isoformat()
        }
    
    @pytest.fixture
    def mock_avatar_upload_response(self):
        """Mock avatar upload response object."""
        return {
            'uploadUrl': 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            'avatarUrl': 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            'avatarKey': 'guild_123/avatar.jpg',
            'expires_in': 3600
        }
    
    @pytest.fixture
    def mock_avatar_get_response(self):
        """Mock avatar get response object."""
        return {
            'avatar_url': 'https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            'avatar_key': 'guild_123/avatar.jpg'
        }
    
    # Test Guild Endpoints
    
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_create_guild, client, mock_guild_response):
        """Test create guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
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
        assert response.json()["guild_id"] == "guild_123"
        mock_create_guild.assert_called_once()
    
    @patch('app.api.guild.get_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_get_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_guild, client, mock_guild_response):
        """Test get guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_guild.return_value = mock_guild_response
        
        response = client.get(
            "/guilds/guild_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["guild_id"] == "guild_123"
        mock_get_guild.assert_called_once_with("guild_123")
    
    @patch('app.api.guild.update_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_update_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_update_guild, client, mock_guild_response):
        """Test update guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
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
        assert response.json()["guild_id"] == "guild_123"
        mock_update_guild.assert_called_once()
    
    @patch('app.api.guild.delete_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_delete_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_delete_guild, client):
        """Test delete guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_delete_guild.return_value = True
        
        response = client.delete(
            "/guilds/guild_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_delete_guild.assert_called_once_with("guild_123", "user_123")
    
    @patch('app.api.guild.list_guilds')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_list_guilds_endpoint(self, mock_rate_limit, mock_authenticate, mock_list_guilds, client, mock_guild_response):
        """Test list guilds endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_list_guilds.return_value = {
            "guilds": [mock_guild_response],
            "total_count": 1,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()["guilds"]) == 1
        mock_list_guilds.assert_called_once()
    
    @patch('app.api.guild.join_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_join_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_join_guild, client):
        """Test join guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_join_guild.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_join_guild.assert_called_once_with("guild_123", "user_123")
    
    @patch('app.api.guild.leave_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_leave_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_leave_guild, client):
        """Test leave guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_leave_guild.return_value = True
        
        response = client.post(
            "/guilds/guild_123/leave",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_leave_guild.assert_called_once_with("guild_123", "user_123")
    
    @patch('app.api.guild.list_user_guilds')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_list_user_guilds_endpoint(self, mock_rate_limit, mock_authenticate, mock_list_user_guilds, client, mock_guild_response):
        """Test list user guilds endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_list_user_guilds.return_value = {
            "guilds": [mock_guild_response],
            "total_count": 1,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/user/user_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()["guilds"]) == 1
        mock_list_user_guilds.assert_called_once_with("user_123")
    
    @patch('app.api.guild.remove_user_from_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_remove_user_from_guild_endpoint(self, mock_rate_limit, mock_authenticate, mock_remove_user, client):
        """Test remove user from guild endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_remove_user.return_value = True
        
        response = client.delete(
            "/guilds/guild_123/members/user_456",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_remove_user.assert_called_once_with("guild_123", "user_456", "user_123")
    
    # Test Comments Endpoints
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_create_comment, client, mock_comment_response):
        """Test create comment endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
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
        assert response.json()["comment_id"] == "comment_123"
        mock_create_comment.assert_called_once()
    
    @patch('app.api.comments.get_guild_comments')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_get_comments_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_comments, client, mock_comment_response):
        """Test get comments endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_comments.return_value = {
            "comments": [mock_comment_response],
            "total_count": 1,
            "next_token": None
        }
        
        response = client.get(
            "/guilds/guild_123/comments",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()["comments"]) == 1
        mock_get_comments.assert_called_once_with("guild_123")
    
    @patch('app.api.comments.update_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_update_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_update_comment, client, mock_comment_response):
        """Test update comment endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_update_comment.return_value = mock_comment_response
        
        response = client.put(
            "/guilds/guild_123/comments/comment_123",
            json={
                "content": "Updated comment"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["comment_id"] == "comment_123"
        mock_update_comment.assert_called_once()
    
    @patch('app.api.comments.delete_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_delete_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_delete_comment, client):
        """Test delete comment endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_delete_comment.return_value = True
        
        response = client.delete(
            "/guilds/guild_123/comments/comment_123",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_delete_comment.assert_called_once_with("comment_123", "user_123")
    
    @patch('app.api.comments.like_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_like_comment_endpoint(self, mock_rate_limit, mock_authenticate, mock_like_comment, client):
        """Test like comment endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_like_comment.return_value = True
        
        response = client.post(
            "/guilds/guild_123/comments/comment_123/like",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_like_comment.assert_called_once_with("comment_123", "user_123")
    
    # Test Analytics Endpoints
    
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_analytics, client, mock_analytics_response):
        """Test get guild analytics endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_analytics.return_value = mock_analytics_response
        
        response = client.get(
            "/guilds/guild_123/analytics",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["guild_id"] == "guild_123"
        mock_get_analytics.assert_called_once_with("guild_123")
    
    @patch('app.api.analytics.get_guild_rankings')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_rankings_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_rankings, client, mock_ranking_response):
        """Test get guild rankings endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_rankings.return_value = [mock_ranking_response]
        
        response = client.get(
            "/guilds/rankings",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 1
        mock_get_rankings.assert_called_once()
    
    @patch('app.api.analytics.calculate_guild_rankings')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_calculate_guild_rankings_endpoint(self, mock_rate_limit, mock_authenticate, mock_calculate_rankings, client):
        """Test calculate guild rankings endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_calculate_rankings.return_value = True
        
        response = client.post(
            "/guilds/rankings/calculate",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_calculate_rankings.assert_called_once()
    
    # Test Moderation Endpoints
    
    @patch('app.api.moderation.get_guild_join_requests')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_get_join_requests_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_requests, client, mock_join_request_response):
        """Test get join requests endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_requests.return_value = [mock_join_request_response]
        
        response = client.get(
            "/guilds/guild_123/join-requests",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 1
        mock_get_requests.assert_called_once_with("guild_123")
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint(self, mock_rate_limit, mock_authenticate, mock_approve_request, client):
        """Test approve join request endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_approve_request.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/approve",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_approve_request.assert_called_once_with("guild_123", "user_456", "user_123")
    
    @patch('app.api.moderation.reject_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_reject_join_request_endpoint(self, mock_rate_limit, mock_authenticate, mock_reject_request, client):
        """Test reject join request endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_reject_request.return_value = True
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/reject",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_reject_request.assert_called_once_with("guild_123", "user_456", "user_123")
    
    @patch('app.api.moderation.assign_moderator')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_assign_moderator_endpoint(self, mock_rate_limit, mock_authenticate, mock_assign_moderator, client):
        """Test assign moderator endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_assign_moderator.return_value = {"success": True}
        
        response = client.post(
            "/guilds/guild_123/moderators/user_456",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_assign_moderator.assert_called_once_with("guild_123", "user_456", "user_123")
    
    @patch('app.api.moderation.remove_moderator')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_remove_moderator_endpoint(self, mock_rate_limit, mock_authenticate, mock_remove_moderator, client):
        """Test remove moderator endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_remove_moderator.return_value = True
        
        response = client.delete(
            "/guilds/guild_123/moderators/user_456",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_remove_moderator.assert_called_once_with("guild_123", "user_456", "user_123")
    
    @patch('app.api.moderation.get_guild_moderators')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_get_guild_moderators_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_moderators, client):
        """Test get guild moderators endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_moderators.return_value = [{"user_id": "user_456", "username": "moderator"}]
        
        response = client.get(
            "/guilds/guild_123/moderators",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 1
        mock_get_moderators.assert_called_once_with("guild_123")
    
    @patch('app.api.moderation.perform_moderation_action')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_perform_moderation_action_endpoint(self, mock_rate_limit, mock_authenticate, mock_perform_action, client):
        """Test perform moderation action endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_perform_action.return_value = True
        
        response = client.post(
            "/guilds/guild_123/moderation/actions",
            json={
                "action": "block_user",
                "target_user_id": "user_456",
                "reason": "Inappropriate behavior"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_perform_action.assert_called_once()
    
    # Test Avatar Endpoints
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_upload_url_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_upload_url, client, mock_avatar_upload_response):
        """Test get upload URL endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_upload_url.return_value = mock_avatar_upload_response
        
        response = client.post(
            "/guilds/guild_123/avatar/upload-url",
            json={
                "file_type": "image/jpeg",
                "file_size": 1024000
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["avatarKey"] == "guild_123/avatar.jpg"
        mock_get_upload_url.assert_called_once()
    
    @patch('app.api.avatar.get_avatar_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_avatar_endpoint(self, mock_rate_limit, mock_authenticate, mock_get_avatar, client, mock_avatar_get_response):
        """Test get avatar endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_get_avatar.return_value = mock_avatar_get_response
        
        response = client.get(
            "/guilds/guild_123/avatar",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["avatar_url"] == "https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg"
        mock_get_avatar.assert_called_once_with("guild_123")
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_confirm_avatar_upload_endpoint(self, mock_rate_limit, mock_authenticate, mock_confirm_upload, client):
        """Test confirm avatar upload endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_confirm_upload.return_value = True
        
        response = client.post(
            "/guilds/guild_123/avatar/confirm",
            json={
                "avatar_key": "guild_123/avatar.jpg"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_confirm_upload.assert_called_once()
    
    @patch('app.api.avatar.delete_avatar')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_delete_avatar_endpoint(self, mock_rate_limit, mock_authenticate, mock_delete_avatar, client):
        """Test delete avatar endpoint."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        mock_delete_avatar.return_value = True
        
        response = client.delete(
            "/guilds/guild_123/avatar",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        mock_delete_avatar.assert_called_once_with("guild_123", "user_123")
    
    # Error Handling Tests
    
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_guild, client):
        """Test create guild endpoint error handling."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
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
        assert "Database error" in response.json()["detail"]
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_comment, client):
        """Test create comment endpoint error handling."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildNotFoundError
        mock_create_comment.side_effect = GuildNotFoundError("Guild not found")
        
        response = client.post(
            "/guilds/guild_123/comments",
            json={
                "content": "Test comment"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404
        assert "Guild not found" in response.json()["detail"]
    
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_get_analytics, client):
        """Test get guild analytics endpoint error handling."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildPermissionError
        mock_get_analytics.side_effect = GuildPermissionError("Insufficient permissions")
        
        response = client.get(
            "/guilds/guild_123/analytics",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_approve_request, client):
        """Test approve join request endpoint error handling."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildNotFoundError
        mock_approve_request.side_effect = GuildNotFoundError("Join request not found")
        
        response = client.post(
            "/guilds/guild_123/join-requests/user_456/approve",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404
        assert "Join request not found" in response.json()["detail"]
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_upload_url_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_get_upload_url, client):
        """Test get upload URL endpoint error handling."""
        mock_authenticate.return_value = MagicMock(user_id='user_123', username='testuser')
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_get_upload_url.side_effect = GuildDBError("S3 error")
        
        response = client.post(
            "/guilds/guild_123/avatar/upload-url",
            json={
                "file_type": "image/jpeg",
                "file_size": 1024000
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 500
        assert "S3 error" in response.json()["detail"]


if __name__ == '__main__':
    pytest.main([__file__])
