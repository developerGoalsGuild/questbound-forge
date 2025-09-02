from __future__ import annotations
import base64, json, time
from functools import lru_cache
from typing import Any, Dict
import requests
import jwt
from ssm import settings
from jwt.algorithms import RSAAlgorithm


@lru_cache(maxsize=1)
def _jwks_cache_key() -> str:
    # Invalidate manually by process recycle or deploy; or add a timed layer outside if needed
    return f"{settings.cognito_region}:{settings.cognito_user_pool_id}"

_jwks: Dict[str, Any] | None = None
_jwks_fetched_at: float | None = None
_jwks_ttl = 3600


def _cognito_issuer() -> str:
    return f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}"


def _fetch_jwks() -> Dict[str, Any]:
    global _jwks, _jwks_fetched_at
    if _jwks and _jwks_fetched_at and time.time() - _jwks_fetched_at < _jwks_ttl:
        return _jwks
    url = f"{_cognito_issuer()}/.well-known/jwks.json"
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    _jwks = resp.json()
    _jwks_fetched_at = time.time()
    return _jwks


def verify_cognito_jwt(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    jwks = _fetch_jwks()
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key:
        raise ValueError("JWKS key not found")
    public_key = RSAAlgorithm.from_jwk(json.dumps(key))
    claims = jwt.decode(
        token,
        key=public_key,
        algorithms=["RS256"],
        options={"require": ["exp", "iat", "iss", "token_use"]},
        issuer=_cognito_issuer(),
        audience=settings.cognito_client_id,  # for id_token; access_token uses client_id claim
    )
    return claims


def exchange_auth_code_for_tokens(auth_code: str, redirect_uri: str) -> dict:
    token_url = f"https://{settings.cognito_domain}/oauth2/token"
    basic = base64.b64encode(f"{settings.cognito_client_id}:{settings.cognito_client_secret}".encode()).decode()
    headers = {"Content-Type": "application/x-www-form-urlencoded", "Authorization": f"Basic {basic}"}
    data = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "redirect_uri": redirect_uri,
    }
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()