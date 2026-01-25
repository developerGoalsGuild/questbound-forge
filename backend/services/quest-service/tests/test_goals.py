import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Tuple

import jwt
import pytest
from fastapi.testclient import TestClient

# Add the quest-service directory to Python path so we can import app.main
quest_service_dir = Path(__file__).resolve().parent.parent
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

os.environ.setdefault(
    "QUEST_SERVICE_ENV_VARS",
    json.dumps(
        {
            "CORE_TABLE": "gg_core",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-east-2",
            "COGNITO_USER_POOL_ID": "local-pool",
            "COGNITO_CLIENT_ID": "local-client",
            "ALLOWED_ORIGINS": ["http://localhost:8080"],
        }
    ),
)
os.environ.setdefault("QUEST_SERVICE_JWT_SECRET", "test-secret")

import app.main as main_module
app = main_module.app
get_goals_table = main_module.get_goals_table


class FakeTable:
    def __init__(self) -> None:
        self.items: Dict[Tuple[str, str], Dict] = {}

    def put_item(self, Item, ConditionExpression=None):  # noqa: N802 - boto interface
        key = (Item["PK"], Item["SK"])
        if ConditionExpression and key in self.items:
            from botocore.exceptions import ClientError

            raise ClientError(
                {
                    "Error": {
                        "Code": "ConditionalCheckFailedException",
                        "Message": "Conditional check failed",
                    }
                },
                "PutItem",
            )
        self.items[key] = Item

    def get_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        if key in self.items:
            return {"Item": self.items[key]}
        return {}

    def update_item(self, Key, UpdateExpression=None, ExpressionAttributeValues=None, ExpressionAttributeNames=None):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        if key not in self.items:
            from botocore.exceptions import ClientError
            raise ClientError(
                {
                    "Error": {
                        "Code": "ValidationException",
                        "Message": "Item does not exist",
                    }
                },
                "UpdateItem",
            )

        item = self.items[key].copy()

        # Simple update expression parsing for SET operations
        if UpdateExpression and UpdateExpression.startswith("SET "):
            set_part = UpdateExpression[4:]  # Remove "SET "
            assignments = [part.strip() for part in set_part.split(",")]

            for assignment in assignments:
                if "=" in assignment:
                    attr_part, value_key = assignment.split("=", 1)
                    attr_part = attr_part.strip()
                    value_key = value_key.strip()

                    # Handle expression attribute names
                    if attr_part.startswith("#") and ExpressionAttributeNames:
                        attr_name = ExpressionAttributeNames.get(attr_part)
                        if attr_name:
                            attr_part = attr_name

                    # Get the value
                    if value_key.startswith(":"):
                        value = ExpressionAttributeValues.get(value_key)
                        if value is not None:
                            item[attr_part] = value

        self.items[key] = item

    def delete_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        if key in self.items:
            del self.items[key]

    def query(self, **kwargs):  # noqa: N802 - boto interface
        # Return all stored items for simplicity; the handler filters by PK/SK when building.
        return {"Items": list(self.items.values())}


client = TestClient(app)


def _issue_token(sub: str = "user-123") -> str:
    now = int(time.time())
    payload = {
        "sub": sub,
        "iat": now,
        "exp": now + 3600,
        "aud": "api://default",
        "iss": "https://auth.local",
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


def test_create_goal_success():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "title": "Launch new product",
            "description": "Plan and execute product launch",
            "deadline": "2025-12-31",
            "tags": ["product", "launch"],
            "answers": [
                {"key": "Positive", "answer": "Inspire the team"},
                {"key": "specific", "answer": "Launch in Q4"},
            ],
        }
        response = client.post("/quests", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["userId"] == "user-123"
        assert body["deadline"] == "2025-12-31"
        assert len(body["answers"]) == 8
        stored_items = list(table.items.values())
        assert len(stored_items) == 1
        item = stored_items[0]
        assert item["PK"] == "USER#user-123"
        assert item["title"] == "Launch new product"
    finally:
        app.dependency_overrides.clear()


def test_create_goal_invalid_deadline():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "title": "Invalid deadline",
            "deadline": "31-12-2025",
            "answers": [],
        }
        response = client.post("/quests", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Deadline" in response.json()["detail"]
        assert table.items == {}
    finally:
        app.dependency_overrides.clear()


def test_create_goal_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        payload = {
            "title": "Need auth",
            "deadline": "2025-12-31",
        }
        response = client.post("/quests", json=payload)
        assert response.status_code == 401
        assert table.items == {}
    finally:
        app.dependency_overrides.clear()

def test_create_goal_rejects_blank_answer_key():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "title": "Bad answer",
            "deadline": "2025-12-31",
            "answers": [{"key": " ", "answer": ""}],
        }
        response = client.post("/quests", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Answer" in response.json()["detail"]
        assert table.items == {}
    finally:
        app.dependency_overrides.clear()


@pytest.mark.skip(reason="GET /quests endpoint not implemented - uses AppSync GraphQL instead")
def test_list_goals_empty():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        response = client.get("/quests", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.skip(reason="GET /quests endpoint not implemented - uses AppSync GraphQL instead")
def test_list_goals_with_data():
    table = FakeTable()
    # Pre-populate with a goal
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "description": "Test Description",
        "tags": ["test"],
        "answers": [{"key": "why", "answer": "Because"}],
        "deadline": "2025-12-31",
        "status": "active",
        "createdAt": 1609459200000,  # 2021-01-01
        "updatedAt": 1609459200000,
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        response = client.get("/quests", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        goals = response.json()
        assert len(goals) == 1
        goal = goals[0]
        assert goal["id"] == "goal-123"
        assert goal["title"] == "Test Goal"
        assert goal["status"] == "active"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.skip(reason="GET /quests endpoint not implemented - uses AppSync GraphQL instead")
def test_list_goals_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        response = client.get("/quests")
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_create_task_success():
    table = FakeTable()
    # Pre-populate with a goal
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "deadline": "2025-12-31",
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        task_payload = {
            "goalId": "goal-123",
            "title": "Test Task",
            "dueAt": 1735689600,  # 2025-01-01 (before goal deadline)
            "tags": ["urgent"]
        }
        response = client.post("/quests/createTask", json=task_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201
        task = response.json()
        assert task["id"] is not None
        assert task["goalId"] == "goal-123"
        assert task["title"] == "Test Task"
        assert task["dueAt"] == 1735689600
        assert task["status"] == "active"
        assert task["tags"] == ["urgent"]
    finally:
        app.dependency_overrides.clear()


def test_create_task_goal_not_found():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        task_payload = {
            "goalId": "nonexistent-goal",
            "title": "Test Task",
            "dueAt": 1735689600,
            "tags": ["test"]
        }
        response = client.post("/quests/createTask", json=task_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404
        assert "Goal not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_create_task_inactive_goal():
    table = FakeTable()
    # Pre-populate with an inactive goal
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "deadline": "2025-12-31",
        "status": "completed",  # inactive
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        task_payload = {
            "goalId": "goal-123",
            "title": "Test Task",
            "dueAt": 1735689600,
            "tags": ["test"]
        }
        response = client.post("/quests/createTask", json=task_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Cannot add task to inactive goal" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_create_task_due_date_after_goal_deadline():
    table = FakeTable()
    # Pre-populate with a goal
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "deadline": "2025-01-01",  # Earlier than task due date
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        task_payload = {
            "goalId": "goal-123",
            "title": "Test Task",
            "dueAt": 1738368000,  # 2025-02-01 (after goal deadline)
            "tags": ["test"]
        }
        response = client.post("/quests/createTask", json=task_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Task due date cannot exceed goal deadline" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_create_task_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        task_payload = {
            "goalId": "goal-123",
            "title": "Test Task",
            "dueAt": 1735689600,
            "tags": ["test"]
        }
        response = client.post("/quests/createTask", json=task_payload)
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_update_task_success():
    table = FakeTable()
    # Pre-populate with a goal and task
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "deadline": "2025-12-31",
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
    }
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"]
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "title": "Updated Task",
            "status": "completed",
            "tags": ["updated", "important"],
            "completionNote": "Completed after finishing the deliverables."
        }
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_task = response.json()
        assert updated_task["id"] == "task-123"
        assert updated_task["title"] == "Updated Task"
        assert updated_task["status"] == "completed"
        assert updated_task["tags"] == ["updated", "important"]
        assert updated_task["completionNote"] == "Completed after finishing the deliverables."
        assert updated_task["verificationStatus"] == "self_reported"
        assert updated_task["updatedAt"] > updated_task["createdAt"]
    finally:
        app.dependency_overrides.clear()


def test_update_task_completed_requires_note():
    table = FakeTable()
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"]
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "status": "completed"
        }
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Completion note" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_submit_task_verification_sets_pending_review():
    table = FakeTable()
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"]
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "completionNote": "Proof of completion with evidence.",
            "evidenceType": "text",
            "evidencePayload": {"note": "Summary of work"}
        }
        response = client.post(
            "/quests/tasks/task-123/verification",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completionNote"] == payload["completionNote"]
        assert data["verificationStatus"] == "pending_review"
        assert isinstance(data["verificationEvidenceIds"], list)
        assert len(data["verificationEvidenceIds"]) == 1
        assert data["completedAt"] is not None
    finally:
        app.dependency_overrides.clear()


def test_review_task_verification_approved():
    table = FakeTable()
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "completed",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"],
        "verificationStatus": "pending_review"
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "decision": "approved",
            "reason": "Looks good"
        }
        response = client.post(
            "/quests/tasks/task-123/verification/review",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["verificationStatus"] == "approved"
    finally:
        app.dependency_overrides.clear()


def test_flag_task_verification():
    table = FakeTable()
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "completed",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"],
        "verificationStatus": "pending_review"
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        payload = {
            "reason": "Suspicious completion"
        }
        response = client.post(
            "/quests/tasks/task-123/verification/flag",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["verificationStatus"] == "flagged"
    finally:
        app.dependency_overrides.clear()


def test_update_task_partial_update():
    table = FakeTable()
    # Pre-populate with a task
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Original Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["original"]
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "title": "Partially Updated Task"
            # Only updating title, other fields should remain unchanged
        }
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_task = response.json()
        assert updated_task["title"] == "Partially Updated Task"
        assert updated_task["status"] == "active"  # Unchanged
        assert updated_task["tags"] == ["original"]  # Unchanged
        assert updated_task["dueAt"] == 1735689600  # Unchanged
    finally:
        app.dependency_overrides.clear()


def test_update_task_not_found():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {"title": "Updated Task"}
        response = client.put("/quests/tasks/nonexistent-task", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404
        assert "Task not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_update_task_due_date_exceeds_goal_deadline():
    table = FakeTable()
    # Pre-populate with a goal and task
    goal_item = {
        "PK": "USER#user-123",
        "SK": "GOAL#goal-123",
        "type": "Goal",
        "id": "goal-123",
        "userId": "user-123",
        "title": "Test Goal",
        "deadline": "2025-01-01",  # Earlier deadline
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
    }
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Test Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["test"]
    }
    table.items[("USER#user-123", "GOAL#goal-123")] = goal_item
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "dueAt": 1738368000  # 2025-02-01 (after goal deadline)
        }
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400
        assert "Task due date cannot exceed goal deadline" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_update_task_invalid_status():
    table = FakeTable()
    # Pre-populate with a task
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Test Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["test"]
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {"status": "invalid_status"}
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400  # Validation error
        assert "Status must be one of" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_update_task_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        update_payload = {"title": "Updated Task"}
        response = client.put("/quests/tasks/task-123", json=update_payload)
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_delete_task_success():
    table = FakeTable()
    # Pre-populate with a task
    task_item = {
        "PK": "USER#user-123",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Test Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["test"]
    }
    table.items[("USER#user-123", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        response = client.delete("/quests/tasks/task-123", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json() == {"message": "Task deleted successfully"}

        # Verify task is deleted
        assert ("USER#user-123", "TASK#task-123") not in table.items
    finally:
        app.dependency_overrides.clear()


def test_delete_task_not_found():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        response = client.delete("/quests/tasks/nonexistent-task", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404
        assert "Task not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_delete_task_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        response = client.delete("/quests/tasks/task-123")
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_update_task_wrong_user():
    table = FakeTable()
    # Pre-populate with a task belonging to a different user
    task_item = {
        "PK": "USER#other-user",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Test Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["test"]
    }
    table.items[("USER#other-user", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token("user-123")  # Different user
        update_payload = {"title": "Hacked Task"}
        response = client.put("/quests/tasks/task-123", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404  # Task not found for this user
        assert "Task not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_delete_task_wrong_user():
    table = FakeTable()
    # Pre-populate with a task belonging to a different user
    task_item = {
        "PK": "USER#other-user",
        "SK": "TASK#task-123",
        "type": "Task",
        "id": "task-123",
        "goalId": "goal-123",
        "title": "Test Task",
        "dueAt": 1735689600,
        "status": "active",
        "createdAt": 1609459200000,
        "updatedAt": 1609459200000,
        "tags": ["test"]
    }
    table.items[("USER#other-user", "TASK#task-123")] = task_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token("user-123")  # Different user
        response = client.delete("/quests/tasks/task-123", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404  # Task not found for this user
        assert "Task not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
