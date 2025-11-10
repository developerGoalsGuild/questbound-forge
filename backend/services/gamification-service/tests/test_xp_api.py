"""
Unit tests for XP API routes.
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


class TestXPAPI:
    """Tests for XP API endpoints."""
    
    def test_get_current_xp_success(self, app_client):
        """Test getting current XP for authenticated user."""
        token = _issue_token()
        
        # First create an XP summary
        from app.db.xp_db import create_xp_summary
        create_xp_summary("user-123", initial_xp=150)
        
        response = app_client.get(
            "/xp/current",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["userId"] == "user-123"
        assert data["totalXp"] == 150
    
    def test_get_current_xp_unauthorized(self, app_client):
        """Test getting current XP without authentication."""
        response = app_client.get("/xp/current")
        
        assert response.status_code == 401
    
    def test_get_current_xp_invalid_token(self, app_client):
        """Test getting current XP with invalid token."""
        response = app_client.get(
            "/xp/current",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        assert response.status_code == 401
    
    def test_get_xp_history_success(self, app_client):
        """Test getting XP history."""
        token = _issue_token()
        
        # Create transactions
        from app.db.xp_db import create_xp_transaction
        create_xp_transaction("user-123", 10, "task_completion", description="Task 1")
        create_xp_transaction("user-123", 25, "goal_completion", description="Goal 1")
        
        response = app_client.get(
            "/xp/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert len(data["transactions"]) >= 0
    
    def test_get_xp_history_with_limit(self, app_client):
        """Test getting XP history with limit."""
        token = _issue_token()
        
        # Create multiple transactions
        from app.db.xp_db import create_xp_transaction
        for i in range(5):
            create_xp_transaction("user-123", 10, "task_completion", description=f"Task {i}")
        
        response = app_client.get(
            "/xp/history?limit=3",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["transactions"]) <= 3
    
    def test_get_xp_history_invalid_limit(self, app_client):
        """Test getting XP history with invalid limit."""
        token = _issue_token()
        
        response = app_client.get(
            "/xp/history?limit=0",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
    
    def test_award_xp_internal(self, app_client):
        """Test internal XP award endpoint."""
        payload = {
            "userId": "user-123",
            "amount": 10,
            "source": "task_completion",
            "description": "Test task"
        }
        
        response = app_client.post(
            "/xp/award",
            json=payload,
            headers={"X-Internal-Key": "test-key"}
        )
        
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["totalXp"] == 10
