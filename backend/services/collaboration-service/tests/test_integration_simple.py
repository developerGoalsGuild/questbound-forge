"""
Simple integration tests for collaboration service.
Tests basic functionality without complex mocking.
"""

import pytest
import boto3
from moto import mock_aws
from datetime import datetime, timedelta
import json
import uuid

from app.db.invite_db import create_invite, accept_invite, decline_invite, list_user_invites
from app.db.collaborator_db import list_collaborators, remove_collaborator
from app.models.invite import InviteCreatePayload, InviteStatus
from app.models.collaborator import CollaboratorResponse


@pytest.fixture
def dynamodb():
    """Create a mock DynamoDB table for testing."""
    with mock_aws():
        # Create the table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='gg_core',
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                        {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        yield table


@pytest.fixture
def sample_data(dynamodb):
    """Create sample data in the database."""
    table = dynamodb
    
    # Create user profiles
    users = [
        {
            'PK': 'USER#user-123',
            'SK': 'PROFILE',
            'GSI1PK': 'USER#user-123',
            'GSI1SK': 'PROFILE',
            'userId': 'user-123',
            'username': 'john_doe',
            'email': 'john@example.com',
            'nickname': 'John Doe',
            'createdAt': '2024-01-01T00:00:00Z'
        },
        {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'GSI1PK': 'USER#user-456',
            'GSI1SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com',
            'nickname': 'Jane Smith',
            'createdAt': '2024-01-01T00:00:00Z'
        }
    ]
    
    # Create a goal owned by user-123
    goal = {
        'PK': 'USER#user-123',
        'SK': 'GOAL#goal-123',
        'GSI1PK': 'USER#user-123',
        'GSI1SK': 'GOAL#2024-01-01T00:00:00Z',
        'goalId': 'goal-123',
        'title': 'Learn Python',
        'description': 'Master Python programming',
        'status': 'active',
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }
    
    # Insert all data
    for user in users:
        table.put_item(Item=user)
    table.put_item(Item=goal)
    
    return {'users': users, 'goal': goal}


class TestSimpleIntegration:
    """Simple integration tests for collaboration flows."""
    
    def test_invite_creation_basic(self, dynamodb, sample_data):
        """Test basic invite creation."""
        table = dynamodb
        
        # Create invite payload
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me in learning Python!'
        )
        
        # Mock the user lookup functions by creating the user data directly
        # This simulates what would happen in a real scenario
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        # Create invite
        invite = create_invite('user-123', invite_payload)
        
        # Verify invite was created
        assert invite.invite_id is not None
        assert invite.inviter_id == 'user-123'
        assert invite.resource_type == 'goal'
        assert invite.resource_id == 'goal-123'
        assert invite.status == 'pending'
        assert invite.message == 'Join me in learning Python!'
        
        # Verify invite item in DynamoDB
        invite_item = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite.invite_id}'
            }
        )['Item']
        
        assert invite_item['inviteId'] == invite.invite_id
        assert invite_item['inviterId'] == 'user-123'
        assert invite_item['status'] == 'pending'
    
    def test_invite_acceptance_basic(self, dynamodb, sample_data):
        """Test basic invite acceptance."""
        table = dynamodb
        
        # First create an invite
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me!'
        )
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        invite = create_invite('user-123', invite_payload)
        
        # Accept invite
        result = accept_invite('user-456', invite.invite_id)
        
        # Verify invite status updated
        updated_invite = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite["inviteId"]}'
            }
        )['Item']
        
        assert updated_invite['status'] == 'accepted'
        
        # Verify collaborator was created
        collaborator_item = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': 'COLLABORATOR#user-456'
            }
        )['Item']
        
        assert collaborator_item['userId'] == 'user-456'
        assert collaborator_item['resourceType'] == 'goal'
        assert collaborator_item['resourceId'] == 'goal-123'
        assert collaborator_item['role'] == 'collaborator'
        assert 'joinedAt' in collaborator_item
    
    def test_invite_decline_basic(self, dynamodb, sample_data):
        """Test basic invite decline."""
        table = dynamodb
        
        # Create invite
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me!'
        )
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        invite = create_invite('user-123', invite_payload)
        
        # Decline invite
        result = decline_invite('user-456', invite.invite_id)
        
        # Verify invite status updated
        updated_invite = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite["inviteId"]}'
            }
        )['Item']
        
        assert updated_invite['status'] == 'declined'
        
        # Verify no collaborator was created
        response = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': 'COLLABORATOR#user-456'
            }
        )
        
        assert 'Item' not in response
    
    def test_duplicate_invite_prevention(self, dynamodb, sample_data):
        """Test that duplicate invites are prevented."""
        table = dynamodb
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='First invite'
        )
        
        # Create first invite
        invite1 = create_invite('user-123', invite_payload)
        
        # Try to create duplicate invite
        with pytest.raises(ValueError, match="Invite already exists"):
            create_invite('user-123', invite_payload)
    
    def test_collaborator_removal_basic(self, dynamodb, sample_data):
        """Test basic collaborator removal."""
        table = dynamodb
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        # Create and accept invite
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me!'
        )
        
        invite = create_invite('user-123', invite_payload)
        accept_invite('user-456', invite.invite_id)
        
        # Verify collaborator exists
        collaborator_item = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': 'COLLABORATOR#user-456'
            }
        )['Item']
        
        assert collaborator_item is not None
        
        # Remove collaborator
        result = remove_collaborator('user-123', 'goal', 'goal-123', 'user-456')
        
        # Verify collaborator was removed
        response = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': 'COLLABORATOR#user-456'
            }
        )
        
        assert 'Item' not in response
    
    def test_invite_expiry_ttl(self, dynamodb, sample_data):
        """Test that invites have TTL set for expiry."""
        table = dynamodb
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='This invite will expire'
        )
        
        invite = create_invite('user-123', invite_payload)
        
        # Verify TTL is set
        invite_item = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite["inviteId"]}'
            }
        )['Item']
        
        assert 'ttl' in invite_item
        
        # Calculate expected TTL (30 days from now)
        expected_ttl = int((datetime.now() + timedelta(days=30)).timestamp())
        actual_ttl = invite_item['ttl']
        
        # Allow 1 minute tolerance
        assert abs(actual_ttl - expected_ttl) < 60
    
    def test_permission_boundaries(self, dynamodb, sample_data):
        """Test that non-owners cannot invite."""
        table = dynamodb
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='bob@example.com',
            message='I should not be able to invite'
        )
        
        # Test non-owner trying to invite
        with pytest.raises(ValueError, match="User does not own this resource"):
            create_invite('user-456', invite_payload)  # user-456 is not the owner
    
    def test_concurrent_invite_acceptance(self, dynamodb, sample_data):
        """Test handling of concurrent invite acceptance attempts."""
        table = dynamodb
        
        # Create invitee user
        invitee_user = {
            'PK': 'USER#user-456',
            'SK': 'PROFILE',
            'userId': 'user-456',
            'username': 'jane_smith',
            'email': 'jane@example.com'
        }
        table.put_item(Item=invitee_user)
        
        # Create invite
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Concurrent test'
        )
        
        invite = create_invite('user-123', invite_payload)
        
        # First acceptance should succeed
        result1 = accept_invite('user-456', invite.invite_id)
        
        # Second acceptance should fail
        with pytest.raises(ValueError, match="Invite is not pending"):
            accept_invite('user-456', invite.invite_id)
