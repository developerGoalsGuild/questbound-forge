from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Iterable, List

# Lazy loading of boto3 to reduce cold start time
_SSM = None

def _get_ssm_client():
    """Lazy initialization of SSM client."""
    global _SSM
    if _SSM is None:
        import boto3
        _SSM = boto3.client("ssm", region_name=_detect_region())
    return _SSM


def _detect_region() -> str:
    return os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-2"


@lru_cache(maxsize=256)
def get_param(name: str, decrypt: bool = True) -> str:
    ssm = _get_ssm_client()
    resp = ssm.get_parameter(Name=name, WithDecryption=decrypt)
    return resp["Parameter"]["Value"]


class Settings:
    """Loads gamification-service configuration from SSM with env-var overrides."""

    def __init__(self, prefix: str | None = None):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/gamification-service/")
        if not self.prefix.endswith("/"):
            self.prefix += "/"

        raw_json = os.getenv("GAMIFICATION_SERVICE_ENV_VARS")
        if not raw_json:
            try:
                raw_json = get_param(self._path("env_vars"), decrypt=False)
            except Exception as exc:
                # Fallback to empty config for local development
                raw_json = "{}"

        try:
            parsed = json.loads(raw_json) if raw_json else {}
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON in gamification-service env_vars SSM parameter") from exc

        self._vars = {str(k).upper(): v for k, v in parsed.items()}

    def _path(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def _get(self, key: str, default=None):
        env_key = f"GAMIFICATION_SERVICE_{key}"
        if env_key in os.environ:
            return os.environ[env_key]
        return self._vars.get(key, default)

    @property
    def aws_region(self) -> str:
        return _detect_region()

    @property
    def core_table_name(self) -> str:
        table = self._get("CORE_TABLE") or os.getenv("CORE_TABLE")
        if not table:
            # Default to gg_core
            return "gg_core"
        return table

    @property
    def jwt_secret(self) -> str:
        override = os.getenv("GAMIFICATION_SERVICE_JWT_SECRET") or os.getenv("JWT_SECRET")
        if override:
            return override
        param = self._get("JWT_SECRET_PARAM")
        if param:
            return get_param(param, decrypt=True)
        # Try user-service JWT secret as fallback
        try:
            return get_param("/goalsguild/user-service/JWT_SECRET", decrypt=True)
        except Exception:
            raise KeyError("Missing JWT_SECRET in gamification-service configuration")

    @property
    def jwt_audience(self) -> str:
        audience = self._get("JWT_AUDIENCE") or os.getenv("JWT_AUDIENCE")
        if not audience:
            return "api://default"
        return audience

    @property
    def jwt_issuer(self) -> str:
        issuer = self._get("JWT_ISSUER") or os.getenv("JWT_ISSUER")
        if not issuer:
            return "https://auth.local"
        return issuer

    @property
    def cognito_region(self) -> str:
        value = self._get("COGNITO_REGION") or os.getenv("COGNITO_REGION")
        if not value:
            return "us-east-2"
        return value

    @property
    def cognito_user_pool_id(self) -> str:
        value = self._get("COGNITO_USER_POOL_ID") or os.getenv("COGNITO_USER_POOL_ID")
        if not value:
            raise KeyError("Missing COGNITO_USER_POOL_ID in gamification-service configuration")
        return value

    @property
    def environment(self) -> str:
        return str(self._get("ENVIRONMENT", os.getenv("ENVIRONMENT", "dev")))

    @property
    def base_xp_for_level(self) -> int:
        value = self._get("BASE_XP_FOR_LEVEL", os.getenv("BASE_XP_FOR_LEVEL", "100"))
        try:
            return int(value)
        except (TypeError, ValueError):
            return 100

    @property
    def internal_api_key(self) -> str:
        """Shared secret for internal service-to-service calls."""
        return self._get("INTERNAL_API_KEY") or os.getenv("GAMIFICATION_INTERNAL_KEY", "")


def get_settings(prefix: str | None = None) -> Settings:
    return Settings(prefix=prefix)

