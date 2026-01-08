# cognito.py
from __future__ import annotations
import base64, json
from functools import lru_cache
from typing import Any, Dict
import requests
import jwt
from jwt import PyJWKClient
from ssm import settings

@lru_cache(maxsize=1)
def _cognito_issuer() -> str:
    return f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}"

@lru_cache(maxsize=1)
def _jwks_url() -> str:
    return f"{_cognito_issuer()}/.well-known/jwks.json"

@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(_jwks_url())

def verify_cognito_jwt(token: str) -> dict:
    signing_key = _jwks_client().get_signing_key_from_jwt(token).key
    # Skip audience in the core verification so we can support both id/access tokens.
    claims = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        issuer=_cognito_issuer(),
        options={"require": ["exp", "iat", "iss", "token_use"], "verify_aud": False},
    )
    token_use = claims.get("token_use")
    if token_use == "id":
        aud = claims.get("aud")
        cid = settings.cognito_client_id
        if isinstance(aud, str):
            if aud != cid:
                raise ValueError("Invalid audience")
        elif isinstance(aud, list):
            if cid not in aud:
                raise ValueError("Invalid audience")
        else:
            raise ValueError("Missing audience")
    elif token_use == "access":
        if claims.get("client_id") != settings.cognito_client_id:
            raise ValueError("Invalid client_id")
    else:
        raise ValueError("Invalid token_use")
    return claims

def exchange_auth_code_for_tokens(auth_code: str, redirect_uri: str) -> dict:
    token_url = f"https://{settings.cognito_domain}/oauth2/token"
    basic = base64.b64encode(
        f"{settings.cognito_client_id}:{settings.cognito_client_secret}".encode()
    ).decode()
    headers = {"Content-Type": "application/x-www-form-urlencoded", "Authorization": f"Basic {basic}"}
    data = {"grant_type": "authorization_code", "code": auth_code, "redirect_uri": redirect_uri}
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()
