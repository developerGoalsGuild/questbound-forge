import base64
import json
import os
import time
import hmac
import hashlib
from typing import Optional

from ssm import settings

# Load secret key from environment variable
JWT_SECRET = settings.jwt_secret.encode("utf-8")
JWT_ALGORITHM = "HS256"
JWT_AUDIENCE = settings.jwt_audience
JWT_ISSUER = settings.jwt_issuer

JWT_EXP_DELTA_SECONDS = 3600  # 1 hour token expiration


def _b64url_encode(data: bytes) -> str:
  return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(segment: str) -> dict:
  padding = "=" * ((4 - len(segment) % 4) % 4)
  decoded = base64.urlsafe_b64decode((segment + padding).encode("utf-8"))
  return json.loads(decoded.decode("utf-8"))


def issue_local_jwt(subject: str, additional_claims: Optional[dict] = None) -> str:
  """Issue a HS256 JWT token without external dependencies."""
  now = int(time.time())
  header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
  payload = {
    "sub": subject,
    "iat": now,
    "nbf": now,
    "exp": now + JWT_EXP_DELTA_SECONDS,
    "aud": JWT_AUDIENCE,
    "iss": JWT_ISSUER,
  }
  if additional_claims:
    payload.update(additional_claims)

  header_segment = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
  payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
  signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
  signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
  signature_segment = _b64url_encode(signature)
  return f"{header_segment}.{payload_segment}.{signature_segment}"


def verify_local_jwt(token: str) -> dict:
  """Verify and decode a HS256 JWT token."""
  import logging
  logger = logging.getLogger("security")

  if token.count(".") != 2:
    logger.error("JWT verification failed - token format invalid")
    raise ValueError("Invalid token format")

  header_segment, payload_segment, signature_segment = token.split(".")

  header = _b64url_decode(header_segment)
  if header.get("alg") != JWT_ALGORITHM:
    logger.error("JWT verification failed - unsupported algorithm", extra={"alg": header.get("alg")})
    raise ValueError("Unsupported algorithm")

  expected_signature = hmac.new(
    JWT_SECRET,
    f"{header_segment}.{payload_segment}".encode("utf-8"),
    hashlib.sha256,
  ).digest()
  expected_segment = _b64url_encode(expected_signature)
  if not hmac.compare_digest(expected_segment, signature_segment):
    logger.error("JWT verification failed - signature mismatch")
    raise ValueError("Signature mismatch")

  payload = _b64url_decode(payload_segment)

  now = int(time.time())
  if "exp" not in payload or int(payload["exp"]) < now:
    logger.error("JWT verification failed - token expired")
    raise ValueError("Token expired")
  if "nbf" in payload and int(payload["nbf"]) > now:
    logger.error("JWT verification failed - token not yet valid")
    raise ValueError("Token not yet valid")
  if payload.get("aud") != JWT_AUDIENCE:
    logger.error("JWT verification failed - invalid audience", extra={"aud": payload.get("aud")})
    raise ValueError("Invalid audience")
  if payload.get("iss") != JWT_ISSUER:
    logger.error("JWT verification failed - invalid issuer", extra={"iss": payload.get("iss")})
    raise ValueError("Invalid issuer")
  if "sub" not in payload:
    logger.error("JWT verification failed - subject missing")
    raise ValueError("Subject claim missing")

  logger.debug("JWT verification successful", extra={"sub": payload.get("sub")})
  return payload
