"""
Basic functionality tests for collaboration service.
Tests the core functionality without complex integration scenarios.
"""

import pytest
import boto3
from moto import mock_aws
from datetime import datetime, UTC, timedelta
import json
import uuid

from app.db.invite_db import _build_invite_item, _invite_item_to_response
from app.models.invite import InviteCreatePayload, InviteStatus


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


class TestBasicFunctionality:
    """Basic functionality tests for collaboration features."""
    
    def test_invite_item_building(self):
        """Test that invite items are built correctly."""
        payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me in learning Python!'
        )
        
        invite_item = _build_invite_item(
            inviter_id='user-123',
            invitee_id='user-456',
            invitee_email='jane@example.com',
            payload=payload
        )
        
        # Verify required fields
        assert 'inviteId' in invite_item
        assert invite_item['inviterId'] == 'user-123'
        assert invite_item['inviteeId'] == 'user-456'
        assert invite_item['inviteeEmail'] == 'jane@example.com'
        assert invite_item['resourceType'] == 'goal'
        assert invite_item['resourceId'] == 'goal-123'
        assert invite_item['status'] == 'pending'
        assert invite_item['message'] == 'Join me in learning Python!'
        
        # Verify primary key structure
        assert invite_item['PK'] == 'RESOURCE#GOAL#goal-123'
        assert invite_item['SK'].startswith('INVITE#')
        
        # Verify GSI1 key structure
        assert invite_item['GSI1PK'] == 'USER#user-456'
        assert invite_item['GSI1SK'].startswith('INVITE#pending#')
        
        # Verify TTL is set
        assert 'ttl' in invite_item
        assert isinstance(invite_item['ttl'], int)
        
        # Verify timestamps
        assert 'createdAt' in invite_item
        assert 'expiresAt' in invite_item
        assert 'updatedAt' in invite_item
    
    def test_invite_response_conversion(self):
        """Test that DynamoDB items are converted to responses correctly."""
        # Create a sample DynamoDB item
        item = {
            'inviteId': 'invite-123',
            'inviterId': 'user-123',
            'inviterUsername': 'john_doe',
            'inviteeId': 'user-456',
            'inviteeEmail': 'jane@example.com',
            'resourceType': 'goal',
            'resourceId': 'goal-123',
            'resourceTitle': 'Learn Python',
            'status': 'pending',
            'message': 'Join me!',
            'expiresAt': '2024-02-01T00:00:00',
            'createdAt': '2024-01-01T00:00:00',
            'updatedAt': '2024-01-01T00:00:00'
        }
        
        response = _invite_item_to_response(item)
        
        # Verify response fields
        assert response.invite_id == 'invite-123'
        assert response.inviter_id == 'user-123'
        assert response.inviter_username == 'john_doe'
        assert response.invitee_id == 'user-456'
        assert response.invitee_email == 'jane@example.com'
        assert response.resource_type == 'goal'
        assert response.resource_id == 'goal-123'
        assert response.resource_title == 'Learn Python'
        assert response.status == 'pending'
        assert response.message == 'Join me!'
        
        # Verify datetime fields
        assert isinstance(response.expires_at, datetime)
        assert isinstance(response.created_at, datetime)
        assert isinstance(response.updated_at, datetime)
    
    def test_invite_payload_validation(self):
        """Test that invite payloads are validated correctly."""
        # Valid payload
        valid_payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Join me!'
        )
        assert valid_payload.resource_type == 'goal'
        assert valid_payload.resource_id == 'goal-123'
        assert valid_payload.invitee_identifier == 'jane@example.com'
        assert valid_payload.message == 'Join me!'
        
        # Test with username instead of email
        username_payload = InviteCreatePayload(
            resource_type='quest',
            resource_id='quest-456',
            invitee_identifier='jane_smith',
            message='Join my quest!'
        )
        assert username_payload.invitee_identifier == 'jane_smith'
        
        # Test with optional message
        no_message_payload = InviteCreatePayload(
            resource_type='task',
            resource_id='task-789',
            invitee_identifier='bob@example.com'
        )
        assert no_message_payload.message is None
    
    def test_invite_payload_validation_errors(self):
        """Test that invalid payloads raise validation errors."""
        # Invalid resource type
        with pytest.raises(ValueError):
            InviteCreatePayload(
                resource_type='invalid',
                resource_id='goal-123',
                invitee_identifier='jane@example.com'
            )
        
        # Empty resource ID
        with pytest.raises(ValueError):
            InviteCreatePayload(
                resource_type='goal',
                resource_id='',
                invitee_identifier='jane@example.com'
            )
        
        # Empty invitee identifier
        with pytest.raises(ValueError):
            InviteCreatePayload(
                resource_type='goal',
                resource_id='goal-123',
                invitee_identifier=''
            )
    
    def test_ttl_calculation(self):
        """Test that TTL is calculated correctly for 30-day expiry."""
        payload = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='Test TTL'
        )
        
        invite_item = _build_invite_item(
            inviter_id='user-123',
            invitee_id='user-456',
            invitee_email='jane@example.com',
            payload=payload
        )
        
        # Verify TTL is set
        assert 'ttl' in invite_item
        ttl = invite_item['ttl']
        
        # Calculate expected TTL (30 days from now) using UTC
        expected_ttl = int((datetime.now(UTC) + timedelta(days=30)).timestamp())
        
        # Allow 5 minute tolerance for timezone differences
        assert abs(ttl - expected_ttl) < 300
    
    def test_primary_key_structure(self):
        """Test that primary keys are structured correctly."""
        payload = InviteCreatePayload(
            resource_type='quest',
            resource_id='quest-456',
            invitee_identifier='bob@example.com',
            message='Join my quest!'
        )
        
        invite_item = _build_invite_item(
            inviter_id='user-789',
            invitee_id='user-101',
            invitee_email='bob@example.com',
            payload=payload
        )
        
        # Verify primary key
        assert invite_item['PK'] == 'RESOURCE#QUEST#quest-456'
        assert invite_item['SK'].startswith('INVITE#')
        
        # Verify GSI1 key
        assert invite_item['GSI1PK'] == 'USER#user-101'
        assert invite_item['GSI1SK'].startswith('INVITE#pending#')
    
    def test_different_resource_types(self):
        """Test that different resource types are handled correctly."""
        resource_types = ['goal', 'quest', 'task']
        
        for resource_type in resource_types:
            payload = InviteCreatePayload(
                resource_type=resource_type,
                resource_id=f'{resource_type}-123',
                invitee_identifier='test@example.com',
                message=f'Join my {resource_type}!'
            )
            
            invite_item = _build_invite_item(
                inviter_id='user-123',
                invitee_id='user-456',
                invitee_email='test@example.com',
                payload=payload
            )
            
            # Verify resource type is preserved
            assert invite_item['resourceType'] == resource_type
            assert invite_item['resourceId'] == f'{resource_type}-123'
            
            # Verify primary key structure
            assert invite_item['PK'] == f'RESOURCE#{resource_type.upper()}#{resource_type}-123'
    
    def test_message_handling(self):
        """Test that messages are handled correctly."""
        # With message
        payload_with_message = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com',
            message='This is a test message'
        )
        
        invite_item = _build_invite_item(
            inviter_id='user-123',
            invitee_id='user-456',
            invitee_email='jane@example.com',
            payload=payload_with_message
        )
        
        assert invite_item['message'] == 'This is a test message'
        
        # Without message
        payload_without_message = InviteCreatePayload(
            resource_type='goal',
            resource_id='goal-123',
            invitee_identifier='jane@example.com'
        )
        
        invite_item = _build_invite_item(
            inviter_id='user-123',
            invitee_id='user-456',
            invitee_email='jane@example.com',
            payload=payload_without_message
        )
        
        assert invite_item['message'] is None
