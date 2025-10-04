import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient


def _setup_app_no_override():
    with patch('app.settings.Settings') as mock_settings:
        mock_settings.return_value.environment = 'test'
        mock_settings.return_value.aws_region = 'us-east-1'
        mock_settings.return_value.core_table_name = 'gg_core_test'
        mock_settings.return_value.allowed_origins = ["http://localhost:3000"]
        from app.main import app
        return app


def test_auth_missing_header_returns_401():
    app = _setup_app_no_override()
    client = TestClient(app)
    resp = client.post("/quests", json={})
    assert resp.status_code == 401


def test_auth_invalid_scheme_returns_401():
    app = _setup_app_no_override()
    client = TestClient(app)
    resp = client.post("/quests", json={}, headers={"Authorization": "Basic abc"})
    assert resp.status_code == 401


def test_auth_success_with_token_verifier():
    app = _setup_app_no_override()
    with patch('app.main._token_verifier') as tv:
        tv.return_value.verify.return_value = ({"sub": "user-123"}, "local")
        from app.main import get_goals_table
        table = Mock()
        table.put_item.return_value = {}
        # override dependency to ensure no boto calls
        app.dependency_overrides[get_goals_table] = lambda: table
        client = TestClient(app)
        payload = {"title":"T","deadline":"2025-01-01","answers":[],"tags":[]}
        resp = client.post("/quests", json=payload, headers={"Authorization": "Bearer tok"})
        assert resp.status_code == 201
        app.dependency_overrides.clear()

