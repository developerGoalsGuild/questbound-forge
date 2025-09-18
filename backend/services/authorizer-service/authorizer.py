# authorizer.py
from __future__ import annotations
import os, json, logging
from typing import Any, Dict

import jwt  # only used to peek unverified header for debug

# ABSOLUTE imports (no leading dots)
import security
from security import verify_local_jwt
from cognito import verify_cognito_jwt


class Unauthorized(Exception):
    pass


def _to_bool(v: str | None, default=False) -> bool:
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes", "on")


AUTH_LOG_ENABLED = _to_bool(os.getenv("AUTH_LOG_ENABLED"), False)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
ENABLE_LOCAL_JWT = _to_bool(os.getenv("ENABLE_LOCAL_JWT"), True)

logger = logging.getLogger("authorizer")
if not logger.handlers:
    h = logging.StreamHandler()
    h.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(h)
logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))


def _peek_jwt_header(token: str) -> Dict[str, Any]:
    try:
        h = jwt.get_unverified_header(token)
        return {"kid": h.get("kid"), "alg": h.get("alg")}
    except Exception:
        return {}


def _dbg(event_name: str, **fields: Any) -> None:
    if not AUTH_LOG_ENABLED:
        return
    tok = fields.pop("token", None)
    if tok:
        hdr = _peek_jwt_header(tok)
        fields["token_hint"] = {
            "len": len(tok),
            **({"kid": hdr.get("kid")} if hdr.get("kid") else {}),
            **({"alg": hdr.get("alg")} if hdr.get("alg") else {}),
        }
    try:
        logger.info(json.dumps({"event": event_name, **fields}, default=str))
    except Exception:
        logger.warning("failed to serialize debug log for event=%s", event_name)


def _extract_token(event: dict) -> str:
    # REST TOKEN authorizer
    if "authorizationToken" in event:
        raw = event["authorizationToken"]
        parts = raw.split()
        token = parts[-1] if parts else raw
        _dbg("token_extracted", source="TOKEN", token=token)
        return token

    # HTTP API (REQUEST/Lambda authorizer v2)
    headers = event.get("headers") or {}
    for k in ("authorization", "Authorization"):
        if k in headers and headers[k]:
            raw = headers[k]
            parts = raw.split()
            token = parts[-1] if parts else raw
            _dbg("token_extracted", source="HEADER", header_key=k, token=token)
            return token

    _dbg("token_missing")
    raise Unauthorized("No token provided")


def _allow_policy(principal: str, resource: str, context: Dict[str, Any]) -> dict:
    return {
        "principalId": principal,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [{"Action": "execute-api:Invoke", "Effect": "Allow", "Resource": resource}],
        },
        "context": context,
    }


def _httpapi_simple_response(authorized: bool, context: Dict[str, Any]) -> dict:
    return {"isAuthorized": authorized, "context": context}


def handler(event, context):
    req_meta = {
        "version": event.get("version"),
        "routeKey": event.get("routeKey"),
        "methodArn": event.get("methodArn"),
        "aws_request_id": getattr(context, "aws_request_id", None),
        "stage": (event.get("requestContext") or {}).get("stage"),
    }
    _dbg(
        "auth_start",
        **req_meta,
        enable_local_jwt=ENABLE_LOCAL_JWT,
        jwt_alg_local=getattr(security, "JWT_ALGORITHM", None),
        jwt_secret_is_default=(getattr(security, "JWT_SECRET", "") == "default_secret_change_me"),
    )

    try:
        token = _extract_token(event)
        claims = None
        provider = None

        # 1) Optional local HS256
        if ENABLE_LOCAL_JWT:
            try:
                claims = verify_local_jwt(token)
                provider = "local"
                _dbg("local_verify_ok", sub=claims.get("sub"), scope=claims.get("scope"))
            except Exception as e_local:
                _dbg("local_verify_failed", error_type=type(e_local).__name__, error=str(e_local), token=token)

        # 2) Cognito RS256
        if claims is None:
            try:
                claims = verify_cognito_jwt(token)
                provider = "cognito"
                _dbg(
                    "cognito_verify_ok",
                    sub=claims.get("sub"),
                    token_use=claims.get("token_use"),
                    scope=claims.get("scope"),
                )
            except Exception as e_cog:
                _dbg("cognito_verify_failed", error_type=type(e_cog).__name__, error=str(e_cog), token=token)
                if event.get("version") == "2.0" and "routeKey" in event:
                    _dbg("auth_deny_httpapi", reason="verify_failed", **req_meta)
                    return _httpapi_simple_response(False, {"error": "Unauthorized"})
                raise Unauthorized("Unauthorized")

        principal = claims.get("sub", "user")
        ctx = {
            "provider": provider,
            "sub": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "scope": claims.get("scope", ""),
        }

        # HTTP API v2 simple response
        if event.get("version") == "2.0" and "routeKey" in event:
            _dbg("auth_allow_httpapi", principal=principal, **req_meta)
            return _httpapi_simple_response(True, ctx)

        # REST authorizer policy response
        method_arn = event.get("methodArn", "*")
        _dbg("auth_allow_rest", principal=principal, methodArn=method_arn, **req_meta)
        return _allow_policy(principal, method_arn, ctx)

    except Exception as e:
        _dbg("auth_exception", error_type=type(e).__name__, error=str(e), **req_meta)
        if event.get("version") == "2.0" and "routeKey" in event:
            return _httpapi_simple_response(False, {"error": "Unauthorized"})
        raise Unauthorized("Unauthorized")
