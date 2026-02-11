"""
Integration tests for collaboration service.
Tests full collaboration flows with real DynamoDB operations.
"""

import pytest
import boto3
from moto import mock_aws
from datetime import datetime, timedelta
import json
import uuid
from unittest.mock import patch

from app.main import app
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
def sample_users(dynamodb):
    """Create sample users in the database."""
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
        },
        {
            'PK': 'USER#user-789',
            'SK': 'PROFILE',
            'GSI1PK': 'USER#user-789',
            'GSI1SK': 'PROFILE',
            'userId': 'user-789',
            'username': 'bob_wilson',
            'email': 'bob@example.com',
            'nickname': 'Bob Wilson',
            'createdAt': '2024-01-01T00:00:00Z'
        }
    ]
    
    for user in users:
        table.put_item(Item=user)
    
    return users


@pytest.fixture
def sample_resources(dynamodb):
    """Create sample resources (goals, quests, tasks) in the database."""
    table = dynamodb
    
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
    
    # Create a quest owned by user-123
    quest = {
        'PK': 'USER#user-123',
        'SK': 'QUEST#quest-123',
        'GSI1PK': 'USER#user-123',
        'GSI1SK': 'QUEST#2024-01-01T00:00:00Z',
        'questId': 'quest-123',
        'title': 'Python Basics',
        'description': 'Learn Python fundamentals',
        'status': 'active',
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }
    
    # Create a task owned by user-123 (status must be 'draft' or 'active' for collaboration invites)
    task = {
        'PK': 'USER#user-123',
        'SK': 'TASK#task-123',
        'GSI1PK': 'USER#user-123',
        'GSI1SK': 'TASK#2024-01-01T00:00:00Z',
        'taskId': 'task-123',
        'title': 'Complete Python Tutorial',
        'description': 'Finish the online Python tutorial',
        'status': 'active',
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }
    
    resources = [goal, quest, task]
    for resource in resources:
        table.put_item(Item=resource)
    
    return resources


class TestCollaborationIntegration:
    """Integration tests for collaboration flows."""
    
    def test_full_invite_accept_flow(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test complete flow: create invite → accept invite → verify collaborator."""
        table = dynamodb
        
        # Step 1: Create invite (mock_lookup_invitee provides jane@example.com -> user-456)
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me in learning Python!'
        )
        
        invite = create_invite('user-123', invite_payload)
        
        # Verify invite was created
        assert invite.invite_id is not None
        assert invite.inviter_id == 'user-123'
        assert invite.invitee_id == 'user-456'
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
        assert invite_item['inviteeId'] == 'user-456'
        assert invite_item['status'] == 'pending'
        
        # Step 2: Accept invite
        with patch('app.db.invite_db._get_user_by_id') as mock_get_user_by_id:
            mock_get_user_by_id.return_value = {
                'userId': 'user-456',
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
            result = accept_invite('user-456', invite.invite_id)
        
        # Verify invite status updated
        updated_invite = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite.invite_id}'
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
        
        # Step 3: List collaborators
        with patch('app.db.collaborator_db._get_user_profile') as mock_get_profile:
            mock_get_profile.return_value = {'username': 'jane_smith', 'email': 'jane@example.com'}

            collaborators = list_collaborators('goal', 'goal-123')

        # Verify collaborators list includes the accepted collaborator (owner may not be in list
        # depending on PROFILE SK pattern in test data)
        assert len(collaborators.collaborators) >= 1
        collaborator = next(c for c in collaborators.collaborators if c.user_id == 'user-456')
        assert collaborator.username == 'jane_smith'
        assert collaborator.role == 'collaborator'
    
    def test_invite_decline_flow(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test invite decline flow."""
        table = dynamodb
        
        # Create invite
        invite_payload = InviteCreatePayload(
            resource_type='quest',
            resource_id='quest-123',
            invitee_identifier='bob_wilson',
            message='Join my quest!'
        )
        
        invite = create_invite('user-123', invite_payload)
        
        # Decline invite
        with patch('app.db.invite_db._get_user_by_id') as mock_get_user_by_id:
            mock_get_user_by_id.return_value = {
                'userId': 'user-789',
                'username': 'bob_wilson',
                'email': 'bob@example.com'
            }
            
            result = decline_invite('user-789', invite.invite_id)
        
        # Verify invite status updated
        updated_invite = table.get_item(
            Key={
                'PK': 'RESOURCE#QUEST#quest-123',
                'SK': f'INVITE#{invite.invite_id}'
            }
        )['Item']
        
        assert updated_invite['status'] == 'declined'
        
        # Verify no collaborator was created
        response = table.get_item(
            Key={
                'PK': 'RESOURCE#QUEST#quest-123',
                'SK': 'COLLABORATOR#user-789'
            }
        )
        
        assert 'Item' not in response
    
    def test_duplicate_invite_prevention(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test that duplicate invites are prevented."""
        invite_payload = InviteCreatePayload(
            resource_type='task',
            resource_id='task-123',
            invitee_identifier='jane@example.com',
            message='First invite'
        )
        
        with patch('app.db.invite_db._get_user_by_email') as mock_get_user:
            mock_get_user.return_value = {
                'userId': 'user-456',
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
            # Create first invite
            invite1 = create_invite('user-123', invite_payload)
            
            # Try to create duplicate invite
            with pytest.raises(Exception, match="already sent a collaboration invite"):
                create_invite('user-123', invite_payload)
    
    def test_collaborator_removal(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test removing a collaborator."""
        table = dynamodb
        
        # First create and accept an invite
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me!'
        )
        
        with patch('app.db.invite_db._get_user_by_email') as mock_get_user:
            mock_get_user.return_value = {
                'userId': 'user-456',
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
            invite = create_invite('user-123', invite_payload)
        
        with patch('app.db.invite_db._get_user_by_id') as mock_get_user_by_id:
            mock_get_user_by_id.return_value = {
                'userId': 'user-456',
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
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
        with patch('app.db.collaborator_db._get_user_profile') as mock_get_profile:
            mock_get_profile.return_value = {
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
            result = remove_collaborator('user-123', 'goal', 'goal-123', 'user-456')
        
        # Verify collaborator was removed
        response = table.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': 'COLLABORATOR#user-456'
            }
        )
        
        assert 'Item' not in response
    
    def test_list_user_invites(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test listing invites for a user."""
        # Create multiple invites for user-456
        invites = []
        
        for i, resource_type in enumerate(['goal', 'quest', 'task']):
            invite_payload = InviteCreatePayload(
                resource_type=resource_type,
                resource_id=f'{resource_type}-123',
                invitee_identifier='jane@example.com',
                message=f'Join my {resource_type}!'
            )
            
            with patch('app.db.invite_db._get_user_by_email') as mock_get_user:
                mock_get_user.return_value = {
                    'userId': 'user-456',
                    'username': 'jane_smith',
                    'email': 'jane@example.com'
                }
                
                invite = create_invite('user-123', invite_payload)
                invites.append(invite)
        
        # List invites for user-456
        with patch('app.db.invite_db._get_user_profile') as mock_get_profile:
            mock_get_profile.return_value = {
                'username': 'john_doe',
                'email': 'john@example.com'
            }
            
            user_invites = list_user_invites('user-456')

        # Verify all invites are returned
        assert len(user_invites.invites) == 3

        # Verify invite details
        for invite in user_invites.invites:
            assert invite.invitee_id == 'user-456'
            assert invite.inviter_id == 'user-123'
            assert invite.status == 'pending'
            assert invite.invite_id is not None
            assert invite.resource_type is not None
            assert invite.resource_id is not None
    
    def test_invite_expiry(self, dynamodb, sample_users, sample_resources, mock_lookup_invitee):
        """Test that invites expire after 30 days."""
        invite_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='This invite will expire'
        )
        
        with patch('app.db.invite_db._get_user_by_email') as mock_get_user:
            mock_get_user.return_value = {
                'userId': 'user-456',
                'username': 'jane_smith',
                'email': 'jane@example.com'
            }
            
            invite = create_invite('user-123', invite_payload)
        
        # Verify TTL is set to 30 days from now
        invite_item = dynamodb.get_item(
            Key={
                'PK': 'RESOURCE#GOAL#goal-123',
                'SK': f'INVITE#{invite.invite_id}'
            }
        )['Item']
        
        assert 'ttl' in invite_item
        
        # Calculate expected TTL (30 days from now)
        expected_ttl = int((datetime.now() + timedelta(days=30)).timestamp())
        actual_ttl = invite_item['ttl']
        
        # Allow 1 minute tolerance
        assert abs(actual_ttl - expected_ttl) < 60
    
