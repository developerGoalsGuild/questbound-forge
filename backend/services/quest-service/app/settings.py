from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Iterable, List

import boto3


def _detect_region() -> str:
    return os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-2"


_SSM = boto3.client("ssm", region_name=_detect_region())


@lru_cache(maxsize=256)
def get_param(name: str, decrypt: bool = True) -> str:
    resp = _SSM.get_parameter(Name=name, WithDecryption=decrypt)
    return resp["Parameter"]["Value"]


class Settings:
    """Loads quest-service configuration from SSM with env-var overrides."""

    def __init__(self, prefix: str | None = None):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/quest-service/")
        if not self.prefix.endswith("/"):
            self.prefix += "/"

        raw_json = os.getenv("QUEST_SERVICE_ENV_VARS")
        if not raw_json:
            try:
                raw_json = get_param(self._path("env_vars"), decrypt=False)
            except Exception as exc:  # pragma: no cover - surfaced via startup logs
                raise RuntimeError("Failed to load quest-service env_vars from SSM") from exc

        try:
            parsed = json.loads(raw_json) if raw_json else {}
        except json.JSONDecodeError as exc:  # pragma: no cover - misconfiguration
            raise ValueError("Invalid JSON in quest-service env_vars SSM parameter") from exc

        self._vars = {str(k).upper(): v for k, v in parsed.items()}

    # ---------- helpers ----------
    def _path(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def _get(self, key: str, default=None):
        env_key = f"QUEST_SERVICE_{key}"
        if env_key in os.environ:
            return os.environ[env_key]
        return self._vars.get(key, default)

    @staticmethod
    def _normalize_origin(origin: str | None) -> str | None:
        if not origin:
            return None
        trimmed = origin.strip()
        if not trimmed:
            return None
        return trimmed.rstrip('/')

    @staticmethod
    def _parse_origin_list(raw: object) -> List[str]:
        if isinstance(raw, list):
            iterable: Iterable = raw
        elif isinstance(raw, str):
            try:
                decoded = json.loads(raw)
                if isinstance(decoded, list):
                    iterable = decoded
                else:
                    iterable = raw.split(',')
            except json.JSONDecodeError:
                iterable = raw.split(',')
        else:
            iterable = []
        seen = []
        for candidate in iterable:
            if not isinstance(candidate, str):
                continue
            normalized = Settings._normalize_origin(candidate)
            if normalized and normalized not in seen:
                seen.append(normalized)
        return seen

    # ---------- public properties ----------
    @property
    def aws_region(self) -> str:
        return _detect_region()

    @property
    def core_table_name(self) -> str:
        table = self._get("CORE_TABLE")
        if not table:
            raise KeyError("Missing CORE_TABLE in quest-service configuration")
        return table

    @property
    def quests_table_name(self) -> str | None:
        table = self._get("QUESTS_TABLE")
        return str(table) if table else None

    @property
    def allowed_origins(self) -> List[str]:
        raw = self._get("ALLOWED_ORIGINS")
        origins = self._parse_origin_list(raw)
        if not origins:
            fallback = self._normalize_origin(self._get("FRONTEND_BASE_URL"))
            if fallback:
                origins = [fallback]
        return origins

    @property
    def jwt_secret(self) -> str:
        override = os.getenv("QUEST_SERVICE_JWT_SECRET")
        if override:
            return override
        param = self._get("JWT_SECRET_PARAM")
        if param:
            return get_param(param, decrypt=True)
        # fallback to local prefix if explicitly configured
        return get_param(self._path("JWT_SECRET"), decrypt=True)

    @property
    def jwt_audience(self) -> str:
        audience = self._get("JWT_AUDIENCE")
        if not audience:
            raise KeyError("Missing JWT_AUDIENCE in quest-service configuration")
        return audience

    @property
    def jwt_issuer(self) -> str:
        issuer = self._get("JWT_ISSUER")
        if not issuer:
            raise KeyError("Missing JWT_ISSUER in quest-service configuration")
        return issuer

    @property
    def cognito_region(self) -> str:
        value = self._get("COGNITO_REGION")
        if not value:
            raise KeyError("Missing COGNITO_REGION in quest-service configuration")
        return value

    @property
    def cognito_user_pool_id(self) -> str:
        value = self._get("COGNITO_USER_POOL_ID")
        if not value:
            raise KeyError("Missing COGNITO_USER_POOL_ID in quest-service configuration")
        return value

    @property
    def cognito_client_id(self) -> str:
        value = self._get("COGNITO_CLIENT_ID")
        if not value:
            raise KeyError("Missing COGNITO_CLIENT_ID in quest-service configuration")
        return value

    @property
    def cognito_client_secret(self) -> str | None:
        value = self._get("COGNITO_CLIENT_SECRET")
        return str(value) if value else None

    @property
    def cognito_domain(self) -> str | None:
        return self._get("COGNITO_DOMAIN")

    @property
    def environment(self) -> str:
        return str(self._get("ENVIRONMENT", os.getenv("ENVIRONMENT", "dev")))


def get_settings(prefix: str | None = None) -> Settings:
    return Settings(prefix=prefix)
