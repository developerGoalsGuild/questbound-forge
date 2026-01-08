"""
Unit tests for badge service.
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

from app.services.badge_service import (
    check_and_assign_badges, get_user_badges_with_definitions,
    BADGE_IDS
)
from app.db.badge_db import create_badge_definition, get_user_badges
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


@pytest.fixture(scope='function')
def initialized_badges(dynamodb_table):
    """Initialize default badges for testing."""
    from app.services.badge_service import initialize_default_badges
    initialize_default_badges()


class TestBadgeAutoAssignment:
    """Tests for automatic badge assignment."""
    
    def test_assign_badge_first_quest(self, dynamodb_table, initialized_badges):
        """Test assigning badge for first quest completion."""
        check_and_assign_badges("user-123", "quest_completed", {"quest_count": 1})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["FIRST_QUEST"] in badge_ids
    
    def test_assign_badge_quest_10(self, dynamodb_table, initialized_badges):
        """Test assigning badge for 10 quests completed."""
        check_and_assign_badges("user-123", "quest_completed", {"quest_count": 10})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["QUEST_10"] in badge_ids
    
    def test_assign_badge_level_5(self, dynamodb_table, initialized_badges):
        """Test assigning badge for reaching level 5."""
        check_and_assign_badges("user-123", "level_up", {"level": 5})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["LEVEL_5"] in badge_ids
    
    def test_assign_badge_level_10(self, dynamodb_table, initialized_badges):
        """Test assigning badge for reaching level 10."""
        check_and_assign_badges("user-123", "level_up", {"level": 10})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["LEVEL_10"] in badge_ids
    
    def test_assign_badge_streak_7(self, dynamodb_table, initialized_badges):
        """Test assigning badge for 7 day streak."""
        check_and_assign_badges("user-123", "streak", {"streak_days": 7})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["STREAK_7"] in badge_ids
    
    def test_assign_badge_challenge_won(self, dynamodb_table, initialized_badges):
        """Test assigning badge for winning a challenge."""
        check_and_assign_badges("user-123", "challenge_won", {"challenge_id": "challenge-123"})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        assert BADGE_IDS["CHALLENGE_WINNER"] in badge_ids
    
    def test_no_badge_for_non_milestone(self, dynamodb_table, initialized_badges):
        """Test that badges are not assigned for non-milestone achievements."""
        check_and_assign_badges("user-123", "quest_completed", {"quest_count": 5})
        
        badges = get_user_badges("user-123")
        badge_ids = [b.badgeId for b in badges]
        # Should not have any quest badges (5 is not a milestone)
        assert BADGE_IDS["FIRST_QUEST"] not in badge_ids
        assert BADGE_IDS["QUEST_10"] not in badge_ids


class TestGetUserBadgesWithDefinitions:
    """Tests for getting user badges with definitions."""
    
    def test_get_user_badges_with_definitions(self, dynamodb_table, initialized_badges):
        """Test getting user badges with full definitions."""
        # Assign a badge
        check_and_assign_badges("user-123", "quest_completed", {"quest_count": 1})
        
        badges = get_user_badges_with_definitions("user-123")
        
        assert len(badges) >= 1
        assert badges[0].badge.userId == "user-123"
        assert badges[0].definition is not None
        assert badges[0].definition.name is not None

