from __future__ import annotations
import time, uuid, logging, json
from typing import Optional
import boto3
from boto3.dynamodb.conditions import Key, Attr
from .ssm import settings

logger = logging.getLogger("auth")
if not logger.handlers:
    logger.setLevel(logging.INFO)
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(_h)

ddb = boto3.resource("dynamodb")
_table = ddb.Table(settings.ddb_login_attempts_table)

MONTH_SECONDS = 30 * 24 * 3600


def _now() -> int:
    return int(time.time())


def record_attempt(email: str, success: bool, ip: str = "", ua: str = "", reason: str = "") -> None:
    ts = _now()
    item = {
        "pk": f"USER#{email.lower()}",
        "ts": ts,
        "ttl": ts + MONTH_SECONDS,
        "success": success,
        "ip": ip[:256],
        "ua": ua[:512],
        "reason": reason[:128],
        "request_id": str(uuid.uuid4()),
    }
    _table.put_item(Item=item)
    try:
        logger.info(json.dumps({
            "event":"login_attempt",
            "email": email,
            "success": success,
            "reason": reason,
            "ip": ip,
            "ua": ua,
            "ts": ts
        }))
    except Exception:
        pass


def failed_count_last_month(email: str) -> int:
    cutoff = _now() - MONTH_SECONDS
    resp = _table.query(
        KeyConditionExpression=Key("pk").eq(f"USER#{email.lower()}") & Key("ts").gt(cutoff),
        FilterExpression=Attr("success").eq(False),
        ProjectionExpression="#ts, success",
        ExpressionAttributeNames={"#ts": "ts"},
        ReturnConsumedCapacity="TOTAL",
    )
    return len(resp.get("Items", []))