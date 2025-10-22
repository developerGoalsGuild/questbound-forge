"""
API endpoint tests with comprehensive mocking.
Tests FastAPI endpoints without requiring AWS credentials or external dependencies.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

# Mock the settings before importing the main app
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
    from app.main import app

from app.models.guild import GuildType, GuildSettings, GuildMemberRole


class TestAPIEndpoints:
    """API endpoint tests with comprehensive mocking."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_auth_headers(self):
        """Mock authentication headers."""
        return {
            'Authorization': 'Bearer mock_token',
            'x-api-key': 'mock_api_key'
        }
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'API Test Guild',
            'description': 'A guild for API testing',
            'guild_type': 'public',
            'tags': ['api', 'testing'],
            'settings': {
                'allow_join_requests': True,
                'require_approval': False,
                'allow_comments': True
            }
        }
    
    def test_health_check_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_docs_endpoint(self, client):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_openapi_endpoint(self, client):
        """Test that OpenAPI schema is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
    
    def test_info_endpoint(self, client):
        """Test application info endpoint."""
        response = client.get("/info")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "description" in data
    
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        # Metrics should be in a specific format
        assert "requests_total" in response.text or "guild_requests_total" in response.text
    
    @patch('app.api.guild.create_guild')
    def test_create_guild_endpoint_success(self, mock_create, client, sample_guild_data, mock_auth_headers):
        """Test successful guild creation endpoint."""
        # Mock the service response
        mock_guild = MagicMock()
        mock_guild.guild_id = 'guild_123'
        mock_guild.name = sample_guild_data['name']
        mock_guild.description = sample_guild_data['description']
        mock_guild.guild_type = GuildType.PUBLIC
        mock_guild.created_by = 'user_123'
        mock_guild.member_count = 1
        mock_guild.goal_count = 0
        mock_guild.quest_count = 0
        mock_guild.created_at = datetime.now()
        mock_guild.updated_at = datetime.now()
        mock_guild.settings = GuildSettings(**sample_guild_data['settings'])
        mock_guild.moderators = []
        mock_guild.pending_requests = 0
        mock_guild.avatar_url = None
        mock_guild.position = None
        mock_guild.previous_position = None
        mock_guild.total_score = 0
        mock_guild.activity_score = 0
        mock_guild.growth_rate = 0.0
        mock_guild.badges = []
        mock_guild.members = []
        mock_guild.permissions = MagicMock()
        
        mock_create.return_value = mock_guild
        
        response = client.post(
            '/guilds',
            json=sample_guild_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['guild_id'] == 'guild_123'
        assert data['name'] == sample_guild_data['name']
        assert data['description'] == sample_guild_data['description']
        assert data['guild_type'] == sample_guild_data['guild_type']
    
    @patch('app.api.guild.create_guild')
    def test_create_guild_endpoint_validation_error(self, mock_create, client, mock_auth_headers):
        """Test guild creation with validation errors."""
        # Test empty name
        invalid_data = {
            'name': '',
            'guild_type': 'public'
        }
        
        response = client.post(
            '/guilds',
            json=invalid_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 422
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.guild.create_guild')
    def test_create_guild_endpoint_service_error(self, mock_create, client, sample_guild_data, mock_auth_headers):
        """Test guild creation with service error."""
        # Mock service to raise an exception
        mock_create.side_effect = Exception("Database error")
        
        response = client.post(
            '/guilds',
            json=sample_guild_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.guild.get_guild')
    def test_get_guild_endpoint_success(self, mock_get, client, mock_auth_headers):
        """Test successful guild retrieval endpoint."""
        # Mock the service response
        mock_guild = MagicMock()
        mock_guild.guild_id = 'guild_123'
        mock_guild.name = 'Test Guild'
        mock_guild.description = 'Test description'
        mock_guild.guild_type = GuildType.PUBLIC
        mock_guild.created_by = 'user_123'
        mock_guild.member_count = 1
        mock_guild.goal_count = 0
        mock_guild.quest_count = 0
        mock_guild.created_at = datetime.now()
        mock_guild.updated_at = datetime.now()
        mock_guild.settings = GuildSettings()
        mock_guild.moderators = []
        mock_guild.pending_requests = 0
        mock_guild.avatar_url = None
        mock_guild.position = None
        mock_guild.previous_position = None
        mock_guild.total_score = 0
        mock_guild.activity_score = 0
        mock_guild.growth_rate = 0.0
        mock_guild.badges = []
        mock_guild.members = []
        mock_guild.permissions = MagicMock()
        
        mock_get.return_value = mock_guild
        
        response = client.get(
            '/guilds/guild_123',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['guild_id'] == 'guild_123'
        assert data['name'] == 'Test Guild'
        assert data['description'] == 'Test description'
    
    @patch('app.api.guild.get_guild')
    def test_get_guild_endpoint_not_found(self, mock_get, client, mock_auth_headers):
        """Test guild retrieval when guild not found."""
        mock_get.return_value = None
        
        response = client.get(
            '/guilds/nonexistent_guild',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.guild.list_guilds')
    def test_list_guilds_endpoint_success(self, mock_list, client, mock_auth_headers):
        """Test successful guild listing endpoint."""
        # Mock the service response
        mock_guild = MagicMock()
        mock_guild.guild_id = 'guild_123'
        mock_guild.name = 'Test Guild'
        mock_guild.description = 'Test description'
        mock_guild.guild_type = GuildType.PUBLIC
        mock_guild.created_by = 'user_123'
        mock_guild.member_count = 1
        mock_guild.goal_count = 0
        mock_guild.quest_count = 0
        mock_guild.created_at = datetime.now()
        mock_guild.updated_at = datetime.now()
        mock_guild.settings = GuildSettings()
        mock_guild.moderators = []
        mock_guild.pending_requests = 0
        mock_guild.avatar_url = None
        mock_guild.position = None
        mock_guild.previous_position = None
        mock_guild.total_score = 0
        mock_guild.activity_score = 0
        mock_guild.growth_rate = 0.0
        mock_guild.badges = []
        mock_guild.members = []
        mock_guild.permissions = MagicMock()
        
        mock_result = MagicMock()
        mock_result.guilds = [mock_guild]
        mock_result.total_count = 1
        mock_result.next_token = None
        
        mock_list.return_value = mock_result
        
        response = client.get(
            '/guilds',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['guilds']) == 1
        assert data['guilds'][0]['guild_id'] == 'guild_123'
        assert data['total_count'] == 1
    
    @patch('app.api.guild.join_guild')
    def test_join_guild_endpoint_success(self, mock_join, client, mock_auth_headers):
        """Test successful guild join endpoint."""
        mock_join.return_value = True
        
        response = client.post(
            '/guilds/guild_123/join',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    @patch('app.api.guild.join_guild')
    def test_join_guild_endpoint_error(self, mock_join, client, mock_auth_headers):
        """Test guild join endpoint with error."""
        mock_join.side_effect = Exception("Join failed")
        
        response = client.post(
            '/guilds/guild_123/join',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data
    
    @patch('app.api.guild.leave_guild')
    def test_leave_guild_endpoint_success(self, mock_leave, client, mock_auth_headers):
        """Test successful guild leave endpoint."""
        mock_leave.return_value = True
        
        response = client.post(
            '/guilds/guild_123/leave',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    @patch('app.api.comments.create_guild_comment')
    def test_create_comment_endpoint_success(self, mock_create, client, mock_auth_headers):
        """Test successful comment creation endpoint."""
        # Mock the service response
        mock_comment = MagicMock()
        mock_comment.comment_id = 'comment_123'
        mock_comment.guild_id = 'guild_123'
        mock_comment.user_id = 'user_123'
        mock_comment.username = 'testuser'
        mock_comment.content = 'Test comment'
        mock_comment.created_at = datetime.now()
        mock_comment.updated_at = datetime.now()
        mock_comment.parent_comment_id = None
        mock_comment.likes = 0
        mock_comment.is_liked = False
        mock_comment.is_edited = False
        mock_comment.user_role = GuildMemberRole.MEMBER
        mock_comment.replies = []
        
        mock_create.return_value = mock_comment
        
        comment_data = {
            'content': 'Test comment',
            'parent_comment_id': None
        }
        
        response = client.post(
            '/guilds/guild_123/comments',
            json=comment_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['comment_id'] == 'comment_123'
        assert data['content'] == 'Test comment'
    
    @patch('app.api.comments.get_guild_comments')
    def test_get_comments_endpoint_success(self, mock_get, client, mock_auth_headers):
        """Test successful comments retrieval endpoint."""
        # Mock the service response
        mock_comment = MagicMock()
        mock_comment.comment_id = 'comment_123'
        mock_comment.guild_id = 'guild_123'
        mock_comment.user_id = 'user_123'
        mock_comment.username = 'testuser'
        mock_comment.content = 'Test comment'
        mock_comment.created_at = datetime.now()
        mock_comment.updated_at = datetime.now()
        mock_comment.parent_comment_id = None
        mock_comment.likes = 0
        mock_comment.is_liked = False
        mock_comment.is_edited = False
        mock_comment.user_role = GuildMemberRole.MEMBER
        mock_comment.replies = []
        
        mock_result = MagicMock()
        mock_result.comments = [mock_comment]
        mock_result.total_count = 1
        mock_result.next_token = None
        
        mock_get.return_value = mock_result
        
        response = client.get(
            '/guilds/guild_123/comments',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['comments']) == 1
        assert data['comments'][0]['comment_id'] == 'comment_123'
    
    @patch('app.api.analytics.get_guild_analytics')
    def test_get_analytics_endpoint_success(self, mock_get, client, mock_auth_headers):
        """Test successful analytics endpoint."""
        # Mock the service response
        mock_analytics = MagicMock()
        mock_analytics.total_members = 10
        mock_analytics.active_members = 8
        mock_analytics.total_goals = 25
        mock_analytics.completed_goals = 15
        mock_analytics.total_quests = 12
        mock_analytics.completed_quests = 8
        mock_analytics.weekly_activity = 5
        mock_analytics.monthly_activity = 20
        mock_analytics.average_goal_completion = 0.6
        mock_analytics.average_quest_completion = 0.67
        mock_analytics.member_growth_rate = 0.15
        mock_analytics.goal_growth_rate = 0.25
        mock_analytics.quest_growth_rate = 0.3
        mock_analytics.top_performers = 3
        mock_analytics.new_members_this_week = 2
        mock_analytics.goals_created_this_week = 5
        mock_analytics.quests_completed_this_week = 3
        mock_analytics.created_at = datetime.now()
        mock_analytics.last_activity_at = datetime.now()
        mock_analytics.member_leaderboard = []
        
        mock_get.return_value = mock_analytics
        
        response = client.get(
            '/guilds/guild_123/analytics',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_members'] == 10
        assert data['active_members'] == 8
        assert data['total_goals'] == 25
    
    @patch('app.api.analytics.get_guild_rankings')
    def test_get_rankings_endpoint_success(self, mock_get, client, mock_auth_headers):
        """Test successful rankings endpoint."""
        # Mock the service response
        mock_ranking = MagicMock()
        mock_ranking.guild_id = 'guild_1'
        mock_ranking.position = 1
        mock_ranking.previous_position = 2
        mock_ranking.total_score = 1000
        mock_ranking.member_count = 50
        mock_ranking.goal_count = 100
        mock_ranking.quest_count = 25
        mock_ranking.activity_score = 95
        mock_ranking.growth_rate = 0.2
        mock_ranking.badges = ['top_performer', 'active']
        mock_ranking.calculated_at = datetime.now()
        
        mock_get.return_value = [mock_ranking]
        
        response = client.get(
            '/guilds/rankings',
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['guild_id'] == 'guild_1'
        assert data[0]['position'] == 1
    
    def test_unauthorized_request(self, client, sample_guild_data):
        """Test request without authentication headers."""
        response = client.post(
            '/guilds',
            json=sample_guild_data
        )
        
        # Should return 401 or 403 depending on implementation
        assert response.status_code in [401, 403]
    
    def test_invalid_json_request(self, client, mock_auth_headers):
        """Test request with invalid JSON."""
        response = client.post(
            '/guilds',
            data="invalid json",
            headers={**mock_auth_headers, 'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client, mock_auth_headers):
        """Test request with missing required fields."""
        incomplete_data = {
            'name': 'Test Guild'
            # Missing required fields
        }
        
        response = client.post(
            '/guilds',
            json=incomplete_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 422
    
    def test_invalid_guild_type(self, client, mock_auth_headers):
        """Test request with invalid guild type."""
        invalid_data = {
            'name': 'Test Guild',
            'description': 'Test description',
            'guild_type': 'invalid_type',
            'tags': ['test']
        }
        
        response = client.post(
            '/guilds',
            json=invalid_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 422
    
    def test_server_error_handling(self, client, mock_auth_headers):
        """Test server error handling."""
        with patch('app.api.guild.get_guild', side_effect=Exception("Database error")):
            response = client.get(
                '/guilds/guild_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 500
    
    def test_cors_headers(self, client):
        """Test CORS headers are present."""
        response = client.options('/guilds')
        # CORS preflight should return 200
        assert response.status_code == 200
    
    def test_content_type_validation(self, client, mock_auth_headers):
        """Test content type validation."""
        # Test with wrong content type
        response = client.post(
            '/guilds',
            data="some data",
            headers={**mock_auth_headers, 'Content-Type': 'text/plain'}
        )
        
        # Should return 422 for unsupported media type
        assert response.status_code == 422
    
    def test_query_parameters_validation(self, client, mock_auth_headers):
        """Test query parameters validation."""
        # Test with invalid query parameters
        response = client.get(
            '/guilds?limit=invalid&offset=-1',
            headers=mock_auth_headers
        )
        
        # Should return 422 for invalid query parameters
        assert response.status_code == 422
    
    def test_path_parameters_validation(self, client, mock_auth_headers):
        """Test path parameters validation."""
        # Test with invalid guild ID format
        response = client.get(
            '/guilds/invalid-guild-id-format',
            headers=mock_auth_headers
        )
        
        # Should return 422 for invalid path parameter format
        assert response.status_code == 422


if __name__ == '__main__':
    pytest.main([__file__])
