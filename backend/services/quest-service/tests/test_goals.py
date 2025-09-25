import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Tuple

import jwt
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
