import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def app_client():
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


def test_validation_exception_handler_on_create_goal(app_client):
    client, _ = app_client
    payload = {"title": "", "deadline": "2025-01-01"}
    resp = client.post("/quests", json=payload, headers={"Authorization": "Bearer t"})
    assert resp.status_code == 400
    assert "detail" in resp.json()


def test_cors_headers_added(app_client):
    client, _ = app_client
    # Use an existing valid route but expect normal 405 on OPTIONS; just check headers on a GET to a defined route
    headers = {"Origin": "http://localhost:3000", "Authorization": "Bearer t"}
    # call progress endpoint but mock internals to avoid heavy work
    with patch('app.main.compute_goal_progress') as mock_prog:
        from app.models import GoalProgressResponse, Milestone
        mock_prog.return_value = GoalProgressResponse(
            goalId="g", progressPercentage=0.0, taskProgress=0.0, timeProgress=0.0,
            completedTasks=0, totalTasks=0, milestones=[], lastUpdated=1, isOverdue=False, isUrgent=False
        )
        resp = client.get("/quests/g/progress", headers=headers)
        assert resp.status_code == 200
        # CORS headers present
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert resp.headers.get("access-control-allow-credentials") == "true"


def test_get_goal_progress_error(app_client):
    client, _ = app_client
    with patch('app.main.compute_goal_progress', side_effect=Exception("boom")):
        resp = client.get("/quests/gid/progress", headers={"Authorization": "Bearer t"})
        assert resp.status_code == 500


def test_get_all_goals_progress_success(app_client):
    client, table = app_client
    table.query.return_value = {"Items": [{"id": "g1"}, {"id": "g2"}]}
    with patch('app.main.compute_goal_progress') as mock_prog:
        from app.models import GoalProgressResponse
        mock_prog.side_effect = [
            GoalProgressResponse(goalId="g1", progressPercentage=1, taskProgress=1, timeProgress=0,
                                 completedTasks=1, totalTasks=1, milestones=[], lastUpdated=1, isOverdue=False, isUrgent=False),
            GoalProgressResponse(goalId="g2", progressPercentage=2, taskProgress=2, timeProgress=0,
                                 completedTasks=2, totalTasks=2, milestones=[], lastUpdated=1, isOverdue=False, isUrgent=False),
        ]
        resp = client.get("/quests/progress", headers={"Authorization": "Bearer t"})
        assert resp.status_code == 200
        assert len(resp.json()) == 2


def test_lambda_handler_getGoalProgress_success():
    with patch('app.main.get_goals_table') as mock_table_factory, \
         patch('app.main.compute_goal_progress') as mock_prog:
        table = Mock()
        mock_table_factory.return_value = table
        from app.models import GoalProgressResponse
        mock_prog.return_value = GoalProgressResponse(goalId="g1", progressPercentage=0.0, taskProgress=0.0, timeProgress=0.0,
                                                      completedTasks=0, totalTasks=0, milestones=[], lastUpdated=1, isOverdue=False, isUrgent=False)
        from app.main import lambda_handler
        out = lambda_handler({"operation": "getGoalProgress", "goalId": "g1", "userId": "user-123"}, None)
        assert out["goalId"] == "g1"


def test_lambda_handler_getAllGoalsProgress_success():
    with patch('app.main.get_goals_table') as mock_table_factory, \
         patch('app.main.compute_goal_progress') as mock_prog:
        table = Mock()
        table.query.return_value = {"Items": [{"id": "g1"}]}
        mock_table_factory.return_value = table
        from app.models import GoalProgressResponse
        mock_prog.return_value = GoalProgressResponse(goalId="g1", progressPercentage=0.0, taskProgress=0.0, timeProgress=0.0,
                                                      completedTasks=0, totalTasks=0, milestones=[], lastUpdated=1, isOverdue=False, isUrgent=False)
        from app.main import lambda_handler
        out = lambda_handler({"operation": "getAllGoalsProgress", "userId": "user-123"}, None)
        assert isinstance(out, list) and out and out[0]["goalId"] == "g1"


def test_lambda_handler_unknown_operation():
    from app.main import lambda_handler
    with pytest.raises(Exception):
        lambda_handler({"operation": "nope"}, None)


