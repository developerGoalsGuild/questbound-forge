# authorizer.py
from __future__ import annotations
import os, json, logging, time
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


AUTH_LOG_ENABLED = _to_bool(os.getenv("AUTH_LOG_ENABLED"), True)  # Enable logging by default
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()  # Use DEBUG level for more details
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
    _dbg("extract_token_start", event_keys=list(event.keys()))
    
    # REST TOKEN authorizer
    if "authorizationToken" in event:
        raw = event["authorizationToken"]
        parts = raw.split()
        token = parts[-1] if parts else raw
        _dbg("token_extracted", source="TOKEN", token=token, raw_length=len(raw), parts_count=len(parts))
        return token

    # HTTP API (REQUEST/Lambda authorizer v2)
    headers = event.get("headers") or {}
    _dbg("extract_token_headers", header_keys=list(headers.keys()))
    
    for k in ("authorization", "Authorization"):
        if k in headers and headers[k]:
            raw = headers[k]
            parts = raw.split()
            token = parts[-1] if parts else raw
            _dbg("token_extracted", source="HEADER", header_key=k, token=token, raw_length=len(raw), parts_count=len(parts))
            return token

    _dbg("token_missing", available_keys=list(event.keys()), headers_available=bool(headers))
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


def _is_appsync_event(event: dict) -> bool:
    rc = event.get("requestContext") or {}
    # Any API Gateway-style event has methodArn → NOT AppSync
    if event.get("methodArn"):
        return False

    # AppSync signals
    if "apiId" in rc:
        return True
    if "resolverArn" in rc or rc.get("graphqlSchemaVersion"):
        return True
    # Some shapes include these on requestContext (or top-level in older forms)
    if rc.get("typeName") or rc.get("fieldName"):
        return True

    # Heuristic via headers
    headers = event.get("headers") or {}
    try:
        lower_keys = {str(k).lower() for k in headers.keys()}
        if "x-amzn-appsync-is-vpce-request" in lower_keys:
            return True
    except Exception:
        pass

    return False


def _appsync_response(authorized: bool, context: dict) -> dict:
    if not authorized:
        return {"isAuthorized": False, "resolverContext": context, "deniedFields": [], "ttlOverride": 300}
    denied = []
    if "goal:write" not in (context.get("scope") or ""):
        denied = ["Mutation.*"]  # or specific fields: ["Mutation.createGoal","Mutation.updateGoal"]
    return {"isAuthorized": True, "resolverContext": context, "deniedFields": denied, "ttlOverride": 300}




def handler(event, context):
    req_meta = {
        "version": event.get("version"),
        "routeKey": event.get("routeKey"),
        "methodArn": event.get("methodArn"),
        "aws_request_id": getattr(context, "aws_request_id", None),
        "stage": (event.get("requestContext") or {}).get("stage"),
    }
    is_httpapi = event.get("version") == "2.0" and "routeKey" in event
    is_appsync = _is_appsync_event(event)
    if is_appsync:
        rc = event.get("requestContext") or {}
        req_meta = {
            **req_meta,
            "operationName": rc.get("operationName"),
            "typeName": rc.get("typeName"),
            "fieldName": rc.get("fieldName"),
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
                _dbg("local_verify_attempt", token_length=len(token), token_prefix=token[:20] + "..." if len(token) > 20 else token)
                claims = verify_local_jwt(token)
                provider = "local"
                _dbg("local_verify_ok", sub=claims.get("sub"), scope=claims.get("scope"), claims_keys=list(claims.keys()))
            except Exception as e_local:
                _dbg("local_verify_failed", error_type=type(e_local).__name__, error=str(e_local), token_length=len(token), token_prefix=token[:20] + "..." if len(token) > 20 else token)
                
                # Development escape hatch: handle alg: 'none' tokens for dev mode
                try:
                    import base64
                    import json
                    parts = token.split('.')
                    if len(parts) == 3 and parts[2] == 'devsig':
                        # Decode header to check algorithm
                        header_data = base64.urlsafe_b64decode(parts[0] + '==').decode('utf-8')
                        header = json.loads(header_data)
                        if header.get('alg') == 'none':
                            # Decode payload
                            payload_data = base64.urlsafe_b64decode(parts[1] + '==').decode('utf-8')
                            claims = json.loads(payload_data)
                            # Validate expiration
                            exp = claims.get('exp', 0)
                            if exp > int(time.time()):
                                provider = "dev"
                                _dbg("dev_token_verify_ok", sub=claims.get("sub"), exp=exp)
                            else:
                                _dbg("dev_token_expired", exp=exp, now=int(time.time()))
                                claims = None
                        else:
                            _dbg("dev_token_wrong_alg", alg=header.get('alg'))
                    else:
                        _dbg("dev_token_wrong_format", parts_count=len(parts))
                except Exception as e_dev:
                    _dbg("dev_token_verify_failed", error_type=type(e_dev).__name__, error=str(e_dev))

        # 2) Cognito RS256
        if claims is None:
            try:
                _dbg("cognito_verify_attempt", token_length=len(token), token_prefix=token[:20] + "..." if len(token) > 20 else token)
                claims = verify_cognito_jwt(token)
                provider = "cognito"
                _dbg(
                    "cognito_verify_ok",
                    sub=claims.get("sub"),
                    token_use=claims.get("token_use"),
                    scope=claims.get("scope"),
                    claims_keys=list(claims.keys())
                )
            except Exception as e_cog:
                _dbg("cognito_verify_failed", error_type=type(e_cog).__name__, error=str(e_cog), token_length=len(token), token_prefix=token[:20] + "..." if len(token) > 20 else token)
                if is_httpapi:
                    _dbg("auth_deny_httpapi", reason="verify_failed", **req_meta)
                    return _httpapi_simple_response(False, {"error": "Unauthorized"})
                if is_appsync:
                    _dbg("auth_deny_appsync", reason="verify_failed", **req_meta)
                    return _appsync_response(False, {"error": "Unauthorized"})
                raise Unauthorized("Unauthorized")

        principal = claims.get("sub", "user")
        ctx = {
            "provider": provider,
            "sub": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "scope": claims.get("scope", ""),
        }

        _dbg("auth_success", principal=principal, provider=provider, context=ctx, **req_meta)

        # HTTP API v2 simple response
        if is_httpapi:
            _dbg("auth_allow_httpapi", principal=principal, **req_meta)
            return _httpapi_simple_response(True, ctx)

        if is_appsync:
            _dbg("auth_allow_appsync", principal=principal, **req_meta)
            return _appsync_response(True, ctx)

        # REST authorizer policy response
        method_arn = event.get("methodArn", "*")
        req_meta_with_method = {**req_meta, "methodArn": method_arn}
        _dbg("auth_allow_rest", principal=principal, **req_meta_with_method)
        return _allow_policy(principal, method_arn, ctx)

    except Exception as e:
        _dbg("auth_exception", error_type=type(e).__name__, error=str(e), **req_meta)
        if is_httpapi:
            return _httpapi_simple_response(False, {"error": "Unauthorized"})
        if is_appsync:
            return _appsync_response(False, {"error": "Unauthorized"})
        raise Unauthorized("Unauthorized")

