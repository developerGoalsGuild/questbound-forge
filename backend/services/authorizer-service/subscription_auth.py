from __future__ import annotations

import logging
import os
from functools import lru_cache
import base64
import json
from typing import Any, Dict

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from security import verify_local_jwt
from cognito import verify_cognito_jwt

logger = logging.getLogger('subscription_auth')
logger.setLevel(logging.INFO)

_dynamodb = boto3.resource('dynamodb')
_core_table = None  # Lazily initialised so local tests do not hit SSM

class UnauthorizedError(Exception):
    """Raised when the subscription request is not authorized."""

@lru_cache(maxsize=1)
def _settings():
    from ssm import settings  # Imported lazily to avoid SSM lookups in tests
    return settings

@lru_cache(maxsize=1)
def _resolve_core_table_name() -> str:
    for env_key in ("CORE_TABLE_NAME", "GG_CORE_TABLE", "CORE_TABLE"):
        val = os.getenv(env_key)
        if val:
            return val
    try:
        return _settings().core_table_name
    except Exception as exc:  # pragma: no cover - config error surface
        logger.error("core_table_name_unavailable", exc_info=True)
        raise UnauthorizedError("Configuration missing") from exc


@lru_cache(maxsize=1)
def _resolve_guild_table_name() -> str:
    for env_key in ("GUILD_TABLE_NAME", "GG_GUILD_TABLE", "GUILD_TABLE"):
        val = os.getenv(env_key)
        if val:
            return val
    # Default to gg_guild if not configured
    return "gg_guild"


def _get_core_table():
    global _core_table
    if _core_table is None:
        table_name = _resolve_core_table_name()
        _core_table = _dynamodb.Table(table_name)
    return _core_table


_guild_table = None  # Lazily initialised so local tests do not hit SSM


def _get_guild_table():
    global _guild_table
    if _guild_table is None:
        table_name = _resolve_guild_table_name()
        _guild_table = _dynamodb.Table(table_name)
    return _guild_table


def _decode_b64_dict(value: str | None) -> Dict[str, Any]:
    if not value:
        return {}
    try:
        padded = value + ("=" * ((4 - len(value) % 4) % 4))
        raw = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _extract_token_from_headers(headers: Dict[str, Any] | None) -> str:
    if not headers:
        return ""
    raw = headers.get("authorization") or headers.get("Authorization") or ""
    if not isinstance(raw, str):
        return ""
    token = raw.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    return token


def _extract_token_from_event(event: Dict[str, Any]) -> str:
    payload = event.get("payload") or {}
    token = _extract_token_from_headers(payload.get("headers"))
    if token:
        return token

    # AppSync real-time connections may base64-encode headers or payload in query params
    header_param = payload.get("header") or payload.get("Header") or event.get("header") or event.get("Header")
    token = _extract_token_from_headers(_decode_b64_dict(header_param))
    if token:
        return token

    qs = event.get("queryStringParameters") or {}
    token = _extract_token_from_headers(_decode_b64_dict(qs.get("header") or qs.get("Header")))
    if token:
        return token

    token = _extract_token_from_headers(_decode_b64_dict(qs.get("payload") or qs.get("Payload")))
    if token:
        return token

    # Fallback to top-level headers if provided
    return _extract_token_from_headers(event.get("headers"))

def _extract_api_key(headers: Dict[str, Any]) -> str:
    if not headers:
        return ''
    for key in ("x-api-key", "X-Api-Key", "x-api_key"):
        if headers.get(key):
            return str(headers[key]).strip()
    return ''


def _is_guild_member(room_id: str, user_id: str) -> bool:
    if not room_id or not room_id.startswith('GUILD#'):
        return True
    
    # Extract guild_id from room_id (format: GUILD#{guild_id})
    guild_id = room_id.replace('GUILD#', '')
    if not guild_id:
        logger.warning('Empty guild_id extracted from room_id', extra={'room_id': room_id})
        return False
    
    try:
        # Query gg_guild table (not gg_core) with correct keys
        table = _get_guild_table()
        resp = table.get_item(
            Key={'PK': f'GUILD#{guild_id}', 'SK': f'MEMBER#{user_id}'},
            ConsistentRead=True,
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error('guild membership lookup failed', extra={'room_id': room_id, 'guild_id': guild_id, 'user_id': user_id}, exc_info=True)
        raise UnauthorizedError('Unable to verify guild membership') from exc

    if 'Item' not in resp:
        logger.info('Guild membership check failed', extra={'room_id': room_id, 'guild_id': guild_id, 'user_id': user_id})
        return False
    
    # Check if member is active (not removed)
    item = resp['Item']
    status = item.get('status', 'active')
    if status != 'active':
        logger.info('Guild member is not active', extra={'room_id': room_id, 'guild_id': guild_id, 'user_id': user_id, 'status': status})
        return False
    
    return True


def _verify_availability_key(headers: Dict[str, Any]) -> Dict[str, Any]:
    presented = _extract_api_key(headers)
    if not presented:
        logger.warning('Availability request missing API key')
        raise UnauthorizedError('API key required')
    try:
        expected = _settings().appsync_availability_key
    except Exception as exc:  # pragma: no cover - configuration errors
        logger.error('availability_key_unavailable', exc_info=True)
        raise UnauthorizedError('Configuration missing') from exc

    if presented != expected:
        logger.warning('Availability API key mismatch', extra={'token_len': len(presented)})
        raise UnauthorizedError('Invalid API key')
    return {'ok': True}


def handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    payload = event.get('payload') or {}
    headers = payload.get('headers') or event.get('headers') or {}
    arguments = payload.get('arguments') or event.get('arguments') or {}
    room_id = payload.get('roomId') or arguments.get('roomId')
    mode = str(payload.get('mode') or event.get('mode') or 'subscription').lower()

    if mode == 'availability':
        return _verify_availability_key(headers)

    token = _extract_token_from_event(event)
    if not token:
        logger.warning('Missing authorization token for subscription', extra={'room_id': room_id})
        raise UnauthorizedError('Authorization token required')

    claims: Dict[str, Any] | None = None
    provider = "local"
    try:
        claims = verify_local_jwt(token)
    except Exception as e_local:  # noqa: BLE001
        try:
            claims = verify_cognito_jwt(token)
            provider = "cognito"
        except Exception as e_cognito:
            logger.warning(
                'JWT verification failed for subscription',
                extra={'room_id': room_id},
                exc_info=True,
            )
            raise UnauthorizedError('Invalid or expired token') from e_cognito

    if not isinstance(claims, dict):
        logger.warning('JWT verification produced non-dict claims', extra={'room_id': room_id})
        raise UnauthorizedError('Invalid or expired token')

    user_id = claims.get('sub')
    if not user_id:
        logger.warning('JWT missing sub claim', extra={'room_id': room_id})
        raise UnauthorizedError('Malformed token')

    if not _is_guild_member(room_id, user_id):
        raise UnauthorizedError('Guild membership required')

    return {
        'sub': user_id,
        'claims': claims,
        'roomId': room_id,
        'provider': provider,
    }
