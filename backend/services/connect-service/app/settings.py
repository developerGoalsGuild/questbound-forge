"""Settings for connect-service.

This follows the same SSM+env override pattern used by other services (e.g.
collaboration-service).
"""

from __future__ import annotations

import json
import os
import logging
from functools import lru_cache

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
    """Loads connect-service configuration from SSM with env-var overrides."""

    def __init__(self, prefix: str | None = None):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/connect-service/")
        if not self.prefix.endswith("/"):
            self.prefix += "/"

        raw_json = os.getenv("CONNECT_SERVICE_ENV_VARS")
        if not raw_json:
            try:
                raw_json = get_param(self._path("env_vars"), decrypt=False)
            except Exception as exc:
                # Local/dev environments may not have AWS credentials (e.g. expired SSO).
                # Fall back to an empty config so the app can still import/run locally.
                logger.warning("connect.settings.ssm_env_vars_unavailable_fallback_to_empty", exc_info=exc)
                raw_json = "{}"

        try:
            parsed = json.loads(raw_json) if raw_json else {}
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON in connect-service env_vars") from exc

        self._vars = {str(k).upper(): v for k, v in parsed.items()}

    def _path(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def _get(self, key: str, default=None):
        env_key = f"CONNECT_SERVICE_{key}"
        if env_key in os.environ:
            return os.environ[env_key]
        return self._vars.get(key, default)

    @property
    def aws_region(self) -> str:
        return _detect_region()

    @property
    def environment(self) -> str:
        return str(self._get("ENVIRONMENT", os.getenv("ENVIRONMENT", "dev")))

    @property
    def dynamodb_table_name(self) -> str:
        return str(self._get("DYNAMODB_TABLE_NAME", "gg_core"))

    @property
    def log_level(self) -> str:
        return str(self._get("LOG_LEVEL", "INFO"))

    @property
    def jwt_secret(self) -> str:
        override = os.getenv("CONNECT_SERVICE_JWT_SECRET")
        if override:
            return override
        param = self._get("JWT_SECRET_PARAM")
        if param:
            return get_param(str(param), decrypt=True)
        return get_param(self._path("JWT_SECRET"), decrypt=True)

    @property
    def jwt_audience(self) -> str:
        aud = self._get("JWT_AUDIENCE")
        if not aud:
            raise KeyError("Missing JWT_AUDIENCE in connect-service configuration")
        return str(aud)

    @property
    def jwt_issuer(self) -> str:
        issuer = self._get("JWT_ISSUER")
        if not issuer:
            raise KeyError("Missing JWT_ISSUER in connect-service configuration")
        return str(issuer)

    @property
    def cognito_region(self) -> str:
        value = self._get("COGNITO_REGION")
        return str(value) if value else ""

    @property
    def cognito_user_pool_id(self) -> str:
        value = self._get("COGNITO_USER_POOL_ID")
        return str(value) if value else ""

    @property
    def cognito_client_id(self) -> str:
        value = self._get("COGNITO_CLIENT_ID")
        return str(value) if value else ""

    @property
    def bedrock_model_id(self) -> str:
        model_id = self._get("BEDROCK_MODEL_ID")
        if not model_id:
            # sensible default for dev; override in env/SSM
            return "anthropic.claude-3-haiku-20240307-v1:0"
        return str(model_id)

    @property
    def sns_topic_arn(self) -> str:
        arn = self._get("SNS_TOPIC_ARN")
        return str(arn) if arn else ""


def get_settings(prefix: str | None = None) -> Settings:
    return Settings(prefix=prefix)



