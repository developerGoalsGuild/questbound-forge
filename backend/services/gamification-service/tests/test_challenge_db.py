"""
Unit tests for challenge database operations.
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

from app.db.challenge_db import (
    create_challenge, get_challenge, list_challenges,
    join_challenge, get_challenge_participants, update_participant_progress,
    ChallengeDBError
)
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


class TestChallengeOperations:
    """Tests for challenge operations."""
    
    def test_create_challenge(self, dynamodb_table):
        """Test creating a challenge."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        created = create_challenge(challenge)
        
        assert created.id == "challenge-123"
        assert created.title == "Complete 10 Tasks"
    
    def test_get_challenge(self, dynamodb_table):
        """Test retrieving a challenge."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        retrieved = get_challenge("challenge-123")
        
        assert retrieved is not None
        assert retrieved.id == "challenge-123"
        assert retrieved.title == "Complete 10 Tasks"
    
    def test_get_challenge_not_found(self, dynamodb_table):
        """Test retrieving a non-existent challenge."""
        retrieved = get_challenge("challenge-nonexistent")
        assert retrieved is None
    
    def test_list_challenges(self, dynamodb_table):
        """Test listing challenges."""
        now_ms = int(time.time() * 1000)
        challenge1 = Challenge(
            id="challenge-1",
            title="Challenge 1",
            description="Description 1",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=50,
            createdBy="user-123",
            status="active",
            createdAt=now_ms,
            updatedAt=now_ms
        )
        challenge2 = Challenge(
            id="challenge-2",
            title="Challenge 2",
            description="Description 2",
            type="xp_accumulation",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=75,
            createdBy="user-456",
            status="active",
            createdAt=now_ms,
            updatedAt=now_ms
        )
        
        create_challenge(challenge1)
        create_challenge(challenge2)
        
        challenges = list_challenges()
        
        assert len(challenges) >= 2
    
    def test_list_challenges_by_status(self, dynamodb_table):
        """Test listing challenges filtered by status."""
        now_ms = int(time.time() * 1000)
        challenge1 = Challenge(
            id="challenge-1",
            title="Challenge 1",
            description="Description 1",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=50,
            createdBy="user-123",
            status="active",
            createdAt=now_ms,
            updatedAt=now_ms
        )
        challenge2 = Challenge(
            id="challenge-2",
            title="Challenge 2",
            description="Description 2",
            type="xp_accumulation",
            startDate=now_ms,
            endDate=now_ms + 7 * 24 * 60 * 60 * 1000,
            xpReward=75,
            createdBy="user-456",
            status="completed",
            createdAt=now_ms,
            updatedAt=now_ms
        )
        
        create_challenge(challenge1)
        create_challenge(challenge2)
        
        active_challenges = list_challenges(status="active")
        
        assert len(active_challenges) >= 1
        assert all(c.status == "active" for c in active_challenges)


class TestChallengeParticipants:
    """Tests for challenge participant operations."""
    
    def test_join_challenge(self, dynamodb_table):
        """Test joining a challenge."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        participant = join_challenge("user-456", "challenge-123")
        
        assert participant.userId == "user-456"
        assert participant.challengeId == "challenge-123"
        assert participant.progress == 0.0
        assert participant.currentValue == 0
    
    def test_join_challenge_duplicate(self, dynamodb_table):
        """Test joining a challenge twice (should return existing)."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        participant1 = join_challenge("user-456", "challenge-123")
        participant2 = join_challenge("user-456", "challenge-123")
        
        assert participant1.joinedAt == participant2.joinedAt
    
    def test_get_challenge_participants(self, dynamodb_table):
        """Test getting all participants for a challenge."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        join_challenge("user-1", "challenge-123")
        join_challenge("user-2", "challenge-123")
        
        participants = get_challenge_participants("challenge-123")
        
        assert len(participants) == 2
        user_ids = [p.userId for p in participants]
        assert "user-1" in user_ids
        assert "user-2" in user_ids
    
    def test_update_participant_progress(self, dynamodb_table):
        """Test updating participant progress."""
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-123",
            title="Complete 10 Tasks",
            description="Complete 10 tasks this week",
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
        
        update_participant_progress("challenge-123", "user-456", current_value=5, progress=0.5)
        
        participants = get_challenge_participants("challenge-123")
        participant = next(p for p in participants if p.userId == "user-456")
        
        assert participant.currentValue == 5
        assert participant.progress == 0.5
