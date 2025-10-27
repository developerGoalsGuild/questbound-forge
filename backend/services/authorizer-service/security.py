import os
import time
from typing import Optional

import jwt
from jwt import PyJWTError
from ssm import settings


# Load secret key from environment variable
JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = "HS256"
JWT_AUDIENCE = settings.jwt_audience
JWT_ISSUER = settings.jwt_issuer

JWT_EXP_DELTA_SECONDS = 3600  # 1 hour token expiration


def issue_local_jwt(subject: str, additional_claims: Optional[dict] = None) -> str:
  """
  Issue a JWT token with subject and optional additional claims.
  The token expires in JWT_EXP_DELTA_SECONDS seconds.
  """
  now = int(time.time())
  payload = {
    "sub": subject,
    "iat": now,
    "exp": now + JWT_EXP_DELTA_SECONDS,
  }
  if additional_claims:
    payload.update(additional_claims)

  token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
  # PyJWT 2.x returns str by default
  return token


def verify_local_jwt(token: str) -> dict:
  """
  Verify and decode a JWT token.
  Raises jwt.PyJWTError on failure.
  Returns the decoded payload dictionary on success.
  """
  import logging
  logger = logging.getLogger("security")
  
  logger.debug(f"JWT verification attempt - Token length: {len(token)}")
  logger.debug(f"JWT verification attempt - Expected audience: {JWT_AUDIENCE}")
  logger.debug(f"JWT verification attempt - Expected issuer: {JWT_ISSUER}")
  logger.debug(f"JWT verification attempt - Expected algorithm: {JWT_ALGORITHM}")
  
  options = {
    "require_sub": True,
    "require_iat": True,
    "require_exp": True,
    "require_aud": True,
    "require_iss": True,
  }
  
  try:
    payload = jwt.decode(
      token,
      JWT_SECRET,
      algorithms=[JWT_ALGORITHM],
      options=options,
      audience=JWT_AUDIENCE,
      issuer=JWT_ISSUER,
    )
    logger.debug(f"JWT verification successful - Payload keys: {list(payload.keys())}")
    return payload
  except Exception as e:
    logger.error(f"JWT verification failed - Error: {str(e)}")
    logger.error(f"JWT verification failed - Token prefix: {token[:50]}...")
    raise
