from __future__ import annotations
import logging
from typing import Optional
import jwt
from fastapi import HTTPException, Request, Depends
from .settings import Settings

logger = logging.getLogger(__name__)


class AuthContext:
    """Authentication context for requests."""
    def __init__(self, user_id: str, claims: dict, provider: str):
        self.user_id = user_id
        self.claims = claims
        self.provider = provider


def get_settings() -> Settings:
    """Dependency to get settings."""
    return Settings()


async def authenticate(
    request: Request,
    settings: Settings = Depends(get_settings)
) -> AuthContext:
    """Authenticate user from JWT token in Authorization header."""
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    
    if not auth_header:
        logger.warning('auth.missing_header', extra={'path': request.url.path})
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not auth_header.startswith('Bearer '):
        logger.warning('auth.invalid_format', extra={'path': request.url.path})
        raise HTTPException(status_code=401, detail="Authorization header must be Bearer token")
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    
    # Try local JWT first, then Cognito JWT
    try:
        # Local JWT verification
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={
                "require": ["sub", "iat", "exp", "aud", "iss"],
            }
        )
        provider = "local"
        logger.info('auth.local_jwt_success', extra={'user_id': claims.get('sub')})
    except jwt.PyJWTError as e_local:
        try:
            # Cognito JWT verification (would need cognito verification here)
            # For now, fallback to local JWT if secret is missing
            if not settings.jwt_secret:
                logger.warning('auth.jwt_secret_missing')
                raise HTTPException(status_code=401, detail="Authentication configuration missing")
            raise e_local
        except Exception as e_cognito:
            logger.warning(
                'auth.jwt_verification_failed',
                extra={'local_error': str(e_local), 'cognito_error': str(e_cognito)}
            )
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = claims.get('sub')
    if not user_id:
        logger.warning('auth.missing_sub_claim')
        raise HTTPException(status_code=401, detail="Malformed token")
    
    return AuthContext(user_id=user_id, claims=claims, provider=provider)

