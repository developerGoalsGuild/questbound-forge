from __future__ import annotations

import hashlib
import os
import sys
import time
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

_SERVICES_DIR = Path(__file__).resolve().parents[2]
if str(_SERVICES_DIR) not in sys.path:
    sys.path.append(str(_SERVICES_DIR))

from common.logging import get_structured_logger, log_event

from .auth import TokenVerificationError, TokenVerifier
from .settings import Settings


# ---------- Logging ----------
logger = get_structured_logger("quest-service", env_flag="QUEST_LOG_ENABLED", default_enabled=True)

# ---------- Static configuration ----------
NLP_QUESTION_ORDER = [
    "positive",
    "specific",
    "evidence",
    "resources",
    "obstacles",
    "ecology",
    "timeline",
    "firstStep",
]
CANONICAL_MAP = {key.lower(): key for key in NLP_QUESTION_ORDER}


# ---------- Settings & FastAPI app ----------
settings = Settings()
root_path = os.getenv("QUEST_SERVICE_ROOT_PATH", f"/{settings.environment.upper()}")
app = FastAPI(root_path=root_path, title="Quest Service", version="2.0.0")

def _norm_origin(origin: Optional[str]) -> Optional[str]:
    if not origin:
        return None
    return origin.rstrip('/')

_origin_candidates: List[str] = []
for candidate in settings.allowed_origins or []:
    normalized = _norm_origin(candidate)
    if normalized and normalized not in _origin_candidates:
        _origin_candidates.append(normalized)

_dev_origin = _norm_origin(os.getenv("DEV_FRONTEND_ORIGIN", "http://localhost:8080"))
if _dev_origin and _dev_origin not in _origin_candidates:
    _origin_candidates.append(_dev_origin)

_allowed_origins = _origin_candidates or ["*"]
_allowed_origin_set = {origin for origin in _allowed_origins if origin != "*"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    normalized = _norm_origin(origin)
    allow_any = "*" in _allowed_origins
    if origin and (allow_any or (normalized and normalized in _allowed_origin_set)):
        if "access-control-allow-origin" not in response.headers:
            response.headers["access-control-allow-origin"] = origin
        if "access-control-allow-credentials" not in response.headers:
            response.headers["access-control-allow-credentials"] = "true"
        vary = response.headers.get("vary") or ""
        vary_parts = [part.strip() for part in vary.split(",") if part.strip()]
        if "Origin" not in vary_parts:
            vary_parts.append("Origin")
            response.headers["vary"] = ", ".join(vary_parts)
    return response




@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    detail = "Invalid request payload"
    if errors:
        first = errors[0]
        loc = [str(part) for part in first.get("loc", []) if part not in {"body"}]
        message = first.get("msg", detail)
        detail = f"{'/'.join(loc)}: {message}" if loc else message
    return JSONResponse(status_code=400, content={"detail": detail})


# ---------- Dependencies ----------
@lru_cache(maxsize=1)
def _dynamodb_resource():
    return boto3.resource("dynamodb", region_name=settings.aws_region)


def get_goals_table():
    return _dynamodb_resource().Table(settings.core_table_name)


@lru_cache(maxsize=1)
def _token_verifier() -> TokenVerifier:
    return TokenVerifier(settings)


class AuthContext(BaseModel):
    user_id: str
    claims: Dict
    provider: str


async def authenticate(request: Request) -> AuthContext:
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
        logger.warning(
            'auth.header_missing',
            extra={'method': request.method, 'path': path, 'client': client_host},
        )
        raise HTTPException(status_code=401, detail='Authorization header is required')

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        logger.warning(
            'auth.header_invalid',
            extra={
                'method': request.method,
                'path': path,
                'client': client_host,
                'scheme': parts[0] if parts else None,
            },
        )
        raise HTTPException(status_code=401, detail='Authorization header must use Bearer token')

    token = parts[1]
    try:
        claims, provider = _token_verifier().verify(token)
    except TokenVerificationError as exc:
        logger.warning(
            'auth.token_verification_failed',
            extra={
                'method': request.method,
                'path': path,
                'client': client_host,
                'error_type': type(exc).__name__,
                'token_length': len(token),
            },
            exc_info=exc,
        )
        raise HTTPException(status_code=401, detail='Unauthorized: token verification failed') from exc

    user_id = claims.get('sub')
    if not user_id:
        logger.warning(
            'auth.subject_missing',
            extra={'method': request.method, 'path': path, 'provider': provider},
        )
        raise HTTPException(status_code=401, detail='Unauthorized: subject claim missing')

    log_event(
        logger,
        'auth.success',
        method=request.method,
        path=path,
        provider=provider,
        user_id=str(user_id),
    )

    return AuthContext(user_id=str(user_id), claims=claims, provider=provider)



# ---------- Request/response models ----------
class AnswerInput(BaseModel):
    key: str
    answer: Optional[str] = ""


class GoalCreatePayload(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    deadline: str
    answers: List[AnswerInput] = Field(default_factory=list)


class AnswerOutput(BaseModel):
    key: str
    answer: str


class GoalResponse(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    tags: List[str]
    answers: List[AnswerOutput]
    deadline: Optional[str]
    status: str
    createdAt: int
    updatedAt: int


# ---------- Validation helpers ----------
def _digits_only(value: str) -> bool:
    return value.isdigit()


def _normalize_date_only(value: Optional[str]) -> Optional[str]:
    if not value or not isinstance(value, str):
        return None
    trimmed = value.strip()
    if len(trimmed) != 10 or trimmed[4] != '-' or trimmed[7] != '-':
        return None
    y, m, d = trimmed[:4], trimmed[5:7], trimmed[8:10]
    if not (_digits_only(y) and _digits_only(m) and _digits_only(d)):
        return None
    if not ("01" <= m <= "12"):
        return None
    if not ("01" <= d <= "31"):
        return None
    return f"{y}-{m}-{d}"


def _sanitize_string(value: Optional[str]) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _validate_tags(raw_tags: List[str]) -> List[str]:
    tags: List[str] = []
    for idx, tag in enumerate(raw_tags):
        if not isinstance(tag, str):
            raise HTTPException(status_code=400, detail=f"Tag at index {idx} must be a string")
        trimmed = tag.strip()
        if trimmed:
            tags.append(trimmed)
    return tags


def _validate_answers(raw_answers: List[AnswerInput]) -> List[Dict[str, str]]:
    for index, entry in enumerate(raw_answers):
        if entry is None or not isinstance(entry.key, str) or not entry.key.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Answer at index {index} is missing a valid key",
            )
    filled = {key: "" for key in NLP_QUESTION_ORDER}
    for entry in raw_answers:
        canonical = CANONICAL_MAP.get(entry.key.strip().lower())
        if not canonical:
            continue
        filled[canonical] = _sanitize_string(entry.answer)
    return [{"key": key, "answer": filled[key]} for key in NLP_QUESTION_ORDER]


def _serialize_answers(raw_answers: List[Dict]) -> List[Dict[str, str]]:
    sanitized: List[Dict[str, str]] = []
    for entry in raw_answers or []:
        if not isinstance(entry, dict):
            continue
        key = _sanitize_string(entry.get("key"))
        if not key:
            continue
        sanitized.append({"key": key, "answer": _sanitize_string(entry.get("answer"))})
    return sanitized


def _normalize_deadline_output(value) -> Optional[str]:
    if isinstance(value, str) and len(value) == 10:
        return value
    if isinstance(value, (int, float)):
        try:
            from datetime import datetime

            return datetime.utcfromtimestamp(value / 1000).strftime("%Y-%m-%d")
        except Exception:  # pragma: no cover - defensive
            return None
    return None


def _build_goal_item(user_id: str, payload: GoalCreatePayload) -> Dict:
    title = _sanitize_string(payload.title)
    if not title:
        raise HTTPException(status_code=400, detail="Title is required and must be a non-empty string")

    normalized_deadline = _normalize_date_only(payload.deadline)
    if not normalized_deadline:
        raise HTTPException(status_code=400, detail="Deadline must be provided in YYYY-MM-DD format")

    answers = _validate_answers(payload.answers)
    tags = _validate_tags(payload.tags)
    description = _sanitize_string(payload.description)

    now_ms = int(time.time() * 1000)
    goal_id = str(uuid4())

    item = {
        "PK": f"USER#{user_id}",
        "SK": f"GOAL#{goal_id}",
        "type": "Goal",
        "id": goal_id,
        "userId": user_id,
        "title": title,
        "description": description,
        "tags": tags,
        "answers": answers,
        "deadline": normalized_deadline,
        "status": "active",
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"ENTITY#Goal#{now_ms}",
    }
    return item


def _to_response(item: Dict) -> GoalResponse:
    return GoalResponse(
        id=str(item.get("id")),
        userId=str(item.get("userId")),
        title=str(item.get("title", "")),
        description=_sanitize_string(item.get("description")),
        tags=[str(tag) for tag in item.get("tags", []) if isinstance(tag, str)],
        answers=[AnswerOutput(**a) for a in _serialize_answers(item.get("answers"))],
        deadline=_normalize_deadline_output(item.get("deadline")),
        status=str(item.get("status", "active")),
        createdAt=int(item.get("createdAt", 0)),
        updatedAt=int(item.get("updatedAt", 0)),
    )


# ---------- Routes ----------
@app.get("/quests", response_model=List[GoalResponse])
async def list_goals(
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    log_event(logger, 'quests.list_start', user_id=auth.user_id)
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{auth.user_id}") & Key("SK").begins_with("GOAL#"),
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.list_failed',
            extra={'user_id': auth.user_id, 'table': settings.core_table_name},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Unable to load goals") from exc

    items = response.get("Items", [])
    log_event(logger, 'quests.list_success', user_id=auth.user_id, item_count=len(items))
    return [_to_response(item) for item in items]


@app.post("/quests", response_model=GoalResponse, status_code=201)
async def create_goal(
    payload: GoalCreatePayload,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    item = _build_goal_item(auth.user_id, payload)
    log_event(logger, 'quests.create_start', user_id=auth.user_id, goal_id=item['id'])
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.create_failed',
            extra={'user_id': auth.user_id, 'goal_id': item['id']},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Could not create goal at this time") from exc

    log_event(logger, 'quests.create_success', user_id=auth.user_id, goal_id=item['id'])
    return _to_response(item)



class AITextPayload(BaseModel):
    text: str
    lang: Optional[str] = "en"


@app.post("/ai/inspiration-image")
async def inspiration_image(body: AITextPayload):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    url = f"https://picsum.photos/seed/{h}/1024/640"
    return {"imageUrl": url}


@app.post("/ai/suggest-improvements")
async def suggest_improvements(body: AITextPayload):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    suggestions: List[str] = []
    if len(text.split()) < 8:
        suggestions.append("Make the goal more specific with measurable outcomes.")
    lower = text.lower()
    if not any(token in lower for token in ("by ", "before ", "on ", "within ")):
        suggestions.append("Add a clear deadline or timeframe.")
    if not any(token in lower for token in ("because", "so that", "in order to")):
        suggestions.append("Include the deeper purpose (why it matters).")
    suggestions.append("Define evidence: how will you know it’s achieved?")
    suggestions.append("List resources needed and first concrete step.")

    return {"suggestions": suggestions[:6]}


__all__ = ["app"]
