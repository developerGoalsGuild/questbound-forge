"""
Unit tests for XP service.
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

from app.services.xp_service import award_xp, get_user_xp_summary, get_xp_award_amount
from app.models.xp import XPAwardRequest, XPAwardResponse
from app.db.xp_db import create_xp_summary


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


class TestXPAward:
    """Tests for XP award functionality."""
    
    def test_award_xp_new_user(self, dynamodb_table):
        """Test awarding XP to a new user (creates summary)."""
        request = XPAwardRequest(
            userId="user-123",
            amount=10,
            source="task_completion",
            description="Completed a task"
        )
        
        response = award_xp(request)
        
        assert response.success is True
        assert response.totalXp == 10
        assert response.level == 1
        assert response.levelUp is False
    
    def test_award_xp_existing_user(self, dynamodb_table):
        """Test awarding XP to an existing user."""
        # Create initial summary at 50 XP (level 1)
        create_xp_summary("user-123", initial_xp=50)
        
        request = XPAwardRequest(
            userId="user-123",
            amount=10,
            source="task_completion",
            description="Completed a task"
        )
        
        response = award_xp(request)
        
        assert response.success is True
        assert response.totalXp == 60
        assert response.level == 1
    
    def test_award_xp_level_up(self, dynamodb_table):
        """Test XP award that triggers level up."""
        # Create user at 95 XP (level 1, close to level 2)
        create_xp_summary("user-123", initial_xp=95)
        
        request = XPAwardRequest(
            userId="user-123",
            amount=10,
            source="task_completion",
            description="Completed a task"
        )
        
        response = award_xp(request)
        
        assert response.success is True
        assert response.totalXp == 105
        assert response.level == 2
        assert response.levelUp is True
        assert response.previousLevel == 1
    
    def test_award_xp_idempotency(self, dynamodb_table):
        """Test that duplicate event IDs don't award XP twice."""
        request = XPAwardRequest(
            userId="user-123",
            amount=10,
            source="task_completion",
            description="Completed a task",
            eventId="unique-event-123"
        )
        
        # First award
        response1 = award_xp(request)
        assert response1.success is True
        assert response1.totalXp == 10
        
        # Second award with same event ID
        response2 = award_xp(request)
        assert response2.success is True
        assert response2.totalXp == 10  # Should be same, not 20
    
    def test_get_xp_award_amount_task(self):
        """Test getting XP award amount for task completion."""
        amount = get_xp_award_amount("task_completion")
        assert amount == 10
    
    def test_get_xp_award_amount_goal(self):
        """Test getting XP award amount for goal completion."""
        amount = get_xp_award_amount("goal_completion")
        assert amount == 25
    
    def test_get_xp_award_amount_daily_login(self):
        """Test getting XP award amount for daily login."""
        amount = get_xp_award_amount("daily_login")
        assert amount == 5
    
    def test_get_xp_award_amount_quest_with_reward(self):
        """Test getting XP award amount for quest with custom reward."""
        amount = get_xp_award_amount("quest_completion", {"rewardXp": 100})
        assert amount == 100
    
    def test_get_xp_award_amount_quest_without_reward(self):
        """Test getting XP award amount for quest without reward."""
        amount = get_xp_award_amount("quest_completion", {})
        assert amount == 0
    
    def test_get_user_xp_summary_existing(self, dynamodb_table):
        """Test getting XP summary for existing user."""
        create_xp_summary("user-123", initial_xp=150)
        
        summary = get_user_xp_summary("user-123")
        
        assert summary is not None
        assert summary.userId == "user-123"
        assert summary.totalXp == 150
    
    def test_get_user_xp_summary_new_user(self, dynamodb_table):
        """Test getting XP summary for new user (creates default)."""
        summary = get_user_xp_summary("user-new")
        
        assert summary is not None
        assert summary.userId == "user-new"
        assert summary.totalXp == 0
        assert summary.currentLevel == 1
