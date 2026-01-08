"""
Unit tests for Badge API routes.
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
    'JWT_ISSUER': 'https://auth.local',
    'INTERNAL_API_KEY': 'test-key'
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


class TestBadgeAPI:
    """Tests for Badge API endpoints."""
    
    def test_list_available_badges_success(self, app_client):
        """Test listing all available badge definitions."""
        # Create some badge definitions
        from app.db.badge_db import create_badge_definition
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        badge1 = BadgeDefinition(
            id="badge-1",
            name="First Quest",
            description="Completed first quest",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        badge2 = BadgeDefinition(
            id="badge-2",
            name="Quest Master",
            description="Completed 10 quests",
            category="quest",
            rarity="rare",
            createdAt=now_ms
        )
        create_badge_definition(badge1)
        create_badge_definition(badge2)
        
        response = app_client.get("/badges")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
    
    def test_list_available_badges_with_category(self, app_client):
        """Test listing badges filtered by category."""
        from app.db.badge_db import create_badge_definition
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        quest_badge = BadgeDefinition(
            id="quest-badge",
            name="Quest Badge",
            description="Quest badge",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        level_badge = BadgeDefinition(
            id="level-badge",
            name="Level Badge",
            description="Level badge",
            category="level",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(quest_badge)
        create_badge_definition(level_badge)
        
        response = app_client.get("/badges?category=quest")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert all(badge["category"] == "quest" for badge in data)
    
    def test_get_my_badges_success(self, app_client):
        """Test getting badges for authenticated user."""
        token = _issue_token("user-123")
        
        # Create badge definition and assign it
        from app.db.badge_db import create_badge_definition, assign_badge
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        badge_def = BadgeDefinition(
            id="test-badge",
            name="Test Badge",
            description="Test badge",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(badge_def)
        assign_badge("user-123", "test-badge", {})
        
        response = app_client.get(
            "/badges/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "total" in data
        assert data["total"] >= 1
    
    def test_get_my_badges_unauthorized(self, app_client):
        """Test getting badges without authentication."""
        response = app_client.get("/badges/me")
        
        assert response.status_code == 401
    
    def test_get_my_badges_invalid_token(self, app_client):
        """Test getting badges with invalid token."""
        response = app_client.get(
            "/badges/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        assert response.status_code == 401
    
    def test_get_user_badges_success(self, app_client):
        """Test getting badges for a specific user (public endpoint)."""
        # Create badge definition and assign it
        from app.db.badge_db import create_badge_definition, assign_badge
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        badge_def = BadgeDefinition(
            id="public-badge",
            name="Public Badge",
            description="Public badge",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(badge_def)
        assign_badge("user-456", "public-badge", {})
        
        response = app_client.get("/badges/user-456")
        
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "total" in data
        assert data["total"] >= 1
    
    def test_get_user_badges_not_found(self, app_client):
        """Test getting badges for user with no badges."""
        response = app_client.get("/badges/user-nonexistent")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["badges"]) == 0

    def test_badges_evaluate_endpoint(self, app_client):
        """Ensure evaluate endpoint assigns level-based badges."""
        payload = {
            "userId": "user-123",
            "achievementType": "level_up",
            "achievementData": {"level": 5}
        }

        response = app_client.post(
            "/badges/evaluate",
            json=payload,
            headers={"X-Internal-Key": "test-key"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    def test_badges_evaluate_requires_key(self, app_client):
        """Internal evaluate endpoint enforces secret."""
        payload = {
            "userId": "user-123",
            "achievementType": "level_up",
            "achievementData": {"level": 5}
        }

        response = app_client.post("/badges/evaluate", json=payload)
        assert response.status_code == 403
    
    def test_assign_badge_internal_success(self, app_client):
        """Test internal badge assignment endpoint."""
        # Create badge definition first
        from app.db.badge_db import create_badge_definition
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        badge_def = BadgeDefinition(
            id="assign-badge",
            name="Assign Badge",
            description="Assign badge",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(badge_def)
        
        payload = {
            "userId": "user-789",
            "badgeId": "assign-badge",
            "metadata": {"source": "test"}
        }
        
        response = app_client.post(
            "/badges/assign",
            json=payload,
            headers={"X-Internal-Key": "test-key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "badge" in data
    
    def test_assign_badge_internal_missing_badge(self, app_client):
        """Test assigning a badge that doesn't exist (still succeeds)."""
        payload = {
            "userId": "user-789",
            "badgeId": "nonexistent-badge",
            "metadata": {}
        }
        
        response = app_client.post(
            "/badges/assign",
            json=payload,
            headers={"X-Internal-Key": "test-key"}
        )
        
        # Badge assignment succeeds even if definition doesn't exist
        # (definition check is not enforced at assignment time)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_assign_badge_internal_invalid_payload(self, app_client):
        """Test assigning badge with invalid payload."""
        payload = {
            "userId": "user-789"
            # Missing badgeId
        }
        
        response = app_client.post(
            "/badges/assign",
            json=payload,
            headers={"X-Internal-Key": "test-key"}
        )
        
        # FastAPI may return 400 or 422 for validation errors
        assert response.status_code in [400, 422]  # Validation error

