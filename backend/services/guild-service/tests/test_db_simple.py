"""
Simple database tests to increase coverage.
Tests core database functions with proper mocking.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import os

# Import the modules to test
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild,
    join_guild, leave_guild, list_guilds,
    create_guild_comment, get_guild_comments, update_guild_comment,
    delete_guild_comment, like_guild_comment,
    create_join_request, get_guild_join_requests, approve_join_request,
    reject_join_request, assign_moderator, remove_moderator,
    get_guild_rankings, get_guild_analytics, update_guild_ranking,
    calculate_guild_rankings, check_guild_name_availability,
    has_pending_join_request
)
from app.models.guild import GuildType, GuildSettings


class TestGuildDatabaseSimple:
    """Simple test cases for database operations."""
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Simple Test Guild',
            'description': 'A guild for simple testing',
            'guild_type': GuildType.PUBLIC,
            'tags': ['testing', 'simple'],
            'created_by': 'user_123',
            'created_by_username': 'testuser'
        }
    
    @pytest.mark.asyncio
    async def test_create_guild_simple(self, sample_guild_data):
        """Test simple guild creation."""
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
    async def test_get_guild_simple(self, sample_guild_data):
        """Test simple guild retrieval."""
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
                        'goal_count': 0,
                        'quest_count': 0,
                        'settings': {}
                    }
                }
                
                result = await get_guild('test_guild_id')
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.name == sample_guild_data['name']
    
    @pytest.mark.asyncio
    async def test_join_guild_public(self, sample_guild_data):
        """Test joining a public guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.side_effect = [
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'METADATA',
                            'guild_id': 'test_guild_id',
                            'guild_type': 'public'
                        }
                    },
                    {}  # No existing member
                ]
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await join_guild('test_guild_id', 'user_456', 'newuser')
                
                assert result is None  # join_guild returns None on success
    
    @pytest.mark.asyncio
    async def test_leave_guild_simple(self, sample_guild_data):
        """Test simple guild leaving."""
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
    async def test_create_guild_comment_simple(self, sample_guild_data):
        """Test simple guild comment creation."""
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
                    'This is a test comment',
                    'member'
                )
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.user_id == 'user_123'
                assert result.content == 'This is a test comment'
    
    @pytest.mark.asyncio
    async def test_get_guild_comments_simple(self, sample_guild_data):
        """Test simple guild comments retrieval."""
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
    async def test_update_guild_comment_simple(self, sample_guild_data):
        """Test simple guild comment update."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'COMMENT#comment_123',
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'username': 'testuser',
                        'user_role': 'member',
                        'content': 'Original content',
                        'created_at': datetime.now().isoformat()
                    }
                }
                mock_table.update_item.return_value = {
                    'Attributes': {
                        'comment_id': 'comment_123',
                        'guild_id': 'test_guild_id',
                        'user_id': 'user_123',
                        'username': 'testuser',
                        'user_role': 'member',
                        'content': 'Updated content',
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'is_edited': True,
                        'likes': 0
                    }
                }
                
                result = await update_guild_comment(
                    'test_guild_id',
                    'comment_123',
                    'Updated content',
                    'user_123'
                )
                
                assert result is not None
                assert result.content == 'Updated content'
                assert result.is_edited is True
    
    @pytest.mark.asyncio
    async def test_delete_guild_comment_simple(self, sample_guild_data):
        """Test simple guild comment deletion."""
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
    async def test_like_guild_comment_simple(self, sample_guild_data):
        """Test simple guild comment liking."""
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
    async def test_create_join_request_simple(self, sample_guild_data):
        """Test simple join request creation."""
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
                    {},  # No existing join request
                    {}   # No existing member
                ]
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
    
    @pytest.mark.asyncio
    async def test_get_guild_join_requests_simple(self, sample_guild_data):
        """Test simple join requests retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.query.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'REQUEST#user_456',
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
                assert result[0].guild_id == 'test_guild_id'
                assert result[0].user_id == 'user_456'
    
    @pytest.mark.asyncio
    async def test_approve_join_request_simple(self, sample_guild_data):
        """Test simple join request approval."""
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
                mock_table.delete_item.return_value = {}
                
                result = await approve_join_request('test_guild_id', 'user_456', 'user_123', 'Welcome!')
                
                assert result is None  # approve_join_request returns None on success
    
    @pytest.mark.asyncio
    async def test_reject_join_request_simple(self, sample_guild_data):
        """Test simple join request rejection."""
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
                
                result = await reject_join_request('test_guild_id', 'user_456', 'user_123', 'Not suitable')
                
                assert result is None  # reject_join_request returns None on success
    
    @pytest.mark.asyncio
    async def test_assign_moderator_simple(self, sample_guild_data):
        """Test simple moderator assignment."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.side_effect = [
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'METADATA',
                            'guild_id': 'test_guild_id'
                        }
                    },
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_123',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_123',
                            'role': 'owner'
                        }
                    },
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_456',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_456',
                            'role': 'member'
                        }
                    }
                ]
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await assign_moderator('test_guild_id', 'user_456', 'user_123')
                
                assert result is None  # assign_moderator returns None on success
    
    @pytest.mark.asyncio
    async def test_remove_moderator_simple(self, sample_guild_data):
        """Test simple moderator removal."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.side_effect = [
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'METADATA',
                            'guild_id': 'test_guild_id'
                        }
                    },
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_123',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_123',
                            'role': 'owner'
                        }
                    },
                    {
                        'Item': {
                            'PK': 'GUILD#test_guild_id',
                            'SK': 'MEMBER#user_456',
                            'guild_id': 'test_guild_id',
                            'user_id': 'user_456',
                            'role': 'moderator'
                        }
                    }
                ]
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await remove_moderator('test_guild_id', 'user_456', 'user_123')
                
                assert result is None  # remove_moderator returns None on success
    
    @pytest.mark.asyncio
    async def test_get_guild_rankings_simple(self, sample_guild_data):
        """Test simple guild rankings retrieval."""
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
                            'guild_type': 'public'
                        }
                    ]
                }
                
                result = await get_guild_rankings(10)
                
                assert result is not None
                assert len(result) == 1
                assert result[0]['guild_id'] == 'guild_1'
    
    @pytest.mark.asyncio
    async def test_get_guild_analytics_simple(self, sample_guild_data):
        """Test simple guild analytics retrieval."""
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
                        }
                    ]
                }
                
                result = await get_guild_analytics('test_guild_id')
                
                assert result is not None
                assert result.total_members == 10
                assert result.total_goals == 25
                assert result.total_quests == 15
    
    @pytest.mark.asyncio
    async def test_update_guild_ranking_simple(self, sample_guild_data):
        """Test simple guild ranking update."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#test_guild_id',
                        'SK': 'METADATA',
                        'guild_id': 'test_guild_id',
                        'member_count': 10,
                        'goal_count': 25,
                        'quest_count': 15,
                        'created_at': datetime.now().isoformat()
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await update_guild_ranking('test_guild_id')
                
                assert result is None  # update_guild_ranking returns None on success
    
    @pytest.mark.asyncio
    async def test_calculate_guild_rankings_simple(self, sample_guild_data):
        """Test simple guild rankings calculation."""
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
                            'quest_count': 15,
                            'created_at': datetime.now().isoformat()
                        }
                    ]
                }
                # Mock the get_item call in update_guild_ranking
                mock_table.get_item.return_value = {
                    'Item': {
                        'PK': 'GUILD#guild_1',
                        'SK': 'METADATA',
                        'guild_id': 'guild_1',
                        'member_count': 10,
                        'goal_count': 25,
                        'quest_count': 15,
                        'created_at': datetime.now().isoformat()
                    }
                }
                mock_table.put_item.return_value = {}
                mock_table.update_item.return_value = {}
                
                result = await calculate_guild_rankings()
                
                assert result is None  # calculate_guild_rankings returns None on success
    
    @pytest.mark.asyncio
    async def test_check_guild_name_availability_simple(self, sample_guild_data):
        """Test simple guild name availability check."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {'Items': []}  # No existing guild with this name
                
                result = await check_guild_name_availability('Available Guild Name')
                
                assert result is True
    
    @pytest.mark.asyncio
    async def test_has_pending_join_request_simple(self, sample_guild_data):
        """Test simple pending join request check."""
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
