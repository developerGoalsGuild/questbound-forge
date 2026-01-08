"""
Unit tests for leaderboard database operations.
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

from app.db.leaderboard_db import (
    get_global_xp_leaderboard, get_level_leaderboard, get_badge_leaderboard
)
from app.db.xp_db import create_xp_summary, update_xp_summary
from app.db.badge_db import create_badge_definition, assign_badge
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


class TestGlobalXPLeaderboard:
    """Tests for global XP leaderboard."""
    
    def test_get_global_xp_leaderboard(self, dynamodb_table):
        """Test getting global XP leaderboard."""
        # Create XP summaries for multiple users
        create_xp_summary("user-1", initial_xp=1000)
        create_xp_summary("user-2", initial_xp=500)
        create_xp_summary("user-3", initial_xp=1500)
        
        leaderboard = get_global_xp_leaderboard(limit=10)
        
        assert len(leaderboard) >= 3
        # Should be sorted by XP descending
        assert leaderboard[0].value >= leaderboard[1].value
    
    def test_get_global_xp_leaderboard_with_limit(self, dynamodb_table):
        """Test getting global XP leaderboard with limit."""
        # Create multiple users
        for i in range(10):
            create_xp_summary(f"user-{i}", initial_xp=i * 100)
        
        leaderboard = get_global_xp_leaderboard(limit=5)
        
        assert len(leaderboard) <= 5


class TestLevelLeaderboard:
    """Tests for level leaderboard."""
    
    def test_get_level_leaderboard(self, dynamodb_table):
        """Test getting level leaderboard."""
        # Create users at different levels
        create_xp_summary("user-1", initial_xp=100)  # Level 2
        update_xp_summary("user-1", 100, 2, 100, 400, 0.0)
        
        create_xp_summary("user-2", initial_xp=400)  # Level 3
        update_xp_summary("user-2", 400, 3, 400, 900, 0.0)
        
        create_xp_summary("user-3", initial_xp=50)  # Level 1
        update_xp_summary("user-3", 50, 1, 0, 100, 0.5)
        
        leaderboard = get_level_leaderboard(limit=10)
        
        assert len(leaderboard) >= 3
        # Should be sorted by level descending
        assert leaderboard[0].value >= leaderboard[1].value


class TestBadgeLeaderboard:
    """Tests for badge leaderboard."""
    
    def test_get_badge_leaderboard(self, dynamodb_table):
        """Test getting badge leaderboard."""
        # Create badge definitions
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
        badge3 = BadgeDefinition(
            id="badge-3",
            name="Badge 3",
            description="Description 3",
            category="streak",
            rarity="epic",
            createdAt=int(time.time() * 1000)
        )
        
        create_badge_definition(badge1)
        create_badge_definition(badge2)
        create_badge_definition(badge3)
        
        # Assign badges to users
        assign_badge("user-1", "badge-1")
        assign_badge("user-1", "badge-2")
        assign_badge("user-1", "badge-3")  # 3 badges
        
        assign_badge("user-2", "badge-1")
        assign_badge("user-2", "badge-2")  # 2 badges
        
        assign_badge("user-3", "badge-1")  # 1 badge
        
        leaderboard = get_badge_leaderboard(limit=10)
        
        assert len(leaderboard) >= 3
        # Should be sorted by badge count descending
        assert leaderboard[0].value >= leaderboard[1].value
        # User 1 should have the most badges
        assert leaderboard[0].userId == "user-1"
        assert leaderboard[0].value == 3
