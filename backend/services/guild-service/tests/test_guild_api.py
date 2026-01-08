"""
Unit tests for guild API endpoints.
Tests the FastAPI endpoints in main.py.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import json
from datetime import datetime

# Import the FastAPI app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.models.guild import GuildType, GuildSettings


class TestGuildAPI:
    """Test cases for guild API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Test Guild',
            'description': 'A test guild for API testing',
            'guild_type': 'public',
            'tags': ['testing', 'api'],
            'settings': {
                'allow_join_requests': True,
                'require_approval': False,
                'allow_comments': True
            }
        }
    
    @pytest.fixture
    def mock_auth_headers(self):
        """Mock authentication headers."""
        return {
            'Authorization': 'Bearer mock_token',
            'x-api-key': 'mock_api_key'
        }
    
    def test_create_guild_success(self, client, sample_guild_data, mock_auth_headers):
        """Test successful guild creation via API."""
        with patch('app.api.guild.create_guild') as mock_create:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = sample_guild_data['name']
            mock_guild.description = sample_guild_data['description']
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.tags = sample_guild_data['tags']
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
            assert data['guild_type'] == 'public'
            assert data['tags'] == sample_guild_data['tags']
            assert data['member_count'] == 1
    
    def test_create_guild_validation_error(self, client, mock_auth_headers):
        """Test guild creation with validation error."""
        invalid_data = {
            'name': '',  # Empty name should fail validation
            'guild_type': 'invalid_type'
        }
        
        response = client.post(
            '/guilds',
            json=invalid_data,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_guild_unauthorized(self, client, sample_guild_data):
        """Test guild creation without authentication."""
        response = client.post(
            '/guilds',
            json=sample_guild_data
        )
        
        assert response.status_code == 401  # Unauthorized
    
    def test_get_guild_success(self, client, mock_auth_headers):
        """Test successful guild retrieval via API."""
        with patch('app.api.guild.get_guild') as mock_get:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = 'Test Guild'
            mock_guild.description = 'Test description'
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.tags = ['testing']
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
            
            mock_get.return_value = mock_guild
            
            response = client.get(
                '/guilds/guild_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['guild_id'] == 'guild_123'
            assert data['name'] == 'Test Guild'
    
    def test_get_guild_not_found(self, client, mock_auth_headers):
        """Test guild retrieval when guild doesn't exist."""
        with patch('app.api.guild.get_guild') as mock_get:
            mock_get.return_value = None
            
            response = client.get(
                '/guilds/nonexistent_guild',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 404
    
    def test_update_guild_success(self, client, mock_auth_headers):
        """Test successful guild update via API."""
        with patch('app.api.guild.update_guild') as mock_update:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = 'Updated Guild'
            mock_guild.description = 'Updated description'
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.tags = ['updated']
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
            
            mock_update.return_value = mock_guild
            
            update_data = {
                'name': 'Updated Guild',
                'description': 'Updated description',
                'tags': ['updated']
            }
            
            response = client.put(
                '/guilds/guild_123',
                json=update_data,
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['name'] == 'Updated Guild'
            assert data['description'] == 'Updated description'
    
    def test_update_guild_insufficient_permissions(self, client, mock_auth_headers):
        """Test guild update with insufficient permissions."""
        with patch('app.api.guild.update_guild') as mock_update:
            from app.db.guild_db import GuildPermissionError
            mock_update.side_effect = GuildPermissionError("Insufficient permissions")
            
            update_data = {'name': 'Unauthorized Update'}
            
            response = client.put(
                '/guilds/guild_123',
                json=update_data,
                headers=mock_auth_headers
            )
            
            assert response.status_code == 403
    
    def test_delete_guild_success(self, client, mock_auth_headers):
        """Test successful guild deletion via API."""
        with patch('app.api.guild.delete_guild') as mock_delete:
            mock_delete.return_value = True
            
            response = client.delete(
                '/guilds/guild_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_delete_guild_insufficient_permissions(self, client, mock_auth_headers):
        """Test guild deletion with insufficient permissions."""
        with patch('app.api.guild.delete_guild') as mock_delete:
            from app.db.guild_db import GuildPermissionError
            mock_delete.side_effect = GuildPermissionError("Insufficient permissions")
            
            response = client.delete(
                '/guilds/guild_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 403
    
    def test_join_guild_success(self, client, mock_auth_headers):
        """Test successful guild join via API."""
        with patch('app.api.guild.join_guild') as mock_join:
            mock_join.return_value = True
            
            response = client.post(
                '/guilds/guild_123/join',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_join_guild_already_member(self, client, mock_auth_headers):
        """Test joining guild when already a member."""
        with patch('app.api.guild.join_guild') as mock_join:
            from app.db.guild_db import GuildValidationError
            mock_join.side_effect = GuildValidationError("Already a member")
            
            response = client.post(
                '/guilds/guild_123/join',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 400
    
    def test_leave_guild_success(self, client, mock_auth_headers):
        """Test successful guild leave via API."""
        with patch('app.api.guild.leave_guild') as mock_leave:
            mock_leave.return_value = True
            
            response = client.post(
                '/guilds/guild_123/leave',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_leave_guild_owner_cannot_leave(self, client, mock_auth_headers):
        """Test that guild owner cannot leave."""
        with patch('app.api.guild.leave_guild') as mock_leave:
            from app.db.guild_db import GuildValidationError
            mock_leave.side_effect = GuildValidationError("Owner cannot leave guild")
            
            response = client.post(
                '/guilds/guild_123/leave',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 400
    
    def test_list_guilds_success(self, client, mock_auth_headers):
        """Test successful guild listing via API."""
        with patch('app.api.guild.list_guilds') as mock_list:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = 'Test Guild'
            mock_guild.description = 'Test description'
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.tags = ['testing']
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
    
    def test_list_guilds_with_filters(self, client, mock_auth_headers):
        """Test guild listing with search and tag filters."""
        with patch('app.api.guild.list_guilds') as mock_list:
            mock_result = MagicMock()
            mock_result.guilds = []
            mock_result.total_count = 0
            mock_result.next_token = None
            
            mock_list.return_value = mock_result
            
            response = client.get(
                '/guilds?search=test&tags=testing&guild_type=public',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['total_count'] == 0
    
    def test_get_guild_members_success(self, client, mock_auth_headers):
        """Test successful guild members retrieval via API."""
        with patch('app.api.guild.get_guild_members') as mock_get_members:
            mock_member = MagicMock()
            mock_member.user_id = 'user_123'
            mock_member.username = 'testuser'
            mock_member.role = 'owner'
            mock_member.joined_at = datetime.now()
            mock_member.is_blocked = False
            mock_member.can_comment = True
            
            mock_result = MagicMock()
            mock_result.members = [mock_member]
            mock_result.total_count = 1
            mock_result.next_token = None
            
            mock_get_members.return_value = mock_result
            
            response = client.get(
                '/guilds/guild_123/members',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data['members']) == 1
            assert data['members'][0]['user_id'] == 'user_123'
            assert data['members'][0]['role'] == 'owner'
    
    def test_add_goal_to_guild_success(self, client, mock_auth_headers):
        """Test successful goal addition to guild via API."""
        with patch('app.api.guild.add_goal_to_guild') as mock_add_goal:
            mock_add_goal.return_value = True
            
            goal_data = {
                'goal_id': 'goal_123',
                'title': 'Test Goal',
                'status': 'active'
            }
            
            response = client.post(
                '/guilds/guild_123/goals',
                json=goal_data,
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_remove_goal_from_guild_success(self, client, mock_auth_headers):
        """Test successful goal removal from guild via API."""
        with patch('app.api.guild.remove_goal_from_guild') as mock_remove_goal:
            mock_remove_goal.return_value = True
            
            response = client.delete(
                '/guilds/guild_123/goals/goal_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_remove_guild_member_success(self, client, mock_auth_headers):
        """Test successful guild member removal via API."""
        with patch('app.api.guild.remove_guild_member') as mock_remove_member:
            mock_remove_member.return_value = True
            
            response = client.delete(
                '/guilds/guild_123/members/user_123',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
    
    def test_remove_guild_member_owner_cannot_be_removed(self, client, mock_auth_headers):
        """Test that guild owner cannot be removed."""
        with patch('app.api.guild.remove_guild_member') as mock_remove_member:
            from app.db.guild_db import GuildValidationError
            mock_remove_member.side_effect = GuildValidationError("Owner cannot be removed")
            
            response = client.delete(
                '/guilds/guild_123/members/owner_user',
                headers=mock_auth_headers
            )
            
            assert response.status_code == 400


if __name__ == '__main__':
    pytest.main([__file__])


