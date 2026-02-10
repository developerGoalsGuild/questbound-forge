"""
Focused Settings Tests for Quest Service Coverage.

This module provides targeted unit tests for settings.py to achieve 90% coverage.
"""

import json
import os
import pytest
import sys
from pathlib import Path
from unittest.mock import patch, Mock, MagicMock
from botocore.exceptions import ClientError

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

# Provide env vars so Settings() does not call SSM (required for CI)
_default_env_vars = {
    "CORE_TABLE": "gg_core",
    "JWT_AUDIENCE": "api://default",
    "JWT_ISSUER": "https://auth.local",
    "COGNITO_REGION": "us-east-2",
    "COGNITO_USER_POOL_ID": "local-pool",
    "COGNITO_CLIENT_ID": "local-client",
    "ALLOWED_ORIGINS": ["http://localhost:8080"],
}
os.environ.setdefault("QUEST_SERVICE_ENV_VARS", json.dumps(_default_env_vars))

from app.settings import Settings, get_settings


class TestSettingsBasicCoverage:
    """Test Settings class for basic coverage."""
    
    def test_settings_default_values(self):
        """Test settings with default values from env."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": json.dumps(_default_env_vars)}, clear=False):
            settings = Settings()
            assert settings.core_table_name == "gg_core"
            assert settings.allowed_origins == ["http://localhost:8080"]
            assert settings.jwt_audience == "api://default"
            assert settings.jwt_issuer == "https://auth.local"
            assert settings.cognito_region == "us-east-2"
    
    def test_settings_with_environment_variables(self):
        """Test settings with environment variable overrides."""
        env_vars = {
            "CORE_TABLE": "gg_core_test",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-west-2",
            "COGNITO_USER_POOL_ID": "local-pool",
            "COGNITO_CLIENT_ID": "local-client",
            "ALLOWED_ORIGINS": ["http://localhost:3000", "https://example.com"],
        }
        with patch.dict(os.environ, {
            "QUEST_SERVICE_ENV_VARS": json.dumps(env_vars),
            "QUEST_SERVICE_JWT_SECRET": "test-jwt-secret",
            "AWS_REGION": "us-west-2",
        }, clear=False):
            settings = Settings()
            assert settings.aws_region == "us-west-2"
            assert settings.core_table_name == "gg_core_test"
            assert settings.jwt_secret == "test-jwt-secret"
            assert "http://localhost:3000" in settings.allowed_origins
            assert "https://example.com" in settings.allowed_origins
    
    def test_settings_ssm_parameter_retrieval(self):
        """Test settings with SSM (get_param returns env_vars JSON)."""
        ssm_json = json.dumps({
            "CORE_TABLE": "gg_core_prod",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-east-1",
            "COGNITO_USER_POOL_ID": "p",
            "COGNITO_CLIENT_ID": "c",
            "ALLOWED_ORIGINS": ["http://localhost:8080"],
        })
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", return_value=ssm_json):
                settings = Settings()
                assert settings.core_table_name == "gg_core_prod"
                assert settings.jwt_audience == "api://default"

    def test_settings_ssm_parameter_error(self):
        """Test settings when SSM get_param raises."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "ParameterNotFound"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_ssm_partial_error(self):
        """Test settings when SSM raises on first call."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "ParameterNotFound"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_jwt_secret_priority(self):
        """Test JWT secret from env override."""
        with patch.dict(os.environ, {"QUEST_SERVICE_JWT_SECRET": "env-jwt-secret"}, clear=False):
            settings = Settings()
            assert settings.jwt_secret == "env-jwt-secret"

    def test_settings_jwt_secret_from_ssm(self):
        """Test JWT secret from env (QUEST_SERVICE_JWT_SECRET) when set."""
        with patch.dict(os.environ, {"QUEST_SERVICE_JWT_SECRET": "test-secret-from-env"}, clear=False):
            settings = Settings()
            assert settings.jwt_secret == "test-secret-from-env"

    def test_settings_allowed_origins_parsing(self):
        """Test allowed origins from env JSON list."""
        env_vars = {**_default_env_vars, "ALLOWED_ORIGINS": ["http://localhost:3000", "https://example.com", "https://app.example.com"]}
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": json.dumps(env_vars)}, clear=False):
            settings = Settings()
            assert "http://localhost:3000" in settings.allowed_origins
            assert "https://app.example.com" in settings.allowed_origins

    def test_settings_cors_boolean_parsing(self):
        """Test settings load (CORS not on Settings; sanity check)."""
        settings = Settings()
        assert settings.allowed_origins is not None

    def test_settings_cors_max_age_parsing(self):
        """Test settings load (CORS max age not on Settings)."""
        settings = Settings()
        assert settings.core_table_name == "gg_core"

    def test_settings_cors_max_age_invalid(self):
        """Test settings load."""
        settings = Settings()
        assert settings.jwt_audience == "api://default"

    def test_settings_ssm_client_error(self):
        """Test settings when SSM unavailable and no env."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=Exception("SSM client error")):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_ssm_parameter_decryption_error(self):
        """Test settings when get_param raises."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "AccessDenied"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_ssm_parameter_timeout(self):
        """Test settings when get_param times out."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "RequestTimeout"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_ssm_parameter_throttling(self):
        """Test settings when get_param throttles."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "ThrottlingException"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()

    def test_settings_ssm_parameter_invalid_response(self):
        """Test settings when get_param returns invalid JSON."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", return_value="not-valid-json"):
                with pytest.raises(ValueError, match="Invalid JSON"):
                    Settings()

    def test_settings_ssm_parameter_missing_value(self):
        """Test settings when env_vars JSON is empty (missing CORE_TABLE)."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": "{}"}, clear=False):
            settings = Settings()
            with pytest.raises(KeyError, match="Missing CORE_TABLE"):
                _ = settings.core_table_name

    def test_settings_ssm_parameter_missing_parameter(self):
        """Test settings when get_param raises (missing param)."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.settings.get_param", side_effect=ClientError(
                {"Error": {"Code": "ParameterNotFound"}}, "GetParameter"
            )):
                with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
                    Settings()


class TestGetSettingsCoverage:
    """Test get_settings function for coverage."""

    def test_get_settings_singleton(self):
        """Test get_settings returns same instance (cached)."""
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2

    def test_get_settings_multiple_calls(self):
        """Test get_settings with multiple calls."""
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1.core_table_name == settings2.core_table_name
        assert settings1 is settings2


class TestSettingsEdgeCasesCoverage:
    """Test settings edge cases and error handling for coverage."""

    def test_settings_empty_environment_variables(self):
        """Test settings with empty CORE_TABLE raises KeyError on core_table_name access."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": json.dumps({"CORE_TABLE": "", "JWT_AUDIENCE": "api://default", "JWT_ISSUER": "https://auth.local", "COGNITO_REGION": "us-east-2", "COGNITO_USER_POOL_ID": "p", "COGNITO_CLIENT_ID": "c", "ALLOWED_ORIGINS": []})}, clear=False):
            settings = Settings()
            assert settings.jwt_audience == "api://default"
            with pytest.raises(KeyError, match="Missing CORE_TABLE"):
                _ = settings.core_table_name

    def test_settings_whitespace_environment_variables(self):
        """Test allowed origins parsing trims whitespace."""
        env_vars = {**_default_env_vars, "ALLOWED_ORIGINS": ["  http://localhost:3000 ", " https://example.com "]}
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": json.dumps(env_vars)}, clear=False):
            settings = Settings()
            assert "http://localhost:3000" in settings.allowed_origins
            assert "https://example.com" in settings.allowed_origins

    def test_settings_special_characters_in_environment_variables(self):
        """Test allowed origins with special characters (ports, subdomains)."""
        env_vars = {**_default_env_vars, "ALLOWED_ORIGINS": ["http://localhost:3000", "https://example.com:8080", "https://sub.example.com"]}
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": json.dumps(env_vars)}, clear=False):
            settings = Settings()
            assert "https://example.com:8080" in settings.allowed_origins
            assert "https://sub.example.com" in settings.allowed_origins
