from __future__ import annotations
import secrets
import os, time, uuid
from typing import Any, Dict
import jwt
from passlib.context import CryptContext
from .ssm import settings
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Passwords


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)



def validate_password_strength(pwd: str) -> None:
    """Validate password complexity.
    Requirements: min 8 chars; at least one lowercase, uppercase, digit, and special.
    Raises: ValueError on failure (message safe to return as 400).
    """
    if pwd is None or len(pwd) < 8:
        raise ValueError("Password must be at least 8 characters long. ")
    if not any(c.islower() for c in pwd):
        raise ValueError("Password must include at least one lowercase letter.")
    if not any(c.isupper() for c in pwd):
        raise ValueError("Password must include at least one uppercase letter.")
    if not any(c.isdigit() for c in pwd):
        raise ValueError("Password must include at least one digit.")
    specials = set("!@#$%^&*()-_=+[]{};:,.?/")
    if not any(c in specials for c in pwd):
        raise ValueError("Password must include at least one special character.")
        
def generate_secure_password(length: int = 16) -> str:
        """Generate a strong random password using secrets.
        Guarantees presence of each required character class. Enforces min length 12.
        Returns: password string (do not log or persist in plaintext outside email body).
        """
        if length < 12:
            length = 12
            lowers = string.ascii_lowercase
            uppers = string.ascii_uppercase
            digits = string.digits
        specials = "!@#$%^&*()-_=+[]{};:,.?/"
        pwd = [
            secrets.choice(lowers),
            secrets.choice(uppers),
            secrets.choice(digits),
            secrets.choice(specials),
        ]
        pool = lowers + uppers + digits + specials
        pwd += [secrets.choice(pool) for _ in range(length - 4)]
        secrets.SystemRandom().shuffle(pwd)
        return "".join(pwd)


# Local JWT


def issue_local_jwt(sub: str, email: str, scopes: list[str] | None = None, ttl_seconds: int = 1200, *, role: str | None = None) -> dict:
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
    if role:
        payload["role"] = role
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
