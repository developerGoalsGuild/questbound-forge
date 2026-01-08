"""
Comprehensive AWS-mocked tests for improved coverage.
Mocks DynamoDB, S3, and other AWS services to test the actual business logic.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os
from datetime import datetime, timezone
from moto import mock_aws
import boto3

# Add the parent directory to the path to import common module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Now import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild,
    join_guild, leave_guild, list_guilds,
    create_guild_comment, get_guild_comments, update_guild_comment, delete_guild_comment,
    create_join_request, get_guild_join_requests, approve_join_request, reject_join_request,
    assign_moderator, remove_moderator, get_guild_rankings, get_guild_analytics,
    update_guild_ranking, calculate_guild_rankings, check_guild_name_availability,
    has_pending_join_request
)
from app.models.guild import GuildType, GuildSettings, GuildMemberRole
from app.models.comment import GuildCommentResponse
from app.models.analytics import GuildAnalyticsResponse, GuildRankingResponse


class TestAWSMocked:
    """AWS-mocked tests for comprehensive coverage."""
    
    @pytest.fixture
    def mock_dynamodb(self):
        """Mock DynamoDB table."""
        with mock_aws():
            # Create a mock DynamoDB table
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            table = dynamodb.create_table(
                TableName='gg_guild',
                KeySchema=[
                    {'AttributeName': 'PK', 'KeyType': 'HASH'},
                    {'AttributeName': 'SK', 'KeyType': 'RANGE'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'PK', 'AttributeType': 'S'},
                    {'AttributeName': 'SK', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            yield table
    
    @pytest.fixture
    def sample_guild_data(self):
        """Sample guild data for testing."""
        return {
            'name': 'Test Guild',
            'description': 'A test guild for comprehensive testing',
            'guild_type': GuildType.PUBLIC,
            'tags': ['testing', 'comprehensive'],
            'settings': GuildSettings(
                allow_join_requests=True,
                require_approval=False,
                allow_comments=True
            )
        }
    
    @pytest.fixture
    def sample_user(self):
        """Sample user data for testing."""
        return {
            'user_id': 'user_123',
            'username': 'testuser',
            'email': 'test@example.com',
            'role': 'member'
        }
    
    @pytest.mark.asyncio
    async def test_create_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild creation with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            result = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            assert result is not None
            assert result.guild_id is not None
            assert result.name == sample_guild_data['name']
            assert result.description == sample_guild_data['description']
            assert result.guild_type == sample_guild_data['guild_type']
            assert result.created_by == sample_user['user_id']
            assert result.member_count == 1
            assert result.goal_count == 0
            assert result.quest_count == 0
            assert result.created_at is not None
            assert result.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_get_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild retrieval with mocked DynamoDB."""
        # First create a guild
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Then retrieve it
            result = await get_guild(created_guild.guild_id)
            
            assert result is not None
            assert result.guild_id == created_guild.guild_id
            assert result.name == sample_guild_data['name']
            assert result.description == sample_guild_data['description']
            assert result.guild_type == sample_guild_data['guild_type']
    
    @pytest.mark.asyncio
    async def test_update_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild update with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Then update it
            updated_guild = await update_guild(
                guild_id=created_guild.guild_id,
                name='Updated Guild Name',
                description='Updated description',
                guild_type=GuildType.PRIVATE,
                tags=['updated', 'guild']
            )
            
            assert updated_guild is not None
            assert updated_guild.guild_id == created_guild.guild_id
            assert updated_guild.name == 'Updated Guild Name'
            assert updated_guild.description == 'Updated description'
            assert updated_guild.guild_type == GuildType.PRIVATE
            assert 'updated' in updated_guild.tags
    
    @pytest.mark.asyncio
    async def test_join_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild joining with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Join the guild
            result = await join_guild(created_guild.guild_id, 'user_456')
            
            assert result is True
            
            # Verify the guild now has 2 members
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.member_count == 2
    
    @pytest.mark.asyncio
    async def test_leave_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild leaving with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Join the guild
            await join_guild(created_guild.guild_id, 'user_456')
            
            # Leave the guild
            result = await leave_guild(created_guild.guild_id, 'user_456')
            
            assert result is True
            
            # Verify the guild now has 1 member again
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.member_count == 1
    
    @pytest.mark.asyncio
    async def test_list_guilds_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild listing with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create multiple guilds
            guild1 = await create_guild(
                name='Guild 1',
                description='First guild',
                guild_type=GuildType.PUBLIC,
                created_by=sample_user['user_id'],
                tags=['test1'],
                settings=GuildSettings()
            )
            
            guild2 = await create_guild(
                name='Guild 2',
                description='Second guild',
                guild_type=GuildType.PRIVATE,
                created_by='user_456',
                tags=['test2'],
                settings=GuildSettings()
            )
            
            # List guilds
            result = await list_guilds(limit=10)
            
            assert result is not None
            assert len(result.guilds) >= 2
            assert any(g.guild_id == guild1.guild_id for g in result.guilds)
            assert any(g.guild_id == guild2.guild_id for g in result.guilds)
    
    @pytest.mark.asyncio
    async def test_create_guild_comment_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive comment creation with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Create a comment
            comment = await create_guild_comment(
                guild_id=created_guild.guild_id,
                user_id=sample_user['user_id'],
                username=sample_user['username'],
                content='This is a test comment',
                user_role='member'
            )
            
            assert comment is not None
            assert comment.comment_id is not None
            assert comment.guild_id == created_guild.guild_id
            assert comment.user_id == sample_user['user_id']
            assert comment.username == sample_user['username']
            assert comment.content == 'This is a test comment'
            assert comment.likes == 0
            assert comment.is_liked is False
            assert comment.is_edited is False
            assert comment.user_role == 'member'
    
    @pytest.mark.asyncio
    async def test_get_guild_comments_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive comment retrieval with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Create multiple comments
            comment1 = await create_guild_comment(
                guild_id=created_guild.guild_id,
                user_id=sample_user['user_id'],
                username=sample_user['username'],
                content='First comment',
                user_role='member'
            )
            
            comment2 = await create_guild_comment(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                username='otheruser',
                content='Second comment',
                user_role='member'
            )
            
            # Get comments
            result = await get_guild_comments(created_guild.guild_id)
            
            assert result is not None
            assert len(result.comments) >= 2
            assert any(c.comment_id == comment1.comment_id for c in result.comments)
            assert any(c.comment_id == comment2.comment_id for c in result.comments)
    
    @pytest.mark.asyncio
    async def test_update_guild_comment_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive comment update with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Create a comment
            comment = await create_guild_comment(
                guild_id=created_guild.guild_id,
                user_id=sample_user['user_id'],
                username=sample_user['username'],
                content='Original comment',
                user_role='member'
            )
            
            # Update the comment
            updated_comment = await update_guild_comment(
                comment_id=comment.comment_id,
                content='Updated comment content',
                user_id=sample_user['user_id']
            )
            
            assert updated_comment is not None
            assert updated_comment.comment_id == comment.comment_id
            assert updated_comment.content == 'Updated comment content'
            assert updated_comment.is_edited is True
    
    @pytest.mark.asyncio
    async def test_delete_guild_comment_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive comment deletion with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # First create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Create a comment
            comment = await create_guild_comment(
                guild_id=created_guild.guild_id,
                user_id=sample_user['user_id'],
                username=sample_user['username'],
                content='Comment to delete',
                user_role='member'
            )
            
            # Delete the comment
            result = await delete_guild_comment(
                comment_id=comment.comment_id,
                user_id=sample_user['user_id']
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_create_join_request_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive join request creation with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create an approval-type guild
            created_guild = await create_guild(
                name='Approval Guild',
                description='A guild that requires approval',
                guild_type=GuildType.APPROVAL,
                created_by=sample_user['user_id'],
                tags=['approval'],
                settings=GuildSettings(require_approval=True)
            )
            
            # Create a join request
            join_request = await create_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                username='requesting_user'
            )
            
            assert join_request is not None
            assert join_request.request_id is not None
            assert join_request.guild_id == created_guild.guild_id
            assert join_request.user_id == 'user_456'
            assert join_request.username == 'requesting_user'
            assert join_request.status == 'pending'
    
    @pytest.mark.asyncio
    async def test_approve_join_request_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive join request approval with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create an approval-type guild
            created_guild = await create_guild(
                name='Approval Guild',
                description='A guild that requires approval',
                guild_type=GuildType.APPROVAL,
                created_by=sample_user['user_id'],
                tags=['approval'],
                settings=GuildSettings(require_approval=True)
            )
            
            # Create a join request
            join_request = await create_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                username='requesting_user'
            )
            
            # Approve the join request
            result = await approve_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                approved_by=sample_user['user_id']
            )
            
            assert result is True
            
            # Verify the user is now a member
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.member_count == 2
    
    @pytest.mark.asyncio
    async def test_reject_join_request_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive join request rejection with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create an approval-type guild
            created_guild = await create_guild(
                name='Approval Guild',
                description='A guild that requires approval',
                guild_type=GuildType.APPROVAL,
                created_by=sample_user['user_id'],
                tags=['approval'],
                settings=GuildSettings(require_approval=True)
            )
            
            # Create a join request
            join_request = await create_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                username='requesting_user'
            )
            
            # Reject the join request
            result = await reject_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                rejected_by=sample_user['user_id']
            )
            
            assert result is True
            
            # Verify the guild still has only 1 member
            updated_guild = await get_guild(created_guild.guild_id)
            assert updated_guild.member_count == 1
    
    @pytest.mark.asyncio
    async def test_assign_moderator_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive moderator assignment with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Join the guild
            await join_guild(created_guild.guild_id, 'user_456')
            
            # Assign moderator
            result = await assign_moderator(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                assigned_by=sample_user['user_id']
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_remove_moderator_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive moderator removal with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Join the guild
            await join_guild(created_guild.guild_id, 'user_456')
            
            # Assign moderator
            await assign_moderator(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                assigned_by=sample_user['user_id']
            )
            
            # Remove moderator
            result = await remove_moderator(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                removed_by=sample_user['user_id']
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_get_guild_rankings_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild rankings with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create multiple guilds
            guild1 = await create_guild(
                name='Guild 1',
                description='First guild',
                guild_type=GuildType.PUBLIC,
                created_by=sample_user['user_id'],
                tags=['test1'],
                settings=GuildSettings()
            )
            
            guild2 = await create_guild(
                name='Guild 2',
                description='Second guild',
                guild_type=GuildType.PRIVATE,
                created_by='user_456',
                tags=['test2'],
                settings=GuildSettings()
            )
            
            # Get rankings
            rankings = await get_guild_rankings()
            
            assert rankings is not None
            assert len(rankings) >= 2
            assert any(r.guild_id == guild1.guild_id for r in rankings)
            assert any(r.guild_id == guild2.guild_id for r in rankings)
    
    @pytest.mark.asyncio
    async def test_get_guild_analytics_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild analytics with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Get analytics
            analytics = await get_guild_analytics(created_guild.guild_id)
            
            assert analytics is not None
            assert analytics.total_members >= 1
            assert analytics.active_members >= 1
            assert analytics.total_goals >= 0
            assert analytics.total_quests >= 0
    
    @pytest.mark.asyncio
    async def test_calculate_guild_rankings_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild ranking calculation with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create multiple guilds
            guild1 = await create_guild(
                name='Guild 1',
                description='First guild',
                guild_type=GuildType.PUBLIC,
                created_by=sample_user['user_id'],
                tags=['test1'],
                settings=GuildSettings()
            )
            
            guild2 = await create_guild(
                name='Guild 2',
                description='Second guild',
                guild_type=GuildType.PRIVATE,
                created_by='user_456',
                tags=['test2'],
                settings=GuildSettings()
            )
            
            # Calculate rankings
            result = await calculate_guild_rankings()
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_check_guild_name_availability_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild name availability checking with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Check availability of existing name
            is_available_existing = await check_guild_name_availability(sample_guild_data['name'])
            assert is_available_existing is False
            
            # Check availability of new name
            is_available_new = await check_guild_name_availability('New Unique Guild Name')
            assert is_available_new is True
    
    @pytest.mark.asyncio
    async def test_has_pending_join_request_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive pending join request checking with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create an approval-type guild
            created_guild = await create_guild(
                name='Approval Guild',
                description='A guild that requires approval',
                guild_type=GuildType.APPROVAL,
                created_by=sample_user['user_id'],
                tags=['approval'],
                settings=GuildSettings(require_approval=True)
            )
            
            # Check for pending request (should be False initially)
            has_pending_initial = await has_pending_join_request(created_guild.guild_id, 'user_456')
            assert has_pending_initial is False
            
            # Create a join request
            await create_join_request(
                guild_id=created_guild.guild_id,
                user_id='user_456',
                username='requesting_user'
            )
            
            # Check for pending request (should be True now)
            has_pending_after = await has_pending_join_request(created_guild.guild_id, 'user_456')
            assert has_pending_after is True
    
    @pytest.mark.asyncio
    async def test_delete_guild_comprehensive(self, mock_dynamodb, sample_guild_data, sample_user):
        """Test comprehensive guild deletion with mocked DynamoDB."""
        with patch('app.db.guild_db.get_dynamodb_table', return_value=mock_dynamodb):
            # Create a guild
            created_guild = await create_guild(
                name=sample_guild_data['name'],
                description=sample_guild_data['description'],
                guild_type=sample_guild_data['guild_type'],
                created_by=sample_user['user_id'],
                tags=sample_guild_data['tags'],
                settings=sample_guild_data['settings']
            )
            
            # Delete the guild
            result = await delete_guild(created_guild.guild_id, sample_user['user_id'])
            
            assert result is True
            
            # Verify the guild is deleted
            deleted_guild = await get_guild(created_guild.guild_id)
            assert deleted_guild is None


if __name__ == '__main__':
    pytest.main([__file__])
