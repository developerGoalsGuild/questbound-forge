import json
import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-2")
os.environ.setdefault(
    "SETTINGS_ENV_VARS_JSON",
    json.dumps({
        "CORE_TABLE": "gg_core",
        "DYNAMODB_USERS_TABLE": "users",
        "LOGIN_ATTEMPTS_TABLE": "login",
        "COGNITO_REGION": "us-east-2",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
        "COGNITO_CLIENT_SECRET": "secret",
        "COGNITO_DOMAIN": "example.com",
        "SES_SENDER_EMAIL": "no-reply@example.com",
        "APP_BASE_URL": "https://app.example.com",
        "APPSYNC_AVAILABILITY_KEY": "test-availability-key"
    })
)
os.environ.setdefault("JWT_SECRET", "unit-test-secret")
os.environ.setdefault("JWT_ISSUER", "https://issuer.example.com")
os.environ.setdefault("JWT_AUDIENCE", "api://default")

import subscription_auth
from subscription_auth import UnauthorizedError, handler


def _event(headers=None, room_id=None):
    headers = headers or {}
    payload = {'headers': headers}
    if room_id is not None:
        payload['roomId'] = room_id
    return {'payload': payload}


def test_general_room_allows_valid_token():
    mock_table = MagicMock()
    with patch.object(subscription_auth, '_core_table', mock_table), \
         patch.object(subscription_auth, 'verify_local_jwt', return_value={'sub': 'user-123'}):
        evt = _event({'authorization': 'Bearer token'}, room_id='ROOM-general')
        result = handler(evt, None)
        assert result['sub'] == 'user-123'
        mock_table.get_item.assert_not_called()


def test_missing_token_raises():
    mock_table = MagicMock()
    with patch.object(subscription_auth, '_core_table', mock_table), \
         patch.object(subscription_auth, 'verify_local_jwt', return_value={'sub': 'user-123'}):
        evt = _event({}, room_id='ROOM-general')
        with pytest.raises(UnauthorizedError):
            handler(evt, None)


def test_cognito_token_fallback():
    mock_table = MagicMock()
    with patch.object(subscription_auth, '_core_table', mock_table), \
         patch.object(subscription_auth, 'verify_local_jwt', side_effect=ValueError("bad signature")), \
         patch.object(subscription_auth, 'verify_cognito_jwt', return_value={'sub': 'user-456'}):
        evt = _event({'authorization': 'Bearer cognito'}, room_id='ROOM-general')
        result = handler(evt, None)
        assert result['sub'] == 'user-456'


def test_guild_room_requires_membership():
    mock_guild_table = MagicMock()
    mock_guild_table.get_item.return_value = {
        'Item': {'PK': 'GUILD#1', 'SK': 'MEMBER#user-123', 'status': 'active'}
    }
    with patch.object(subscription_auth, '_get_guild_table', return_value=mock_guild_table), \
         patch.object(subscription_auth, 'verify_local_jwt', return_value={'sub': 'user-123'}):
        evt = _event({'authorization': 'Bearer token'}, room_id='GUILD#1')
        result = handler(evt, None)
        assert result['roomId'] == 'GUILD#1'
        mock_guild_table.get_item.assert_called_once()


def test_guild_room_denies_non_member():
    mock_guild_table = MagicMock()
    mock_guild_table.get_item.return_value = {}
    with patch.object(subscription_auth, '_get_guild_table', return_value=mock_guild_table), \
         patch.object(subscription_auth, 'verify_local_jwt', return_value={'sub': 'user-123'}):
        evt = _event({'authorization': 'Bearer token'}, room_id='GUILD#1')
        with pytest.raises(UnauthorizedError):
            handler(evt, None)


def test_availability_mode_valid_key():
    evt = {'payload': {'mode': 'availability', 'headers': {'x-api-key': 'test-availability-key'}}}
    result = handler(evt, None)
    assert result['ok'] is True


def test_availability_mode_rejects_invalid_key():
    evt = {'payload': {'mode': 'availability', 'headers': {'x-api-key': 'bad-key'}}}
    with pytest.raises(UnauthorizedError):
        handler(evt, None)
