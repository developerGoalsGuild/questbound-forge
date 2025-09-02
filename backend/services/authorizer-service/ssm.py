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
    def __init__(self, prefix: str | None = None):
        self.prefix = prefix or os.getenv("SETTINGS_SSM_PREFIX", "/auth-api/dev/")
        if not self.prefix.endswith("/"): self.prefix += "/"

    def _p(self, key: str) -> str:
        return f"{self.prefix}{key}"

    @property
    def ddb_users_table(self) -> str:
        return get_param(self._p("dynamodb_users_table"), False)

    @property
    def jwt_secret(self) -> str:
        return get_param(self._p("jwt_secret"), True)

    @property
    def jwt_issuer(self) -> str:
        return get_param(self._p("jwt_issuer"), False)

    @property
    def jwt_audience(self) -> str:
        return get_param(self._p("jwt_audience"), False)

    @property
    def cognito_region(self) -> str:
        return get_param(self._p("cognito_region"), False)

    @property
    def cognito_user_pool_id(self) -> str:
        return get_param(self._p("cognito_user_pool_id"), False)

    @property
    def cognito_client_id(self) -> str:
        return get_param(self._p("cognito_client_id"), False)

    @property
    def cognito_client_secret(self) -> str:
        return get_param(self._p("cognito_client_secret"), True)

    @property
    def cognito_domain(self) -> str:
        return get_param(self._p("cognito_domain"), False)

    @property
    def ddb_login_attempts_table(self) -> str:
        return get_param(self._p("dynamodb_login_attempts_table"), False)
    
    
settings = Settings()