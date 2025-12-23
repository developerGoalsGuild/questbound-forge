"""
Unit tests for Challenge API routes.
"""

import pytest
import boto3
import os
import json
import time
from moto import mock_aws
from fastapi.testclient import TestClient

os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
os.environ['AWS_REGION'] = os.environ['AWS_DEFAULT_REGION']
os.environ['CORE_TABLE'] = 'gg_core'
os.environ['JWT_SECRET'] = 'test-secret'
os.environ['JWT_AUDIENCE'] = 'api://default'
os.environ['JWT_ISSUER'] = 'https://auth.local'
os.environ['GAMIFICATION_SERVICE_ENV_VARS'] = json.dumps({
    'CORE_TABLE': 'gg_core',
    'JWT_SECRET': 'test-secret',
    'JWT_AUDIENCE': 'api://default',
    'JWT_ISSUER': 'https://auth.local'
})


@pytest.fixture(scope='function')
def app_client(monkeypatch):
    """Create a test client with mocked AWS services."""
    with mock_aws():
        # Create mock DynamoDB table
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
        
        # Import app after environment is set
        import importlib
        from app.main import app
        importlib.reload(__import__('app.main', fromlist=['']))
        
        client = TestClient(app)
        yield client


def _issue_token(user_id: str = "user-123", email: str = "test@example.com") -> str:
    """Issue a test JWT token."""
    import jwt
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
        "aud": "api://default",
        "iss": "https://auth.local"
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


class TestChallengeAPI:
    """Tests for Challenge API endpoints."""
    
    def test_create_challenge_success(self, app_client):
        """Test creating a new challenge."""
        token = _issue_token("user-123")
        
        now_ms = int(time.time() * 1000)
        payload = {
            "title": "Test Challenge",
            "description": "Complete 10 quests",
            "type": "quest_completion",
            "startDate": now_ms,
            "endDate": now_ms + (7 * 24 * 60 * 60 * 1000),  # 7 days from now
            "xpReward": 100,
            "targetValue": 10
        }
        
        response = app_client.post(
            "/challenges",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Challenge"
        assert data["createdBy"] == "user-123"
        assert data["status"] == "active"
        assert "id" in data
    
    def test_create_challenge_unauthorized(self, app_client):
        """Test creating challenge without authentication."""
        now_ms = int(time.time() * 1000)
        payload = {
            "title": "Test Challenge",
            "description": "Test",
            "type": "quest_completion",
            "startDate": now_ms,
            "endDate": now_ms + 1000,
            "xpReward": 100
        }
        
        response = app_client.post("/challenges", json=payload)
        
        assert response.status_code == 401
    
    def test_create_challenge_invalid_payload(self, app_client):
        """Test creating challenge with invalid payload."""
        token = _issue_token()
        
        payload = {
            "title": "Test Challenge"
            # Missing required fields
        }
        
        response = app_client.post(
            "/challenges",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # FastAPI may return 400 or 422 for validation errors
        assert response.status_code in [400, 422]  # Validation error
    
    def test_list_challenges_success(self, app_client):
        """Test listing challenges."""
        # Create a challenge first
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-1",
            title="Test Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        
        response = app_client.get("/challenges")
        
        assert response.status_code == 200
        data = response.json()
        assert "challenges" in data
        assert "total" in data
        assert data["total"] >= 1
    
    def test_list_challenges_with_status_filter(self, app_client):
        """Test listing challenges filtered by status."""
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        active_challenge = Challenge(
            id="active-1",
            title="Active Challenge",
            description="Active",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        completed_challenge = Challenge(
            id="completed-1",
            title="Completed Challenge",
            description="Completed",
            type="quest_completion",
            startDate=now_ms - 2000,
            endDate=now_ms - 1000,
            xpReward=100,
            createdBy="user-123",
            status="completed",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(active_challenge)
        create_challenge(completed_challenge)
        
        response = app_client.get("/challenges?status=active")
        
        assert response.status_code == 200
        data = response.json()
        assert all(ch["status"] == "active" for ch in data["challenges"])
    
    def test_list_challenges_with_limit(self, app_client):
        """Test listing challenges with limit."""
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        for i in range(5):
            challenge = Challenge(
                id=f"challenge-{i}",
                title=f"Challenge {i}",
                description="Test",
                type="quest_completion",
                startDate=now_ms,
                endDate=now_ms + 1000,
                xpReward=100,
                createdBy="user-123",
                status="active",
                targetValue=10,
                createdAt=now_ms,
                updatedAt=now_ms
            )
            create_challenge(challenge)
        
        response = app_client.get("/challenges?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["challenges"]) <= 3
    
    def test_get_challenge_success(self, app_client):
        """Test getting challenge details."""
        from app.db.challenge_db import create_challenge, join_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="challenge-detail",
            title="Detail Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        join_challenge("user-456", "challenge-detail")
        
        token = _issue_token("user-456")
        response = app_client.get(
            "/challenges/challenge-detail",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "challenge" in data
        assert "participants" in data
        assert "participantCount" in data
        assert data["challenge"]["id"] == "challenge-detail"
        assert data["myProgress"] is not None
    
    def test_get_challenge_not_found(self, app_client):
        """Test getting non-existent challenge."""
        token = _issue_token()
        response = app_client.get(
            "/challenges/nonexistent",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    def test_get_challenge_unauthenticated(self, app_client):
        """Test getting challenge without authentication (requires auth)."""
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="public-challenge",
            title="Public Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        
        response = app_client.get("/challenges/public-challenge")
        
        # Endpoint requires authentication (authenticate dependency raises 401)
        assert response.status_code == 401
    
    def test_join_challenge_success(self, app_client):
        """Test joining a challenge."""
        token = _issue_token("user-789")
        
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="join-challenge",
            title="Join Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms - 1000,  # Started
            endDate=now_ms + 1000,     # Not ended
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        
        response = app_client.post(
            "/challenges/join-challenge/join",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["userId"] == "user-789"
        assert data["challengeId"] == "join-challenge"
        assert data["progress"] == 0.0
    
    def test_join_challenge_not_found(self, app_client):
        """Test joining non-existent challenge."""
        token = _issue_token()
        
        response = app_client.post(
            "/challenges/nonexistent/join",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    def test_join_challenge_inactive(self, app_client):
        """Test joining an inactive challenge."""
        token = _issue_token()
        
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="inactive-challenge",
            title="Inactive Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="completed",  # Not active
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        
        response = app_client.post(
            "/challenges/inactive-challenge/join",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
    
    def test_join_challenge_outside_time_window(self, app_client):
        """Test joining challenge outside time window."""
        token = _issue_token()
        
        from app.db.challenge_db import create_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="expired-challenge",
            title="Expired Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms - 2000,
            endDate=now_ms - 1000,  # Already ended
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        
        response = app_client.post(
            "/challenges/expired-challenge/join",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
    
    def test_update_challenge_progress_success(self, app_client):
        """Test updating challenge progress (internal endpoint)."""
        token = _issue_token("user-progress")
        
        from app.db.challenge_db import create_challenge, join_challenge
        from app.models.challenge import Challenge
        
        now_ms = int(time.time() * 1000)
        challenge = Challenge(
            id="progress-challenge",
            title="Progress Challenge",
            description="Test",
            type="quest_completion",
            startDate=now_ms - 1000,
            endDate=now_ms + 1000,
            xpReward=100,
            createdBy="user-123",
            status="active",
            targetValue=10,
            createdAt=now_ms,
            updatedAt=now_ms
        )
        create_challenge(challenge)
        join_challenge("user-progress", "progress-challenge")
        
        response = app_client.post(
            "/challenges/progress-challenge/progress?current_value=5",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Internal-Key": "test-key"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["progress"] == 0.5  # 5/10
        assert data["currentValue"] == 5
    
    def test_update_challenge_progress_not_found(self, app_client):
        """Test updating progress for non-existent challenge."""
        token = _issue_token()
        
        response = app_client.post(
            "/challenges/nonexistent/progress?current_value=5",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Internal-Key": "test-key"
            }
        )
        
        assert response.status_code == 404
    
    def test_update_challenge_progress_unauthorized(self, app_client):
        """Test updating progress without authentication."""
        response = app_client.post(
            "/challenges/test/progress?current_value=5",
            headers={"X-Internal-Key": "test-key"}
        )
        
        assert response.status_code == 401

