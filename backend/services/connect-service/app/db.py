from __future__ import annotations

import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.conditions import Attr

from .settings import get_settings

_settings = get_settings()
_dynamodb = boto3.resource("dynamodb", region_name=_settings.aws_region)
_table = _dynamodb.Table(_settings.dynamodb_table_name)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _ttl_epoch_seconds(minutes: int) -> int:
    return int((datetime.now(timezone.utc) + timedelta(minutes=minutes)).timestamp())


def put_connect_profile(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"CONNECT_PROFILE#{user_id}",
        "type": "ConnectProfile",
        "userId": user_id,
        **payload,
        "updatedAt": _now_iso(),
    }
    # DynamoDB does not allow None
    item = {k: v for k, v in item.items() if v is not None}
    _table.put_item(Item=item)
    return item


def get_connect_profile(user_id: str) -> dict[str, Any] | None:
    resp = _table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"CONNECT_PROFILE#{user_id}"})
    return resp.get("Item")


def create_session(user_id: str, session_id: str, expires_in_minutes: int = 30) -> dict[str, Any]:
    expires_at = _ttl_epoch_seconds(expires_in_minutes)
    item = {
        "PK": f"CONNECT_SESSION#{session_id}",
        "SK": f"CONNECT_SESSION#{session_id}",
        "type": "ConnectSession",
        "sessionId": session_id,
        "userId": user_id,
        "status": "OPEN",
        "coreAnswers": {},
        "followupQAs": [],
        "createdAt": _now_iso(),
        "expiresAt": expires_at,
    }
    _table.put_item(Item=item)
    return item


def get_session(session_id: str) -> dict[str, Any] | None:
    resp = _table.get_item(Key={"PK": f"CONNECT_SESSION#{session_id}", "SK": f"CONNECT_SESSION#{session_id}"})
    return resp.get("Item")


def update_session_answers(session_id: str, *, core_answers: dict[str, Any] | None, followup_qas: list[dict[str, Any]] | None, status: str | None = None) -> dict[str, Any]:
    session = get_session(session_id)
    if not session:
        raise KeyError("SESSION_NOT_FOUND")

    if core_answers:
        session["coreAnswers"] = {**(session.get("coreAnswers") or {}), **core_answers}
    if followup_qas:
        # append
        session["followupQAs"] = list(session.get("followupQAs") or []) + list(followup_qas)
    if status:
        session["status"] = status

    _table.put_item(Item=session)
    return session


def put_match_batch(user_id: str, match_batch_id: str, candidates: list[dict[str, Any]], expires_in_minutes: int = 10) -> dict[str, Any]:
    expires_at = _ttl_epoch_seconds(expires_in_minutes)
    item = {
        "PK": f"CONNECT_MATCH_BATCH#{match_batch_id}",
        "SK": f"CONNECT_MATCH_BATCH#{match_batch_id}",
        "type": "ConnectMatchBatch",
        "matchBatchId": match_batch_id,
        "ownerUserId": user_id,
        "candidates": candidates,
        "status": "OPEN",
        "createdAt": _now_iso(),
        "expiresAt": expires_at,
    }
    _table.put_item(Item=item)
    return item


def get_match_batch(match_batch_id: str) -> dict[str, Any] | None:
    resp = _table.get_item(Key={"PK": f"CONNECT_MATCH_BATCH#{match_batch_id}", "SK": f"CONNECT_MATCH_BATCH#{match_batch_id}"})
    return resp.get("Item")


def put_connect_request(
    *,
    request_id: str,
    to_user_id: str,
    from_user_id: str,
    match_batch_id: str,
    suggested_first_message: str,
    expires_in_minutes: int = 60,
) -> dict[str, Any]:
    expires_at = _ttl_epoch_seconds(expires_in_minutes)
    item = {
        "PK": f"USER#{to_user_id}",
        "SK": f"CONNECT_REQUEST#{request_id}",
        "type": "ConnectRequest",
        "requestId": request_id,
        "toUserId": to_user_id,
        "fromUserId": from_user_id,
        "matchBatchId": match_batch_id,
        "suggestedFirstMessage": suggested_first_message,
        "status": "PENDING",
        "createdAt": _now_iso(),
        "expiresAt": expires_at,
    }
    _table.put_item(Item=item)
    return item


def list_connect_requests(to_user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    # Simple Query on PK; Connect requests are stored under USER#{to_user_id}
    resp = _table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{to_user_id}") & Key("SK").begins_with("CONNECT_REQUEST#"),
        Limit=limit,
    )
    return resp.get("Items") or []


def get_connect_request(to_user_id: str, request_id: str) -> dict[str, Any] | None:
    resp = _table.get_item(Key={"PK": f"USER#{to_user_id}", "SK": f"CONNECT_REQUEST#{request_id}"})
    return resp.get("Item")


def update_connect_request(to_user_id: str, request: dict[str, Any]) -> dict[str, Any]:
    _table.put_item(Item=request)
    return request


def stable_dm_room_id(user_a: str, user_b: str) -> str:
    first, second = sorted([user_a, user_b])
    return f"ROOM-dm-{first}-{second}"


def scan_opted_in_profiles(*, exclude_user_id: str, limit: int = 100) -> list[dict[str, Any]]:
    """MVP: scan table for opted-in connect profiles.

    This can be replaced with a GSI later; for now we cap the result size.
    """
    resp = _table.scan(
        FilterExpression=Attr("type").eq("ConnectProfile") & Attr("isOptedIn").eq(True),
        Limit=limit + 20,  # buffer for excluding self
    )
    items = resp.get("Items") or []
    out: list[dict[str, Any]] = []
    for it in items:
        uid = str(it.get("userId") or "")
        if not uid or uid == exclude_user_id:
            continue
        out.append(it)
        if len(out) >= limit:
            break
    return out


def endpoint_hash(endpoint: str) -> str:
    return hashlib.sha256(endpoint.encode("utf-8")).hexdigest()[:24]


def upsert_webpush_subscription(user_id: str, subscription: dict[str, Any]) -> dict[str, Any]:
    endpoint = str(subscription.get("endpoint") or "")
    if not endpoint:
        raise ValueError("Missing subscription.endpoint")

    keys = subscription.get("keys") or {}
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"WEBPUSH_SUB#{endpoint_hash(endpoint)}",
        "type": "WebPushSubscription",
        "endpoint": endpoint,
        "keys": keys,
        "updatedAt": _now_iso(),
        "createdAt": _now_iso(),
    }
    _table.put_item(Item=item)
    return item



