"""
Test Helper Functions for Quest Tests.

This module provides utility functions and helpers for Quest testing,
including test data generation, authentication mocking, and common test patterns.
"""

import uuid
import time
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from unittest.mock import Mock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from .test_data_manager import test_data_manager


class TestDataHelpers:
    """Helper functions for generating test data."""
    
    @staticmethod
    def generate_test_user_id() -> str:
        """Generate a test user ID with prefix."""
        return f"test_user_{uuid.uuid4().hex[:8]}"
    
    @staticmethod
    def generate_test_quest_id() -> str:
        """Generate a test quest ID with prefix."""
        return f"test_quest_{uuid.uuid4().hex[:8]}"
    
    @staticmethod
    def generate_test_goal_id() -> str:
        """Generate a test goal ID with prefix."""
        return f"test_goal_{uuid.uuid4().hex[:8]}"
    
    @staticmethod
    def generate_test_task_id() -> str:
        """Generate a test task ID with prefix."""
        return f"test_task_{uuid.uuid4().hex[:8]}"
    
    @staticmethod
    def generate_future_timestamp(days: int = 7) -> int:
        """Generate a future timestamp in milliseconds."""
        future_time = datetime.now() + timedelta(days=days)
        return int(future_time.timestamp() * 1000)
    
    @staticmethod
    def generate_past_timestamp(days: int = 1) -> int:
        """Generate a past timestamp in milliseconds."""
        past_time = datetime.now() - timedelta(days=days)
        return int(past_time.timestamp() * 1000)
    
    @staticmethod
    def is_test_data(item: Dict) -> bool:
        """Check if an item is test data."""
        test_prefixes = ["test_user_", "test_quest_", "test_goal_", "test_task_"]
        item_id = item.get("id", "")
        return any(item_id.startswith(prefix) for prefix in test_prefixes)
    
    @staticmethod
    def create_test_quest_payload(
        title: str = "Test Quest",
        category: str = "Health",
        difficulty: str = "medium",
        kind: str = "linked",
        **kwargs
    ) -> Dict[str, Any]:
        """Create a test quest payload with defaults."""
        payload = {
            "title": title,
            "category": category,
            "difficulty": difficulty,
            "kind": kind,
            **kwargs
        }
        return payload
    
    @staticmethod
    def create_test_quantitative_quest_payload(
        title: str = "Test Quantitative Quest",
        category: str = "Work",
        target_count: int = 5,
        **kwargs
    ) -> Dict[str, Any]:
        """Create a test quantitative quest payload."""
        future_time = TestDataHelpers.generate_future_timestamp(1)
        payload = {
            "title": title,
            "category": category,
            "kind": "quantitative",
            "targetCount": target_count,
            "countScope": "completed_tasks",
            "startAt": future_time,
            "periodDays": 1,  # 1 day
            **kwargs
        }
        return payload
    
    @staticmethod
    def create_test_linked_quest_payload(
        title: str = "Test Linked Quest",
        category: str = "Health",
        goal_ids: Optional[list] = None,
        task_ids: Optional[list] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create a test linked quest payload."""
        payload = {
            "title": title,
            "category": category,
            "kind": "linked",
            **kwargs
        }
        
        if goal_ids:
            payload["linkedGoalIds"] = goal_ids
        if task_ids:
            payload["linkedTaskIds"] = task_ids
            
        return payload


class AuthHelpers:
    """Helper functions for authentication in tests."""
    
    @staticmethod
    def get_auth_headers() -> Dict[str, str]:
        """Get authentication headers from environment variables."""
        token = os.getenv("TEST_AUTH_TOKEN")
        api_key = os.getenv("TEST_API_KEY")
        
        if not token or not api_key:
            raise ValueError("Missing authentication credentials. Run tests through run_tests.py")
        
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    @staticmethod
    def get_api_url() -> str:
        """Get API URL from environment variables."""
        api_url = os.getenv("TEST_API_URL")
        if not api_url:
            raise ValueError("Missing API URL. Run tests through run_tests.py")
        return api_url
    
    @staticmethod
    def get_api_key() -> str:
        """Get API key from environment variables."""
        api_key = os.getenv("TEST_API_KEY")
        if not api_key:
            raise ValueError("Missing API key. Run tests through run_tests.py")
        return api_key
    
    @staticmethod
    def create_mock_auth_context(user_id: str, role: str = "user", **kwargs) -> Mock:
        """Create a mock authentication context for unit tests."""
        mock_auth = Mock()
        mock_auth.user_id = user_id
        mock_auth.claims = {
            "sub": user_id,
            "role": role,
            **kwargs
        }
        mock_auth.provider = "api_gateway"
        return mock_auth
    
    @staticmethod
    def create_admin_auth_context(user_id: str) -> Mock:
        """Create a mock admin authentication context."""
        return AuthHelpers.create_mock_auth_context(user_id, role="admin")
    
    @staticmethod
    def mock_authenticate(user_id: str, role: str = "user"):
        """Create a mock for the authenticate dependency."""
        def mock_auth_func(request):
            return AuthHelpers.create_mock_auth_context(user_id, role)
        return mock_auth_func
    
    @staticmethod
    def make_authenticated_request(method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make an authenticated request to the API."""
        api_url = AuthHelpers.get_api_url()
        headers = AuthHelpers.get_auth_headers()
        
        # Merge headers
        if 'headers' in kwargs:
            headers.update(kwargs['headers'])
        kwargs['headers'] = headers
        
        # Ensure endpoint starts with / if it doesn't already
        if not endpoint.startswith('/'):
            endpoint = '/' + endpoint
        
        # Add /v1 prefix for API Gateway compatibility
        if not endpoint.startswith('/v1/'):
            endpoint = '/v1' + endpoint
            
        url = f"{api_url}{endpoint}"
        return requests.request(method, url, **kwargs)


class TestClientHelpers:
    """Helper functions for working with FastAPI test client."""
    
    @staticmethod
    def create_authenticated_client(app, user_id: str, role: str = "user") -> TestClient:
        """Create a test client with mocked authentication for unit tests."""
        with patch('app.main.authenticate') as mock_auth:
            mock_auth.return_value = AuthHelpers.create_mock_auth_context(user_id, role)
            return TestClient(app)
    
    @staticmethod
    def make_authenticated_request(
        client: TestClient,
        method: str,
        url: str,
        user_id: str,
        role: str = "user",
        **kwargs
    ):
        """Make an authenticated request with mocked auth for unit tests."""
        with patch('app.main.authenticate') as mock_auth:
            mock_auth.return_value = AuthHelpers.create_mock_auth_context(user_id, role)
            return getattr(client, method.lower())(url, **kwargs)
    
    @staticmethod
    def make_integration_request(method: str, endpoint: str, **kwargs):
        """Make an authenticated request for integration tests."""
        return AuthHelpers.make_authenticated_request(method, endpoint, **kwargs)


class DatabaseHelpers:
    """Helper functions for database operations in tests."""
    
    @staticmethod
    def create_test_quest_in_db(user_id: str, quest_data: Dict[str, Any]) -> str:
        """Create a test quest directly in the database."""
        from app.db.quest_db import create_quest
        from app.models.quest import QuestCreatePayload
        
        # Convert dict to Pydantic model
        payload = QuestCreatePayload(**quest_data)
        
        # Create quest
        quest = create_quest(user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", 
            quest.id, 
            user_id,
            f"USER#{user_id}",
            f"QUEST#{quest.id}"
        )
        
        return quest.id
    
    @staticmethod
    def create_test_goal_in_db(user_id: str, goal_data: Dict[str, Any]) -> str:
        """Create a test goal directly in the database."""
        from app.main import _build_goal_item, get_goals_table
        from app.models import GoalCreatePayload
        
        # Convert dict to Pydantic model
        payload = GoalCreatePayload(**goal_data)
        
        # Create goal item
        item = _build_goal_item(user_id, payload)
        
        # Save to database
        table = get_goals_table()
        table.put_item(Item=item)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "goal", 
            item["id"], 
            user_id,
            item["PK"],
            item["SK"]
        )
        
        return item["id"]
    
    @staticmethod
    def create_test_task_in_db(user_id: str, task_data: Dict[str, Any]) -> str:
        """Create a test task directly in the database."""
        from app.main import _build_task_item, get_goals_table
        from app.models import TaskInput
        
        # Convert dict to Pydantic model
        payload = TaskInput(**task_data)
        
        # Create task item
        item = _build_task_item(user_id, payload)
        
        # Save to database
        table = get_goals_table()
        table.put_item(Item=item)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "task", 
            item["id"], 
            user_id,
            item["PK"],
            item["SK"]
        )
        
        return item["id"]


class ValidationHelpers:
    """Helper functions for validation testing."""
    
    @staticmethod
    def assert_quest_response_structure(response_data: Dict[str, Any]):
        """Assert that quest response has correct structure."""
        required_fields = [
            "id", "userId", "title", "difficulty", "rewardXp", 
            "status", "category", "tags", "privacy", "createdAt", 
            "updatedAt", "version", "kind"
        ]
        
        for field in required_fields:
            assert field in response_data, f"Missing required field: {field}"
        
        # Check data types
        assert isinstance(response_data["id"], str)
        assert isinstance(response_data["userId"], str)
        assert isinstance(response_data["title"], str)
        assert isinstance(response_data["difficulty"], str)
        assert isinstance(response_data["rewardXp"], int)
        assert isinstance(response_data["status"], str)
        assert isinstance(response_data["category"], str)
        assert isinstance(response_data["tags"], list)
        assert isinstance(response_data["privacy"], str)
        assert isinstance(response_data["createdAt"], int)
        assert isinstance(response_data["updatedAt"], int)
        assert isinstance(response_data["version"], int)
        assert isinstance(response_data["kind"], str)
    
    @staticmethod
    def assert_error_response_structure(response_data: Dict[str, Any]):
        """Assert that error response has correct structure."""
        # API Gateway may return either 'detail' or 'message' field
        assert "detail" in response_data or "message" in response_data, "Error response missing 'detail' or 'message' field"
        
        # Check the appropriate field based on what's available
        if "detail" in response_data:
            assert isinstance(response_data["detail"], str), "Error detail must be a string"
        elif "message" in response_data:
            assert isinstance(response_data["message"], str), "Error message must be a string"
    
    @staticmethod
    def assert_validation_error(response, expected_status: int = 400):
        """Assert that response is a validation error."""
        assert response.status_code == expected_status
        data = response.json()
        ValidationHelpers.assert_error_response_structure(data)
        assert "detail" in data


class SecurityHelpers:
    """Helper functions for security testing."""
    
    @staticmethod
    def get_xss_payloads() -> list:
        """Get list of XSS test payloads."""
        return [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "';alert('xss');//",
            "<iframe src=javascript:alert('xss')>",
        ]
    
    @staticmethod
    def get_sql_injection_payloads() -> list:
        """Get list of SQL injection test payloads."""
        return [
            "'; DROP TABLE quests; --",
            "' OR '1'='1",
            "'; DELETE FROM quests; --",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO quests VALUES ('hack'); --",
        ]
    
    @staticmethod
    def get_validation_bypass_payloads() -> list:
        """Get list of validation bypass test payloads."""
        return [
            "A" * 1000,  # Very long string
            "",  # Empty string
            "   ",  # Whitespace only
            "\x00\x01\x02",  # Null bytes
            "🚀🎯💪",  # Unicode characters
        ]


# Common test fixtures
@pytest.fixture
def test_user_id():
    """Provide a test user ID for tests."""
    return TestDataHelpers.generate_test_user_id()


@pytest.fixture
def test_quest_id():
    """Provide a test quest ID for tests."""
    return TestDataHelpers.generate_test_quest_id()


@pytest.fixture
def test_goal_id():
    """Provide a test goal ID for tests."""
    return TestDataHelpers.generate_test_goal_id()


@pytest.fixture
def test_task_id():
    """Provide a test task ID for tests."""
    return TestDataHelpers.generate_test_task_id()


@pytest.fixture
def future_timestamp():
    """Provide a future timestamp for tests."""
    return TestDataHelpers.generate_future_timestamp(7)


@pytest.fixture
def mock_auth_context(test_user_id):
    """Provide a mock authentication context for tests."""
    return AuthHelpers.create_mock_auth_context(test_user_id)


@pytest.fixture
def mock_admin_auth_context(test_user_id):
    """Provide a mock admin authentication context for tests."""
    return AuthHelpers.create_admin_auth_context(test_user_id)
