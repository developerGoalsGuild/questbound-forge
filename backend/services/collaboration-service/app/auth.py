"""
Authentication utilities for collaboration service.
"""

import jwt
import os
from typing import Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_jwt_secret() -> str:
    """Get JWT secret from environment."""
    return os.getenv("JWT_SECRET", "your-secret-key")

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def authenticate(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Authenticate user and return user info."""
    token = credentials.credentials
    payload = verify_token(token)
    
    # Extract user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID"
        )
    
    return {
        "sub": user_id,
        "username": payload.get("username", ""),
        "email": payload.get("email", "")
    }

