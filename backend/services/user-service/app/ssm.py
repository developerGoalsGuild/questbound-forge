from __future__ import annotations
import os, json, time, logging
from functools import lru_cache
import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("user-service.ssm")
_ssm = boto3.client("ssm", region_name=os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1")))

@lru_cache(maxsize=128)
def get_param(name: str, decrypt: bool = True) -> str:
    try:
        resp = _ssm.get_parameter(Name=name, WithDecryption=decrypt)
        return resp["Parameter"]["Value"]
    except (ClientError, BotoCoreError):
        env_key = f"SSM_PARAM_{name.upper().replace('/', '_')}"
        env_override = os.getenv(env_key)
        if env_override is not None:
            return env_override
        raise

class Settings:
    def __init__(self, prefix: str | None = None ):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/user-service/")
        if not self.prefix.endswith("/"): self.prefix += "/"

        env_override = os.getenv("SETTINGS_ENV_VARS_JSON")
        if env_override is not None:
            raw = env_override
        else:
            try:
                raw = get_param(self._p("env_vars"), False)  # likely returns a JSON string
            except (ClientError, BotoCoreError):
                raw = os.getenv("SETTINGS_ENV_VARS_JSON", "{}")
        self.ssmvariables = {}
        if raw:
            try:
                self.ssmvariables = json.loads(raw)
            except json.JSONDecodeError as e:
                # handle bad JSON from SSM however you prefer
                raise ValueError(f"Invalid JSON in SSM 'env_vars': {e}") from e

    def _p(self, key: str) -> str:
        return f"{self.prefix}{key}"

    #def _returnJsonVariable(name):
    #    json(get_param(self._p("env_vars"), False))

    def _get(self, key: str, *, required: bool = True, default: str | None = None) -> str | None:
        env_val = os.getenv(key) or os.getenv(key.lower())
        if env_val:
            return env_val
        value = self.ssmvariables.get(key) or self.ssmvariables.get(key.lower())
        if value is None:
            if required:
                raise KeyError(f"Missing {key} in user-service env vars")
            return default
        return value


    @property
    def ddb_users_table(self) -> str:
        return self._get("DYNAMODB_USERS_TABLE")

    @property
    def core_table_name(self) -> str:
        # Single-table used by AppSync patterns (gg_core)
        v = self._get("CORE_TABLE", required=False)
        if not v:
            v = self._get("GG_CORE_TABLE")
        return v

    @property
    def jwt_secret(self) -> str:
        secret = os.getenv("JWT_SECRET")
        if not secret:
            secret = get_param(self._p("JWT_SECRET"), True)
        if not secret or secret.strip() == "":
            raise ValueError("JWT_SECRET is empty or None - cannot generate signed tokens")
        return secret

    @property
    def jwt_issuer(self) -> str:
        return self._get("JWT_ISSUER")


    @property
    def jwt_audience(self) -> str:
        return self._get("JWT_AUDIENCE")

    @property
    def cognito_region(self) -> str:
        return self._get("COGNITO_REGION")

    @property
    def cognito_user_pool_id(self) -> str:
        return self._get("COGNITO_USER_POOL_ID")

    @property
    def cognito_client_id(self) -> str:
        return self._get("COGNITO_CLIENT_ID")

    @property
    def cognito_client_secret(self) -> str:
        override = os.getenv("COGNITO_CLIENT_SECRET")
        if override:
            return override
        return get_param(self._p("cognito_client_secret"), True)

    @property
    def cognito_domain(self) -> str:
        return self._get("COGNITO_DOMAIN")
    
    @property
    def ses_sender_email(self) -> str:
        """Return SES verified sender (e.g., no-reply@domain).
        Security: value is non-secret; stored as SSM String.
        """
        return self._get("SES_SENDER_EMAIL")


    @property
    def app_base_url(self) -> str:
        """Public base URL of the app/API used to compose confirmation links."""
        return self._get("APP_BASE_URL")

    @property
    def frontend_base_url(self) -> str | None:
        """Optional separate frontend base URL for CORS (e.g., SPA origin)."""
        return self._get("FRONTEND_BASE_URL", required=False)


    @property
    def ddb_login_attempts_table(self) -> str:
        """ Table that logs login attempts"""
        return self._get("LOGIN_ATTEMPTS_TABLE")

    @property
    def email_token_secret(self) -> str:
        """Secret used to sign short-lived email/challenge tokens (separate from jwt_secret)."""
        override = os.getenv("EMAIL_TOKEN_SECRET")
        if override:
            return override
        return get_param(self._p("email_token_secret"), True)
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ssmvariables.get("ENVIRONMENT", "").lower() == "dev"
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ssmvariables.get("ENVIRONMENT", "").lower() == "prod"
    
    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.ssmvariables.get("ENVIRONMENT", "").lower() == "staging"

    @property
    def appsync_subscription_key(self) -> str:
        param = self._get("APPSYNC_SUBSCRIPTION_KEY_PARAM", required=False)
        if param:
            try:
                return get_param(param, True)
            except Exception as exc:
                logger.warning("Failed to read AppSync subscription key from SSM (%s). Falling back to inline env var.", param, exc_info=logger.isEnabledFor(logging.DEBUG))
        local_override = os.getenv("LOCAL_APPSYNC_SUBSCRIPTION_KEY")
        if local_override:
            return local_override

        value = self._get("APPSYNC_SUBSCRIPTION_KEY", required=False)
        if not value:
            raise KeyError("Missing APPSYNC_SUBSCRIPTION_KEY in env vars")
        if value.startswith("/"):
            raise KeyError("APPSYNC_SUBSCRIPTION_KEY resolves to parameter path but SSM retrieval failed.")
        return value

    @property
    def appsync_subscription_key_expires_at(self) -> str | None:
        param = self._get("APPSYNC_SUBSCRIPTION_KEY_EXPIRES_AT_PARAM", required=False)
        if param:
            try:
                return get_param(param, False)
            except Exception as exc:
                logger.warning("Failed to read AppSync subscription key expiry from SSM (%s). Falling back to inline env var.", param, exc_info=logger.isEnabledFor(logging.DEBUG))
        return self._get("APPSYNC_SUBSCRIPTION_KEY_EXPIRES_AT", required=False)

    @property
    def appsync_availability_key(self) -> str:
        param = self._get("APPSYNC_AVAILABILITY_KEY_PARAM", required=False)
        if param:
            try:
                return get_param(param, True)
            except Exception as exc:
                logger.warning("Failed to read AppSync availability key from SSM (%s). Falling back to inline env var.", param, exc_info=logger.isEnabledFor(logging.DEBUG))
        local_override = os.getenv("LOCAL_APPSYNC_AVAILABILITY_KEY")
        if local_override:
            return local_override

        value = self._get("APPSYNC_AVAILABILITY_KEY", required=False)
        if not value:
            raise KeyError("Missing APPSYNC_AVAILABILITY_KEY in env vars")
        if value.startswith("/"):
            raise KeyError("APPSYNC_AVAILABILITY_KEY resolves to parameter path but SSM retrieval failed.")
        return value

    @property
    def appsync_availability_key_expires_at(self) -> str | None:
        param = self._get("APPSYNC_AVAILABILITY_KEY_EXPIRES_AT_PARAM", required=False)
        if param:
            try:
                return get_param(param, False)
            except Exception as exc:
                logger.warning("Failed to read AppSync availability key expiry from SSM (%s). Falling back to inline env var.", param, exc_info=logger.isEnabledFor(logging.DEBUG))
        return self._get("APPSYNC_AVAILABILITY_KEY_EXPIRES_AT", required=False)

settings = Settings()
