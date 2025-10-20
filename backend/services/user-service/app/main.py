from __future__ import annotations

import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config

from fastapi import Depends, FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.exceptions import RequestValidationError

from pydantic import BaseModel, ValidationError

_SERVICES_DIR = Path(__file__).resolve().parents[2]
if str(_SERVICES_DIR) not in sys.path:
    sys.path.append(str(_SERVICES_DIR))

from common.logging import get_structured_logger, log_event

from .models import (
    ConfirmEmailResponse,
    PasswordChangeRequest,
    SendTempPassword,
    SignupLocal,
    SignupGoogle,
    LoginLocal,
    TokenResponse,
    PublicUser,
    UserProfile,
    ProfileUpdate,
)
from .ssm import settings
from .security import (
    generate_secure_password,
    hash_password,
    verify_local_jwt,
    verify_password,
    issue_local_jwt,
    validate_password_strength,
)
from .cognito import exchange_auth_code_for_tokens, verify_cognito_jwt
from .attempts import record_attempt, failed_count_last_month
from .ses_email import send_email
from .tokens import TokenPurpose, decode_link_token, issue_link_token

# Configure AWS SDK for optimal Lambda performance
AWS_CONFIG = Config(
    # Enable HTTP keep-alive for better connection reuse
    max_pool_connections=50,
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    },
    # Optimize timeouts for Lambda environment
    read_timeout=30,
    connect_timeout=10,
    # Enable keep-alive
    tcp_keepalive=True,
    # Use regional endpoints for better performance
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

# Initialize boto3 session with optimized config
boto3_session = boto3.Session()
dynamodb = boto3_session.resource('dynamodb', config=AWS_CONFIG)
dynamodb_client = boto3_session.client('dynamodb', config=AWS_CONFIG)

# -------------------------
# Constants
# -------------------------
CONFIRM_TTL = 60 * 60 * 24   # 24h
CHANGE_CHALLENGE_TTL = 60 * 10  # 10m
BLOCK_THRESHOLD = 3

# -------------------------
# Logging
# -------------------------
logger = get_structured_logger("user-service", env_flag="USER_LOG_ENABLED", default_enabled=True)



def _mask_email(email: Optional[str]) -> Optional[str]:
    if not email or "@" not in email:
        return email
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        masked = "*" * len(name)
    else:
        masked = name[0] + "*" * (len(name) - 2) + name[-1]
    return f"{masked}@{domain}"



def _safe_event(event: str, **kwargs):
    # NEVER log secrets, passwords or tokens
    if "password" in kwargs:
        kwargs["password"] = "<redacted>"
    if "new_password" in kwargs:
        kwargs["new_password"] = "<redacted>"
    if "current_password" in kwargs:
        kwargs["current_password"] = "<redacted>"
    if "token" in kwargs:
        kwargs["token"] = "<redacted>"
    if "id_token" in kwargs:
        kwargs["id_token"] = "<redacted>"
    if "access_token" in kwargs:
        kwargs["access_token"] = "<redacted>"
    if "refresh_token" in kwargs:
        kwargs["refresh_token"] = "<redacted>"
    log_event(logger, event, **kwargs)


def _detect_conflict(email: Optional[str] = None, nickname: Optional[str] = None) -> dict | None:
    """Return a structured conflict descriptor if email/nickname locks exist.
    Uses the lock items written to `gg_core`:
      - Email lock:  PK = EMAIL#{email}, SK = UNIQUE#USER
      - Nick lock:   PK = NICK#{nickname}, SK = UNIQUE#USER
    """
    try:
        if email:
            r = core.get_item(Key={"PK": f"EMAIL#{email}", "SK": "UNIQUE#USER"})
            if r.get("Item"):
                return {"code": "EMAIL_TAKEN", "field": "email", "message": "Email already in use"}
    except Exception:
        pass
    try:
        if nickname:
            r = core.get_item(Key={"PK": f"NICK#{nickname}", "SK": "UNIQUE#USER"})
            if r.get("Item"):
                return {"code": "NICKNAME_TAKEN", "field": "nickname", "message": "Nickname already in use"}
    except Exception:
        pass
    return None

# -------------------------
# Auth Context & Middleware
# -------------------------

class AuthContext(BaseModel):
    user_id: str
    claims: Dict[str, Any]
    provider: str


async def authenticate(request: Request) -> AuthContext:
    """Authenticate user from JWT token in Authorization header"""
    path = request.url.path if request.url else ""
    client_host = request.client.host if request.client else None
    log_event(
        logger,
        'auth.request_received',
        method=request.method,
        path=path,
        client=client_host,
    )

    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    if not auth_header:
        log_event(logger, 'auth.missing_header', path=path, client=client_host, status=401)
        raise HTTPException(status_code=401, detail="Authorization header required")

    if not auth_header.startswith('Bearer '):
        log_event(logger, 'auth.invalid_format', path=path, client=client_host, status=401)
        raise HTTPException(status_code=401, detail="Authorization header must be Bearer token")

    token = auth_header[7:]  # Remove 'Bearer ' prefix

    # Try local JWT first (for development/testing), then Cognito JWT for production
    try:
        claims = verify_local_jwt(token)
        log_event(logger, 'auth.local_jwt_success', user_id=claims.get('sub'), path=path, client=client_host, status=200)
        return AuthContext(user_id=claims['sub'], claims=claims, provider='local')
    except Exception as e_local:
        try:
            claims = verify_cognito_jwt(token, settings.cognito_user_pool_id, settings.cognito_region, request.url.netloc if request.url else None)
            log_event(logger, 'auth.cognito_jwt_success', user_id=claims.get('sub'), path=path, client=client_host, status=200)
            return AuthContext(user_id=claims['sub'], claims=claims, provider='cognito')
        except Exception as e_cognito:
            log_event(logger, 'auth.jwt_verification_failed', path=path, client=client_host, status=401, local_error=str(e_local), cognito_error=str(e_cognito))
            raise HTTPException(status_code=401, detail="Invalid or expired token")


# -------------------------
# FastAPI app & middleware
# -------------------------
app = FastAPI(title="Goals Guild Serverless Auth API", version="1.0.0")

def _norm_origin(o: Optional[str]) -> Optional[str]:
    if not o:
        return None
    return o.rstrip("/")

# Build a permissive but explicit allowlist to ensure CORS headers are
# present on all responses when coming from known frontends.
_origin_candidates = [
    _norm_origin(getattr(settings, "frontend_base_url", None)),
    _norm_origin(settings.app_base_url),
    _norm_origin(os.getenv("DEV_FRONTEND_ORIGIN", "http://localhost:8080")),
]
_allow_origins = [o for o in _origin_candidates if o]
if not _allow_origins:
    _allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardening: ensure CORS headers on all responses (including errors) when
# the request Origin is allowed. Some adapters or frameworks may occasionally
# omit ACAO on non-2xx responses; this guarantees it for browsers.
@app.middleware("http")
async def _ensure_cors_headers(request: Request, call_next: Callable):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") in _allow_origins:
        # Only set if not already present
        if "access-control-allow-origin" not in response.headers:
            response.headers["access-control-allow-origin"] = origin
        if "access-control-allow-credentials" not in response.headers:
            response.headers["access-control-allow-credentials"] = "true"
        # Ensure caches vary by Origin
        vary = response.headers.get("vary") or ""
        if "Origin" not in vary.split(","):
            response.headers["vary"] = ", ".join([v for v in [vary.strip(", ") or None, "Origin"] if v])
    return response

def _client_ip(request: Request) -> str:
    xfwd = request.headers.get("x-forwarded-for")
    if xfwd:
        return xfwd.split(",")[0].strip()
    return request.client.host if request.client else ""

def _correlation_id(request: Request) -> str:
    return (
        request.headers.get("x-correlation-id")
        or request.headers.get("x-request-id")
        or str(uuid.uuid4())
    )

@app.middleware("http")
async def access_log_middleware(request: Request, call_next: Callable):
    cid = _correlation_id(request)
    t0 = time.time()
    _safe_event(
        "request.start",
        cid=cid,
        method=request.method,
        path=request.url.path,
        query=dict(request.query_params),
        ip=_client_ip(request),
        ua=request.headers.get("user-agent", ""),
    )
    try:
        response = await call_next(request)
        dt = int((time.time() - t0) * 1000)
        _safe_event(
            "request.end",
            cid=cid,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            dur_ms=dt,
        )
        response.headers["x-correlation-id"] = cid
        return response
    except Exception as e:
        dt = int((time.time() - t0) * 1000)
        logger.error(
            "request.error",
            extra={
                "cid": cid,
                "method": request.method,
                "path": request.url.path,
                "dur_ms": dt,
            },
            exc_info=True,
        )
        # Let the global exception handlers render the response
        raise

# -------------------------
# Global exception handlers
# -------------------------
@app.exception_handler(RequestValidationError)
async def _handle_request_validation(_: Request, exc: RequestValidationError):
    logger.warning("validation.request ", extra={"errors": exc.errors()})
    return JSONResponse(status_code=400, content={"detail": exc.errors()})

@app.exception_handler(ValidationError)
async def _handle_pydantic_validation(_: Request, exc: ValidationError):
    logger.warning("validation.model ", extra={"errors": exc.errors()})
    return JSONResponse(status_code=400, content={"detail": exc.errors()})

@app.exception_handler(HTTPException)
async def _handle_http_exc(_: Request, exc: HTTPException):
    logger.info("http.exception", extra={"status": exc.status_code, "detail": exc.detail})
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def _handle_unexpected(_: Request, exc: Exception):
    logger.error("unhandled.exception", extra={"type": type(exc).__name__}, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# -------------------------
# AWS resources (with logging)
# -------------------------
def _ddb() -> boto3.resources.base.ServiceResource:
    try:
        return dynamodb  # Use the pre-configured optimized resource
    except Exception as e:
        logger.error("dynamodb.init_error", exc_info=True)
        raise

ddb = _ddb()
users = ddb.Table(settings.ddb_users_table)
core = ddb.Table(settings.core_table_name)

# -------------------------
# Small retry helper for DDB calls that may transiently fail
# -------------------------
def _ddb_call(fn: Callable, *, op: str, max_retries: int = 2, **kwargs):
    attempt = 0
    while True:
        core_profile_created = False
        try:
            return fn(**kwargs)
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            msg = e.response.get("Error", {}).get("Message")
            logger.warning("ddb.client_error.", extra={"op": op, "code": code, "message": msg, "attempt": attempt})
            # Conditional checks & validation shouldn't retry
            if code in {"ConditionalCheckFailedException", "ValidationException"} or attempt >= max_retries:
                raise
        except BotoCoreError as e:
            logger.warning("ddb.boto_error", extra={"op": op, "type": type(e).__name__, "attempt": attempt})
            if attempt >= max_retries:
                raise
        except Exception:
            logger.error("ddb.unknown_error", extra={"op": op, "attempt": attempt}, exc_info=True)
            if attempt >= max_retries:
                raise
        attempt += 1
        time.sleep(0.2 * attempt)

# -------------------------
# Routes
# -------------------------
@app.get("/health")
def healthz():
    return {"ok": True, "time": int(time.time())}

# --- SIGNUP (LOCAL) — send confirmation email ---
@app.post("/users/signup", response_model=None)
def signup(payload: dict, request: Request):
    provider = payload.get("provider")
    client_ip = _client_ip(request)
    ua = request.headers.get("user-agent", "")
    cid = request.headers.get("x-correlation-id") or request.headers.get("x-request-id")

    if provider == "local":
        try:
            body = SignupLocal(**payload)
            validate_password_strength(body.password)
        except ValidationError as ve:
            _safe_event("signup.local.validation_error", cid=cid, errors=ve.errors())
            raise HTTPException(status_code=400, detail=ve.errors())
        except ValueError as ve:
            _safe_event("signup.local.password_weak", cid=cid, reason=str(ve))
            raise HTTPException(status_code=400, detail=str(ve))

        email = body.email.lower()
        user_id = str(uuid.uuid4())
        password_hash = hash_password(body.password)
        ts = int(time.time())
        nickname = (payload.get("nickname") or "").strip()
        full_name = (payload.get("fullName") or payload.get("name") or "").strip()
        country = (payload.get("country") or "").strip().upper()
        birth_date = (payload.get("birthDate") or "").strip()
        language = payload.get("language") or "en"
        gender = payload.get("gender") or ""
        pronouns = payload.get("pronouns") or ""
        bio = payload.get("bio") or ""
        tags = payload.get("tags") or []
        status = payload.get("status") or "email confirmation pending"

        # Country allow-list
        if country:
            allowed_countries = {"US","CA","MX","BR","AR","CL","CO","PE","VE","UY","PY","BO","EC","GT","CR","PA","DO","CU","HN","NI","SV","JM","TT",
                "GB","IE","FR","DE","ES","PT","IT","NL","BE","LU","CH","AT","DK","SE","NO","FI","IS","PL","CZ","SK","HU","RO","BG","GR","HR","SI","RS","BA","MK","AL","ME","UA","BY","LT","LV","EE","MD","TR","CY","MT","RU",
                "CN","JP","KR","IN","PK","BD","LK","NP","BT","MV","TH","MY","SG","ID","PH","VN","KH","LA","MM","BN","TL",
                "AE","SA","QA","BH","KW","OM","YE","IR","IQ","JO","LB","SY","IL","PS","AF","KZ","KG","UZ","TM","TJ","MN",
                "AU","NZ","PG","FJ","SB","VU","WS","TO","TV","KI","FM","MH","NR","PW",
                "EG","MA","DZ","TN","LY","SD","SS","ET","ER","DJ","SO","KE","UG","TZ","RW","BI","CD","CG","GA","GQ","CM","NG","GH","CI","SN","ML","BF","NE","BJ","TG","GM","GN","GW","SL","LR","MR","EH","AO","ZM","ZW","MW","MZ","NA","BW","SZ","LS","MG","MU","SC","CV","ST","KM"}
            if country not in allowed_countries:
                _safe_event("signup.local.invalid_country", cid=cid, email=_mask_email(email), country=country)
                raise HTTPException(status_code=400, detail="invalid country")

        # Birthdate sanity
        if birth_date:
            try:
                y, m, d = map(int, birth_date.split("-"))
            except Exception:
                raise HTTPException(status_code=400, detail="invalid birthDate format,  expected YYYY-MM-DD")
            if not (1 <= m <= 12 and 1 <= d <= 31 and y > 1900):
                raise HTTPException(status_code=400, detail="invalid birthDate")
            now_iso = time.strftime("%Y-%m-%d", time.gmtime())
            cy, cm, cd = map(int, now_iso.split("-"))
            cutoff_y = cy - 1
            if y > cutoff_y or (y == cutoff_y and (m > cm or (m == cm and d > cd))):
                raise HTTPException(status_code=400, detail="birthDate too recent.")

        # Local auth data is stored within the core profile; no separate users table writes

        # Create core email lock + (optional) nickname lock + profile atomically
        # Best practice: transact to avoid partial writes under race conditions
        core_profile_created = False
        try:
            # ISO-8601 timestamps (UTC) for core table consistency
            created_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts))
            updated_at_iso = created_at_iso
            profile_item = {
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
                "type": "User",
                "id": user_id,
                "email": email,
                "role": body.role,
                "fullName": full_name,
                "birthDate": birth_date or None,
                "status": status,
                "country": country,
                "language": language,
                "gender": gender,
                "pronouns": pronouns,
                "bio": bio,
                "tags": tags if isinstance(tags, list) else [],
                "tier": "free",
                # local auth fields
                "provider": "local",
                "password_hash": password_hash,
                "email_confirmed": False,
                # GSI3: email lookup
                "GSI3PK": f"EMAIL#{email}",
                "GSI3SK": f"PROFILE#{user_id}",
                # GSI1: user-owned listing/timeline
                "GSI1PK": f"USER#{user_id}",
                "GSI1SK": f"ENTITY#User#{created_at_iso}",
                "createdAt": created_at_iso,
                "updatedAt": updated_at_iso,
            }

            # Only set nickname keys if a valid nickname was provided
            def _valid_nickname(n: str) -> bool:
                if not n:
                    return False
                n = n.strip()
                if len(n) < 3 or len(n) > 32:
                    return False
                # Alphanumeric, underscore and hyphen
                import re
                return re.fullmatch(r"[A-Za-z0-9_\-]+", n) is not None

            transact_items = [
                {
                    "Put": {
                        "TableName": settings.core_table_name,
                        "Item": {
                            "PK": {"S": f"EMAIL#{email}"},
                            "SK": {"S": "UNIQUE#USER"},
                            "type": {"S": "EmailUnique"},
                            "email": {"S": email},
                            "userId": {"S": user_id},
                            "createdAt": {"S": created_at_iso},
                        },
                        "ConditionExpression": "attribute_not_exists(PK)",
                    }
                },
                {
                    "Put": {
                        "TableName": settings.core_table_name,
                        "Item": {k: ( {"S": v} if isinstance(v, str) else {"N": str(v)} ) for k, v in profile_item.items() if v is not None and k not in {"tags"}}
                        | {"tags": {"L": [{"S": t} for t in (tags if isinstance(tags, list) else [])]}},
                        "ConditionExpression": "attribute_not_exists(PK)",
                    }
                },
            ]

            if _valid_nickname(nickname):
                # Add nickname lock + profile nickname/GSIs
                profile_item["nickname"] = nickname
                profile_item["GSI2PK"] = f"NICK#{nickname}"
                profile_item["GSI2SK"] = f"PROFILE#{user_id}"

                transact_items.insert(1, {
                    "Put": {
                        "TableName": settings.core_table_name,
                        "Item": {
                            "PK": {"S": f"NICK#{nickname}"},
                            "SK": {"S": "UNIQUE#USER"},
                            "type": {"S": "NicknameUnique"},
                            "nickname": {"S": nickname},
                            "userId": {"S": user_id},
                            "createdAt": {"S": created_at_iso},
                        },
                        "ConditionExpression": "attribute_not_exists(PK)",
                    }
                })

                # Update the profile put item to include nickname keys
                # (Rebuild the dict to include these attributes)
                transact_items[-1]["Put"]["Item"] = {k: ( {"S": v} if isinstance(v, str) else {"N": str(v)} ) for k, v in profile_item.items() if v is not None and k not in {"tags"}}
                transact_items[-1]["Put"]["Item"].update({"tags": {"L": [{"S": t} for t in (tags if isinstance(tags, list) else [])]}})

            # Execute transaction (preferred)
            ddb.meta.client.transact_write_items(TransactItems=transact_items)
            core_profile_created = True

        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code in {"ConditionalCheckFailedException"}:
                # Could be email or nickname already in use
                _safe_event("signup.local.core_conflict", cid=cid, email=_mask_email(email), nickname=nickname)
                det = _detect_conflict(email=email, nickname=nickname)
                if not det:
                    det = {"code": "EMAIL_OR_NICKNAME_TAKEN", "message": "Email or nickname already in use"}
                raise HTTPException(status_code=409, detail=det)
            if code in {"TransactionCanceledException", "ValidationException"}:
                # Some local stacks (e.g., moto) do not fully support TransactWriteItems.
                # Fallback to sequential conditional puts with best-effort compensation.
                try:
                    # Email lock
                    _ddb_call(
                        core.put_item,
                        op="core.put_item.email_lock_fallback",
                        Item={
                            "PK": f"EMAIL#{email}",
                            "SK": "UNIQUE#USER",
                            "type": "EmailUnique",
                            "email": email,
                            "userId": user_id,
                            "createdAt": created_at_iso,
                        },
                        ConditionExpression="attribute_not_exists(#pk)",
                        ExpressionAttributeNames={"#pk": "PK"},
                    )

                    # Optional nickname lock
                    if _valid_nickname(nickname):
                        try:
                            _ddb_call(
                                core.put_item,
                                op="core.put_item.nickname_lock_fallback",
                                Item={
                                    "PK": f"NICK#{nickname}",
                                    "SK": "UNIQUE#USER",
                                    "type": "NicknameUnique",
                                    "nickname": nickname,
                                    "userId": user_id,
                                    "createdAt": created_at_iso,
                                },
                                ConditionExpression="attribute_not_exists(#pk)",
                                ExpressionAttributeNames={"#pk": "PK"},
                            )
                            profile_item["nickname"] = nickname
                            profile_item["GSI2PK"] = f"NICK#{nickname}"
                            profile_item["GSI2SK"] = f"PROFILE#{user_id}"
                        except ClientError as ne:
                            # Roll back email lock if nickname fails to keep consistency
                            try:
                                core.delete_item(Key={"PK": f"EMAIL#{email}", "SK": "UNIQUE#USER"})
                            except Exception:
                                logger.warning("fallback.cleanup.email_lock_delete_failed", exc_info=True)
                            ncode = ne.response.get("Error", {}).get("Code")
                            if ncode == "ConditionalCheckFailedException":
                                raise HTTPException(status_code=409, detail={"code": "NICKNAME_TAKEN", "field": "nickname", "message": "Nickname already in use"})
                            raise

                    # Profile item
                    _ddb_call(
                        core.put_item,
                        op="core.put_item.user_profile_fallback",
                        Item=profile_item,
                        ConditionExpression="attribute_not_exists(#pk)",
                        ExpressionAttributeNames={"#pk": "PK"},
                    )
                    core_profile_created = True
                except ClientError as fe:
                    fcode = fe.response.get("Error", {}).get("Code")
                    if fcode == "ConditionalCheckFailedException":
                        det = _detect_conflict(email=email, nickname=nickname)
                        if not det:
                            det = {"code": "EMAIL_OR_NICKNAME_TAKEN", "message": "Email or nickname already in use"}
                        raise HTTPException(status_code=409, detail=det)
                    logger.error("signup.local.core_fallback_error", exc_info=True)
                    raise HTTPException(status_code=500, detail="Could not create profile")
            if not core_profile_created:
                logger.error("signup.local.core_transact_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
        except Exception:
            # Unknown client impl (e.g., moto) – try the same sequential fallback path
            try:
                # Email lock
                _ddb_call(
                    core.put_item,
                    op="core.put_item.email_lock_fallback2",
                    Item={
                        "PK": f"EMAIL#{email}",
                        "SK": "UNIQUE#USER",
                        "type": "EmailUnique",
                        "email": email,
                        "userId": user_id,
                        "createdAt": created_at_iso,
                    },
                    ConditionExpression="attribute_not_exists(#pk)",
                    ExpressionAttributeNames={"#pk": "PK"},
                )

                if _valid_nickname(nickname):
                    try:
                        _ddb_call(
                            core.put_item,
                            op="core.put_item.nickname_lock_fallback2",
                            Item={
                                "PK": f"NICK#{nickname}",
                                "SK": "UNIQUE#USER",
                                "type": "NicknameUnique",
                                "nickname": nickname,
                                "userId": user_id,
                                "createdAt": created_at_iso,
                            },
                            ConditionExpression="attribute_not_exists(#pk)",
                            ExpressionAttributeNames={"#pk": "PK"},
                        )
                        profile_item["nickname"] = nickname
                        profile_item["GSI2PK"] = f"NICK#{nickname}"
                        profile_item["GSI2SK"] = f"PROFILE#{user_id}"
                    except ClientError as ne:
                        try:
                            core.delete_item(Key={"PK": f"EMAIL#{email}", "SK": "UNIQUE#USER"})
                        except Exception:
                            pass
                        ncode = ne.response.get("Error", {}).get("Code")
                        if ncode == "ConditionalCheckFailedException":
                            raise HTTPException(status_code=409, detail={"code": "NICKNAME_TAKEN", "field": "nickname", "message": "Nickname already in use"})
                        raise

                _ddb_call(
                    core.put_item,
                    op="core.put_item.user_profile_fallback2",
                    Item=profile_item,
                    ConditionExpression="attribute_not_exists(#pk)",
                    ExpressionAttributeNames={"#pk": "PK"},
                )
                core_profile_created = True
            except ClientError as fe2:
                fcode = fe2.response.get("Error", {}).get("Code")
                if fcode == "ConditionalCheckFailedException":
                    det = _detect_conflict(email=email, nickname=nickname)
                    if not det:
                        det = {"code": "EMAIL_OR_NICKNAME_TAKEN", "message": "Email or nickname already in use"}
                    raise HTTPException(status_code=409, detail=det)
                logger.error("signup.local.core_fallback2_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
            except Exception:
                logger.error("signup.local.core_profile_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
        # end core-profile-create block

        # email confirmation token stored on core profile
        try:
            tok = issue_link_token(f"{email}|{user_id}", TokenPurpose.EMAIL_CONFIRM, CONFIRM_TTL)
            _ddb_call(
                core.update_item,
                op="core.update_item.confirm_token",
                Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"},
                UpdateExpression="SET email_confirm_jti=:j, email_confirm_expires_at=:e",
                ExpressionAttributeValues={":j": tok["jti"], ":e": tok["exp"]},
            )
            confirm_link = f"{settings.app_base_url}/confirm-email?token={tok['token']}"
        except Exception:
            logger.error("signup.local.token_issue_or_store_error", exc_info=True)
            raise HTTPException(status_code=500, detail="Could not issue confirmation")

        # send email (best effort)
        try:
            send_email(
                to=email,
                subject="Confirm your email",
                html=f"<p>Welcome!</p><p>Confirm your email by clicking <a href='{confirm_link}'>this link</a> (valid 24h).</p>",
                text=f"Confirm your email: {confirm_link}",
            )
            _safe_event("email_confirmation_sent", cid=cid, email=_mask_email(email), jti=tok.get("jti"))
        except Exception:
            logger.error("signup.local.email_send_error", exc_info=True)

        _safe_event("signup.local.success", cid=cid, email=_mask_email(email), ip=client_ip, ua=ua)
        return {"message": "Signup successful. Please confirm your email to log in."}

    elif provider == "google":
        # OAuth exchange + shadow user upsert
        try:
            body = SignupGoogle(**payload)
        except ValidationError as ve:
            _safe_event("signup.google.validation_error", cid=cid, errors=ve.errors())
            raise HTTPException(status_code=400, detail=ve.errors())

        try:
            tokens = exchange_auth_code_for_tokens(body.authorization_code, body.redirect_uri)
        except Exception:
            logger.error("signup.google.exchange_error", exc_info=True)
            raise HTTPException(status_code=400, detail="Token exchange failed")

        id_token = tokens.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="Token exchange did not return id_token")
        try:
            claims = verify_cognito_jwt(id_token)
        except Exception:
            logger.error("signup.google.jwt_invalid", exc_info=True)
            raise HTTPException(status_code=401, detail="Invalid id_token")

        email = (claims.get("email") or "").lower()
        sub = claims.get("sub")
        display_name = claims.get("name", "")
        now_ts = int(time.time())
        # No separate users table upsert; rely on core profile only

        # Create core email lock + profile (no nickname by default) atomically
        try:
            created_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts))
            profile_item = {
                "PK": f"USER#{sub}",
                "SK": f"PROFILE#{sub}",
                "type": "User",
                "id": sub,
                "email": email or f"unknown+{sub}@example.com",
                "role": "user",
                "fullName": display_name,
                "status": "ACTIVE",
                "tier": "free",
                # GSI3: email lookup
                "GSI3PK": f"EMAIL#{email}" if email else f"EMAIL#unknown+{sub}@example.com",
                "GSI3SK": f"PROFILE#{sub}",
                # GSI1: user-owned listing/timeline
                "GSI1PK": f"USER#{sub}",
                "GSI1SK": f"ENTITY#User#{created_at_iso}",
                "createdAt": created_at_iso,
                "updatedAt": created_at_iso,
            }

            transact_items = [
                {
                    "Put": {
                        "TableName": settings.core_table_name,
                        "Item": {
                            "PK": {"S": (f"EMAIL#{email}" if email else f"EMAIL#unknown+{sub}@example.com")},
                            "SK": {"S": "UNIQUE#USER"},
                            "type": {"S": "EmailUnique"},
                            "email": {"S": (email or f"unknown+{sub}@example.com")},
                            "userId": {"S": sub},
                            "createdAt": {"S": created_at_iso},
                        },
                        "ConditionExpression": "attribute_not_exists(PK)",
                    }
                },
                {
                    "Put": {
                        "TableName": settings.core_table_name,
                        "Item": {k: ( {"S": v} if isinstance(v, str) else {"N": str(v)} ) for k, v in profile_item.items() if v is not None and k not in {"tags"}},
                        "ConditionExpression": "attribute_not_exists(PK)",
                    }
                },
            ]
            ddb.meta.client.transact_write_items(TransactItems=transact_items)
            core_profile_created = True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code in {"ConditionalCheckFailedException"}:
                _safe_event("signup.google.core_conflict", cid=cid, email=_mask_email(email) if email else None, sub=sub)
                raise HTTPException(status_code=409, detail={"code": "EMAIL_TAKEN", "field": "email", "message": "Email already in use"})
            if code in {"TransactionCanceledException", "ValidationException"}:
                # Fallback to sequential conditional puts for local test stacks
                try:
                    # Email lock
                    _ddb_call(
                        core.put_item,
                        op="core.put_item.email_lock_google_fallback",
                        Item={
                            "PK": f"EMAIL#{email}" if email else f"EMAIL#unknown+{sub}@example.com",
                            "SK": "UNIQUE#USER",
                            "type": "EmailUnique",
                            "email": email or f"unknown+{sub}@example.com",
                            "userId": sub,
                            "createdAt": created_at_iso,
                        },
                        ConditionExpression="attribute_not_exists(#pk)",
                        ExpressionAttributeNames={"#pk": "PK"},
                    )
                    # Profile
                    _ddb_call(
                        core.put_item,
                        op="core.put_item.user_profile_google_fallback",
                        Item=profile_item,
                        ConditionExpression="attribute_not_exists(#pk)",
                        ExpressionAttributeNames={"#pk": "PK"},
                    )
                    core_profile_created = True
                except ClientError as fe:
                    fcode = fe.response.get("Error", {}).get("Code")
                    if fcode == "ConditionalCheckFailedException":
                        raise HTTPException(status_code=409, detail={"code": "EMAIL_TAKEN", "field": "email", "message": "Email already in use"})
                    logger.error("signup.google.core_fallback_error", exc_info=True)
                    raise HTTPException(status_code=500, detail="Could not create profile")
            if not core_profile_created:
                logger.error("signup.google.core_transact_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
        except Exception:
            # Unknown error, attempt fallback path as well
            try:
                _ddb_call(
                    core.put_item,
                    op="core.put_item.email_lock_google_fallback2",
                    Item={
                        "PK": f"EMAIL#{email}" if email else f"EMAIL#unknown+{sub}@example.com",
                        "SK": "UNIQUE#USER",
                        "type": "EmailUnique",
                        "email": email or f"unknown+{sub}@example.com",
                        "userId": sub,
                        "createdAt": created_at_iso,
                    },
                    ConditionExpression="attribute_not_exists(#pk)",
                    ExpressionAttributeNames={"#pk": "PK"},
                )
                _ddb_call(
                    core.put_item,
                    op="core.put_item.user_profile_google_fallback2",
                    Item=profile_item,
                    ConditionExpression="attribute_not_exists(#pk)",
                    ExpressionAttributeNames={"#pk": "PK"},
                )
                core_profile_created = True
            except ClientError as fe2:
                fcode = fe2.response.get("Error", {}).get("Code")
                if fcode == "ConditionalCheckFailedException":
                    raise HTTPException(status_code=409, detail={"code": "EMAIL_TAKEN", "field": "email", "message": "Email already in use"})
                logger.error("signup.google.core_fallback2_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
            except Exception:
                logger.error("signup.google.core_profile_error", exc_info=True)
                raise HTTPException(status_code=500, detail="Could not create profile")
        # end google core-profile-create block

        _safe_event("signup.google.success", cid=cid, email=_mask_email(email) if email else None, sub=sub)
        return {
            "user": PublicUser(user_id=sub, email=email or f"unknown+{sub}@example.com", name=display_name, provider="cognito-google").model_dump(),
            "tokens": {
                "token_type": "Bearer",
                "access_token": tokens.get("access_token"),
                "id_token": id_token,
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in", 3600),
            },
        }

    else:
        _safe_event("signup.invalid_provider", provider=str(provider))
        raise HTTPException(status_code=400, detail="provider must be 'local' or 'google'")

# --- CONFIRM EMAIL ---
@app.get("/users/confirm-email", response_model=ConfirmEmailResponse)
def confirm_email(request: Request, token: str = Query(..., min_length=20)):
    cid = request.headers.get("x-correlation-id") if request else None
    try:
        claims = decode_link_token(token, TokenPurpose.EMAIL_CONFIRM)
    except Exception:
        _safe_event("confirm_email.invalid_or_expired", cid=cid)
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    try:
        subject = claims.get("sub", "")
        email, user_id = subject.split("|", 1)
    except Exception:
        _safe_event("confirm_email.malformed_subject", cid=cid)
        raise HTTPException(status_code=400, detail="Malformed token")

    try:
        resp = _ddb_call(core.get_item, op="core.get_item.confirm_email", Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"})
        item = resp.get("Item")
    except Exception:
        logger.error("confirm_email.ddb_get_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not validate token")

    if not item or (item.get("email") or "").lower() != email.lower():
        _safe_event("confirm_email.subject_mismatch", cid=cid, email=_mask_email(email))
        raise HTTPException(status_code=400, detail="Invalid token subject")

    if item.get("email_confirmed", False):
        return {"message": "Email already confirmed."}

    if item.get("email_confirm_jti") != claims.get("jti"):
        raise HTTPException(status_code=400, detail="Token no longer valid")
    if int(time.time()) > int(item.get("email_confirm_expires_at", 0)):
        raise HTTPException(status_code=400, detail="Token expired")

    try:
        _ddb_call(
            core.update_item,
            op="core.update_item.mark_confirmed",
            Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"},
            UpdateExpression="SET email_confirmed=:t REMOVE email_confirm_jti, email_confirm_expires_at",
            ExpressionAttributeValues={":t": True},
        )
    except Exception:
        logger.error("confirm_email.ddb_update_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not confirm email")

    _safe_event("email_confirmed", cid=cid, email=_mask_email(email))
    return {"message": "Email confirmed. You may now log in."}

# --- LOGIN ENFORCEMENTS ---
@app.post("/users/login", response_model=None)
def login(body: LoginLocal, request: Request):
    email = body.email.lower()
    client_ip = _client_ip(request)
    ua = request.headers.get("user-agent", "")
    cid = request.headers.get("x-correlation-id") or request.headers.get("x-request-id")

    # Load core profile via GSI3 (email)
    try:
        r = core.query(
            IndexName="GSI3",
            KeyConditionExpression="#pk = :v",
            ExpressionAttributeNames={"#pk": "GSI3PK"},
            ExpressionAttributeValues={":v": f"EMAIL#{email}"},
            Limit=1,
        )
    except Exception:
        logger.error("login.core_query_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to process login")

    items = r.get("Items") or []
    item = items[0] if items else None
    if not item or item.get("provider") != "local":
        record_attempt(email, success=False, ip=client_ip, ua=ua, reason="NOT_FOUND_OR_NOT_LOCAL")
        _safe_event("login.not_found_or_not_local", cid=cid, email=_mask_email(email))
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Enforce confirmed email (skip in development)
    if not settings.is_development() and not item.get("email_confirmed", False):
        record_attempt(email, success=False, ip=client_ip, ua=ua, reason="EMAIL_NOT_CONFIRMED")
        _safe_event("login.email_not_confirmed", cid=cid, email=_mask_email(email))
        raise HTTPException(status_code=403, detail="Email not confirmed.")
    elif settings.is_development() and not item.get("email_confirmed", False):
        _safe_event("login.dev_skip_email_confirmation", cid=cid, email=_mask_email(email))

    # Optional: block if too many recent failures
    try:
        failures = failed_count_last_month(email)
        if failures >= BLOCK_THRESHOLD:
            _safe_event("login.blocked_threshold", cid=cid, email=_mask_email(email), failures=failures)
            raise HTTPException(status_code=403, detail="Account temporarily locked due to failed attempts")
    except Exception:
        logger.warning("login.failed_count_error", exc_info=True)

    # Password check
    if not verify_password(body.password, item.get("password_hash", "")):
        record_attempt(email, success=False, ip=client_ip, ua=ua, reason="BAD_PASSWORD")
        _safe_event("login.bad_password", cid=cid, email=_mask_email(email))
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Must-change-password enforcement
    if item.get("must_change_password", False):
        tok = issue_link_token(f"{email}|{item.get('id')}", TokenPurpose.CHANGE_PASSWORD, CHANGE_CHALLENGE_TTL)
        _safe_event("password_change_required", cid=cid, email=_mask_email(email))
        return JSONResponse(status_code=403, content={
            "detail": "Password change required.",
            "challenge_token": tok["token"],
            "expires_in": CHANGE_CHALLENGE_TTL,
        })

    # Success
    user_role = (
        item.get("role")
        or item.get("user_type")
        or "user"
    )
    token = issue_local_jwt(item["id"], email, ttl_seconds=3600, role=user_role,nickname=item.get("nickname"))
    record_attempt(email, success=True, ip=client_ip, ua=ua, reason="OK")
    _safe_event("login.success", cid=cid, email=_mask_email(email), ip=client_ip, ua=ua)
    return TokenResponse(**token).model_dump()  

    user_id = claims.get("sub")
    email = (claims.get("email") or "").lower()
    role = (claims.get("role") or claims.get("user_type") or "user")
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Malformed token")

    # Optionally verify user still exists/active
    try:
        r = core.get_item(Key={"PK": f"USER#{user_id}", "SK": f"PROFILE#{user_id}"})
        item = r.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="User not found")
        if item.get("status") in {"BLOCKED", "DISABLED"}:
            raise HTTPException(status_code=403, detail="User not allowed")
        if not item.get("email_confirmed", True):
            raise HTTPException(status_code=403, detail="Email not confirmed")
    except HTTPException:
        raise
    except Exception:
        logger.error("renew.ddb_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to renew token")

    new_tok = issue_local_jwt(user_id, email, ttl_seconds=3600, role=role, nickname=item.get("nickname"))
    _safe_event("renew.success", cid=cid, email=_mask_email(email))
    return TokenResponse(**new_tok).model_dump()

# --- TEMP PASSWORD FOR BLOCKED USERS ---
@app.post("/password/temp", response_model=None)
def send_temp_password(body: SendTempPassword, request: Request):
    cid = request.headers.get("x-correlation-id") if request else None
    email = body.email.lower()
    try:
        resp = _ddb_call(users.get_item, op="users.get_item.temp_pwd", Key={"pk": f"USER#{email}", "sk": "PROFILE"})
        item = resp.get("Item")
    except Exception:
        logger.error("temp_pwd.ddb_get_error", exc_info=True)
        # Do not reveal existence to caller
        return {"message": "If the account exists, an email will be sent."}

    if not item or item.get("provider") != "local":
        return {"message": "If the account exists, an email will be sent."}
    if item.get("status") != "BLOCKED":
        return {"message": "If the account is eligible, an email will be sent."}

    temp_pwd = generate_secure_password()
    pwd_hash = hash_password(temp_pwd)
    try:
        _ddb_call(
            users.update_item,
            op="users.update_item.set_temp_pwd",
            Key={"pk": f"USER#{email}", "sk": "PROFILE"},
            UpdateExpression="SET password_hash=:ph, must_change_password=:m, #s=:a, blocked_reason=:r",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":ph": pwd_hash, ":m": True, ":a": "ACTIVE", ":r": "RESET_TEMP_PASSWORD"},
        )
    except Exception:
        logger.error("temp_pwd.ddb_update_error", exc_info=True)
        # Still respond generically
        return {"message": "If the account exists and is eligible, an email will be sent."}

    html = (
        "<p>We've set a temporary password for your account.</p>"
        f"<p><strong>Temporary password:</strong> {temp_pwd}</p>"
        "<p>For your security, you must change it after signing in. Do not share this password.</p>"
    )
    try:
        send_email(email, "Your temporary password", html, text=f"Temporary password: {temp_pwd}")
        _safe_event("temp_password_sent", cid=cid, email=_mask_email(email))
    except Exception:
        logger.error("temp_pwd.email_send_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to send email at this time")

    return {"message": "If the account exists and is eligible, an email will be sent."}

# --- CHANGE PASSWORD (local users) ---
@app.post("/password/change", response_model=None)
def change_password(
    body: PasswordChangeRequest,
    request: Request,
    authorization: str | None = Header(default=None),
):
    cid = request.headers.get("x-correlation-id") or request.headers.get("x-request-id")
    email: Optional[str] = None
    item: Optional[Dict[str, Any]] = None

    def _load_user_by_email(_email: str):
        try:
            r = _ddb_call(users.get_item, op="users.get_item.change_pwd", Key={"pk": f"USER#{_email}", "sk": "PROFILE"})
            return r.get("Item")
        except Exception:
            logger.error("change_pwd.ddb_get_error", exc_info=True)
            raise HTTPException(status_code=500, detail="Could not load user")

    # Must-change via challenge token
    if body.challenge_token:
        try:
            claims = decode_link_token(body.challenge_token, TokenPurpose.CHANGE_PASSWORD)
        except Exception:
            _safe_event("change_pwd.invalid_challenge_token", cid=cid)
            raise HTTPException(status_code=400, detail="Invalid or expired challenge token")
        try:
            email_token, user_id = claims["sub"].split("|", 1)
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed challenge token")
        email = email_token
        item = _load_user_by_email(email)
        if not item or item.get("user_id") != user_id:
            raise HTTPException(status_code=400, detail="Challenge token subject mismatch")
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(body.current_password, item.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

    # Authenticated local user (Bearer local JWT)
    elif authorization:
        token = authorization.split(" ")[-1]
        try:
            claims = verify_local_jwt(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        if claims.get("provider") != "local":
            raise HTTPException(status_code=400, detail="Password change only valid for local accounts")
        email = claims.get("email")
        item = _load_user_by_email(email)
        if not item:
            raise HTTPException(status_code=404, detail="User not found")
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(body.current_password, item.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

    else:
        raise HTTPException(status_code=400, detail="Provide Authorization header or challenge_token")

    # Validate + rotate
    try:
        validate_password_strength(body.new_password)
    except ValueError as ve:
        _safe_event("change_pwd.weak_password", cid=cid, email=_mask_email(email), reason=str(ve))
        raise HTTPException(status_code=400, detail=str(ve))

    new_hash = hash_password(body.new_password)
    try:
        _ddb_call(
            users.update_item,
            op="users.update_item.rotate_pwd",
            Key={"pk": f"USER#{email}", "sk": "PROFILE"},
            UpdateExpression="SET password_hash=:ph, must_change_password=:f, #s=:a REMOVE blocked_at, blocked_reason",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":ph": new_hash, ":f": False, ":a": "ACTIVE"},
        )
    except Exception:
        logger.error("change_pwd.ddb_update_error", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not update password")

    _safe_event("password_changed", cid=cid, email=_mask_email(email))
    token = issue_local_jwt(item["user_id"], email, nickname=item.get("nickname"))
    return TokenResponse(**token).model_dump()


# ---------- Profile CRUD Endpoints ----------

@app.get("/profile", response_model=UserProfile)
async def get_profile(auth: AuthContext = Depends(authenticate)):
    """Get current user's profile"""
    log_event(logger, 'profile.get_start', user_id=auth.user_id)

    try:
        response = _ddb_call(
            core.get_item,
            op="core.get_item.profile",
            Key={"PK": f"USER#{auth.user_id}", "SK": f"PROFILE#{auth.user_id}"}
        )
    except Exception:
        logger.error("profile.get.ddb_error", extra={"user_id": auth.user_id}, exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to load profile")

    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Convert DynamoDB item to UserProfile model
    # Convert ISO timestamps to Unix timestamps
    def iso_to_timestamp(iso_str):
        if not iso_str:
            return 0
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
            return int(dt.timestamp())
        except (ValueError, AttributeError):
            return 0
    
    # Get notification preferences, provide defaults if not set
    notification_prefs = item.get("notificationPreferences")
    if notification_prefs is None:
        # Default notification preferences for existing users
        notification_prefs = {
            "questStarted": True,
            "questCompleted": True,
            "questFailed": True,
            "progressMilestones": True,
            "deadlineWarnings": True,
            "streakAchievements": True,
            "challengeUpdates": True,
            "channels": {"inApp": True, "email": False, "push": False}
        }
    
    profile_data = {
        "id": item.get("id"),
        "email": item.get("email"),
        "role": item.get("role", "user"),
        "fullName": item.get("fullName"),
        "nickname": item.get("nickname"),
        "birthDate": item.get("birthDate"),
        "status": item.get("status", "ACTIVE"),
        "country": item.get("country"),
        "language": item.get("language", "en"),
        "gender": item.get("gender"),
        "pronouns": item.get("pronouns"),
        "bio": item.get("bio"),
        "tags": item.get("tags", []),
        "tier": item.get("tier", "free"),
        "provider": item.get("provider", "local"),
        "email_confirmed": item.get("email_confirmed", False),
        "notificationPreferences": notification_prefs,
        "createdAt": iso_to_timestamp(item.get("createdAt")),
        "updatedAt": iso_to_timestamp(item.get("updatedAt")),
    }

    log_event(logger, 'profile.get_success', user_id=auth.user_id)
    return UserProfile(**profile_data)


@app.put("/profile", response_model=UserProfile)
async def update_profile(
    payload: ProfileUpdate,
    auth: AuthContext = Depends(authenticate)
):
    """Update current user's profile"""
    log_event(logger, 'profile.update_start', user_id=auth.user_id)

    # Validate nickname uniqueness if provided
    if payload.nickname:
        nickname = payload.nickname.strip()
        if len(nickname) < 3 or len(nickname) > 32:
            raise HTTPException(status_code=400, detail="Nickname must be 3-32 characters")

        import re
        if not re.fullmatch(r"[A-Za-z0-9_\-]+", nickname):
            raise HTTPException(status_code=400, detail="Nickname can only contain letters, numbers, underscores, and hyphens")

        # Check if nickname is taken by another user using AppSync GraphQL
        try:
            from .graphql_client import graphql_client
            is_available = await graphql_client.is_nickname_available_for_user(nickname)
            if not is_available:
                raise HTTPException(status_code=409, detail="Nickname already taken")
        except HTTPException:
            raise
        except Exception as e:
            # Fallback to direct DynamoDB check if GraphQL fails
            logger.warning("GraphQL nickname check failed, falling back to DynamoDB", extra={"user_id": auth.user_id, "error": str(e)})
            try:
                response = core.query(
                    IndexName="GSI2",
                    KeyConditionExpression="#pk = :v",
                    ExpressionAttributeNames={"#pk": "GSI2PK"},
                    ExpressionAttributeValues={":v": f"NICK#{nickname}"},
                    Limit=1,
                )
                items = response.get("Items", [])
                if items and items[0].get("id") != auth.user_id:
                    raise HTTPException(status_code=409, detail="Nickname already taken")
            except ClientError as e:
                if e.response.get("Error", {}).get("Code") != "ValidationException":
                    raise HTTPException(status_code=500, detail="Unable to validate nickname")

    # Validate country if provided
    if payload.country:
        allowed_countries = {"US","CA","MX","BR","AR","CL","CO","PE","VE","UY","PY","BO","EC","GT","CR","PA","DO","CU","HN","NI","SV","JM","TT",
            "GB","IE","FR","DE","ES","PT","IT","NL","BE","LU","CH","AT","DK","SE","NO","FI","IS","PL","CZ","SK","HU","RO","BG","GR","HR","SI","RS","BA","MK","AL","ME","UA","BY","LT","LV","EE","MD","TR","CY","MT","RU",
            "CN","JP","KR","IN","PK","BD","LK","NP","BT","MV","TH","MY","SG","ID","PH","VN","KH","LA","MM","BN","TL",
            "AE","SA","QA","BH","KW","OM","YE","IR","IQ","JO","LB","SY","IL","PS","AF","KZ","KG","UZ","TM","TJ","MN",
            "AU","NZ","PG","FJ","SB","VU","WS","TO","TV","KI","FM","MH","NR","PW"}
        if payload.country.upper() not in allowed_countries:
            raise HTTPException(status_code=400, detail="Invalid country")

    # Validate birthdate if provided
    if payload.birthDate:
        try:
            y, m, d = map(int, payload.birthDate.split("-"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid birthDate format, expected YYYY-MM-DD")
        if not (1 <= m <= 12 and 1 <= d <= 31 and y > 1900):
            raise HTTPException(status_code=400, detail="Invalid birthDate")
        now_iso = time.strftime("%Y-%m-%d", time.gmtime())
        cy, cm, cd = map(int, now_iso.split("-"))
        cutoff_y = cy - 1
        if y > cutoff_y or (y == cutoff_y and (m > cm or (m == cm and d > cd))):
            raise HTTPException(status_code=400, detail="birthDate too recent")

    # Build update expression
    update_expression_parts = []
    expression_attribute_names = {}
    expression_attribute_values = {}
    attr_counter = 0

    # Handle nickname changes (need to update GSI)
    current_profile = None
    nickname_changed = False

    if payload.nickname is not None:
        # Get current profile to check if nickname changed
        try:
            response = _ddb_call(
                core.get_item,
                op="core.get_item.profile_current",
                Key={"PK": f"USER#{auth.user_id}", "SK": f"PROFILE#{auth.user_id}"}
            )
            current_profile = response.get("Item")
        except Exception:
            pass

        current_nickname = current_profile.get("nickname") if current_profile else None
        if current_nickname != payload.nickname:
            nickname_changed = True

    # Prepare update fields
    update_fields = {}
    if payload.fullName is not None:
        update_fields["fullName"] = payload.fullName
    if payload.nickname is not None:
        update_fields["nickname"] = payload.nickname
    if payload.birthDate is not None:
        update_fields["birthDate"] = payload.birthDate
    if payload.country is not None:
        update_fields["country"] = payload.country.upper() if payload.country else None
    if payload.language is not None:
        update_fields["language"] = payload.language
    if payload.gender is not None:
        update_fields["gender"] = payload.gender
    if payload.pronouns is not None:
        update_fields["pronouns"] = payload.pronouns
    if payload.bio is not None:
        update_fields["bio"] = payload.bio
    if payload.tags is not None:
        update_fields["tags"] = payload.tags
    if payload.notificationPreferences is not None:
        update_fields["notificationPreferences"] = payload.notificationPreferences

    update_fields["updatedAt"] = int(time.time() * 1000)

    # Build update expression
    for key, value in update_fields.items():
        attr_name = f"#{key}"
        attr_value = f":val{attr_counter}"
        update_expression_parts.append(f"{attr_name} = {attr_value}")
        expression_attribute_names[attr_name] = key
        expression_attribute_values[attr_value] = value
        attr_counter += 1

    # Handle nickname GSI updates
    if nickname_changed and payload.nickname:
        if current_nickname:
            # Remove old nickname GSI
            try:
                _ddb_call(
                    core.delete_item,
                    op="core.delete_item.old_nickname_lock",
                    Key={"PK": f"NICK#{current_nickname}", "SK": "UNIQUE#USER"}
                )
            except Exception:
                logger.warning("profile.update.old_nickname_cleanup_failed", extra={"user_id": auth.user_id}, exc_info=True)

        # Add new nickname GSI
        try:
            _ddb_call(
                core.put_item,
                op="core.put_item.new_nickname_lock",
                Item={
                    "PK": f"NICK#{payload.nickname}",
                    "SK": "UNIQUE#USER",
                    "type": "NicknameUnique",
                    "nickname": payload.nickname,
                    "userId": auth.user_id,
                    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
                ConditionExpression="attribute_not_exists(PK)"
            )

            # Update profile GSIs
            update_expression_parts.append("GSI2PK = :gsi2pk")
            update_expression_parts.append("GSI2SK = :gsi2sk")
            expression_attribute_values[":gsi2pk"] = f"NICK#{payload.nickname}"
            expression_attribute_values[":gsi2sk"] = f"PROFILE#{auth.user_id}"

        except ClientError as e:
            if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                raise HTTPException(status_code=409, detail="Nickname already taken")
            raise HTTPException(status_code=500, detail="Unable to update nickname")

    if update_expression_parts:
        update_expression = f"SET {', '.join(update_expression_parts)}"

        try:
            _ddb_call(
                core.update_item,
                op="core.update_item.profile",
                Key={"PK": f"USER#{auth.user_id}", "SK": f"PROFILE#{auth.user_id}"},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names or None,
                ExpressionAttributeValues=expression_attribute_values,
            )
        except Exception:
            logger.error("profile.update.ddb_error", extra={"user_id": auth.user_id}, exc_info=True)
            raise HTTPException(status_code=500, detail="Unable to update profile")

    # Return updated profile
    return await get_profile(auth)
