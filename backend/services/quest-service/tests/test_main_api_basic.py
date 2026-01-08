import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def app_client():
    # Patch Settings at import time to avoid SSM/env lookups
    with patch('app.settings.Settings') as mock_settings:
        mock_settings.return_value.environment = 'test'
        mock_settings.return_value.aws_region = 'us-east-1'
        mock_settings.return_value.core_table_name = 'gg_core_test'
        mock_settings.return_value.allowed_origins = ["http://localhost:3000"]

        from app.main import app, authenticate, get_goals_table, AuthContext

        # Override dependencies
        def fake_auth():
            return AuthContext(user_id="user-123", claims={"role": "user"}, provider="local")

        mock_table = Mock()

        app.dependency_overrides[authenticate] = lambda: fake_auth()
        app.dependency_overrides[get_goals_table] = lambda: mock_table

        client = TestClient(app)
        yield client, mock_table

        # Cleanup overrides
        app.dependency_overrides.clear()


def test_create_goal_success(app_client):
    client, mock_table = app_client

    # Simulate successful put_item
    mock_table.put_item.return_value = {}

    payload = {
        "title": "My Goal",
        "description": "Desc",
        "category": "Work",
        "tags": ["a", "b"],
        "answers": [],
        "deadline": "2025-12-31"
    }

    # Include Authorization header to pass auth dependency (even though overridden)
    resp = client.post("/quests", json=payload, headers={"Authorization": "Bearer test"})

    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Goal"
    assert data["category"] == "Work"
    assert data["status"] == "active"


def test_update_goal_success(app_client):
    client, mock_table = app_client

    # First GET existing item
    existing = {
        "PK": "USER#user-123",
        "SK": "GOAL#gid-1",
        "id": "gid-1",
        "userId": "user-123",
        "title": "Old",
        "status": "active",
        "deadline": "2025-12-31",
        "createdAt": 1,
        "updatedAt": 1,
        "answers": [],
        "tags": []
    }
    mock_table.get_item.side_effect = [
        {"Item": existing},  # initial check
        {"Item": {**existing, "title": "New Title", "updatedAt": 2}}  # after update fetch
    ]
    mock_table.update_item.return_value = {}

    payload = {"title": "New Title"}
    resp = client.put("/quests/gid-1", json=payload, headers={"Authorization": "Bearer test"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "New Title"


def test_delete_goal_success(app_client):
    client, mock_table = app_client

    # Goal exists
    existing = {
        "PK": "USER#user-123",
        "SK": "GOAL#gid-2",
        "id": "gid-2",
        "userId": "user-123",
        "title": "To delete",
        "status": "active",
        "deadline": "2025-12-31",
        "createdAt": 1,
        "updatedAt": 1,
    }
    mock_table.get_item.return_value = {"Item": existing}
    # Query tasks returns empty
    mock_table.query.return_value = {"Items": []}
    mock_table.delete_item.return_value = {}

    resp = client.delete("/quests/gid-2", headers={"Authorization": "Bearer test"})
    assert resp.status_code == 200
    assert resp.json()["message"].startswith("Goal")


def test_create_task_success(app_client):
    client, mock_table = app_client

    # Goal exists and active
    mock_table.get_item.return_value = {"Item": {
        "PK": "USER#user-123",
        "SK": "GOAL#gid-1",
        "id": "gid-1",
        "status": "active",
        "deadline": "2099-12-31"
    }}
    mock_table.put_item.return_value = {}
    mock_table.update_item.return_value = {}

    payload = {
        "goalId": "gid-1",
        "title": "Task A",
        "dueAt": 1600000000,
        "tags": ["x"]
    }

    resp = client.post("/quests/createTask", json=payload, headers={"Authorization": "Bearer test"})
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["goalId"] == "gid-1"
    assert data["title"] == "Task A"


def test_update_task_success(app_client):
    client, mock_table = app_client

    # Existing task
    task_id = "tid-1"
    task_item = {
        "PK": "USER#user-123",
        "SK": f"TASK#{task_id}",
        "id": task_id,
        "goalId": "gid-1",
        "title": "Old Task",
        "status": "active",
        "createdAt": 1,
        "updatedAt": 1,
        "tags": ["x"]
    }
    # First get task, later get updated task
    mock_table.get_item.side_effect = [
        {"Item": task_item},
        {"Item": {**task_item, "title": "New Task", "updatedAt": 2, "dueAt": 1600000000}}
    ]
    # Goal retrieval for dueAt check (not used here)
    mock_table.update_item.return_value = {}

    payload = {"title": "New Task"}
    resp = client.put(f"/quests/tasks/{task_id}", json=payload, headers={"Authorization": "Bearer test"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == task_id
    assert data["title"] == "New Task"


def test_delete_task_success(app_client):
    client, mock_table = app_client

    # Existing task
    task_id = "tid-2"
    task_item = {
        "PK": "USER#user-123",
        "SK": f"TASK#{task_id}",
        "id": task_id,
        "goalId": "gid-1",
        "title": "Task",
        "status": "active",
    }
    mock_table.get_item.return_value = {"Item": task_item}
    mock_table.delete_item.return_value = {}

    resp = client.delete(f"/quests/tasks/{task_id}", headers={"Authorization": "Bearer test"})
    assert resp.status_code == 200
    assert "message" in resp.json()


def test_create_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.create_quest') as mock_create:
        from app.models.quest import QuestResponse
        mock_create.return_value = QuestResponse(
            id="qid-1", userId="user-123", title="Q", difficulty="easy", rewardXp=50,
            status="draft", category="Health", privacy="private", createdAt=1, updatedAt=1, version=1, kind="linked"
        )
        payload = {"title": "Quest Title", "category": "Health", "difficulty": "easy", "tags": ["x"]}
        resp = client.post("/quests/createQuest", json=payload, headers={"Authorization": "Bearer test"})
        assert resp.status_code == 201
        assert resp.json()["id"] == "qid-1"


def test_start_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.change_quest_status') as mock_change:
        from app.models.quest import QuestResponse
        mock_change.return_value = QuestResponse(
            id="qid-2", userId="user-123", title="Q", difficulty="easy", rewardXp=50,
            status="active", category="Health", privacy="private", createdAt=1, updatedAt=2, version=2, kind="linked"
        )
        resp = client.post("/quests/quests/qid-2/start", headers={"Authorization": "Bearer test"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"


def test_update_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.get_quest') as mock_get, patch('app.main.update_quest') as mock_update:
        from app.models.quest import QuestResponse
        current = QuestResponse(
            id="qid-3", userId="user-123", title="Q", difficulty="easy", rewardXp=50,
            status="draft", category="Health", privacy="private", createdAt=1, updatedAt=1, version=1, kind="linked"
        )
        updated = QuestResponse(
            id="qid-3", userId="user-123", title="Q2", difficulty="easy", rewardXp=50,
            status="draft", category="Health", privacy="private", createdAt=1, updatedAt=2, version=2, kind="linked"
        )
        mock_get.return_value = current
        mock_update.return_value = updated
        payload = {"title": "Quest Title 2"}
        resp = client.put("/quests/quests/qid-3", json=payload, headers={"Authorization": "Bearer test"})
        assert resp.status_code == 200
        assert resp.json()["version"] == 2


def test_cancel_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.change_quest_status') as mock_change:
        from app.models.quest import QuestResponse
        mock_change.return_value = QuestResponse(
            id="qid-4", userId="user-123", title="Q", difficulty="easy", rewardXp=50,
            status="cancelled", category="Health", privacy="private", createdAt=1, updatedAt=2, version=2, kind="linked"
        )
        resp = client.post("/quests/quests/qid-4/cancel", json={"reason": "x"}, headers={"Authorization": "Bearer test"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"


def test_fail_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.change_quest_status') as mock_change:
        from app.models.quest import QuestResponse
        mock_change.return_value = QuestResponse(
            id="qid-5", userId="user-123", title="Q", difficulty="easy", rewardXp=50,
            status="failed", category="Health", privacy="private", createdAt=1, updatedAt=2, version=2, kind="linked"
        )
        resp = client.post("/quests/quests/qid-5/fail", headers={"Authorization": "Bearer test"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "failed"


def test_delete_quest_endpoint_success(app_client):
    client, _ = app_client
    with patch('app.main.delete_quest') as mock_delete:
        mock_delete.return_value = True
        resp = client.delete("/quests/quests/qid-6", headers={"Authorization": "Bearer test"})
        assert resp.status_code == 200
        assert resp.json()["message"].startswith("Quest deleted")

