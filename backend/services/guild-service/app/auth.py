from __future__ import annotations

import logging
from functools import lru_cache
from typing import Dict, Tuple

import jwt
from jwt import PyJWKClient, PyJWTError

from .settings import Settings

logger = logging.getLogger("guild-service.auth")


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
        except Exception as exc:  # pragma: no cover - unexpected
            logger.warning("Local JWT verification raised unexpected error", exc_info=exc)

        try:
            claims = self._verify_cognito(token)
            return claims, "cognito"
        except Exception as exc:
            logger.warning("Cognito JWT verification failed", exc_info=exc)
            raise TokenVerificationError("Token verification failed") from exc

    def _verify_local(self, token: str) -> Dict:
        # For development, if JWT secret is not configured, decode without verification
        if not self.settings.jwt_secret:
            logger.warning("JWT secret not configured, decoding without verification")
            return jwt.decode(token, options={"verify_signature": False})
        
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
        # Skip Cognito verification if not properly configured
        if not self.settings.cognito_user_pool_id or not self.settings.cognito_client_id:
            logger.warning("Cognito not configured, skipping Cognito verification")
            raise TokenVerificationError("Cognito not configured")
        
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
            client_id = self.settings.cognito_client_id
            if isinstance(audience, list):
                if client_id not in audience:
                    raise TokenVerificationError("Invalid Cognito audience")
            elif audience != client_id:
                raise TokenVerificationError("Invalid Cognito audience")
        elif token_use == "access":
            if claims.get("client_id") != self.settings.cognito_client_id:
                raise TokenVerificationError("Invalid Cognito client_id")
        else:
            raise TokenVerificationError("Unsupported Cognito token_use")
        return claims


__all__ = ["TokenVerifier", "TokenVerificationError"]
