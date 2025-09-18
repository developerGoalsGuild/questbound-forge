from __future__ import annotations
import os, json, time
from functools import lru_cache
import boto3

_ssm = boto3.client("ssm", region_name=os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-2")))

@lru_cache(maxsize=128)
def get_param(name: str, decrypt: bool = True) -> str:
    resp = _ssm.get_parameter(Name=name, WithDecryption=decrypt)
    return resp["Parameter"]["Value"]

class Settings:
    def __init__(self, prefix: str | None = None ):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/")
        if not self.prefix.endswith("/"): self.prefix += "/"

        raw = get_param(self._p("user-service/env_vars"), False)  # likely returns a JSON string
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
    def jwt_secret(self) -> str:
        return get_param(self._p("user-service/JWT_SECRET"), True)

    @property
    def jwt_issuer(self) -> str:
           #return get_param(self._p("jwt_issuer"), False)
        value = get_param(self._p("user-service/jwt_issuer"), True)
        return value


    @property
    def jwt_audience(self) -> str:
        value = get_param(self._p("user-service/jwt_audience"), True)
        return value
        #return get_param(self._p("jwt_audience"), False)

    @property
    def cognito_region(self) -> str:
        value = get_param(self._p("cognito/cognito_region"), True)
        return value
        #return get_param(self._p("cognito_region"), False)

    @property
    def cognito_user_pool_id(self) -> str:
        value = get_param(self._p("cognito/user_pool_id"), True)
        return value
        #return get_param(self._p("cognito_user_pool_id"), False)

    @property
    def cognito_client_id(self) -> str:
        value = get_param(self._p("cognito/client_id"), True)
        return value        
        #return get_param(self._p("cognito_client_id"), False)

    @property
    def cognito_client_secret(self) -> str:
        value = get_param(self._p("cognito/client_secret"), True)
        return value          
        #return get_param(self._p("cognito_client_secret"), True)

    @property
    def cognito_domain(self) -> str:
        value = get_param(self._p("cognito/domain"), True)
        return value    
        #return get_param(self._p("cognito_domain"), False)
    
    @property
    def ses_sender_email(self) -> str:
        """Return SES verified sender (e.g., no-reply@domain).
        Security: value is non-secret; stored as SSM String.
        """
        value = get_param(self._p("ses_sender_email"), True)
    
    @property
    def email_token_secret(self) -> str:
        """Secret used to sign short-lived email/challenge tokens (separate from jwt_secret)."""
        return get_param(self._p("user-service/email_token_secret"), True)

settings = Settings()
