"""
Unit tests for Leaderboard API routes.
"""

import pytest
import boto3
import os
import json
import time
from decimal import Decimal
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


class TestLeaderboardAPI:
    """Tests for Leaderboard API endpoints."""
    
    def test_get_global_leaderboard_success(self, app_client):
        """Test getting global XP leaderboard."""
        # Create XP summaries for multiple users
        from app.db.xp_db import create_xp_summary
        
        create_xp_summary("user-1", initial_xp=1000)
        create_xp_summary("user-2", initial_xp=500)
        create_xp_summary("user-3", initial_xp=2000)
        
        response = app_client.get("/leaderboard/global")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        # Check that entries are sorted by value (descending)
        # Values may be strings, so convert to int for comparison
        values = [int(entry["value"]) if isinstance(entry["value"], str) else entry["value"] for entry in data]
        assert values == sorted(values, reverse=True)
    
    def test_get_global_leaderboard_with_limit(self, app_client):
        """Test getting global leaderboard with limit."""
        from app.db.xp_db import create_xp_summary
        
        for i in range(10):
            create_xp_summary(f"user-{i}", initial_xp=100 * i)
        
        response = app_client.get("/leaderboard/global?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
    
    def test_get_global_leaderboard_invalid_limit(self, app_client):
        """Test getting global leaderboard with invalid limit."""
        response = app_client.get("/leaderboard/global?limit=0")
        
        # FastAPI may return 400 or 422 for validation errors
        assert response.status_code in [400, 422]  # Validation error
    
    def test_get_global_leaderboard_limit_too_high(self, app_client):
        """Test getting global leaderboard with limit too high."""
        response = app_client.get("/leaderboard/global?limit=2000")
        
        # FastAPI may return 400 or 422 for validation errors
        assert response.status_code in [400, 422]  # Validation error (max is 1000)
    
    def test_get_global_leaderboard_empty(self, app_client):
        """Test getting global leaderboard when empty."""
        response = app_client.get("/leaderboard/global")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_level_leaderboard_success(self, app_client):
        """Test getting level leaderboard."""
        from app.db.xp_db import create_xp_summary
        
        # Create users with different levels
        create_xp_summary("user-level-1", initial_xp=100)   # Level 2
        create_xp_summary("user-level-2", initial_xp=400)   # Level 3
        create_xp_summary("user-level-3", initial_xp=1600)  # Level 5
        
        response = app_client.get("/leaderboard/level")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        # Check that entries are sorted by value (descending)
        # Values may be strings, so convert to int for comparison
        values = [int(entry["value"]) if isinstance(entry["value"], str) else entry["value"] for entry in data]
        assert values == sorted(values, reverse=True)
    
    def test_get_level_leaderboard_with_limit(self, app_client):
        """Test getting level leaderboard with limit."""
        from app.db.xp_db import create_xp_summary
        
        for i in range(10):
            create_xp_summary(f"level-user-{i}", initial_xp=100 * i)
        
        response = app_client.get("/leaderboard/level?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3
    
    def test_get_badge_leaderboard_success(self, app_client):
        """Test getting badge leaderboard."""
        from app.db.badge_db import create_badge_definition, assign_badge
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        
        # Create badge definitions
        badge1 = BadgeDefinition(
            id="badge-1",
            name="Badge 1",
            description="Test",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        badge2 = BadgeDefinition(
            id="badge-2",
            name="Badge 2",
            description="Test",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(badge1)
        create_badge_definition(badge2)
        
        # Assign badges to users
        assign_badge("user-badge-1", "badge-1", {})
        assign_badge("user-badge-1", "badge-2", {})
        assign_badge("user-badge-2", "badge-1", {})
        
        response = app_client.get("/leaderboard/badges")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        
        # Check that entries are sorted by value (descending)
        # Values may be strings, so convert to int for comparison
        values = [int(entry["value"]) if isinstance(entry["value"], str) else entry["value"] for entry in data]
        assert values == sorted(values, reverse=True)
        
        # user-badge-1 should have more badges than user-badge-2
        user1_entry = next((e for e in data if e["userId"] == "user-badge-1"), None)
        user2_entry = next((e for e in data if e["userId"] == "user-badge-2"), None)
        
        if user1_entry and user2_entry:
            assert user1_entry["value"] >= user2_entry["value"]
    
    def test_get_badge_leaderboard_with_limit(self, app_client):
        """Test getting badge leaderboard with limit."""
        from app.db.badge_db import create_badge_definition, assign_badge
        from app.models.badge import BadgeDefinition
        
        now_ms = int(time.time() * 1000)
        
        badge = BadgeDefinition(
            id="limit-badge",
            name="Limit Badge",
            description="Test",
            category="quest",
            rarity="common",
            createdAt=now_ms
        )
        create_badge_definition(badge)
        
        for i in range(10):
            assign_badge(f"badge-user-{i}", "limit-badge", {})
        
        response = app_client.get("/leaderboard/badges?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
    
    def test_get_badge_leaderboard_empty(self, app_client):
        """Test getting badge leaderboard when empty."""
        response = app_client.get("/leaderboard/badges")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_leaderboard_entries_have_required_fields(self, app_client):
        """Test that leaderboard entries have required fields."""
        from app.db.xp_db import create_xp_summary
        
        create_xp_summary("test-user", initial_xp=500)
        
        response = app_client.get("/leaderboard/global")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            entry = data[0]
            assert "userId" in entry
            assert "rank" in entry
            assert "value" in entry
            assert "metadata" in entry

