"""
Unit tests for guild database operations.
Tests the guild_db.py module functionality.
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


class TestGuildDatabase:
    """Test cases for guild database operations."""
    
    @pytest.fixture
    def dynamodb_table(self):
        """Create a mock DynamoDB table for testing."""
        with mock_aws():
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            table = dynamodb.create_table(
                TableName='gg_guild',
                KeySchema=[
                    {'AttributeName': 'PK', 'KeyType': 'HASH'},
                    {'AttributeName': 'SK', 'KeyType': 'RANGE'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'PK', 'AttributeType': 'S'},
                    {'AttributeName': 'SK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI1SK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI2PK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI2SK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI3PK', 'AttributeType': 'S'},
                    {'AttributeName': 'GSI3SK', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'GSI1',
                        'KeySchema': [
                            {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                            {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    },
                    {
                        'IndexName': 'GSI2',
                        'KeySchema': [
                            {'AttributeName': 'GSI2PK', 'KeyType': 'HASH'},
                            {'AttributeName': 'GSI2SK', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    },
                    {
                        'IndexName': 'GSI3',
                        'KeySchema': [
                            {'AttributeName': 'GSI3PK', 'KeyType': 'HASH'},
                            {'AttributeName': 'GSI3SK', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            yield table
    
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
    async def test_create_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild creation."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            result = await create_guild(**sample_guild_data)
            
            assert result.guild_id is not None
            assert result.name == sample_guild_data['name']
            assert result.description == sample_guild_data['description']
            assert result.guild_type == sample_guild_data['guild_type']
            assert result.tags == sample_guild_data['tags']
            assert result.created_by == sample_guild_data['created_by']
            assert result.member_count == 1
            assert result.goal_count == 0
            assert result.quest_count == 0
    
    @pytest.mark.asyncio
    async def test_create_guild_approval_type(self, dynamodb_table):
        """Test guild creation with approval type sets require_approval to true."""
        guild_data = {
            'name': 'Approval Guild',
            'description': 'A guild requiring approval',
            'guild_type': GuildType.APPROVAL,
            'tags': ['exclusive'],
            'created_by': 'test_user_123',
            'created_by_username': 'testuser'
        }
        
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            result = await create_guild(**guild_data)
            
            assert result.guild_type == GuildType.APPROVAL
            assert result.settings.require_approval is True
    
    @pytest.mark.asyncio
    async def test_get_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild first
            created_guild = await create_guild(**sample_guild_data)
            
            # Retrieve guild
            retrieved_guild = await get_guild(created_guild.guild_id)
            
            assert retrieved_guild is not None
            assert retrieved_guild.guild_id == created_guild.guild_id
            assert retrieved_guild.name == sample_guild_data['name']
    
    @pytest.mark.asyncio
    async def test_get_guild_not_found(self, dynamodb_table):
        """Test guild retrieval when guild doesn't exist."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            result = await get_guild('nonexistent_guild_id')
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_guild_with_members(self, dynamodb_table, sample_guild_data):
        """Test guild retrieval with members included."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Retrieve guild with members
            retrieved_guild = await get_guild(created_guild.guild_id, include_members=True)
            
            assert retrieved_guild is not None
            assert len(retrieved_guild.members) == 1
            assert retrieved_guild.members[0].user_id == sample_guild_data['created_by']
            assert retrieved_guild.members[0].role == 'owner'
    
    @pytest.mark.asyncio
    async def test_update_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild update."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Update guild
            update_data = {
                'name': 'Updated Guild Name',
                'description': 'Updated description',
                'tags': ['updated', 'tags']
            }
            
            updated_guild = await update_guild(
                created_guild.guild_id,
                sample_guild_data['created_by'],
                **update_data
            )
            
            assert updated_guild.name == update_data['name']
            assert updated_guild.description == update_data['description']
            assert updated_guild.tags == update_data['tags']
    
    @pytest.mark.asyncio
    async def test_update_guild_insufficient_permissions(self, dynamodb_table, sample_guild_data):
        """Test guild update with insufficient permissions."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Try to update with different user
            with pytest.raises(GuildPermissionError):
                await update_guild(
                    created_guild.guild_id,
                    'different_user',
                    name='Unauthorized Update'
                )
    
    @pytest.mark.asyncio
    async def test_join_guild_public_success(self, dynamodb_table, sample_guild_data):
        """Test successful join to public guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create public guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Join guild
            result = await join_guild(created_guild.guild_id, 'new_user_456', 'newuser')
            
            assert result is True
            
            # Verify member was added
            members = await get_guild_members(created_guild.guild_id)
            assert len(members.members) == 2  # Owner + new member
    
    @pytest.mark.asyncio
    async def test_join_guild_already_member(self, dynamodb_table, sample_guild_data):
        """Test joining guild when already a member."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Try to join again
            with pytest.raises(GuildValidationError):
                await join_guild(created_guild.guild_id, sample_guild_data['created_by'], 'testuser')
    
    @pytest.mark.asyncio
    async def test_leave_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild leave."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild and add member
            created_guild = await create_guild(**sample_guild_data)
            await join_guild(created_guild.guild_id, 'member_user', 'memberuser')
            
            # Leave guild
            result = await leave_guild(created_guild.guild_id, 'member_user')
            assert result is True
            
            # Verify member was removed
            members = await get_guild_members(created_guild.guild_id)
            assert len(members.members) == 1  # Only owner left
    
    @pytest.mark.asyncio
    async def test_leave_guild_owner_cannot_leave(self, dynamodb_table, sample_guild_data):
        """Test that guild owner cannot leave."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Try to leave as owner
            with pytest.raises(GuildValidationError):
                await leave_guild(created_guild.guild_id, sample_guild_data['created_by'])
    
    @pytest.mark.asyncio
    async def test_add_goal_to_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful goal addition to guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Add goal
            result = await add_goal_to_guild(
                created_guild.guild_id,
                'goal_123',
                sample_guild_data['created_by'],
                'Test Goal',
                'active'
            )
            
            assert result is True
            
            # Verify goal count increased
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.goal_count == 1
    
    @pytest.mark.asyncio
    async def test_remove_goal_from_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful goal removal from guild."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild and add goal
            created_guild = await create_guild(**sample_guild_data)
            await add_goal_to_guild(
                created_guild.guild_id,
                'goal_123',
                sample_guild_data['created_by'],
                'Test Goal',
                'active'
            )
            
            # Remove goal
            result = await remove_goal_from_guild(created_guild.guild_id, 'goal_123')
            assert result is True
            
            # Verify goal count decreased
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.goal_count == 0
    
    @pytest.mark.asyncio
    async def test_list_guilds_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild listing."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create multiple guilds
            guild1 = await create_guild(**sample_guild_data)
            
            guild2_data = sample_guild_data.copy()
            guild2_data['name'] = 'Second Guild'
            guild2 = await create_guild(**guild2_data)
            
            # List guilds
            result = await list_guilds()
            
            assert len(result.guilds) >= 2
            guild_names = [g.name for g in result.guilds]
            assert 'Test Guild' in guild_names
            assert 'Second Guild' in guild_names
    
    @pytest.mark.asyncio
    async def test_list_guilds_with_search(self, dynamodb_table, sample_guild_data):
        """Test guild listing with search filter."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            await create_guild(**sample_guild_data)
            
            # Search for guild
            result = await list_guilds(search='Test')
            
            assert len(result.guilds) == 1
            assert result.guilds[0].name == 'Test Guild'
    
    @pytest.mark.asyncio
    async def test_list_guilds_with_tags(self, dynamodb_table, sample_guild_data):
        """Test guild listing with tag filter."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            await create_guild(**sample_guild_data)
            
            # Filter by tags
            result = await list_guilds(tags=['testing'])
            
            assert len(result.guilds) == 1
            assert 'testing' in result.guilds[0].tags
    
    @pytest.mark.asyncio
    async def test_get_guild_members_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild members retrieval."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild and add members
            created_guild = await create_guild(**sample_guild_data)
            await join_guild(created_guild.guild_id, 'member1', 'member1user')
            await join_guild(created_guild.guild_id, 'member2', 'member2user')
            
            # Get members
            result = await get_guild_members(created_guild.guild_id)
            
            assert len(result.members) == 3  # Owner + 2 members
            user_ids = [m.user_id for m in result.members]
            assert sample_guild_data['created_by'] in user_ids
            assert 'member1' in user_ids
            assert 'member2' in user_ids
    
    @pytest.mark.asyncio
    async def test_remove_guild_member_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild member removal."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild and add member
            created_guild = await create_guild(**sample_guild_data)
            await join_guild(created_guild.guild_id, 'member_user', 'memberuser')
            
            # Remove member
            result = await remove_guild_member(created_guild.guild_id, 'member_user')
            assert result is True
            
            # Verify member was removed
            members = await get_guild_members(created_guild.guild_id)
            assert len(members.members) == 1  # Only owner left
    
    @pytest.mark.asyncio
    async def test_remove_guild_member_owner_cannot_be_removed(self, dynamodb_table, sample_guild_data):
        """Test that guild owner cannot be removed."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Try to remove owner
            with pytest.raises(GuildValidationError):
                await remove_guild_member(created_guild.guild_id, sample_guild_data['created_by'])
    
    @pytest.mark.asyncio
    async def test_delete_guild_success(self, dynamodb_table, sample_guild_data):
        """Test successful guild deletion."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Delete guild
            result = await delete_guild(created_guild.guild_id, sample_guild_data['created_by'])
            assert result is True
            
            # Verify guild is deleted
            deleted_guild = await get_guild(created_guild.guild_id)
            assert deleted_guild is None
    
    @pytest.mark.asyncio
    async def test_delete_guild_insufficient_permissions(self, dynamodb_table, sample_guild_data):
        """Test guild deletion with insufficient permissions."""
        with patch.dict(os.environ, {'GUILD_TABLE_NAME': 'gg_guild'}):
            # Create guild
            created_guild = await create_guild(**sample_guild_data)
            
            # Try to delete with different user
            with pytest.raises(GuildPermissionError):
                await delete_guild(created_guild.guild_id, 'different_user')


if __name__ == '__main__':
    pytest.main([__file__])
