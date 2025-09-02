from __future__ import annotations
import os, time, uuid
from typing import Any, Dict
import jwt
from passlib.context import CryptContext
from ssm import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Passwords


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# Local JWT


def issue_local_jwt(sub: str, email: str, scopes: list[str] | None = None, ttl_seconds: int = 900) -> dict:
    now = int(time.time())
    payload = {
    "iss": settings.jwt_issuer,
    "aud": settings.jwt_audience,
    "sub": sub,
    "email": email,
    "scope": " ".join(scopes or ["user:read"]),
    "iat": now,
    "nbf": now,
    "exp": now + ttl_seconds,
    "token_use": "access",
    "provider": "local",
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return {"access_token": token, "expires_in": ttl_seconds}




def verify_local_jwt(token: str) -> dict:
    return jwt.decode(
    token,
    settings.jwt_secret,
    algorithms=["HS256"],
    audience=settings.jwt_audience,
    options={"require": ["exp", "iat", "nbf", "aud", "iss", "sub"]},
    issuer=settings.jwt_issuer,
    )