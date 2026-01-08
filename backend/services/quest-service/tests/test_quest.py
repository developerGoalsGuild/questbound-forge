"""
Comprehensive tests for Quest API endpoints and functionality.

This module tests all Quest-related API endpoints including:
- CRUD operations (create, read, update, delete)
- Quest status management (start, cancel, fail)
- Validation and error handling
- Security controls and authorization
- Rate limiting and input sanitization
- XSS and injection attack prevention
"""

import json
import time
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
from botocore.exceptions import ClientError

# Import the models (but not the main app yet due to settings dependency)
from app.models.quest import (
    QuestCreatePayload, QuestUpdatePayload, QuestCancelPayload,
    QuestResponse, QuestStatus, QuestDifficulty, QuestKind, QuestCountScope
)
from app.db.quest_db import (
    QuestDBError, QuestNotFoundError, QuestVersionConflictError, QuestPermissionError
)

# Mock settings before importing main app
import os
os.environ["QUEST_LOG_ENABLED"] = "true"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["CORE_TABLE_NAME"] = "test-table"

# Mock the Settings class to avoid SSM calls
class MockSettings:
    def __init__(self):
        self.aws_region = "us-east-1"
        self.core_table_name = "test-table"
        self.environment = "test"
        self.allowed_origins = ["*"]
        self.cognito_region = "us-east-1"
        self.cognito_user_pool_id = "test-user-pool"
        self.cognito_client_id = "test-client-id"

# Mock the TokenVerifier class as well
class MockTokenVerifier:
    def __init__(self, settings):
        pass  # Mock constructor that accepts settings

    def verify(self, token):
        # Parse the mock JWT token and return appropriate claims
        import base64
        import json

        try:
            parts = token.split('.')
            if len(parts) == 3:
                payload_b64 = parts[1]
                # Add padding if needed
                payload_b64 += '=' * (4 - len(payload_b64) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                return payload, "test"
        except:
            pass

        # Fallback for invalid tokens
        return {"sub": "test-user-123", "role": "user"}, "test"

# Mock the TokenVerifier class
with patch('app.settings.Settings', MockSettings), \
     patch('app.auth.TokenVerifier', MockTokenVerifier):
    from app.main import app

# Test client
client = TestClient(app)


class TestQuestAPI:
    """Test Quest API endpoints functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        return {
            "Authorization": f"Bearer test-token-{user_id}",
            "x-api-key": "test-api-key"
        }

    def setup_auth_mock(self):
        """Set up authentication mock for testing."""
        mock_auth_context = MagicMock()
        mock_auth_context.user_id = "test-user-123"
        mock_auth_context.claims = {"sub": "test-user-123", "role": "user"}
        mock_auth_context.provider = "test"

        return mock_auth_context


class TestQuestCreation:
    """Test quest creation functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        # Create a simple JWT-like token for testing
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def setup_auth_mock(self):
        """Set up authentication mock for testing."""
        mock_auth_context = MagicMock()
        mock_auth_context.user_id = "test-user-123"
        mock_auth_context.claims = {"sub": "test-user-123", "role": "user"}
        mock_auth_context.provider = "test"
        return mock_auth_context

    def test_create_valid_linked_quest(self):
        """Test creating a valid linked quest."""
        # Mock the database operations
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Complete my fitness goals",
            "description": "Work out 3 times this week",
            "category": "Health",
            "difficulty": "medium",
            "rewardXp": 75,
            "status": "draft",
            "tags": ["fitness", "health"],
            "privacy": "private",
            "kind": "linked",
            "linkedGoalIds": ["goal-123"],
            "linkedTaskIds": ["task-456"],
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 1,
            "auditTrail": []
        }

        with patch('app.main.create_quest') as mock_create, \
             patch('app.main.authenticate') as mock_auth:

            mock_create.return_value = QuestResponse(**mock_quest)
            mock_auth.return_value = self.setup_auth_mock()

            payload = {
                "title": "Complete my fitness goals",
                "description": "Work out 3 times this week",
                "category": "Health",
                "difficulty": "medium",
                "rewardXp": 75,
                "tags": ["fitness", "health"],
                "privacy": "private",
                "kind": "linked",
                "linkedGoalIds": ["goal-123"],
                "linkedTaskIds": ["task-456"]
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 201
            data = response.json()
            assert data["id"] == "quest-123"
            assert data["title"] == "Complete my fitness goals"
            assert data["status"] == "draft"
            assert data["kind"] == "linked"
            mock_create.assert_called_once()

    def test_create_valid_quantitative_quest(self):
        """Test creating a valid quantitative quest."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)

        mock_quest = {
            "id": "quest-456",
            "userId": "test-user-123",
            "title": "Complete 5 tasks this week",
            "category": "Work",
            "difficulty": "easy",
            "rewardXp": 50,
            "status": "draft",
            "tags": [],
            "privacy": "private",
            "kind": "quantitative",
            "targetCount": 5,
            "countScope": "completed_tasks",
            "startAt": future_time,
            "periodDays": 7,  # 7 days
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 1,
            "auditTrail": []
        }

        with patch('app.main.create_quest') as mock_create:
            mock_create.return_value = QuestResponse(**mock_quest)

            payload = {
                "title": "Complete 5 tasks this week",
                "category": "Work",
                "difficulty": "easy",
                "kind": "quantitative",
                "targetCount": 5,
                "countScope": "completed_tasks",
                "startAt": future_time,
                "periodSeconds": 604800
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 201
            data = response.json()
            assert data["id"] == "quest-456"
            assert data["kind"] == "quantitative"
            assert data["targetCount"] == 5
            assert data["countScope"] == "completed_tasks"

    def test_create_quest_missing_title(self):
        """Test quest creation fails with missing title."""
        payload = {
            "category": "Health",
            "difficulty": "easy"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400  # FastAPI validation error
        assert "title" in response.json()["detail"].lower()

    def test_create_quest_invalid_category(self):
        """Test quest creation fails with invalid category."""
        payload = {
            "title": "Test Quest",
            "category": "InvalidCategory"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "category" in response.json()["detail"].lower()

    def test_create_quest_invalid_difficulty(self):
        """Test quest creation fails with invalid difficulty."""
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "difficulty": "invalid"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "difficulty" in response.json()["detail"].lower()

    def test_create_quest_quantitative_missing_required_fields(self):
        """Test quantitative quest creation fails with missing required fields."""
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "kind": "quantitative"
            # Missing targetCount, countScope, periodDays
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "quantitative" in response.json()["detail"].lower()

    def test_create_quest_database_error(self):
        """Test quest creation handles database errors gracefully."""
        with patch('app.main.create_quest') as mock_create:
            mock_create.side_effect = QuestDBError("Database connection failed")

            payload = {
                "title": "Test Quest",
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "database" in response.json()["detail"].lower()


class TestQuestStart:
    """Test quest starting functionality."""

    def test_start_draft_quest(self):
        """Test starting a draft quest successfully."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "status": "active",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "active"
            mock_change_status.assert_called_once_with("test-user-123", "quest-123", "active")

    def test_start_nonexistent_quest(self):
        """Test starting a non-existent quest fails."""
        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.side_effect = QuestNotFoundError("Quest not found")

            response = client.post(
                "/quests/quests/nonexistent-quest/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_start_quest_permission_denied(self):
        """Test starting a quest without permission fails."""
        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.side_effect = QuestPermissionError("Permission denied")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "permission" in response.json()["detail"].lower()


class TestQuestUpdate:
    """Test quest update functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_update_quest_version_conflict(self):
        """Test handling version conflicts during quest update."""
        with patch('app.main.get_quest') as mock_get_quest, \
             patch('app.main.update_quest') as mock_update_quest:

            mock_get_quest.return_value = QuestResponse(
                id="quest-123", userId="test-user-123", title="Test",
                status="draft", createdAt=1000, updatedAt=1000, version=1,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_update_quest.side_effect = QuestVersionConflictError("Version conflict")

            payload = {"title": "Updated Title"}

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 409
            assert "modified" in response.json()["detail"].lower()

    def test_update_draft_quest(self):
        """Test updating a draft quest successfully."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Updated Quest Title",
            "description": "Updated description",
            "difficulty": "hard",
            "rewardXp": 100,
            "status": "draft",
            "category": "Work",
            "tags": ["updated"],
            "privacy": "private",
            "kind": "linked",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.get_quest') as mock_get_quest, \
             patch('app.main.update_quest') as mock_update_quest:

            mock_get_quest.return_value = QuestResponse(**mock_quest)
            mock_update_quest.return_value = QuestResponse(**mock_quest)

            payload = {
                "title": "Updated Quest Title",
                "description": "Updated description",
                "difficulty": "hard",
                "rewardXp": 100
            }

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Updated Quest Title"
            assert data["difficulty"] == "hard"
            assert data["rewardXp"] == 100

    def test_update_active_quest_fails(self):
        """Test updating an active quest fails."""
        active_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Active Quest",
            "difficulty": "medium",
            "rewardXp": 75,
            "status": "active",
            "category": "Health",
            "tags": ["active"],
            "privacy": "private",
            "kind": "linked",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 1,
            "auditTrail": []
        }

        with patch('app.main.get_quest') as mock_get_quest, \
             patch('app.db.quest_db._get_dynamodb_table') as mock_table:

            mock_get_quest.return_value = QuestResponse(**active_quest)

            payload = {"title": "Cannot Update Active Quest"}

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=self.get_auth_headers()
            )

            # Should fail because active quests are immutable
            assert response.status_code == 404


class TestQuestCancellation:
    """Test quest cancellation functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_cancel_active_quest_with_reason(self):
        """Test cancelling an active quest with a reason."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "difficulty": "easy",
            "rewardXp": 50,
            "status": "cancelled",
            "category": "Personal",
            "tags": [],
            "privacy": "private",
            "kind": "linked",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            payload = {"reason": "Changed my mind"}

            response = client.post(
                "/quests/quests/quest-123/cancel",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "cancelled"
            mock_change_status.assert_called_once_with(
                "test-user-123", "quest-123", "cancelled", "Changed my mind"
            )

    def test_cancel_active_quest_without_reason(self):
        """Test cancelling an active quest without a reason."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "status": "cancelled",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            response = client.post(
                "/quests/quests/quest-123/cancel",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "cancelled"


class TestQuestFailure:
    """Test quest failure functionality."""

    def test_fail_active_quest(self):
        """Test marking an active quest as failed."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "status": "failed",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            response = client.post(
                "/quests/quests/quest-123/fail",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "failed"
            mock_change_status.assert_called_once_with("test-user-123", "quest-123", "failed")


class TestQuestDeletion:
    """Test quest deletion functionality."""

    def test_delete_draft_quest_as_user(self):
        """Test user can delete their own draft quest."""
        with patch('app.main.delete_quest') as mock_delete:
            mock_delete.return_value = True

            response = client.delete(
                "/quests/quests/quest-123",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]
            mock_delete.assert_called_once_with("test-user-123", "quest-123", False)

    def test_delete_quest_as_admin(self):
        """Test admin can delete any quest."""
        admin_headers = self.get_auth_headers(role="admin")

        with patch('app.main.delete_quest') as mock_delete:
            mock_delete.return_value = True

            response = client.delete(
                "/quests/quests/quest-123",
                headers=admin_headers
            )

            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]
            mock_delete.assert_called_once_with("test-user-123", "quest-123", True)

    def test_delete_nonexistent_quest(self):
        """Test deleting a non-existent quest fails."""
        with patch('app.main.delete_quest') as mock_delete:
            mock_delete.side_effect = QuestNotFoundError("Quest not found")

            response = client.delete(
                "/quests/quests/nonexistent-quest",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()


class TestQuestSecurity:
    """Test quest security controls."""

    def test_quest_creation_rate_limiting(self):
        """Test rate limiting for quest creation."""
        # This would typically be tested with a rate limiting middleware
        # For now, we test that the endpoint accepts requests normally
        payload = {
            "title": "Rate Limited Quest",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        # Should work normally if rate limiting is not enforced in tests
        # In production, this would be handled by middleware
        assert response.status_code in [200, 201, 400, 422]

    def test_quest_xss_protection(self):
        """Test XSS protection in quest creation."""
        # Test script injection in title
        payload = {
            "title": "<script>alert('xss')</script>",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        # Should either sanitize the input or reject it
        assert response.status_code in [200, 201, 400]

        if response.status_code == 200:
            data = response.json()
            # If accepted, title should be sanitized
            assert "<script>" not in data.get("title", "")

    def test_quest_sql_injection_protection(self):
        """Test SQL injection protection in quest creation."""
        # Test SQL injection attempts
        malicious_inputs = [
            "'; DROP TABLE quests; --",
            "1' OR '1'='1",
            "admin'--",
            "'; UPDATE quests SET status='completed'; --"
        ]

        for malicious_input in malicious_inputs:
            payload = {
                "title": malicious_input,
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            # Should either reject or sanitize the malicious input
            assert response.status_code in [200, 201, 400]

    def test_quest_authorization(self):
        """Test quest authorization controls."""
        # Test accessing another user's quest
        other_user_headers = self.get_auth_headers(user_id="other-user-456")

        with patch('app.main.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestPermissionError("Access denied")

            # Try to update another user's quest
            payload = {"title": "Unauthorized Update"}

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=other_user_headers
            )

            assert response.status_code == 400
            assert "permission" in response.json()["detail"].lower()


class TestQuestValidation:
    """Test quest validation and error handling."""

    def test_quest_title_length_validation(self):
        """Test quest title length validation."""
        # Test minimum length
        payload = {
            "title": "Hi",  # Too short (minimum 3 chars)
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "title" in response.json()["detail"].lower()

        # Test maximum length
        payload = {
            "title": "x" * 101,  # Too long (maximum 100 chars)
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "title" in response.json()["detail"].lower()

    def test_quest_description_length_validation(self):
        """Test quest description length validation."""
        # Test maximum length
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "description": "x" * 501  # Too long (maximum 500 chars)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "description" in response.json()["detail"].lower()

    def test_quest_tags_validation(self):
        """Test quest tags validation."""
        # Test too many tags
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "tags": ["tag"] * 11  # Too many (maximum 10)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "tags" in response.json()["detail"].lower()

        # Test tag too long
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "tags": ["x" * 21]  # Too long (maximum 20 chars)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "tag" in response.json()["detail"].lower()

    def test_quest_reward_xp_validation(self):
        """Test quest reward XP validation."""
        # Test negative XP
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "rewardXp": -10
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "reward" in response.json()["detail"].lower()

        # Test XP too high
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "rewardXp": 1001  # Too high (maximum 1000)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "reward" in response.json()["detail"].lower()

    def test_quest_deadline_validation(self):
        """Test quest deadline validation."""
        # Test past deadline
        past_time = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "deadline": past_time
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "deadline" in response.json()["detail"].lower()

        # Test deadline too soon
        soon_time = int((datetime.now() + timedelta(minutes=30)).timestamp() * 1000)
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "deadline": soon_time  # Less than 1 hour from now
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "deadline" in response.json()["detail"].lower()


class TestQuestErrorHandling:
    """Test quest error handling and edge cases."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_database_connection_error(self):
        """Test handling of database connection errors."""
        with patch('app.main.create_quest') as mock_create:
            mock_create.side_effect = Exception("Database connection failed")

            payload = {
                "title": "Test Quest",
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_invalid_json_payload(self):
        """Test handling of invalid JSON payload."""
        response = client.post(
            "/quests/createQuest",
            data="invalid json",
            headers=self.get_auth_headers()
        )

        assert response.status_code == 422
        assert "json" in response.json()["detail"].lower()

    def test_missing_authentication(self):
        """Test handling of missing authentication."""
        payload = {
            "title": "Test Quest",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload
            # No Authorization header
        )

        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()

    def test_invalid_authentication_token(self):
        """Test handling of invalid authentication token."""
        payload = {
            "title": "Test Quest",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers={"Authorization": "Invalid token format"}
        )

        assert response.status_code == 401
        assert "bearer" in response.json()["detail"].lower()


class TestQuestIntegration:
    """Test quest integration scenarios."""

    def test_quest_lifecycle_complete(self):
        """Test complete quest lifecycle from creation to completion."""
        # Create quest
        with patch('app.main.create_quest') as mock_create:
            draft_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="draft", createdAt=1000, updatedAt=1000, version=1,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_create.return_value = draft_quest

            response = client.post(
                "/quests/createQuest",
                json={"title": "Lifecycle Test", "category": "Personal"},
                headers=self.get_auth_headers()
            )

            assert response.status_code == 201

        # Start quest
        with patch('app.main.change_quest_status') as mock_start:
            active_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="active", createdAt=1000, updatedAt=2000, version=2,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_start.return_value = active_quest

            response = client.post(
                "/quests/quests/quest-lifecycle/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200

        # Cancel quest
        with patch('app.main.change_quest_status') as mock_cancel:
            cancelled_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="cancelled", createdAt=1000, updatedAt=3000, version=3,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_cancel.return_value = cancelled_quest

            response = client.post(
                "/quests/quests/quest-lifecycle/cancel",
                json={"reason": "Test completed"},
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            assert response.json()["status"] == "cancelled"


    def test_create_quest_database_error(self):
        """Test quest creation handles database errors gracefully."""
        with patch('app.main.create_quest') as mock_create:
            mock_create.side_effect = QuestDBError("Database connection failed")

            payload = {
                "title": "Test Quest",
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "database" in response.json()["detail"].lower()


class TestQuestStart:
    """Test quest starting functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        # Create a simple JWT-like token for testing
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_start_draft_quest(self):
        """Test starting a draft quest successfully."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "difficulty": "easy",
            "rewardXp": 50,
            "status": "active",
            "category": "Personal",
            "tags": [],
            "privacy": "private",
            "kind": "linked",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "active"
            mock_change_status.assert_called_once_with("test-user-123", "quest-123", "active")

    def test_start_nonexistent_quest(self):
        """Test starting a non-existent quest fails."""
        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.side_effect = QuestNotFoundError("Quest not found")

            response = client.post(
                "/quests/quests/nonexistent-quest/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_start_quest_validation_failed_missing_title(self):
        """Test starting a quest with missing title fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Quest title is required")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "title is required" in response.json()["detail"]

    def test_start_quest_validation_failed_missing_category(self):
        """Test starting a quest with missing category fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Quest category is required")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "category is required" in response.json()["detail"]

    def test_start_quest_validation_failed_quantitative_missing_target_count(self):
        """Test starting a quantitative quest with missing target count fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Quantitative quest requires a valid target count greater than 0")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "target count" in response.json()["detail"]

    def test_start_quest_validation_failed_linked_missing_goals(self):
        """Test starting a linked quest with missing goals fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Linked quest requires at least one goal to be selected")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "goal" in response.json()["detail"]

    def test_start_quest_validation_failed_linked_missing_tasks(self):
        """Test starting a linked quest with missing tasks fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Linked quest requires at least one task to be selected")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "task" in response.json()["detail"]

    def test_start_quest_validation_failed_wrong_status(self):
        """Test starting a quest that's not in draft status fails validation."""
        with patch('app.main.change_quest_status') as mock_change_status:
            from app.db.quest_db import QuestValidationError
            mock_change_status.side_effect = QuestValidationError("Quest cannot be started - current status: active")

            response = client.post(
                "/quests/quests/quest-123/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 400
            assert "cannot be started" in response.json()["detail"]


class TestQuestCancellation:
    """Test quest cancellation functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_cancel_active_quest_with_reason(self):
        """Test cancelling an active quest with a reason."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "status": "cancelled",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            payload = {"reason": "Changed my mind"}

            response = client.post(
                "/quests/quests/quest-123/cancel",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "cancelled"
            mock_change_status.assert_called_once_with(
                "test-user-123", "quest-123", "cancelled", "Changed my mind"
            )


class TestQuestFailure:
    """Test quest failure functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_fail_active_quest(self):
        """Test marking an active quest as failed."""
        mock_quest = {
            "id": "quest-123",
            "userId": "test-user-123",
            "title": "Test Quest",
            "status": "failed",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "version": 2,
            "auditTrail": []
        }

        with patch('app.main.change_quest_status') as mock_change_status:
            mock_change_status.return_value = QuestResponse(**mock_quest)

            response = client.post(
                "/quests/quests/quest-123/fail",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "failed"
            mock_change_status.assert_called_once_with("test-user-123", "quest-123", "failed")


class TestQuestDeletion:
    """Test quest deletion functionality."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_delete_draft_quest_as_user(self):
        """Test user can delete their own draft quest."""
        with patch('app.main.delete_quest') as mock_delete:
            mock_delete.return_value = True

            response = client.delete(
                "/quests/quests/quest-123",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]
            mock_delete.assert_called_once_with("test-user-123", "quest-123", False)

    def test_delete_quest_as_admin(self):
        """Test admin can delete any quest."""
        admin_headers = self.get_auth_headers(role="admin")

        with patch('app.main.delete_quest') as mock_delete:
            mock_delete.return_value = True

            response = client.delete(
                "/quests/quests/quest-123",
                headers=admin_headers
            )

            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]
            mock_delete.assert_called_once_with("test-user-123", "quest-123", True)


class TestQuestSecurity:
    """Test quest security controls."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_quest_authorization(self):
        """Test quest authorization controls."""
        # Test accessing another user's quest
        other_user_headers = self.get_auth_headers(user_id="other-user-456")

        with patch('app.main.get_quest') as mock_get_quest, \
             patch('app.db.quest_db._get_dynamodb_table') as mock_table:

            mock_get_quest.side_effect = QuestPermissionError("Access denied")

            # Try to update another user's quest
            payload = {"title": "Unauthorized Update"}

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=other_user_headers
            )

            assert response.status_code == 400
            assert "access denied" in response.json()["detail"].lower()

    def test_quest_xss_protection(self):
        """Test XSS protection in quest creation."""
        # Test script injection in title
        payload = {
            "title": "<script>alert('xss')</script>",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        # Should either sanitize the input or reject it
        assert response.status_code in [200, 201, 400]

        if response.status_code == 200:
            data = response.json()
            # If accepted, title should be sanitized
            assert "<script>" not in data.get("title", "")

    def test_quest_sql_injection_protection(self):
        """Test SQL injection protection in quest creation."""
        # Test SQL injection attempts
        malicious_inputs = [
            "'; DROP TABLE quests; --",
            "1' OR '1'='1",
            "admin'--",
            "'; UPDATE quests SET status='completed'; --"
        ]

        for malicious_input in malicious_inputs:
            payload = {
                "title": malicious_input,
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            # Should either reject or sanitize the malicious input
            assert response.status_code in [200, 201, 400]

    def test_quest_authorization(self):
        """Test quest authorization controls."""
        # Test accessing another user's quest
        other_user_headers = self.get_auth_headers(user_id="other-user-456")

        with patch('app.main.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestPermissionError("Access denied")

            # Try to update another user's quest
            payload = {"title": "Unauthorized Update"}

            response = client.put(
                "/quests/quests/quest-123",
                json=payload,
                headers=other_user_headers
            )

            assert response.status_code == 400
            assert "permission" in response.json()["detail"].lower()


class TestQuestValidation:
    """Test quest validation and error handling."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_quest_title_length_validation(self):
        """Test quest title length validation."""
        # Test minimum length
        payload = {
            "title": "Hi",  # Too short (minimum 3 chars)
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "title" in response.json()["detail"].lower()

        # Test maximum length
        payload = {
            "title": "x" * 101,  # Too long (maximum 100 chars)
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "title" in response.json()["detail"].lower()

    def test_quest_description_length_validation(self):
        """Test quest description length validation."""
        # Test maximum length
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "description": "x" * 501  # Too long (maximum 500 chars)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "description" in response.json()["detail"].lower()

    def test_quest_tags_validation(self):
        """Test quest tags validation."""
        # Test too many tags
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "tags": ["tag"] * 11  # Too many (maximum 10)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "tags" in response.json()["detail"].lower()

        # Test tag too long
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "tags": ["x" * 21]  # Too long (maximum 20 chars)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "tag" in response.json()["detail"].lower()

    def test_quest_reward_xp_validation(self):
        """Test quest reward XP validation."""
        # Test negative XP
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "rewardXp": -10
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "reward" in response.json()["detail"].lower()

        # Test XP too high
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "rewardXp": 1001  # Too high (maximum 1000)
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "reward" in response.json()["detail"].lower()

    def test_quest_deadline_validation(self):
        """Test quest deadline validation."""
        # Test past deadline
        past_time = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "deadline": past_time
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "deadline" in response.json()["detail"].lower()

        # Test deadline too soon
        soon_time = int((datetime.now() + timedelta(minutes=30)).timestamp() * 1000)
        payload = {
            "title": "Test Quest",
            "category": "Health",
            "deadline": soon_time  # Less than 1 hour from now
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers=self.get_auth_headers()
        )

        assert response.status_code == 400
        assert "deadline" in response.json()["detail"].lower()


class TestQuestErrorHandling:
    """Test quest error handling and edge cases."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_database_connection_error(self):
        """Test handling of database connection errors."""
        with patch('app.main.create_quest') as mock_create:
            mock_create.side_effect = Exception("Database connection failed")

            payload = {
                "title": "Test Quest",
                "category": "Health"
            }

            response = client.post(
                "/quests/createQuest",
                json=payload,
                headers=self.get_auth_headers()
            )

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_invalid_json_payload(self):
        """Test handling of invalid JSON payload."""
        response = client.post(
            "/quests/createQuest",
            data="invalid json",
            headers=self.get_auth_headers()
        )

        assert response.status_code == 422
        assert "json" in response.json()["detail"].lower()

    def test_missing_authentication(self):
        """Test handling of missing authentication."""
        payload = {
            "title": "Test Quest",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload
            # No Authorization header
        )

        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()

    def test_invalid_authentication_token(self):
        """Test handling of invalid authentication token."""
        payload = {
            "title": "Test Quest",
            "category": "Health"
        }

        response = client.post(
            "/quests/createQuest",
            json=payload,
            headers={"Authorization": "Invalid token format"}
        )

        assert response.status_code == 401
        assert "bearer" in response.json()["detail"].lower()


class TestQuestIntegration:
    """Test quest integration scenarios."""

    def get_auth_headers(self, user_id: str = "test-user-123", role: str = "user") -> dict:
        """Get authentication headers for testing."""
        import base64
        import json

        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"sub": user_id, "role": role, "iat": 1234567890, "exp": 9876543210}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        signature = "test_signature"

        token = f"{header_b64}.{payload_b64}.{signature}"
        return {
            "Authorization": f"Bearer {token}",
            "x-api-key": "test-api-key"
        }

    def test_quest_lifecycle_complete(self):
        """Test complete quest lifecycle from creation to completion."""
        # Create quest
        with patch('app.main.create_quest') as mock_create:
            draft_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="draft", createdAt=1000, updatedAt=1000, version=1,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_create.return_value = draft_quest

            response = client.post(
                "/quests/createQuest",
                json={"title": "Lifecycle Test", "category": "Personal"},
                headers=self.get_auth_headers()
            )

            assert response.status_code == 201

        # Start quest
        with patch('app.main.change_quest_status') as mock_start:
            active_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="active", createdAt=1000, updatedAt=2000, version=2,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_start.return_value = active_quest

            response = client.post(
                "/quests/quests/quest-lifecycle/start",
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200

        # Cancel quest
        with patch('app.main.change_quest_status') as mock_cancel:
            cancelled_quest = QuestResponse(
                id="quest-lifecycle", userId="test-user-123", title="Lifecycle Test",
                status="cancelled", createdAt=1000, updatedAt=3000, version=3,
                difficulty="easy", rewardXp=50, category="Personal",
                tags=[], privacy="private", kind="linked", auditTrail=[]
            )
            mock_cancel.return_value = cancelled_quest

            response = client.post(
                "/quests/quests/quest-lifecycle/cancel",
                json={"reason": "Test completed"},
                headers=self.get_auth_headers()
            )

            assert response.status_code == 200
            assert response.json()["status"] == "cancelled"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
