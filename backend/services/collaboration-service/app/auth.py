"""
Authentication utilities for collaboration service.
"""

import logging
from functools import lru_cache
from typing import Dict, Tuple, Any

import jwt
from jwt import PyJWKClient, PyJWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .settings import Settings

logger = logging.getLogger("collaboration-service.auth")

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

    def verify(self, token: str) -> Tuple[Dict, str]:
        """Return (claims, provider) or raise TokenVerificationError."""
        logger.info(f"collaboration.auth.verify_token_start - token_length={len(token)}, token_prefix={token[:20] + '...' if len(token) > 20 else token}")
        
        try:
            claims = self._verify_local(token)
            logger.info(f"collaboration.auth.verify_token_success - provider=local, user_id={claims.get('sub')}, username={claims.get('username')}")
            return claims, "local"
        except PyJWTError as exc:
            logger.debug(f"collaboration.auth.local_verification_failed - error={str(exc)}, error_type={type(exc).__name__}")
        except Exception as exc:  # pragma: no cover - unexpected
            logger.warning(f"collaboration.auth.local_verification_unexpected_error - error={str(exc)}, error_type={type(exc).__name__}", exc_info=exc)

        try:
            claims = self._verify_cognito(token)
            logger.info(f"collaboration.auth.verify_token_success - provider=cognito, user_id={claims.get('sub')}, username={claims.get('username')}")
            return claims, "cognito"
        except Exception as exc:
            logger.warning(f"collaboration.auth.cognito_verification_failed - error={str(exc)}, error_type={type(exc).__name__}", exc_info=exc)
            raise TokenVerificationError("Token verification failed") from exc

    def _verify_local(self, token: str) -> Dict:
        logger.info(f"collaboration.auth.verify_local_start - jwt_secret_length={len(self.settings.jwt_secret)}, jwt_audience={self.settings.jwt_audience}, jwt_issuer={self.settings.jwt_issuer}")
        
        try:
            # Decode header to check algorithm
            header = jwt.get_unverified_header(token)
            logger.info(f"collaboration.auth.token_header - algorithm={header.get('alg')}, kid={header.get('kid')}")
            
            options = {
                "require": ["sub", "iat", "exp", "aud", "iss"],
            }
            claims = jwt.decode(
                token,
                self.settings.jwt_secret,
                algorithms=["HS256"],
                audience=self.settings.jwt_audience,
                issuer=self.settings.jwt_issuer,
                options=options,
            )
            logger.info(f"collaboration.auth.verify_local_success - user_id={claims.get('sub')}")
            return claims
        except Exception as e:
            logger.error(f"collaboration.auth.verify_local_failed - error={str(e)}, error_type={type(e).__name__}")
            raise

    def _verify_cognito(self, token: str) -> Dict:
        logger.info(f"collaboration.auth.verify_cognito_start - cognito_issuer={self.cognito_issuer}, cognito_client_id={self.settings.cognito_client_id}")
        
        try:
            # Decode header to check algorithm and kid
            header = jwt.get_unverified_header(token)
            logger.info(f"collaboration.auth.cognito_token_header - algorithm={header.get('alg')}, kid={header.get('kid')}")
            
            signing_key = self._jwks_client().get_signing_key_from_jwt(token).key
        except Exception as e:
            logger.error(f"collaboration.auth.cognito_signing_key_failed - error={str(e)}, error_type={type(e).__name__}")
            raise
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


# Global settings instance
_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

def get_token_verifier() -> TokenVerifier:
    return TokenVerifier(get_settings())

def verify_token(token: str) -> Dict[str, any]:
    """Verify JWT token and return payload."""
    logger.info(f"collaboration.auth.verify_token_legacy - token_length={len(token)}")
    
    verifier = get_token_verifier()
    try:
        claims, provider = verifier.verify(token)
        logger.info(f"collaboration.auth.verify_token_legacy_success - provider={provider}, user_id={claims.get('sub')}")
        return claims
    except TokenVerificationError as exc:
        logger.error(f"collaboration.auth.verify_token_legacy_failed - error={str(exc)}, error_type={type(exc).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def authenticate(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Authenticate user and return user information."""
    logger.info(f"collaboration.auth.authenticate_start - has_credentials={credentials is not None}")
    
    if not credentials:
        logger.error("collaboration.auth.authenticate_no_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No credentials provided"
        )
    
    token = credentials.credentials
    logger.info(f"collaboration.auth.authenticate_token_received - token_length={len(token)}, token_prefix={token[:20] + '...' if len(token) > 20 else token}")
    
    try:
        payload = verify_token(token)
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if not user_id:
            logger.error(f"collaboration.auth.authenticate_missing_user_id - payload_keys={list(payload.keys())}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        user_info = {
            "sub": user_id,
            "username": payload.get("username", ""),
            "email": payload.get("email", "")
        }
        
        logger.info(f"collaboration.auth.authenticate_success - user_id={user_id}, username={user_info.get('username')}, email={user_info.get('email')}")
        
        return user_info
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        logger.error(f"collaboration.auth.authenticate_unexpected_error - error={str(exc)}, error_type={type(exc).__name__}", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


__all__ = ["TokenVerifier", "TokenVerificationError", "authenticate", "verify_token"]