import json
import os
import time
from typing import Dict, Tuple

import jwt
from fastapi.testclient import TestClient

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


import importlib
main_module = importlib.import_module('app.main')
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
