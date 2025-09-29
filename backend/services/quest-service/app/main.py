from __future__ import annotations

import datetime
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
from fastapi import Body, Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from .models import AnswerInput, TaskResponse, AnswerOutput, GoalResponse, GoalCreatePayload, TaskInput, TaskUpdateInput
from .utils import _normalize_date_only,_normalize_deadline_output,_sanitize_string,_validate_answers,_serialize_answers,_validate_tags


_SERVICES_DIR = Path(__file__).resolve().parents[2]
if str(_SERVICES_DIR) not in sys.path:
    sys.path.append(str(_SERVICES_DIR))

from common.logging import get_structured_logger, log_event

from .auth import TokenVerificationError, TokenVerifier
from .settings import Settings


# ---------- Logging ----------
logger = get_structured_logger("quest-service", env_flag="QUEST_LOG_ENABLED", default_enabled=True)




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


# Helper to build task item for single table pattern
def _build_task_item(user_id: str, payload: TaskInput) -> Dict:
  now_ms = int(time.time() * 1000)
  task_id = str(uuid4())
  title = payload.title.strip()

  item = {
    "PK": f"USER#{user_id}",
    "SK": f"TASK#{task_id}",
    "type": "Task",
    "id": task_id,
    "goalId": payload.goalId,
    "title": title,
    "dueAt": payload.dueAt,
    "status": "active",
    "createdAt": now_ms,
    "updatedAt": now_ms,
    "tags": payload.tags,
    # GSI for querying tasks by user and creation time
    "GSI1PK": f"USER#{user_id}",
    "GSI1SK": f"ENTITY#Task#{now_ms}",
  }
  return item

# Helper to convert DynamoDB item to TaskResponse
def _task_to_response(item: Dict) -> TaskResponse:
  return TaskResponse(
    id=str(item.get("id")),
    goalId=str(item.get("goalId")),
    title=str(item.get("title")),
    dueAt=int(item.get("dueAt")),
    status=str(item.get("status")),
    createdAt=int(item.get("createdAt")),
    updatedAt=int(item.get("updatedAt")),
    tags=item.get("tags", []),
  )

# GraphQL resolver for createTask mutation
@app.post("/quests/createTask", response_model=TaskResponse, status_code=201)
async def create_task(
  payload: TaskInput = Body(...),
  auth: AuthContext = Depends(authenticate),
  table=Depends(get_goals_table),

):
  user_id = auth.user_id

  # Validate user owns the goal and goal is active
  try:
    response = table.get_item(
      Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{payload.goalId}"}
    )
  except (ClientError, BotoCoreError) as exc:
    raise HTTPException(status_code=500, detail="Internal server error")

  goal_item = response.get("Item")
  if not goal_item:
    raise HTTPException(status_code=404, detail="Goal not found")

  if goal_item.get("status") != "active":
    raise HTTPException(status_code=400, detail="Cannot add task to inactive goal")

  # Validate task dueAt <= goal deadline
  goal_deadline_str = goal_item.get("deadline")
  if not goal_deadline_str:
    raise HTTPException(status_code=400, detail="Goal deadline is missing")

  try:
    goal_deadline_date = datetime.datetime.strptime(goal_deadline_str, "%Y-%m-%d")

  except Exception as ex:
    raise HTTPException(status_code=400, detail=f"Goal deadline format invalid. '{goal_deadline_str}':{ex}")

  task_due_date =  datetime.datetime.utcfromtimestamp(payload.dueAt)
  if task_due_date > goal_deadline_date:
    raise HTTPException(
      status_code=400,
      detail="Task due date cannot exceed goal deadline",
    )

  # Build and save task item
  item = _build_task_item(user_id, payload)
  try:
    table.put_item(
      Item=item,
      ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
    )
  except (ClientError, BotoCoreError) as exc:
    raise HTTPException(status_code=500, detail="Could not create task at this time")

  return _task_to_response(item)


@app.put("/quests/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdateInput,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    user_id = auth.user_id

    # Verify task exists and belongs to user
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Internal server error")

    task_item = response.get("Item")
    if not task_item:
        raise HTTPException(status_code=404, detail="Task not found")

    # If updating dueAt, validate it doesn't exceed goal deadline
    if payload.dueAt is not None:
        goal_id = task_item.get("goalId")
        if goal_id:
            try:
                goal_response = table.get_item(
                    Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"}
                )
                goal_item = goal_response.get("Item")
                if goal_item:
                    goal_deadline_str = goal_item.get("deadline")
                    if goal_deadline_str:
                        import datetime
                        goal_deadline_date = datetime.datetime.strptime(goal_deadline_str, "%Y-%m-%d")
                        task_due_date = datetime.datetime.utcfromtimestamp(payload.dueAt)
                        if task_due_date > goal_deadline_date:
                            raise HTTPException(
                                status_code=400,
                                detail="Task due date cannot exceed goal deadline",
                            )
            except (ClientError, BotoCoreError):
                pass  # Continue with update if goal validation fails

    # Prepare update expression
    update_expression = "SET updatedAt = :updatedAt"
    expression_attribute_values = {":updatedAt": int(time.time() * 1000)}
    expression_attribute_names = {}

    if payload.title is not None:
        update_expression += ", #title = :title"
        expression_attribute_values[":title"] = _sanitize_string(payload.title)
        expression_attribute_names["#title"] = "title"

    if payload.dueAt is not None:
        update_expression += ", dueAt = :dueAt"
        expression_attribute_values[":dueAt"] = payload.dueAt

    if payload.status is not None:
        update_expression += ", #status = :status"
        expression_attribute_values[":status"] = payload.status
        expression_attribute_names["#status"] = "status"

    if payload.tags is not None:
        update_expression += ", tags = :tags"
        expression_attribute_values[":tags"] = payload.tags

    try:
        table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names if expression_attribute_names else None,
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Could not update task at this time")

    # Fetch updated task
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Could not retrieve updated task")

    updated_task = response.get("Item")
    if not updated_task:
        raise HTTPException(status_code=500, detail="Could not retrieve updated task")

    return _task_to_response(updated_task)


@app.delete("/quests/tasks/{task_id}")
async def delete_task(
    task_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    user_id = auth.user_id

    # Verify task exists and belongs to user
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Internal server error")

    task_item = response.get("Item")
    if not task_item:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete the task
    try:
        table.delete_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Could not delete task at this time")

    return {"message": "Task deleted successfully"}


__all__ = ["app"]
