"""
Extended database tests to increase coverage to 90%.
Tests additional database functions and edge cases.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import json
import os

# Import the modules to test
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild,
    join_guild, leave_guild, list_guilds, remove_user_from_guild,
    create_guild_comment, get_guild_comments, update_guild_comment,
    delete_guild_comment, like_guild_comment,
    create_join_request, get_guild_join_requests, update_join_request_status,
    approve_join_request, reject_join_request,
    perform_moderation_action, transfer_guild_ownership,
    assign_moderator, remove_moderator,
    get_guild_rankings, get_guild_analytics, update_guild_ranking,
    calculate_guild_rankings, check_guild_name_availability,
    has_pending_join_request, check_user_comment_permissions,
    generate_avatar_signed_url, build_guild_response
)
from app.models.guild import GuildType, GuildSettings
from app.models.comment import GuildCommentResponse
from app.models.join_request import JoinRequestStatus


class TestGuildDatabaseExtended:
    """Extended test cases for database operations to increase coverage."""
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Extended Test Guild',
            'description': 'A guild for extended testing',
            'guild_type': GuildType.PUBLIC,
            'tags': ['testing', 'extended'],
            'created_by': 'user_123',
            'created_by_username': 'testuser'
        }
    
    @pytest.mark.asyncio
    async def test_create_guild_with_avatar(self, sample_guild_data):
        """Test guild creation with avatar."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.put_item.return_value = {}
                
                result = await create_guild(
                    avatar_key='guild_123/avatar.jpg',
                    **sample_guild_data
                )
                
                assert result is not None
                assert result.name == sample_guild_data['name']
                assert result.avatar_key == 'guild_123/avatar.jpg'
    
    @pytest.mark.asyncio
    async def test_get_guild_with_goals_and_quests(self, sample_guild_data):
        """Test guild retrieval with goals and quests."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'name': sample_guild_data['name'],
                        'description': sample_guild_data['description'],
                        'guild_type': sample_guild_data['guild_type'],
                        'tags': sample_guild_data['tags'],
                        'created_by': sample_guild_data['created_by'],
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'member_count': 1,
                        'goal_count': 5,
                        'quest_count': 3,
                        'settings': {}
                    }
                }
                mock_table.query.side_effect = [
                    {'Items': []},  # Members
                    {'Items': []},  # Goals
                    {'Items': []}   # Quests
                ]
                
                result = await get_guild('test_guild_id', include_members=True, include_goals=True, include_quests=True)
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.name == sample_guild_data['name']
                assert result.goal_count == 5
                assert result.quest_count == 3
    
    @pytest.mark.asyncio
    async def test_update_guild_with_settings(self, sample_guild_data):
        """Test guild update with settings."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'role': 'owner'
                    }
                }
                mock_table.update_item.return_value = {}
                
                update_data = {
                    'name': 'Updated Guild Name',
                    'settings': {
                        'allow_join_requests': False,
                        'require_approval': True,
                        'allow_comments': False
                    }
                }
                
                result = await update_guild('test_guild_id', 'user_123', **update_data)
                
                assert result is not None
                assert result.name == update_data['name']
    
    @pytest.mark.asyncio
    async def test_delete_guild_with_cleanup(self, sample_guild_data):
        """Test guild deletion with cleanup."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'role': 'owner'
                    }
                }
                mock_table.delete_item.return_value = {}
                mock_table.scan.return_value = {'Items': []}
                
                result = await delete_guild('test_guild_id', 'user_123')
                
                assert result is True
    
    @pytest.mark.asyncio
    async def test_join_guild_private_type(self, sample_guild_data):
        """Test joining private guild (should fail)."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'guild_type': 'private'
                    }
                }
                
                with pytest.raises(Exception):  # Should raise GuildPermissionError
                    await join_guild('test_guild_id', 'user_456', 'newuser')
    
    @pytest.mark.asyncio
    async def test_leave_guild_as_owner(self, sample_guild_data):
        """Test leaving guild as owner (should fail)."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'role': 'owner'
                    }
                }
                
                with pytest.raises(Exception):  # Should raise GuildValidationError
                    await leave_guild('test_guild_id', 'user_123')
    
    @pytest.mark.asyncio
    async def test_list_guilds_with_filters(self, sample_guild_data):
        """Test guild listing with various filters."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#guild_1',
                            'SK': 'METADATA',
                            'guild_id': 'guild_1',
                            'name': 'Test Guild 1',
                            'guild_type': 'public',
                            'tags': ['testing'],
                            'member_count': 10
                        }
                    ]
                }
                
                result = await list_guilds(
                    search='test',
                    tags=['testing'],
                    guild_type='public',
                    limit=10,
                    next_token=None
                )
                
                assert result is not None
                assert len(result.guilds) == 1
                assert result.guilds[0].guild_id == 'guild_1'
    
    @pytest.mark.asyncio
    async def test_remove_user_from_guild(self, sample_guild_data):
        """Test removing user from guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_456',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'role': 'member'
                    }
                }
                mock_table.delete_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await remove_user_from_guild('test_guild_id', 'user_456', 'user_123')
                
                assert result is True
    
    @pytest.mark.asyncio
    async def test_create_guild_comment_with_reply(self, sample_guild_data):
        """Test creating a reply comment."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'guild_type': 'public'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await create_guild_comment(
                    'test_guild_id',
                    'user_123',
                    'testuser',
                    'This is a reply',
                    'member',
                    parent_comment_id='comment_123'
                )
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.content == 'This is a reply'
                assert result.parent_comment_id == 'comment_123'
    
    @pytest.mark.asyncio
    async def test_get_guild_comments_with_pagination(self, sample_guild_data):
        """Test guild comments retrieval with pagination."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.query.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'COMMENT#comment_123',
                            'comment_id': 'comment_123',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_123',
                            'username': 'testuser',
                            'content': 'Test comment',
                            'created_at': datetime.now().isoformat(),
                            'likes': 0,
                            'is_edited': False
                        }
                    ],
                    'LastEvaluatedKey': {'PK': 'GUILD#test_guild_id', 'SK': 'COMMENT#comment_123'}
                }
                
                result = await get_guild_comments('test_guild_id', 'user_123', limit=10, next_token='token_123')
                
                assert result is not None
                assert len(result) == 1
                assert result[0].comment_id == 'comment_123'
    
    @pytest.mark.asyncio
    async def test_like_guild_comment_unlike(self, sample_guild_data):
        """Test unliking a guild comment."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'COMMENT#comment_123',
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'likes': 1
                    }
                }
                mock_table.update_item.return_value = {}
                
                result = await like_guild_comment('test_guild_id', 'comment_123', 'user_123')
                
                assert result is not None
                assert result['likes'] == 0
                assert result['is_liked'] is False
    
    @pytest.mark.asyncio
    async def test_update_join_request_status(self, sample_guild_data):
        """Test updating join request status."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'REQUEST#user_456',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'status': 'pending'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await update_join_request_status(
                    'test_guild_id',
                    'user_456',
                    'approved',
                    'user_123',
                    'Welcome to the guild!'
                )
                
                assert result is None
    
    @pytest.mark.asyncio
    async def test_perform_moderation_action_block_user(self, sample_guild_data):
        """Test performing moderation action to block user."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_456',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'role': 'member'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await perform_moderation_action(
                    'test_guild_id',
                    'block_user',
                    'user_123',
                    'user_456',
                    'Inappropriate behavior',
                    'user_123'
                )
                
                assert result is None
    
    @pytest.mark.asyncio
    async def test_transfer_guild_ownership(self, sample_guild_data):
        """Test transferring guild ownership."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_456',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'role': 'member'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await transfer_guild_ownership('test_guild_id', 'user_123', 'user_456', 'Transferring ownership')
                
                assert result is None
    
    @pytest.mark.asyncio
    async def test_check_user_comment_permissions(self, sample_guild_data):
        """Test checking user comment permissions."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'role': 'member',
                        'is_blocked': False,
                        'can_comment': True
                    }
                }
                
                is_blocked, can_comment = await check_user_comment_permissions('test_guild_id', 'user_123')
                
                assert is_blocked is False
                assert can_comment is True
    
    @pytest.mark.asyncio
    async def test_generate_avatar_signed_url(self, sample_guild_data):
        """Test generating avatar signed URL."""
        with patch('app.db.guild_db.s3_client') as mock_s3:
            mock_s3.generate_presigned_url.return_value = 'https://s3.amazonaws.com/signed-url'
            
            result = generate_avatar_signed_url('guild_123/avatar.jpg')
            
            assert result == 'https://s3.amazonaws.com/signed-url'
    
    @pytest.mark.asyncio
    async def test_build_guild_response_with_permissions(self, sample_guild_data):
        """Test building guild response with user permissions."""
        item = {
            'guild_id': 'test_guild_id',
            'name': 'Test Guild',
            'description': 'Test description',
            'guild_type': 'public',
            'created_by': 'user_123',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'member_count': 10,
            'goal_count': 5,
            'quest_count': 3,
            'settings': {}
        }
        
        members = [
            MagicMock(user_id='user_123', role='owner'),
            MagicMock(user_id='user_456', role='member')
        ]
        
        result = build_guild_response(item, members=members, current_user_id='user_123')
        
        assert result is not None
        assert result.guild_id == 'test_guild_id'
        assert result.name == 'Test Guild'
        assert result.user_permissions is not None
        assert result.user_permissions.is_member is True
        assert result.user_permissions.is_owner is True
    
    @pytest.mark.asyncio
    async def test_get_guild_analytics_with_leaderboard(self, sample_guild_data):
        """Test guild analytics with member leaderboard."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'name': 'Test Guild',
                        'description': 'Test description',
                        'guild_type': 'public',
                        'created_by': 'user_123',
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'member_count': 10,
                        'goal_count': 25,
                        'quest_count': 15,
                        'settings': {}
                    }
                }
                mock_table.query.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_1',
                            'user_id': 'user_1',
                            'username': 'user1',
                            'goals_completed': 5,
                            'quests_completed': 3,
                            'activity_score': 85
                        },
                        {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_2',
                            'user_id': 'user_2',
                            'username': 'user2',
                            'goals_completed': 3,
                            'quests_completed': 2,
                            'activity_score': 70
                        }
                    ]
                }
                
                result = await get_guild_analytics('test_guild_id')
                
                assert result is not None
                assert result.total_members == 10
                assert result.total_goals == 25
                assert result.total_quests == 15
                assert len(result.member_leaderboard) == 2
                assert result.member_leaderboard[0].activity_score == 85
                assert result.member_leaderboard[1].activity_score == 70
    
    @pytest.mark.asyncio
    async def test_get_guild_rankings_with_badges(self, sample_guild_data):
        """Test guild rankings with badges."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#guild_1',
                            'SK': 'METADATA',
                            'guild_id': 'guild_1',
                            'name': 'Guild 1',
                            'member_count': 50,
                            'created_at': datetime.now().isoformat(),
                            'guild_type': 'public',
                            'badges': ['top_performer', 'active']
                        }
                    ]
                }
                
                result = await get_guild_rankings(10)
                
                assert result is not None
                assert len(result) == 1
                assert result[0]['guild_id'] == 'guild_1'
                assert 'top_performer' in result[0]['badges']
                assert 'active' in result[0]['badges']


if __name__ == '__main__':
    pytest.main([__file__])


