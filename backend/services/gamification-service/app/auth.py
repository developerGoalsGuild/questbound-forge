from __future__ import annotations

import logging
from functools import lru_cache
from typing import Dict, Tuple

import jwt
from jwt import PyJWKClient, PyJWTError

from .settings import Settings

logger = logging.getLogger("gamification-service.auth")


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

    def verify(self, token: str) -> Tuple[Dict, str]:
        """Return (claims, provider) or raise TokenVerificationError."""
        try:
            claims = self._verify_local(token)
            return claims, "local"
        except PyJWTError as exc:
            logger.debug("Local JWT verification failed: %s", exc)
        except Exception as exc:
            logger.warning("Local JWT verification raised unexpected error", exc_info=exc)

        try:
            claims = self._verify_cognito(token)
            return claims, "cognito"
        except Exception as exc:
            logger.warning("Cognito JWT verification failed", exc_info=exc)
            raise TokenVerificationError("Token verification failed") from exc

    def _verify_local(self, token: str) -> Dict:
        options = {
            "require": ["sub", "iat", "exp", "aud", "iss"],
        }
        return jwt.decode(
            token,
            self.settings.jwt_secret,
            algorithms=["HS256"],
            audience=self.settings.jwt_audience,
            issuer=self.settings.jwt_issuer,
            options=options,
        )

    def _verify_cognito(self, token: str) -> Dict:
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
            audience = claims.get("aud")
            # For id tokens, we accept any valid audience
            if not audience:
                raise TokenVerificationError("Invalid Cognito audience")
        elif token_use == "access":
            # For access tokens, we accept any valid token
            pass
        else:
            raise TokenVerificationError("Unsupported Cognito token_use")
        return claims


__all__ = ["TokenVerifier", "TokenVerificationError"]

