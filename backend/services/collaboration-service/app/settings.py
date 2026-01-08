"""
Settings configuration for the collaboration service.

This module handles configuration loading from environment variables and SSM parameters.
"""

import json
import os
import logging
from functools import lru_cache
from typing import Optional

import boto3

logger = logging.getLogger(__name__)


def _detect_region() -> str:
    return os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-2"


_SSM = boto3.client("ssm", region_name=_detect_region())


@lru_cache(maxsize=256)
def get_param(name: str, decrypt: bool = True) -> str:
    resp = _SSM.get_parameter(Name=name, WithDecryption=decrypt)
    return resp["Parameter"]["Value"]


class Settings:
    """Loads collaboration-service configuration from SSM with env-var overrides."""

    def __init__(self, prefix: str | None = None):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/collaboration-service/")
        if not self.prefix.endswith("/"):
            self.prefix += "/"

        raw_json = os.getenv("COLLABORATION_SERVICE_ENV_VARS")
        if not raw_json:
            try:
                raw_json = get_param(self._path("env_vars"), decrypt=False)
            except Exception as exc:  # pragma: no cover - surfaced via startup logs
                raise RuntimeError("Failed to load collaboration-service env_vars from SSM") from exc

        try:
            parsed = json.loads(raw_json) if raw_json else {}
        except json.JSONDecodeError as exc:  # pragma: no cover - misconfiguration
            raise ValueError("Invalid JSON in collaboration-service env_vars SSM parameter") from exc

        self._vars = {str(k).upper(): v for k, v in parsed.items()}

    # ---------- helpers ----------
    def _path(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def _get(self, key: str, default=None):
        env_key = f"COLLABORATION_SERVICE_{key}"
        if env_key in os.environ:
            return os.environ[env_key]
        return self._vars.get(key, default)

    # ---------- public properties ----------
    @property
    def aws_region(self) -> str:
        return _detect_region()

    @property
    def environment(self) -> str:
        return str(self._get("ENVIRONMENT", os.getenv("ENVIRONMENT", "dev")))

    @property
    def dynamodb_table_name(self) -> str:
        table = self._get("DYNAMODB_TABLE_NAME", "gg_core")
        return str(table)

    @property
    def log_level(self) -> str:
        return str(self._get("LOG_LEVEL", "INFO"))

    @property
    def jwt_secret(self) -> str:
        override = os.getenv("COLLABORATION_SERVICE_JWT_SECRET")
        if override:
            logger.info(f"collaboration.settings.jwt_secret_from_env - length={len(override)}")
            return override
        param = self._get("JWT_SECRET_PARAM")
        if param:
            logger.info(f"collaboration.settings.jwt_secret_from_param - param={param}")
            secret = get_param(param, decrypt=True)
            logger.info(f"collaboration.settings.jwt_secret_loaded - length={len(secret)}")
            return secret
        # fallback to local prefix if explicitly configured
        fallback_param = self._path("JWT_SECRET")
        logger.info(f"collaboration.settings.jwt_secret_fallback - param={fallback_param}")
        secret = get_param(fallback_param, decrypt=True)
        logger.info(f"collaboration.settings.jwt_secret_fallback_loaded - length={len(secret)}")
        return secret

    @property
    def jwt_audience(self) -> str:
        audience = self._get("JWT_AUDIENCE")
        if not audience:
            raise KeyError("Missing JWT_AUDIENCE in collaboration-service configuration")
        return audience

    @property
    def jwt_issuer(self) -> str:
        issuer = self._get("JWT_ISSUER")
        if not issuer:
            raise KeyError("Missing JWT_ISSUER in collaboration-service configuration")
        return issuer

    @property
    def cognito_region(self) -> str:
        value = self._get("COGNITO_REGION")
        if not value:
            raise KeyError("Missing COGNITO_REGION in collaboration-service configuration")
        return value

    @property
    def cognito_user_pool_id(self) -> str:
        value = self._get("COGNITO_USER_POOL_ID")
        if not value:
            raise KeyError("Missing COGNITO_USER_POOL_ID in collaboration-service configuration")
        return value

    @property
    def cognito_client_id(self) -> str:
        value = self._get("COGNITO_CLIENT_ID")
        if not value:
            raise KeyError("Missing COGNITO_CLIENT_ID in collaboration-service configuration")
        return value

    @property
    def cognito_client_secret(self) -> str | None:
        value = self._get("COGNITO_CLIENT_SECRET")
        return str(value) if value else None

    @property
    def api_gateway_key(self) -> str | None:
        value = self._get("API_GATEWAY_KEY")
        return str(value) if value else None

    @property
    def rate_limit_requests_per_hour(self) -> int:
        return int(self._get("RATE_LIMIT_REQUESTS_PER_HOUR", "1000"))

    @property
    def cache_ttl_seconds(self) -> int:
        return int(self._get("CACHE_TTL_SECONDS", "300"))

    @property
    def max_invites_per_user_per_hour(self) -> int:
        return int(self._get("MAX_INVITES_PER_USER_PER_HOUR", "20"))

    @property
    def max_comments_per_user_per_hour(self) -> int:
        return int(self._get("MAX_COMMENTS_PER_USER_PER_HOUR", "100"))

    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "dev"
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "prod"
    
    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.environment == "staging"


def get_settings(prefix: str | None = None) -> Settings:
    return Settings(prefix=prefix)

