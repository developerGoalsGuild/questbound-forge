import os
import json
import datetime
from unittest.mock import Mock
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(autouse=True)
def _mock_settings_env(monkeypatch):
    payload = json.dumps({
        "CORE_TABLE": "gg_core_test",
        "ALLOWED_ORIGINS": ["http://localhost:3000"],
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    })
    monkeypatch.setenv("QUEST_SERVICE_ENV_VARS", payload)
    yield
    monkeypatch.delenv("QUEST_SERVICE_ENV_VARS", raising=False)


def test_calculate_time_progress_no_deadline():
    from app.main import calculate_time_progress
    goal = {"id": "g1", "createdAt": int(datetime.datetime.now().timestamp() * 1000)}
    assert calculate_time_progress(goal) == 0.0


def test_calculate_time_progress_overdue_100():
    from app.main import calculate_time_progress
    created = int((datetime.datetime.now() - datetime.timedelta(days=10)).timestamp() * 1000)
    goal = {"id": "g1", "createdAt": created, "deadline": (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')}
    assert calculate_time_progress(goal) == 100.0


def test_is_goal_overdue_and_urgent():
    from app.main import is_goal_overdue, is_goal_urgent
    goal_overdue = {"deadline": (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')}
    goal_urgent = {"deadline": (datetime.datetime.now() + datetime.timedelta(days=3)).strftime('%Y-%m-%d')}
    assert is_goal_overdue(goal_overdue) is True
    assert is_goal_urgent(goal_urgent) is True


def test_calculate_milestones_mixed():
    from app.main import calculate_milestones
    ms = calculate_milestones(50.0, "g1")
    # 25 and 50 achieved, others not
    assert len(ms) == 4
    assert ms[0].achieved is True
    assert ms[1].achieved is True
    assert ms[2].achieved is False
    assert ms[3].achieved is False


def test_get_goal_tasks_success_and_failure():
    from app.main import get_goal_tasks
    table = Mock()
    table.query.return_value = {"Items": [{"id": "t1", "goalId": "g1"}]}
    items = get_goal_tasks("g1", "user-123", table)
    assert items and items[0]["id"] == "t1"
    table.query.side_effect = ClientError({'Error': {'Code': 'ValidationException', 'Message': 'msg'}}, 'Query')
    items = get_goal_tasks("g1", "user-123", table)
    assert items == []


def test_compute_goal_progress_happy_path():
    from app.main import compute_goal_progress
    table = Mock()
    # No tasks -> taskProgress 0
    table.query.return_value = {"Items": []}
    # Goal with deadline
    goal = {
        "id": "g1",
        "createdAt": int((datetime.datetime.now() - datetime.timedelta(days=1)).timestamp() * 1000),
        "deadline": (datetime.datetime.now() + datetime.timedelta(days=10)).strftime('%Y-%m-%d')
    }
    table.get_item.return_value = {"Item": goal}
    gp = compute_goal_progress("g1", "user-123", table)
    assert gp.goalId == "g1"
    assert gp.totalTasks == 0


