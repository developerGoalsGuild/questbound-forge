"""Authentication utilities for connect-service.

Copied in spirit from collaboration-service so this service can be protected
behind API Gateway with the same tokens.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Dict, Tuple

import jwt
from jwt import PyJWKClient, PyJWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .settings import Settings, get_settings

logger = logging.getLogger("connect-service.auth")
security = HTTPBearer()


class TokenVerificationError(Exception):
    """Raised when a JWT cannot be verified."""


class TokenVerifier:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def cognito_issuer(self) -> str:
        return f"https://cognito-idp.{self.settings.cognito_region}.amazonaws.com/{self.settings.cognito_user_pool_id}"

    @lru_cache(maxsize=1)
    def _jwks_client(self) -> PyJWKClient:
        jwks_url = f"{self.cognito_issuer}/.well-known/jwks.json"
        return PyJWKClient(jwks_url)

    def verify(self, token: str) -> Tuple[Dict[str, Any], str]:
        try:
            claims = self._verify_local(token)
            return claims, "local"
        except PyJWTError:
            pass
        except Exception as exc:  # pragma: no cover
            logger.warning("connect.auth.local_verification_unexpected_error", exc_info=exc)

        # Cognito is optional in dev; if not configured, fail closed.
        if not (self.settings.cognito_region and self.settings.cognito_user_pool_id and self.settings.cognito_client_id):
            raise TokenVerificationError("Cognito not configured")

        try:
            claims = self._verify_cognito(token)
            return claims, "cognito"
        except Exception as exc:
            raise TokenVerificationError("Token verification failed") from exc

    def _verify_local(self, token: str) -> Dict[str, Any]:
        options = {"require": ["sub", "iat", "exp", "aud", "iss"]}
        return jwt.decode(
            token,
            self.settings.jwt_secret,
            algorithms=["HS256"],
            audience=self.settings.jwt_audience,
            issuer=self.settings.jwt_issuer,
            options=options,
        )

    def _verify_cognito(self, token: str) -> Dict[str, Any]:
        signing_key = self._jwks_client().get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=self.cognito_issuer,
            options={"require": ["exp", "iat", "iss", "token_use"], "verify_aud": False},
        )
        token_use = claims.get("token_use")
        if token_use == "id":
            aud = claims.get("aud")
            client_id = self.settings.cognito_client_id
            if isinstance(aud, list):
                if client_id not in aud:
                    raise TokenVerificationError("Invalid Cognito audience")
            elif aud != client_id:
                raise TokenVerificationError("Invalid Cognito audience")
        elif token_use == "access":
            if claims.get("client_id") != self.settings.cognito_client_id:
                raise TokenVerificationError("Invalid Cognito client_id")
        else:
            raise TokenVerificationError("Unsupported Cognito token_use")
        return claims


@lru_cache(maxsize=1)
def get_token_verifier() -> TokenVerifier:
    return TokenVerifier(get_settings())


def authenticate(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No credentials provided")

    token = credentials.credentials
    try:
        claims, provider = get_token_verifier().verify(token)
    except TokenVerificationError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing user ID")

    return {
        "sub": user_id,
        "provider": provider,
        "email": claims.get("email", ""),
        "username": claims.get("username") or claims.get("nickname") or "",
        "claims": claims,
    }




