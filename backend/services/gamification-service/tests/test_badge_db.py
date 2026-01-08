"""
Unit tests for badge database operations.
"""

import pytest
import boto3
import os
import time
from moto import mock_aws

os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
os.environ['AWS_REGION'] = os.environ['AWS_DEFAULT_REGION']
os.environ['CORE_TABLE'] = 'gg_core'
os.environ['JWT_SECRET'] = 'test-secret'
os.environ['JWT_AUDIENCE'] = 'api://default'
os.environ['JWT_ISSUER'] = 'https://auth.local'

from app.db.badge_db import (
    create_badge_definition, get_badge_definition, list_badge_definitions,
    assign_badge, get_user_badges, has_badge, BadgeDBError
)
from app.models.badge import BadgeDefinition


@pytest.fixture(scope='function')
def dynamodb_table():
    """Create a mock DynamoDB table."""
    with mock_aws():
        ddb = boto3.client('dynamodb', region_name='us-east-2')
        ddb.create_table(
            TableName='gg_core',
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'},
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
        yield ddb


class TestBadgeDefinitions:
    """Tests for badge definition operations."""
    
    def test_create_badge_definition(self, dynamodb_table):
        """Test creating a badge definition."""
        badge = BadgeDefinition(
            id="badge-123",
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        
        created = create_badge_definition(badge)
        
        assert created.id == "badge-123"
        assert created.name == "First Quest"
    
    def test_get_badge_definition(self, dynamodb_table):
        """Test retrieving a badge definition."""
        badge = BadgeDefinition(
            id="badge-123",
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        create_badge_definition(badge)
        
        retrieved = get_badge_definition("badge-123")
        
        assert retrieved is not None
        assert retrieved.id == "badge-123"
        assert retrieved.name == "First Quest"
    
    def test_get_badge_definition_not_found(self, dynamodb_table):
        """Test retrieving a non-existent badge definition."""
        retrieved = get_badge_definition("badge-nonexistent")
        assert retrieved is None
    
    def test_list_badge_definitions(self, dynamodb_table):
        """Test listing badge definitions."""
        badge1 = BadgeDefinition(
            id="badge-1",
            name="Badge 1",
            description="Description 1",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        badge2 = BadgeDefinition(
            id="badge-2",
            name="Badge 2",
            description="Description 2",
            category="level",
            rarity="rare",
            createdAt=int(time.time() * 1000)
        )
        
        create_badge_definition(badge1)
        create_badge_definition(badge2)
        
        badges = list_badge_definitions()
        
        assert len(badges) >= 2
    
    def test_list_badge_definitions_by_category(self, dynamodb_table):
        """Test listing badge definitions filtered by category."""
        badge1 = BadgeDefinition(
            id="badge-1",
            name="Badge 1",
            description="Description 1",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        badge2 = BadgeDefinition(
            id="badge-2",
            name="Badge 2",
            description="Description 2",
            category="level",
            rarity="rare",
            createdAt=int(time.time() * 1000)
        )
        
        create_badge_definition(badge1)
        create_badge_definition(badge2)
        
        quest_badges = list_badge_definitions(category="quest")
        
        assert len(quest_badges) >= 1
        assert all(b.category == "quest" for b in quest_badges)


class TestUserBadges:
    """Tests for user badge operations."""
    
    def test_assign_badge(self, dynamodb_table):
        """Test assigning a badge to a user."""
        # First create badge definition
        badge_def = BadgeDefinition(
            id="badge-123",
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        create_badge_definition(badge_def)
        
        user_badge = assign_badge("user-123", "badge-123")
        
        assert user_badge.userId == "user-123"
        assert user_badge.badgeId == "badge-123"
        assert user_badge.progress == 1.0
    
    def test_assign_badge_duplicate(self, dynamodb_table):
        """Test assigning the same badge twice (should return existing)."""
        badge_def = BadgeDefinition(
            id="badge-123",
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        create_badge_definition(badge_def)
        
        badge1 = assign_badge("user-123", "badge-123")
        badge2 = assign_badge("user-123", "badge-123")
        
        assert badge1.earnedAt == badge2.earnedAt
    
    def test_get_user_badges(self, dynamodb_table):
        """Test getting all badges for a user."""
        badge_def1 = BadgeDefinition(
            id="badge-1",
            name="Badge 1",
            description="Description 1",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        badge_def2 = BadgeDefinition(
            id="badge-2",
            name="Badge 2",
            description="Description 2",
            category="level",
            rarity="rare",
            createdAt=int(time.time() * 1000)
        )
        
        create_badge_definition(badge_def1)
        create_badge_definition(badge_def2)
        
        assign_badge("user-123", "badge-1")
        assign_badge("user-123", "badge-2")
        
        badges = get_user_badges("user-123")
        
        assert len(badges) == 2
        badge_ids = [b.badgeId for b in badges]
        assert "badge-1" in badge_ids
        assert "badge-2" in badge_ids
    
    def test_has_badge_true(self, dynamodb_table):
        """Test checking if user has a badge (true case)."""
        badge_def = BadgeDefinition(
            id="badge-123",
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=int(time.time() * 1000)
        )
        create_badge_definition(badge_def)
        assign_badge("user-123", "badge-123")
        
        assert has_badge("user-123", "badge-123") is True
    
    def test_has_badge_false(self, dynamodb_table):
        """Test checking if user has a badge (false case)."""
        assert has_badge("user-123", "badge-nonexistent") is False
