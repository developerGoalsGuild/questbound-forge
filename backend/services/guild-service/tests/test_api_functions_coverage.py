"""
Test API functions directly to improve coverage.
Tests the actual endpoint functions with proper mocking.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
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
    # Import the API modules
    from app.api import guild, comments, analytics, moderation, avatar
    from app.models.guild import GuildType, GuildSettings, GuildResponse, GuildListResponse
    from app.models.comment import GuildCommentResponse, GuildCommentListResponse
    from app.models.analytics import GuildAnalyticsResponse, GuildRankingResponse
    from app.models.join_request import GuildJoinRequestResponse, JoinRequestStatus
    from app.models.avatar import AvatarUploadRequest, AvatarUploadResponse, AvatarGetResponse, AvatarConfirmRequest
    from app.security.auth_models import AuthContext


class TestAPIFunctionsCoverage:
    """Test API functions directly to improve coverage."""
    
    @pytest.fixture
    def mock_auth_context(self):
        """Mock authentication context."""
        return MagicMock(
            user_id='user_123',
            username='testuser',
            email='test@example.com',
            is_authenticated=True
        )
    
    @pytest.fixture
    def mock_guild_response(self):
        """Mock guild response object."""
        now = datetime.now(timezone.utc)
        return GuildResponse(
            guild_id='guild_123',
            name='Test Guild',
            description='A test guild',
            guild_type=GuildType.PUBLIC,
            created_by='user_123',
            member_count=1,
            goal_count=0,
            quest_count=0,
            created_at=now,
            updated_at=now,
            settings=GuildSettings(),
            moderators=[],
            pending_requests=0,
            avatar_url=None,
            position=None,
            previous_position=None,
            total_score=0,
            activity_score=0,
            growth_rate=0.0,
            badges=[],
            members=[],
            user_permissions=MagicMock()
        )
    
    @pytest.fixture
    def mock_comment_response(self):
        """Mock comment response object."""
        now = datetime.now(timezone.utc)
        return GuildCommentResponse(
            comment_id='comment_123',
            guild_id='guild_123',
            user_id='user_123',
            username='testuser',
            content='Test comment',
            created_at=now,
            updated_at=now,
            parent_comment_id=None,
            likes=0,
            is_liked=False,
            is_edited=False,
            user_role=MagicMock(),
            replies=[]
        )
    
    @pytest.fixture
    def mock_analytics_response(self):
        """Mock analytics response object."""
        now = datetime.now(timezone.utc)
        return GuildAnalyticsResponse(
            guild_id='guild_123',
            total_members=10,
            active_members=8,
            total_goals=25,
            completed_goals=15,
            total_quests=12,
            completed_quests=8,
            total_comments=50,
            weekly_activity=5,
            monthly_activity=20,
            goal_completion_rate=0.6,
            quest_completion_rate=0.67,
            member_growth_rate=0.15,
            goal_growth_rate=0.25,
            quest_growth_rate=0.3,
            activity_score=85,
            top_performers=3,
            new_members_this_week=2,
            goals_created_this_week=5,
            quests_completed_this_week=3,
            created_at=now,
            last_updated=now,
            member_leaderboard=[]
        )
    
    @pytest.fixture
    def mock_ranking_response(self):
        """Mock ranking response object."""
        now = datetime.now(timezone.utc)
        return GuildRankingResponse(
            guild_id='guild_123',
            name='Test Guild',
            position=1,
            previous_position=2,
            total_score=1000,
            member_count=50,
            goal_count=100,
            quest_count=25,
            activity_score=95,
            growth_rate=0.2,
            trend='up',
            badges=['top_performer'],
            calculated_at=now
        )
    
    @pytest.fixture
    def mock_join_request_response(self):
        """Mock join request response object."""
        now = datetime.now(timezone.utc)
        return GuildJoinRequestResponse(
            request_id='request_123',
            guild_id='guild_123',
            user_id='user_456',
            username='requesting_user',
            status=JoinRequestStatus.PENDING,
            requested_at=now
        )
    
    @pytest.fixture
    def mock_avatar_upload_response(self):
        """Mock avatar upload response object."""
        return AvatarUploadResponse(
            upload_url='https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            avatar_key='guild_123/avatar.jpg',
            expires_in=3600
        )
    
    @pytest.fixture
    def mock_avatar_get_response(self):
        """Mock avatar get response object."""
        return AvatarGetResponse(
            avatar_url='https://s3.amazonaws.com/test-bucket/guild_123/avatar.jpg',
            avatar_key='guild_123/avatar.jpg'
        )
    
    # Test Guild API Functions
    
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_create_guild, mock_auth_context, mock_guild_response):
        """Test create guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_create_guild.return_value = mock_guild_response
        
        # Test the endpoint function directly
        result = guild.create_guild_endpoint(
            guild_data=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_create_guild.assert_called_once()
    
    @patch('app.api.guild.get_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_get_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_guild, mock_auth_context, mock_guild_response):
        """Test get guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_guild.return_value = mock_guild_response
        
        # Test the endpoint function directly
        result = guild.get_guild_endpoint(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_guild.assert_called_once_with('guild_123')
    
    @patch('app.api.guild.update_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_update_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_update_guild, mock_auth_context, mock_guild_response):
        """Test update guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_update_guild.return_value = mock_guild_response
        
        # Test the endpoint function directly
        result = guild.update_guild_endpoint(
            guild_id='guild_123',
            guild_data=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_update_guild.assert_called_once()
    
    @patch('app.api.guild.delete_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_delete_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_delete_guild, mock_auth_context):
        """Test delete guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_delete_guild.return_value = True
        
        # Test the endpoint function directly
        result = guild.delete_guild_endpoint(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_delete_guild.assert_called_once_with('guild_123', 'user_123')
    
    @patch('app.api.guild.list_guilds')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_list_guilds_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_list_guilds, mock_auth_context, mock_guild_response):
        """Test list guilds endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_list_response = GuildListResponse(
            guilds=[mock_guild_response],
            total_count=1,
            next_token=None
        )
        mock_list_guilds.return_value = mock_list_response
        
        # Test the endpoint function directly
        result = guild.list_guilds_endpoint(
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_list_guilds.assert_called_once()
    
    @patch('app.api.guild.join_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_join_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_join_guild, mock_auth_context):
        """Test join guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_join_guild.return_value = True
        
        # Test the endpoint function directly
        result = guild.join_guild_endpoint(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_join_guild.assert_called_once_with('guild_123', 'user_123')
    
    @patch('app.api.guild.leave_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_leave_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_leave_guild, mock_auth_context):
        """Test leave guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_leave_guild.return_value = True
        
        # Test the endpoint function directly
        result = guild.leave_guild_endpoint(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_leave_guild.assert_called_once_with('guild_123', 'user_123')
    
    @patch('app.api.guild.list_user_guilds')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_list_user_guilds_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_list_user_guilds, mock_auth_context, mock_guild_response):
        """Test list user guilds endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_list_response = GuildListResponse(
            guilds=[mock_guild_response],
            total_count=1,
            next_token=None
        )
        mock_list_user_guilds.return_value = mock_list_response
        
        # Test the endpoint function directly
        result = guild.list_user_guilds_endpoint(
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_list_user_guilds.assert_called_once_with('user_123')
    
    @patch('app.api.guild.remove_user_from_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_remove_user_from_guild_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_remove_user, mock_auth_context):
        """Test remove user from guild endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_remove_user.return_value = True
        
        # Test the endpoint function directly
        result = guild.remove_user_from_guild_endpoint(
            guild_id='guild_123',
            user_id='user_456',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_remove_user.assert_called_once_with('guild_123', 'user_456', 'user_123')
    
    # Test Comments API Functions
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_create_comment, mock_auth_context, mock_comment_response):
        """Test create comment endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_create_comment.return_value = mock_comment_response
        
        # Test the endpoint function directly
        result = comments.create_comment(
            guild_id='guild_123',
            comment_data=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_create_comment.assert_called_once()
    
    @patch('app.api.comments.get_guild_comments')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_get_comments_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_comments, mock_auth_context, mock_comment_response):
        """Test get comments endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_list_response = GuildCommentListResponse(
            comments=[mock_comment_response],
            total_count=1,
            next_token=None
        )
        mock_get_comments.return_value = mock_list_response
        
        # Test the endpoint function directly
        result = comments.get_comments(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_comments.assert_called_once_with('guild_123')
    
    @patch('app.api.comments.update_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_update_comment_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_update_comment, mock_auth_context, mock_comment_response):
        """Test update comment endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_update_comment.return_value = mock_comment_response
        
        # Test the endpoint function directly
        result = comments.update_comment(
            guild_id='guild_123',
            comment_id='comment_123',
            comment_data=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_update_comment.assert_called_once()
    
    @patch('app.api.comments.delete_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_delete_comment_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_delete_comment, mock_auth_context):
        """Test delete comment endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_delete_comment.return_value = True
        
        # Test the endpoint function directly
        result = comments.delete_comment(
            guild_id='guild_123',
            comment_id='comment_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_delete_comment.assert_called_once_with('comment_123', 'user_123')
    
    @patch('app.api.comments.like_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_like_comment_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_like_comment, mock_auth_context):
        """Test like comment endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_like_comment.return_value = True
        
        # Test the endpoint function directly
        result = comments.like_comment(
            guild_id='guild_123',
            comment_id='comment_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_like_comment.assert_called_once_with('comment_123', 'user_123')
    
    # Test Analytics API Functions
    
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_analytics, mock_auth_context, mock_analytics_response):
        """Test get guild analytics endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_analytics.return_value = mock_analytics_response
        
        # Test the endpoint function directly
        result = analytics.get_guild_analytics(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_analytics.assert_called_once_with('guild_123')
    
    @patch('app.api.analytics.get_guild_rankings')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_rankings_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_rankings, mock_auth_context, mock_ranking_response):
        """Test get guild rankings endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_rankings.return_value = [mock_ranking_response]
        
        # Test the endpoint function directly
        result = analytics.get_guild_rankings(
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_rankings.assert_called_once()
    
    @patch('app.api.analytics.calculate_guild_rankings')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_calculate_guild_rankings_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_calculate_rankings, mock_auth_context):
        """Test calculate guild rankings endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_calculate_rankings.return_value = True
        
        # Test the endpoint function directly
        result = analytics.calculate_guild_rankings(
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_calculate_rankings.assert_called_once()
    
    # Test Moderation API Functions
    
    @patch('app.api.moderation.get_guild_join_requests')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_get_join_requests_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_requests, mock_auth_context, mock_join_request_response):
        """Test get join requests endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_requests.return_value = [mock_join_request_response]
        
        # Test the endpoint function directly
        result = moderation.get_join_requests(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_requests.assert_called_once_with('guild_123')
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_approve_request, mock_auth_context):
        """Test approve join request endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_approve_request.return_value = True
        
        # Test the endpoint function directly
        result = moderation.approve_join_request(
            guild_id='guild_123',
            user_id='user_456',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_approve_request.assert_called_once_with('guild_123', 'user_456', 'user_123')
    
    @patch('app.api.moderation.reject_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_reject_join_request_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_reject_request, mock_auth_context):
        """Test reject join request endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_reject_request.return_value = True
        
        # Test the endpoint function directly
        result = moderation.reject_join_request(
            guild_id='guild_123',
            user_id='user_456',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_reject_request.assert_called_once_with('guild_123', 'user_456', 'user_123')
    
    @patch('app.api.moderation.assign_moderator')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_assign_moderator_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_assign_moderator, mock_auth_context):
        """Test assign moderator endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_assign_moderator.return_value = {'success': True}
        
        # Test the endpoint function directly
        result = moderation.assign_moderator(
            guild_id='guild_123',
            user_id='user_456',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_assign_moderator.assert_called_once_with('guild_123', 'user_456', 'user_123')
    
    @patch('app.api.moderation.remove_moderator')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_remove_moderator_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_remove_moderator, mock_auth_context):
        """Test remove moderator endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_remove_moderator.return_value = True
        
        # Test the endpoint function directly
        result = moderation.remove_moderator(
            guild_id='guild_123',
            user_id='user_456',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_remove_moderator.assert_called_once_with('guild_123', 'user_456', 'user_123')
    
    @patch('app.api.moderation.get_guild_moderators')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_get_guild_moderators_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_moderators, mock_auth_context):
        """Test get guild moderators endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_moderators.return_value = [{'user_id': 'user_456', 'username': 'moderator'}]
        
        # Test the endpoint function directly
        result = moderation.get_guild_moderators(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_moderators.assert_called_once_with('guild_123')
    
    @patch('app.api.moderation.perform_moderation_action')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_perform_moderation_action_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_perform_action, mock_auth_context):
        """Test perform moderation action endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_perform_action.return_value = True
        
        # Test the endpoint function directly
        result = moderation.perform_moderation_action(
            guild_id='guild_123',
            action_data=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_perform_action.assert_called_once()
    
    # Test Avatar API Functions
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_upload_url_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_upload_url, mock_auth_context, mock_avatar_upload_response):
        """Test get upload URL endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_upload_url.return_value = mock_avatar_upload_response
        
        # Test the endpoint function directly
        result = avatar.get_upload_url(
            guild_id='guild_123',
            upload_request=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_upload_url.assert_called_once()
    
    @patch('app.api.avatar.get_avatar_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_avatar_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_get_avatar, mock_auth_context, mock_avatar_get_response):
        """Test get avatar endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_get_avatar.return_value = mock_avatar_get_response
        
        # Test the endpoint function directly
        result = avatar.get_avatar(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_get_avatar.assert_called_once_with('guild_123')
    
    @patch('app.api.avatar.confirm_avatar_upload')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_confirm_avatar_upload_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_confirm_upload, mock_auth_context):
        """Test confirm avatar upload endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_confirm_upload.return_value = True
        
        # Test the endpoint function directly
        result = avatar.confirm_avatar_upload(
            guild_id='guild_123',
            confirm_request=MagicMock(),
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_confirm_upload.assert_called_once()
    
    @patch('app.api.avatar.delete_avatar')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_delete_avatar_endpoint_function(self, mock_rate_limit, mock_authenticate, mock_delete_avatar, mock_auth_context):
        """Test delete avatar endpoint function."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        mock_delete_avatar.return_value = True
        
        # Test the endpoint function directly
        result = avatar.delete_avatar(
            guild_id='guild_123',
            auth_context=mock_auth_context
        )
        
        assert result is not None
        mock_delete_avatar.assert_called_once_with('guild_123', 'user_123')
    
    # Error Handling Tests
    
    @patch('app.api.guild.create_guild')
    @patch('app.api.guild.authenticate')
    @patch('app.api.guild.rate_limit')
    def test_create_guild_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_guild, mock_auth_context):
        """Test create guild endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_create_guild.side_effect = GuildDBError("Database error")
        
        # Test the endpoint function directly with error
        try:
            result = guild.create_guild_endpoint(
                guild_data=MagicMock(),
                auth_context=mock_auth_context
            )
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Database error" in str(e)
    
    @patch('app.api.comments.create_guild_comment')
    @patch('app.api.comments.authenticate')
    @patch('app.api.comments.rate_limit')
    def test_create_comment_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_create_comment, mock_auth_context):
        """Test create comment endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildNotFoundError
        mock_create_comment.side_effect = GuildNotFoundError("Guild not found")
        
        # Test the endpoint function directly with error
        try:
            result = comments.create_comment(
                guild_id='guild_123',
                comment_data=MagicMock(),
                auth_context=mock_auth_context
            )
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Guild not found" in str(e)
    
    @patch('app.api.analytics.get_guild_analytics')
    @patch('app.api.analytics.authenticate')
    @patch('app.api.analytics.rate_limit')
    def test_get_guild_analytics_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_get_analytics, mock_auth_context):
        """Test get guild analytics endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildPermissionError
        mock_get_analytics.side_effect = GuildPermissionError("Insufficient permissions")
        
        # Test the endpoint function directly with error
        try:
            result = analytics.get_guild_analytics(
                guild_id='guild_123',
                auth_context=mock_auth_context
            )
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Insufficient permissions" in str(e)
    
    @patch('app.api.moderation.approve_join_request')
    @patch('app.api.moderation.authenticate')
    @patch('app.api.moderation.rate_limit')
    def test_approve_join_request_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_approve_request, mock_auth_context):
        """Test approve join request endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildNotFoundError
        mock_approve_request.side_effect = GuildNotFoundError("Join request not found")
        
        # Test the endpoint function directly with error
        try:
            result = moderation.approve_join_request(
                guild_id='guild_123',
                user_id='user_456',
                auth_context=mock_auth_context
            )
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Join request not found" in str(e)
    
    @patch('app.api.avatar.get_upload_url')
    @patch('app.api.avatar.authenticate')
    @patch('app.api.avatar.rate_limit')
    def test_get_upload_url_endpoint_error_handling(self, mock_rate_limit, mock_authenticate, mock_get_upload_url, mock_auth_context):
        """Test get upload URL endpoint error handling."""
        mock_authenticate.return_value = mock_auth_context
        mock_rate_limit.return_value = lambda x: x
        from app.db.guild_db import GuildDBError
        mock_get_upload_url.side_effect = GuildDBError("S3 error")
        
        # Test the endpoint function directly with error
        try:
            result = avatar.get_upload_url(
                guild_id='guild_123',
                upload_request=MagicMock(),
                auth_context=mock_auth_context
            )
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "S3 error" in str(e)


if __name__ == '__main__':
    pytest.main([__file__])
