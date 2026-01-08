"""
Comprehensive database tests to achieve 90% coverage.
Tests all database functions with various scenarios.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import json

# Import the modules to test
import sys
import os
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
    has_pending_join_request
)
from app.models.guild import GuildType, GuildSettings
from app.models.comment import GuildCommentResponse
from app.models.join_request import JoinRequestStatus


class TestGuildDatabaseComprehensive:
    """Comprehensive test cases for all database operations."""
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Comprehensive Test Guild',
            'description': 'A guild for comprehensive testing',
            'guild_type': GuildType.PUBLIC,
            'tags': ['testing', 'comprehensive'],
            'created_by': 'user_123',
            'created_by_username': 'testuser'
        }
    
    @pytest.mark.asyncio
    async def test_create_guild_comprehensive(self, sample_guild_data):
        """Test comprehensive guild creation."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.put_item.return_value = {}
                
                result = await create_guild(**sample_guild_data)
                
                assert result is not None
                assert result.name == sample_guild_data['name']
                assert result.description == sample_guild_data['description']
                assert result.guild_type == sample_guild_data['guild_type']
                assert result.tags == sample_guild_data['tags']
                assert result.created_by == sample_guild_data['created_by']
                assert result.member_count == 1
                assert result.goal_count == 0
                assert result.quest_count == 0
    
    @pytest.mark.asyncio
    async def test_get_guild_with_members_and_goals(self, sample_guild_data):
        """Test guild retrieval with members and goals."""
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
                        'member_count': 1,
                        'goal_count': 0,
                        'quest_count': 0
                    }
                }
                
                result = await get_guild('test_guild_id', include_members=True, include_goals=True)
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.name == sample_guild_data['name']
    
    @pytest.mark.asyncio
    async def test_update_guild_comprehensive(self, sample_guild_data):
        """Test comprehensive guild update."""
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
                        'member_count': 1,
                        'goal_count': 0,
                        'quest_count': 0
                    }
                }
                mock_table.update_item.return_value = {}
                
                update_data = {
                    'name': 'Updated Guild Name',
                    'description': 'Updated description',
                    'tags': ['updated', 'tags']
                }
                
                result = await update_guild('test_guild_id', sample_guild_data['created_by'], **update_data)
                
                assert result is not None
                assert result.name == update_data['name']
                assert result.description == update_data['description']
                assert result.tags == update_data['tags']
    
    @pytest.mark.asyncio
    async def test_join_guild_approval_type(self, sample_guild_data):
        """Test joining approval-type guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.side_effect = [
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'METADATA',
                            'guild_id': 'test_guild_id',
                            'guild_type': 'approval'
                        }
                    },
                    {}  # No existing member
                ]
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await join_guild('test_guild_id', 'user_456', 'newuser')
                
                assert result is None  # join_guild returns None on success
    
    @pytest.mark.asyncio
    async def test_leave_guild_comprehensive(self, sample_guild_data):
        """Test comprehensive guild leaving."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'role': 'member'
                    }
                }
                mock_table.delete_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await leave_guild('test_guild_id', 'user_123')
                
                assert result is None  # leave_guild returns None on success
    
    @pytest.mark.asyncio
    async def test_create_guild_comment(self, sample_guild_data):
        """Test guild comment creation."""
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
                    'This is a test comment'
                )
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.user_id == 'user_123'
                assert result.content == 'This is a test comment'
    
    @pytest.mark.asyncio
    async def test_get_guild_comments(self, sample_guild_data):
        """Test guild comments retrieval."""
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
                    ]
                }
                
                result = await get_guild_comments('test_guild_id', 'user_123')
                
                assert result is not None
                assert len(result) == 1
                assert result[0].comment_id == 'comment_123'
                assert result[0].content == 'Test comment'
    
    @pytest.mark.asyncio
    async def test_update_guild_comment(self, sample_guild_data):
        """Test guild comment update."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'COMMENT#comment_123',
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'content': 'Original content'
                    }
                }
                mock_table.update_item.return_value = {}
                
                result = await update_guild_comment(
                    'test_guild_id',
                    'comment_123',
                    'user_123',
                    'Updated content'
                )
                
                assert result is not None
                assert result.content == 'Updated content'
                assert result.is_edited is True
    
    @pytest.mark.asyncio
    async def test_delete_guild_comment(self, sample_guild_data):
        """Test guild comment deletion."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'COMMENT#comment_123',
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123'
                    }
                }
                mock_table.delete_item.return_value = {}
                
                result = await delete_guild_comment('test_guild_id', 'comment_123')
                
                assert result is None  # delete_guild_comment returns None on success
    
    @pytest.mark.asyncio
    async def test_like_guild_comment(self, sample_guild_data):
        """Test guild comment liking."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'COMMENT#comment_123',
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'likes': 0
                    }
                }
                mock_table.update_item.return_value = {}
                
                result = await like_guild_comment('test_guild_id', 'comment_123', 'user_123')
                
                assert result is not None
                assert result['likes'] == 1
                assert result['is_liked'] is True
    
    @pytest.mark.asyncio
    async def test_create_join_request(self, sample_guild_data):
        """Test join request creation."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'guild_type': 'approval'
                    }
                }
                mock_table.put_item.return_value = {}
                
                result = await create_join_request(
                    'test_guild_id',
                    'user_456',
                    'newuser',
                    'Please let me join'
                )
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.user_id == 'user_456'
                assert result.status == JoinRequestStatus.PENDING
    
    @pytest.mark.asyncio
    async def test_get_guild_join_requests(self, sample_guild_data):
        """Test join requests retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.query.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'REQUEST#user_456',
                            'request_id': 'request_123',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_456',
                            'username': 'newuser',
                            'status': 'pending',
                            'requested_at': datetime.now().isoformat()
                        }
                    ]
                }
                
                result = await get_guild_join_requests('test_guild_id')
                
                assert result is not None
                assert len(result) == 1
                assert result[0].request_id == 'request_123'
                assert result[0].status == JoinRequestStatus.PENDING
    
    @pytest.mark.asyncio
    async def test_approve_join_request(self, sample_guild_data):
        """Test join request approval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'REQUEST#user_456',
                        'request_id': 'request_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'status': 'pending'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                mock_table.delete_item.return_value = {}
                
                result = await approve_join_request('test_guild_id', 'user_456', 'user_123', 'Welcome!')
                
                assert result is None  # approve_join_request returns None on success
    
    @pytest.mark.asyncio
    async def test_reject_join_request(self, sample_guild_data):
        """Test join request rejection."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'REQUEST#user_456',
                        'request_id': 'request_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'status': 'pending'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await reject_join_request('test_guild_id', 'user_456', 'user_123', 'Not suitable')
                
                assert result is None  # reject_join_request returns None on success
    
    @pytest.mark.asyncio
    async def test_perform_moderation_action(self, sample_guild_data):
        """Test moderation action performance."""
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
                    'Inappropriate behavior'
                )
                
                assert result is None  # perform_moderation_action returns None on success
    
    @pytest.mark.asyncio
    async def test_transfer_guild_ownership(self, sample_guild_data):
        """Test guild ownership transfer."""
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
                
                assert result is None  # transfer_guild_ownership returns None on success
    
    @pytest.mark.asyncio
    async def test_assign_moderator(self, sample_guild_data):
        """Test moderator assignment."""
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
                
                result = await assign_moderator('test_guild_id', 'user_456', 'user_123')
                
                assert result is None  # assign_moderator returns None on success
    
    @pytest.mark.asyncio
    async def test_remove_moderator(self, sample_guild_data):
        """Test moderator removal."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'MEMBER#user_456',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_456',
                        'role': 'moderator'
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await remove_moderator('test_guild_id', 'user_456', 'user_123')
                
                assert result is None  # remove_moderator returns None on success
    
    @pytest.mark.asyncio
    async def test_get_guild_rankings(self, sample_guild_data):
        """Test guild rankings retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#guild_1',
                            'SK': 'METADATA',
                            'guild_id': 'guild_1',
                            'name': 'Guild 1',
                            'position': 1,
                            'total_score': 1000,
                            'member_count': 50,
                            'goal_count': 100,
                            'quest_count': 25,
                            'activity_score': 95,
                            'growth_rate': 0.2,
                            'badges': ['top_performer'],
                            'calculated_at': datetime.now().isoformat()
                        }
                    ]
                }
                
                result = await get_guild_rankings(10)
                
                assert result is not None
                assert len(result) == 1
                assert result[0]['guild_id'] == 'guild_1'
                assert result[0]['position'] == 1
                assert result[0]['total_score'] == 1000
    
    @pytest.mark.asyncio
    async def test_get_guild_analytics(self, sample_guild_data):
        """Test guild analytics retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'member_count': 10,
                        'goal_count': 25,
                        'quest_count': 15
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
                        }
                    ]
                }
                
                result = await get_guild_analytics('test_guild_id')
                
                assert result is not None
                assert result.total_members == 10
                assert result.total_goals == 25
                assert result.total_quests == 15
    
    @pytest.mark.asyncio
    async def test_update_guild_ranking(self, sample_guild_data):
        """Test guild ranking update."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'member_count': 10,
                        'goal_count': 25,
                        'quest_count': 15
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await update_guild_ranking('test_guild_id')
                
                assert result is None  # update_guild_ranking returns None on success
    
    @pytest.mark.asyncio
    async def test_calculate_guild_rankings(self, sample_guild_data):
        """Test guild rankings calculation."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#guild_1',
                            'SK': 'METADATA',
                            'guild_id': 'guild_1',
                            'member_count': 10,
                            'goal_count': 25,
                            'quest_count': 15
                        }
                    ]
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await calculate_guild_rankings()
                
                assert result is None  # calculate_guild_rankings returns None on success
    
    @pytest.mark.asyncio
    async def test_check_guild_name_availability(self, sample_guild_data):
        """Test guild name availability check."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {'Items': []}  # No existing guild with this name
                
                result = await check_guild_name_availability('Available Guild Name')
                
                assert result is True
    
    @pytest.mark.asyncio
    async def test_has_pending_join_request(self, sample_guild_data):
        """Test pending join request check."""
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
                
                result = await has_pending_join_request('test_guild_id', 'user_456')
                
                assert result is True


if __name__ == '__main__':
    pytest.main([__file__])


