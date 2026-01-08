import pytest
from unittest.mock import Mock, patch
from botocore.exceptions import ClientError, BotoCoreError
from fastapi.testclient import TestClient


@pytest.fixture
def client_and_table():
    with patch('app.settings.Settings') as mock_settings:
        mock_settings.return_value.environment = 'test'
        mock_settings.return_value.aws_region = 'us-east-1'
        mock_settings.return_value.core_table_name = 'gg_core_test'
        mock_settings.return_value.allowed_origins = ["http://localhost:3000"]
        from app.main import app, authenticate, get_goals_table, AuthContext
        def fake_auth():
            return AuthContext(user_id="user-123", claims={"role": "user"}, provider="local")
        table = Mock()
        app.dependency_overrides[authenticate] = lambda: fake_auth()
        app.dependency_overrides[get_goals_table] = lambda: table
        client = TestClient(app)
        yield client, table
        app.dependency_overrides.clear()


def _ce(code='ValidationException', op='PutItem'):
    return ClientError({'Error': {'Code': code, 'Message': 'msg'}}, op)


def test_create_goal_db_error(client_and_table):
    client, table = client_and_table
    table.put_item.side_effect = _ce()
    payload = {"title":"T","deadline":"2025-01-01","answers":[],"tags":[]}
    resp = client.post("/quests", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


def test_update_goal_missing_existing(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {}
    resp = client.put("/quests/g1", json={"title":"X"}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 404


def test_update_goal_invalid_title(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","title":"A","deadline":"2025-01-01"}}
    resp = client.put("/quests/g1", json={"title":"   "}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_update_goal_invalid_deadline_format(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","title":"A","deadline":"2025-01-01"}}
    resp = client.put("/quests/g1", json={"deadline":"bad"}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_update_goal_db_update_error(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","title":"A","deadline":"2025-01-01"}}
    table.update_item.side_effect = _ce(op='UpdateItem')
    resp = client.put("/quests/g1", json={"title":"New"}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


def test_update_goal_get_after_failed(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","title":"A","deadline":"2025-01-01"}}
    table.update_item.return_value = {}
    # get after update fails
    table.get_item.side_effect = [
        {"Item": {"id":"g1","title":"A","deadline":"2025-01-01"}},
        ClientError({'Error': {'Code': 'ProvisionedThroughputExceededException', 'Message': 'throttle'}}, 'GetItem')
    ]
    resp = client.put("/quests/g1", json={"title":"New"}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


def test_delete_goal_not_found(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {}
    resp = client.delete("/quests/g1", headers={"Authorization":"Bearer t"})
    assert resp.status_code == 404


def test_delete_goal_task_query_warn_and_continue(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1"}}
    table.query.side_effect = _ce(op='Query')
    table.delete_item.return_value = {}
    resp = client.delete("/quests/g1", headers={"Authorization":"Bearer t"})
    assert resp.status_code == 200


def test_create_task_put_item_error(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","status":"active","deadline":"2099-01-01"}}
    table.put_item.side_effect = ClientError({'Error': {'Code': 'ValidationException'}}, 'PutItem')
    payload = {"goalId":"g1","title":"T","dueAt":1600000000,"tags":["x"]}
    resp = client.post("/quests/createTask", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


def test_create_task_inactive_goal(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","status":"paused","deadline":"2099-01-01"}}
    payload = {"goalId":"g1","title":"T","dueAt":1600000000,"tags":["x"]}
    resp = client.post("/quests/createTask", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_create_task_missing_deadline(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","status":"active"}}
    payload = {"goalId":"g1","title":"T","dueAt":1600000000,"tags":["x"]}
    resp = client.post("/quests/createTask", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_create_task_due_after_deadline(client_and_table):
    client, table = client_and_table
    table.get_item.return_value = {"Item": {"id":"g1","status":"active","deadline":"2020-01-01"}}
    payload = {"goalId":"g1","title":"T","dueAt":1700000000,"tags":["x"]}
    resp = client.post("/quests/createTask", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_update_task_due_exceeds_goal_deadline(client_and_table):
    client, table = client_and_table
    task_id = "tid"
    table.get_item.side_effect = [
        {"Item": {"id": task_id, "goalId": "g1", "title": "T"}},
        {"Item": {"id": "g1", "deadline": "2020-01-01"}},
        {"Item": {"id": task_id, "goalId": "g1", "title": "T", "dueAt": 1600000000, "createdAt":1, "updatedAt":2, "status":"active", "tags":["x"]}}
    ]
    payload = {"dueAt": 1700000000}
    resp = client.put(f"/quests/tasks/{task_id}", json=payload, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 400


def test_update_task_get_after_failed(client_and_table):
    client, table = client_and_table
    task_id = "tid"
    # first get task ok
    table.get_item.side_effect = [
        {"Item": {"id": task_id, "goalId": "g1", "title": "T"}},
        ClientError({'Error': {'Code': 'ProvisionedThroughputExceededException'}}, 'GetItem')
    ]
    table.update_item.return_value = {}
    resp = client.put(f"/quests/tasks/{task_id}", json={"title":"New"}, headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


def test_delete_task_delete_error(client_and_table):
    client, table = client_and_table
    task_id = "tid"
    table.get_item.return_value = {"Item": {"id": task_id, "goalId": "g1", "title": "T"}}
    table.delete_item.side_effect = ClientError({'Error': {'Code': 'ValidationException'}}, 'DeleteItem')
    resp = client.delete(f"/quests/tasks/{task_id}", headers={"Authorization":"Bearer t"})
    assert resp.status_code == 500


