from __future__ import annotations
import os, json, time
from functools import lru_cache
import boto3

_ssm = boto3.client("ssm", region_name=os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1")))

@lru_cache(maxsize=128)
def get_param(name: str, decrypt: bool = True) -> str:
    resp = _ssm.get_parameter(Name=name, WithDecryption=decrypt)
    return resp["Parameter"]["Value"]

class Settings:
    def __init__(self, prefix: str | None = None ):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/user-service/")
        if not self.prefix.endswith("/"): self.prefix += "/"

        raw = get_param(self._p("env_vars"), False)  # likely returns a JSON string
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


    @property
    def ddb_users_table(self) -> str:
        value = self.ssmvariables["dynamodb_users_table".upper()]
        return value

    @property
    def core_table_name(self) -> str:
        # Single-table used by AppSync patterns (gg_core)
        key = "CORE_TABLE"
        v = self.ssmvariables.get(key)
        if not v:
            # Backward compat: try explicit name
            v = self.ssmvariables.get("GG_CORE_TABLE")
        if not v:
            raise KeyError("Missing CORE_TABLE in user-service env_vars SSM parameter")
        return v

    @property
    def jwt_secret(self) -> str:
        return get_param(self._p("JWT_SECRET"), True)

    @property
    def jwt_issuer(self) -> str:
           #return get_param(self._p("jwt_issuer"), False)
        value = self.ssmvariables["jwt_issuer".upper()]
        return value


    @property
    def jwt_audience(self) -> str:
        value = self.ssmvariables["jwt_audience".upper()]
        return value
        #return get_param(self._p("jwt_audience"), False)

    @property
    def cognito_region(self) -> str:
        value = self.ssmvariables["cognito_region".upper()]
        return value
        #return get_param(self._p("cognito_region"), False)

    @property
    def cognito_user_pool_id(self) -> str:
        value = self.ssmvariables["cognito_user_pool_id".upper()]
        return value
        #return get_param(self._p("cognito_user_pool_id"), False)

    @property
    def cognito_client_id(self) -> str:
        value = self.ssmvariables["cognito_client_id".upper()]
        return value        
        #return get_param(self._p("cognito_client_id"), False)

    @property
    def cognito_client_secret(self) -> str:
        value = self.ssmvariables["cognito_client_secret".upper()]
        return value          
        #return get_param(self._p("cognito_client_secret"), True)

    @property
    def cognito_domain(self) -> str:
        value = self.ssmvariables["cognito_domain".upper()]
        return value    
        #return get_param(self._p("cognito_domain"), False)
    
    @property
    def ses_sender_email(self) -> str:
        """Return SES verified sender (e.g., no-reply@domain).
        Security: value is non-secret; stored as SSM String.
        """
        value = self.ssmvariables["ses_sender_email".upper()]
        return value   
        #return get_param(self._p("ses_sender_email"), False)


    @property
    def app_base_url(self) -> str:
        """Public base URL of the app/API used to compose confirmation links."""
        value = self.ssmvariables["app_base_url".upper()]
        return value   
        #return get_param(self._p("app_base_url"), False)

    @property
    def frontend_base_url(self) -> str | None:
        """Optional separate frontend base URL for CORS (e.g., SPA origin)."""
        return self.ssmvariables.get("FRONTEND_BASE_URL") or self.ssmvariables.get("frontend_base_url")


    @property
    def ddb_login_attempts_table(self) -> str:
        """ Table that logs login attempts"""
        value = self.ssmvariables["LOGIN_ATTEMPTS_TABLE".upper()]
        return value   

    @property
    def email_token_secret(self) -> str:
        """Secret used to sign short-lived email/challenge tokens (separate from jwt_secret)."""
        return get_param(self._p("email_token_secret"), True)

settings = Settings()
