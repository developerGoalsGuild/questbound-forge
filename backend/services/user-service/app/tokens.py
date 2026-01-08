from __future__ import annotations
import time, uuid
import jwt
from .ssm import settings

_ALGO = "HS256"

class TokenPurpose:
    EMAIL_CONFIRM = "email_confirm"
    CHANGE_PASSWORD = "change_password"


def issue_link_token(sub: str, purpose: str, ttl_seconds: int) -> dict:
    """Issue a signed token for email confirmation or password-change challenge.
    Args: sub: subject (e.g., "email|user_id"); purpose: TokenPurpose; ttl_seconds: lifetime
    Returns: {"token": str, "jti": str, "exp": int}
    """
    now = int(time.time())
    jti = str(uuid.uuid4())
    payload = {
        "sub": sub,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": now,
        "nbf": now,
        "exp": now + ttl_seconds,
        "jti": jti,
        "purpose": purpose,
    }
    tok = jwt.encode(payload, settings.email_token_secret, algorithm=_ALGO)
    return {"token": tok, "jti": jti, "exp": payload["exp"]}


def decode_link_token(token: str, expected_purpose: str) -> dict:
    """Validate and decode a previously issued token.
    Raises: jwt exceptions or ValueError if purpose mismatched.
    """
    claims = jwt.decode(
        token,
        settings.email_token_secret,
        algorithms=[_ALGO],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
        options={"require": ["exp", "iat", "nbf", "aud", "iss", "jti", "purpose"]},
    )
    if claims.get("purpose") != expected_purpose:
        raise ValueError("Invalid token purpose")
    return claims