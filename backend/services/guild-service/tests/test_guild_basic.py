"""
Basic tests for guild database operations.
Tests the core functionality that actually exists in the codebase.
"""

import pytest
import boto3
from moto import mock_aws
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import json

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild,
    join_guild, leave_guild, list_guilds, remove_user_from_guild
)
from app.models.guild import GuildType, GuildSettings


class TestGuildBasic:
    """Basic test cases for guild database operations."""
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Test Guild',
            'description': 'A test guild for unit testing',
            'guild_type': GuildType.PUBLIC,
            'tags': ['testing', 'development'],
            'created_by': 'test_user_123',
            'created_by_username': 'testuser'
        }
    
    @pytest.mark.asyncio
    async def test_create_guild_basic(self, sample_guild_data):
        """Test basic guild creation."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Mock the DynamoDB table
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.put_item.return_value = {}
                
                result = await create_guild(**sample_guild_data)
                
                assert result is not None
                assert result.name == sample_guild_data['name']
                assert result.description == sample_guild_data['description']
                assert result.guild_type == sample_guild_data['guild_type']
                assert result.tags == sample_guild_data['tags']
                assert result.created_by == sample_guild_data['created_by']
    
    @pytest.mark.asyncio
    async def test_get_guild_basic(self, sample_guild_data):
        """Test basic guild retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Mock the DynamoDB table
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
                
                result = await get_guild('test_guild_id')
                
                assert result is not None
                assert result.guild_id == 'test_guild_id'
                assert result.name == sample_guild_data['name']
    
    @pytest.mark.asyncio
    async def test_list_guilds_basic(self):
        """Test basic guild listing."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Mock the DynamoDB table
            with patch('app.db.guild_db.table') as mock_table:
                mock_table.scan.return_value = {
                    'Items': [
                        {
                            'PK': 'GUILD#guild_1',
                            'SK': 'METADATA',
                            'guild_id': 'guild_1',
                            'name': 'Guild 1',
                            'description': 'Description 1',
                            'guild_type': 'public',
                            'tags': ['tag1'],
                            'created_by': 'user_1',
                            'created_at': datetime.now().isoformat(),
                            'member_count': 5,
                            'goal_count': 10,
                            'quest_count': 3
                        }
                    ],
                    'Count': 1
                }
                
                result = await list_guilds()
                
                assert result is not None
                assert len(result.guilds) == 1
                assert result.guilds[0].name == 'Guild 1'
    
    @pytest.mark.asyncio
    async def test_join_guild_basic(self):
        """Test basic guild joining."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Mock the DynamoDB table
            with patch('app.db.guild_db.table') as mock_table:
                # First call returns guild metadata, second call returns no member (user not already a member)
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
                
                result = await join_guild('test_guild_id', 'user_123', 'testuser')
                
                assert result is None  # join_guild returns None on success
    
    @pytest.mark.asyncio
    async def test_leave_guild_basic(self):
        """Test basic guild leaving."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Mock the DynamoDB table
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


if __name__ == '__main__':
    pytest.main([__file__])
