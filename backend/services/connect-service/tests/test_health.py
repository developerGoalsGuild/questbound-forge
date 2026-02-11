"""Minimal tests for connect-service."""

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    """Health endpoint returns ok without auth."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "connect-service"
