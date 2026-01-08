import os
import json
import pytest
from starlette.requests import Request
from unittest.mock import Mock, patch


def _make_request(headers: dict | None = None):
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/x",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": ("testclient", 123),
    }
    return Request(scope)


@pytest.fixture(autouse=True)
def _env_settings(monkeypatch):
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


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.mark.anyio
async def test_auth_missing_header():
    from app.main import authenticate
    req = _make_request()
    with pytest.raises(Exception) as exc:
        await authenticate(req)
    assert hasattr(exc.value, 'status_code') and exc.value.status_code == 401


@pytest.mark.anyio
async def test_auth_invalid_scheme():
    from app.main import authenticate
    req = _make_request({"Authorization": "Token abc"})
    with pytest.raises(Exception) as exc:
        await authenticate(req)
    assert hasattr(exc.value, 'status_code') and exc.value.status_code == 401


@pytest.mark.anyio
async def test_auth_verify_failure():
    from app.main import authenticate
    from app.auth import TokenVerificationError
    with patch('app.main._token_verifier') as tv:
        mock_verifier = Mock()
        mock_verifier.verify.side_effect = TokenVerificationError("bad")
        tv.return_value = mock_verifier
        req = _make_request({"Authorization": "Bearer abc"})
        with pytest.raises(Exception) as exc:
            await authenticate(req)
        assert hasattr(exc.value, 'status_code') and exc.value.status_code == 401


@pytest.mark.anyio
async def test_auth_missing_subject():
    from app.main import authenticate
    with patch('app.main._token_verifier') as tv:
        mock_verifier = Mock()
        mock_verifier.verify.return_value = ({}, "local")
        tv.return_value = mock_verifier
        req = _make_request({"Authorization": "Bearer abc"})
        with pytest.raises(Exception) as exc:
            await authenticate(req)
        assert hasattr(exc.value, 'status_code') and exc.value.status_code == 401


@pytest.mark.anyio
async def test_auth_success():
    from app.main import authenticate, AuthContext
    with patch('app.main._token_verifier') as tv:
        mock_verifier = Mock()
        mock_verifier.verify.return_value = ({"sub": "user-123"}, "local")
        tv.return_value = mock_verifier
        req = _make_request({"Authorization": "Bearer good"})
        ctx = await authenticate(req)
        assert isinstance(ctx, AuthContext)
        assert ctx.user_id == "user-123"


