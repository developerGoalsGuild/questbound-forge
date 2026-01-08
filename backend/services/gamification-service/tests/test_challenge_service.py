"""
Unit tests for challenge service.
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

from app.services.challenge_service import update_challenge_progress
from app.db.challenge_db import create_challenge, join_challenge, get_challenge_participants
from app.models.challenge import Challenge


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


class TestChallengeProgress:
    """Tests for challenge progress updates."""
    
    def test_update_challenge_progress_quest_completion(self, dynamodb_table):
        """Test updating challenge progress for quest completion."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Quests",
            description="Complete 10 quests this week",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        join_challenge("user-456", "challenge-123")
        
        # Update progress (1 quest completed)
        update_challenge_progress("challenge-123", "user-456", "quest_completion", 1)
        
        participants = get_challenge_participants("challenge-123")
        participant = next(p for p in participants if p.userId == "user-456")
        
        assert participant.currentValue == 1
        assert participant.progress == 0.1  # 1/10
    
    def test_update_challenge_progress_wrong_type(self, dynamodb_table):
        """Test that progress is not updated for wrong achievement type."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Quests",
            description="Complete 10 quests this week",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        join_challenge("user-456", "challenge-123")
        
        # Try to update with wrong type
        update_challenge_progress("challenge-123", "user-456", "xp_accumulation", 100)
        
        participants = get_challenge_participants("challenge-123")
        participant = next(p for p in participants if p.userId == "user-456")
        
        # Should remain at 0 (wrong type, no update)
        assert participant.currentValue == 0
    
    def test_update_challenge_progress_completion(self, dynamodb_table):
        """Test that challenge completion awards XP."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Quests",
            description="Complete 10 quests this week",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        join_challenge("user-456", "challenge-123")
        
        # Complete the challenge (10 quests)
        update_challenge_progress("challenge-123", "user-456", "quest_completion", 10)
        
        participants = get_challenge_participants("challenge-123")
        participant = next(p for p in participants if p.userId == "user-456")
        
        assert participant.currentValue == 10
        assert participant.progress >= 1.0  # Completed

