import json
import os
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-2")
os.environ.setdefault("AWS_REGION", "us-east-2")
os.environ.setdefault(
    "SETTINGS_ENV_VARS_JSON",
    json.dumps({
        "DYNAMODB_USERS_TABLE": "goalsguild_users",
        "CORE_TABLE": "gg_core",
        "LOGIN_ATTEMPTS_TABLE": "goalsguild_login_attempts",
        "JWT_ISSUER": "https://auth.local",
        "JWT_AUDIENCE": "api://default",
        "COGNITO_REGION": "us-east-2",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
        "COGNITO_DOMAIN": "example.com",
        "SES_SENDER_EMAIL": "no-reply@example.com",
        "APP_BASE_URL": "http://localhost:5050",
        "APPSYNC_SUBSCRIPTION_KEY": "test-sub-key",
        "APPSYNC_SUBSCRIPTION_KEY_EXPIRES_AT": "2099-01-01T00:00:00Z",
        "APPSYNC_AVAILABILITY_KEY": "test-availability-key",
        "APPSYNC_AVAILABILITY_KEY_EXPIRES_AT": "2099-01-01T00:00:00Z"
    })
)
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("EMAIL_TOKEN_SECRET", "emailsecret")

from .test_signup import app_client  # noqa: F401


def _issue_token(email: str = "user@example.com", user_id: str = "user-123") -> str:
    from app.security import issue_local_jwt
    token_data = issue_local_jwt(user_id, email)
    return token_data["access_token"]


def _availability_hits():
    from app import main as app_main
    return app_main._availability_hits


@pytest.fixture
def client(app_client: TestClient) -> TestClient:
    """Reuse the existing app_client fixture from test_signup."""
    return app_client


def _signup_and_login(client: TestClient) -> str:
    return _issue_token()


def test_get_subscription_key_requires_auth(client: TestClient):
    resp = client.get('/appsync/subscription-key')
    assert resp.status_code == 401


def test_get_subscription_key_success(client: TestClient):
    token = _signup_and_login(client)
    headers = {'Authorization': f'Bearer {token}'}
    resp = client.get('/appsync/subscription-key', headers=headers)
    assert resp.status_code == 200
    json_body = resp.json()
    assert json_body['apiKey'] == 'test-sub-key'
    issued = datetime.fromisoformat(json_body['issuedAt'].replace('Z', '+00:00'))
    # allow small drift
    assert abs((datetime.utcnow() - issued.replace(tzinfo=None)).total_seconds()) < 10
    assert json_body['expiresAt'] == '2099-01-01T00:00:00Z'


def test_get_availability_key_success(client: TestClient):
    _availability_hits().clear()
    resp = client.get('/appsync/availability-key')
    assert resp.status_code == 200
    json_body = resp.json()
    assert json_body['apiKey'] == 'test-availability-key'
    assert json_body['expiresAt'] == '2099-01-01T00:00:00Z'


def test_get_availability_key_rate_limited(client: TestClient):
    _availability_hits().clear()
    for _ in range(30):
        assert client.get('/appsync/availability-key').status_code == 200
    resp = client.get('/appsync/availability-key')
    assert resp.status_code == 429
    assert resp.json()['detail'].startswith('Too many availability checks')
