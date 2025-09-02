from __future__ import annotations
import os, json
from typing import Any, Dict

# Local JWT
from security import verify_local_jwt
# Cognito JWT
from cognito import verify_cognito_jwt

class Unauthorized(Exception):
    pass


def _extract_token(event: dict) -> str:
    # REST TOKEN authorizer
    if "authorizationToken" in event:
        return event["authorizationToken"].split(" ")[-1]
    # REQUEST/HTTP API
    headers = event.get("headers") or {}
    for k in ("authorization", "Authorization"):
        if k in headers:
            return headers[k].split(" ")[-1]
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
    try:
        token = _extract_token(event)
        claims = None
        provider = None
        try:
            claims = verify_local_jwt(token)
            provider = "local"
        except Exception:
            claims = verify_cognito_jwt(token)
            provider = "cognito"

        principal = claims.get("sub", "user")
        ctx = {
            "provider": provider,
            "sub": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "scope": claims.get("scope", ""),
        }

        # HTTP API simple response?
        if event.get("version") == "2.0" and "routeKey" in event:
            return _httpapi_simple_response(True, ctx)

        # REST policy response
        method_arn = event.get("methodArn", "*")
        return _allow_policy(principal, method_arn, ctx)

    except Exception as e:
        # HTTP API simple deny
        if event.get("version") == "2.0" and "routeKey" in event:
            return _httpapi_simple_response(False, {"error": "Unauthorized"})
        raise Unauthorized("Unauthorized")