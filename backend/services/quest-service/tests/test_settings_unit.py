import json
import os
import pytest
from unittest.mock import patch, Mock


def _env_vars(payload: dict) -> str:
    return json.dumps(payload)


def test_settings_loads_from_env_json_and_properties():
    data = {
        "CORE_TABLE": "gg_core_test",
        "ALLOWED_ORIGINS": ["http://localhost:3000", "http://localhost:3000/"],
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _env_vars(data)}), \
         patch("app.settings.get_param") as gp:
        gp.side_effect = AssertionError("should not be called")
        from app.settings import Settings
        s = Settings()
        assert s.core_table_name == "gg_core_test"
        assert s.allowed_origins == ["http://localhost:3000"]
        assert s.jwt_audience == "aud"
        assert s.jwt_issuer == "iss"
        assert s.cognito_region == "us-east-1"
        assert s.cognito_user_pool_id == "pool"
        assert s.cognito_client_id == "client"


def test_settings_fetches_jwt_secret_via_param():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_SECRET_PARAM": "/path/secret",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _env_vars(data), "QUEST_SERVICE_JWT_SECRET": ""}), \
         patch("app.settings.get_param") as gp:
        gp.side_effect = lambda name, decrypt=True: "sekret" if name == "/path/secret" else "X"
        from app.settings import Settings
        s = Settings()
        assert s.jwt_secret == "sekret"


def test_settings_allowed_origins_parse_string_list():
    data = {
        "CORE_TABLE": "gg_core_test",
        "ALLOWED_ORIGINS": "http://a.com, http://b.com/ , http://a.com",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _env_vars(data)}):
        from app.settings import Settings
        s = Settings()
        assert s.allowed_origins == ["http://a.com", "http://b.com"]


def test_settings_missing_core_table_raises():
    data = {
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _env_vars(data)}):
        from app.settings import Settings
        s = Settings()
        with pytest.raises(KeyError):
            _ = s.core_table_name


def test_settings_loads_from_ssm_on_missing_env_vars():
    payload = _env_vars({
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client"
    })
    with patch.dict(os.environ, {}, clear=True), \
         patch("app.settings.get_param") as gp:
        gp.return_value = payload
        from app.settings import Settings
        s = Settings()
        assert s.core_table_name == "gg_core_test"


def test_settings_invalid_json_raises():
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": "{bad json"}):
        from app.settings import Settings
        with pytest.raises(ValueError):
            Settings()


