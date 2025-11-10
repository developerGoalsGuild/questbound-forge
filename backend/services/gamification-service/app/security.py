"""
Security utilities for JWT token handling.
"""

import jwt
import time
from typing import Dict
from .settings import Settings

_settings = Settings()


def issue_local_jwt(user_id: str, email: str) -> Dict[str, str]:
    """
    Issue a local JWT token for testing/development.
    
    Args:
        user_id: User ID
        email: User email
        
    Returns:
        Dictionary with access_token
    """
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + 3600,  # 1 hour
        "aud": _settings.jwt_audience,
        "iss": _settings.jwt_issuer,
    }
    
    token = jwt.encode(payload, _settings.jwt_secret, algorithm="HS256")
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }

