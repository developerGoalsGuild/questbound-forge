import os
import json
import pytest
from unittest.mock import patch


def _vars(d: dict) -> str:
    return json.dumps(d)


def test_settings_allowed_origins_fallback_to_frontend_base_url():
    data = {
        "CORE_TABLE": "gg_core_test",
        "FRONTEND_BASE_URL": "http://front.local/",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data)}):
        from app.settings import Settings
        s = Settings()
        assert s.allowed_origins == ["http://front.local"]


def test_settings_jwt_secret_override_env():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data), "QUEST_SERVICE_JWT_SECRET": "over"}), \
         patch("app.settings.get_param") as gp:
        gp.side_effect = AssertionError("no param")
        from app.settings import Settings
        s = Settings()
        assert s.jwt_secret == "over"


def test_settings_optional_fields_none():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data)}):
        from app.settings import Settings
        s = Settings()
        assert s.appsync_graphql_endpoint is None
        assert s.appsync_api_key is None
        assert s.cognito_client_secret is None
        assert s.cognito_domain is None


def test_get_param_uses_ssm_client():
    with patch('app.settings._SSM') as mock_ssm:
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": "VAL"}}
        from app.settings import get_param
        assert get_param("name", True) == "VAL"


def test_prefix_trailing_slash_added():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data)}):
        from app.settings import Settings
        s = Settings(prefix="/abc")
        assert s._path("x") == "/abc/x"


def test_env_override_in_get_core_table():
    data = {
        "CORE_TABLE": "notused",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data), "QUEST_SERVICE_CORE_TABLE": "envtable"}):
        from app.settings import Settings
        s = Settings()
        assert s.core_table_name == "envtable"


def test_normalize_origin_none_and_blank():
    from app.settings import Settings
    assert Settings._normalize_origin(None) is None
    assert Settings._normalize_origin("   ") is None


def test_parse_origin_list_string_json_and_invalid_and_nonstr():
    from app.settings import Settings
    # JSON string list
    res = Settings._parse_origin_list('["http://a.com","http://b.com/"]')
    assert res == ["http://a.com", "http://b.com"]
    # Invalid JSON -> CSV
    res2 = Settings._parse_origin_list("http://a.com, http://b.com/")
    assert res2 == ["http://a.com", "http://b.com"]
    # List with non-string
    res3 = Settings._parse_origin_list(["http://a.com", 123, "http://a.com"]) 
    assert res3 == ["http://a.com"]


def test_aws_region_detection_via_env():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data), "AWS_REGION": "us-west-1"}):
        from app.settings import Settings
        s = Settings()
        assert s.aws_region == "us-west-1"


def test_quests_table_name_present_and_missing():
    present = {
        "CORE_TABLE": "gg_core_test",
        "QUESTS_TABLE": "qt",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(present)}):
        from app.settings import Settings
        s = Settings()
        assert s.quests_table_name == "qt"
    missing = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(missing)}):
        from app.settings import Settings
        s2 = Settings()
        assert s2.quests_table_name is None


def test_jwt_secret_fallback_to_ssm_path():
    data = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(data), "QUEST_SERVICE_JWT_SECRET": ""}), \
         patch("app.settings.get_param") as gp:
        def _gp(name, decrypt=True):
            if name.endswith("/JWT_SECRET"):
                return "sek2"
            return "X"
        gp.side_effect = _gp
        from app.settings import Settings
        s = Settings(prefix="/pfx")
        assert s.jwt_secret == "sek2"


def test_missing_required_keys_raise():
    base = {"CORE_TABLE": "gg_core_test"}
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(base)}):
        from app.settings import Settings
        s = Settings()
        with pytest.raises(KeyError):
            _ = s.jwt_audience
        with pytest.raises(KeyError):
            _ = s.jwt_issuer
        with pytest.raises(KeyError):
            _ = s.cognito_region
        with pytest.raises(KeyError):
            _ = s.cognito_user_pool_id
        with pytest.raises(KeyError):
            _ = s.cognito_client_id


def test_environment_property_default_and_override():
    base = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    }
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(base)}, clear=True):
        from app.settings import Settings
        s = Settings()
        assert s.environment == "dev"
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars(base), "ENVIRONMENT": "prod"}, clear=True):
        from app.settings import Settings
        s2 = Settings()
        assert s2.environment == "prod"


def test_get_settings_returns_settings():
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": _vars({
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "aud",
        "JWT_ISSUER": "iss",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "pool",
        "COGNITO_CLIENT_ID": "client",
    })}):
        from app.settings import get_settings, Settings
        s = get_settings()
        assert isinstance(s, Settings)


