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
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import BotoCoreError, ClientError
from botocore.config import Config
from fastapi import Body, Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from .models import AnswerInput, TaskResponse, AnswerOutput, GoalResponse, GoalWithAccessResponse, GoalCreatePayload, GoalUpdatePayload, TaskInput, TaskUpdateInput, GoalProgressResponse, Milestone, QuestCreatePayload, QuestUpdatePayload, QuestCancelPayload, QuestResponse
from .models.quest_template import QuestTemplateCreatePayload, QuestTemplateUpdatePayload, QuestTemplateResponse, QuestTemplateListResponse
from .models.analytics import QuestAnalytics, AnalyticsPeriod
from .db.quest_db import (
    create_quest, get_quest, update_quest, change_quest_status, 
    delete_quest, list_user_quests, QuestDBError, QuestNotFoundError,
    QuestVersionConflictError, QuestPermissionError, QuestValidationError
)
from .db.quest_template_db import (
    create_template, get_template, update_template, delete_template,
    list_user_templates, list_public_templates, QuestTemplateDBError,
    QuestTemplateNotFoundError, QuestTemplatePermissionError, QuestTemplateValidationError
)
from .db.analytics_db import get_cached_analytics, cache_analytics, AnalyticsDBError
from .analytics.quest_analytics import calculate_quest_analytics
from .utils import _normalize_date_only,_normalize_deadline_output,_sanitize_string,_validate_answers,_serialize_answers,_validate_tags
from .security.input_validation import (
    validate_user_id, validate_quest_title, validate_quest_description,
    validate_difficulty, validate_reward_xp, validate_category, validate_privacy,
    validate_quest_kind, validate_tags, validate_target_count, validate_count_scope,
    validate_period_days,
    validate_linked_goal_ids, validate_linked_task_ids, validate_depends_on_quest_ids,
    validate_deadline, SecurityValidationError
)
from .security.audit_logger import get_audit_logger, AuditEventType


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

# Add common module to path - works both locally and in containers
def _add_common_to_path():
    """Add common module to Python path, supporting both local and container environments."""
    # Try container path first (common is copied to /app/common)
    container_common = Path("/app/common")
    if container_common.exists():
        if str(container_common.parent) not in sys.path:
            sys.path.append(str(container_common.parent))
        return
    
    # Try local development path
    services_dir = Path(__file__).resolve().parents[3]
    if (services_dir / "common").exists():
        if str(services_dir) not in sys.path:
            sys.path.append(str(services_dir))
        return
    
    # Fallback: try relative to current file
    current_dir = Path(__file__).resolve().parent
    for _ in range(5):  # Go up max 5 levels
        common_dir = current_dir / "common"
        if common_dir.exists():
            if str(current_dir) not in sys.path:
                sys.path.append(str(current_dir))
            return
        current_dir = current_dir.parent

_add_common_to_path()

from common.logging import get_structured_logger, log_event

from .auth import TokenVerificationError, TokenVerifier
from .settings import Settings


# ---------- Logging ----------
logger = get_structured_logger("quest-service", env_flag="QUEST_LOG_ENABLED", default_enabled=True)

# Log Lambda image version for debugging
lambda_image_version = os.getenv("AWS_LAMBDA_FUNCTION_VERSION", "unknown")
logger.info('quest.service.startup', 
           environment=os.getenv("ENVIRONMENT", "unknown"),
           lambda_image_version=lambda_image_version,
           aws_region=os.getenv("AWS_REGION", "unknown"))




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
    return dynamodb  # Use the pre-configured optimized resource


def get_goals_table():
    return _dynamodb_resource().Table(settings.core_table_name)


def check_goal_access(user_id: str, goal_id: str, table) -> tuple[bool, str, Optional[str]]:
    """
    Check if a user has access to a goal (either as owner or collaborator).
    
    Args:
        user_id: ID of the user requesting access
        goal_id: ID of the goal
        table: DynamoDB table instance
        
    Returns:
        Tuple of (has_access, access_type, owner_user_id)
        - has_access: True if user has access
        - access_type: "owner" or "collaborator"
        - owner_user_id: ID of the actual owner (None if user is owner)
    """
    try:
        logger.info('goal.access_check_start', 
                   user_id=user_id, 
                   goal_id=goal_id,
                   lambda_image_version=os.getenv("AWS_LAMBDA_FUNCTION_VERSION", "unknown"))
        
        # First check if user is the owner
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"}
        )
        
        if "Item" in response:
            logger.info('goal.access_check_owner_found', user_id=user_id, goal_id=goal_id)
            return True, "owner", None
        
        logger.info('goal.access_check_not_owner', user_id=user_id, goal_id=goal_id)
        
        # Check if user is a collaborator using GSI1
        # GSI1PK = GOAL#{goal_id}, GSI1SK = USER#{user_id}
        from boto3.dynamodb.conditions import Key, Attr
        
        collaborator_query = table.query(
            
            KeyConditionExpression=Key("PK").eq(f"RESOURCE#GOAL#{goal_id}") & Key("SK").eq(f"COLLABORATOR#{user_id}")          ,            
            ProjectionExpression="resourceId",
            Limit=1
        )
        
        logger.info('goal.access_check_collaborator_query', 
                   user_id=user_id, 
                   goal_id=goal_id, 
                   query_count=len(collaborator_query.get("Items", [])))
        
        if collaborator_query.get("Items"):
            # User is a collaborator, extract owner from the collaborator record
            collaborator_item = collaborator_query["Items"][0]
            # The PK format is RESOURCE#GOAL#{goal_id}, we need to find the actual owner
            # We'll need to scan for the goal to find the owner
            logger.info('goal.access_check_scanning_for_goal', 
                       user_id=user_id, 
                       goal_id=goal_id,
                       message="Scanning for goal to find owner")
            
            owner_scan = table.query(
                 IndexName="GSI1",
                    KeyConditionExpression=Key("GSI1PK").eq(f"GOAL#{goal_id}") & Key("GSI1SK").begins_with("USER#"),                    
                    ProjectionExpression="GSI1SK",
                    Limit=1
            )
            
            logger.info('goal.access_check_scan_result', 
                       user_id=user_id, 
                       goal_id=goal_id,
                       scan_count=len(owner_scan.get("Items", [])),
                       scan_items=owner_scan.get("Items", []))
            
            if owner_scan.get("Items"):
                owner_gsi1sk = owner_scan["Items"][0]["GSI1SK"]
                owner_user_id = owner_gsi1sk.replace("USER#", "")
                
                logger.info('goal.access_check_collaboration_found', 
                           user_id=user_id, 
                           goal_id=goal_id, 
                           owner_user_id=owner_user_id)
                
                return True, "collaborator", owner_user_id
            else:
                # User is a collaborator but goal doesn't exist - this is a data consistency issue
                # We should still grant access since the collaboration record exists
                logger.warning('goal.access_check_collaborator_but_no_goal', 
                              user_id=user_id, 
                              goal_id=goal_id,
                              message="Collaboration exists but goal not found - granting access anyway")
                
                # Return True with a special access type to indicate the goal is missing
                return True, "collaborator_missing_goal", None
        else:
            logger.warning('goal.access_check_no_collaboration', 
                          user_id=user_id, 
                          goal_id=goal_id)
            return False, "none", None
        
    except Exception as e:
        logger.error('goal.access_check_failed',
                    user_id=user_id,
                    goal_id=goal_id,
                    error=str(e),
                    exc_info=e)
        return False, "none", None


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
    user_agent = request.headers.get('user-agent', '')
    
    # Initialize audit logger
    audit_logger = get_audit_logger(logger)
    
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
        audit_logger.log_security_violation(
            violation_type="missing_auth_header",
            client_ip=client_host,
            details={"method": request.method, "path": path}
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
        audit_logger.log_security_violation(
            violation_type="invalid_auth_header",
            client_ip=client_host,
            details={"method": request.method, "path": path, "scheme": parts[0] if parts else None}
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
        audit_logger.log_security_violation(
            violation_type="token_verification_failed",
            client_ip=client_host,
            details={"method": request.method, "path": path, "error_type": type(exc).__name__}
        )
        raise HTTPException(status_code=401, detail='Unauthorized: token verification failed') from exc

    user_id = claims.get('sub')
    if not user_id:
        logger.warning(
            'auth.subject_missing',
            extra={'method': request.method, 'path': path, 'provider': provider},
        )
        audit_logger.log_security_violation(
            violation_type="missing_subject_claim",
            client_ip=client_host,
            details={"method": request.method, "path": path, "provider": provider}
        )
        raise HTTPException(status_code=401, detail='Unauthorized: subject claim missing')

    # Validate user ID format
    try:
        user_id = validate_user_id(str(user_id))
    except SecurityValidationError as exc:
        audit_logger.log_security_violation(
            violation_type="invalid_user_id_format",
            user_id=str(user_id),
            client_ip=client_host,
            details={"method": request.method, "path": path, "error": str(exc)}
        )
        raise HTTPException(status_code=401, detail='Unauthorized: invalid user ID format') from exc

    log_event(
        logger,
        'auth.success',
        method=request.method,
        path=path,
        provider=provider,
        user_id=user_id,
    )

    # Log successful authentication
    audit_logger.log_auth_event(
        event_type=AuditEventType.AUTHENTICATION,
        user_id=user_id,
        success=True,
        details={"provider": provider, "method": request.method, "path": path},
        client_ip=client_host,
        user_agent=user_agent
    )

    return AuthContext(user_id=user_id, claims=claims, provider=provider)



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
    category = _sanitize_string(payload.category) if payload.category else None

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
        "category": category,
        "tags": tags,
        "answers": answers,
        "deadline": normalized_deadline,
        "status": "active",
        "createdAt": now_ms,
        "updatedAt": now_ms,
        "GSI1PK": f"GOAL#{goal_id}",
        "GSI1SK": f"USER#{user_id}",
    }
    return item


def _to_response(item: Dict) -> GoalResponse:
    return GoalResponse(
        id=str(item.get("id")),
        userId=str(item.get("userId")),
        title=str(item.get("title", "")),
        description=_sanitize_string(item.get("description")),
        category=_sanitize_string(item.get("category")) if item.get("category") else None,
        tags=[str(tag) for tag in item.get("tags", []) if isinstance(tag, str)],
        answers=[AnswerOutput(**a) for a in _serialize_answers(item.get("answers"))],
        deadline=_normalize_deadline_output(item.get("deadline")),
        status=str(item.get("status", "active")),
        createdAt=int(item.get("createdAt", 0)),
        updatedAt=int(item.get("updatedAt", 0)),
    )


def get_quests_for_goal(user_id: str, goal_id: str, table) -> List[QuestResponse]:
    """
    Get all quests for a specific goal.
    
    Args:
        user_id: User ID to get quests for
        goal_id: Goal ID to filter quests by
        table: DynamoDB table
        
    Returns:
        List of QuestResponse objects
    """
    try:
        # Query for quests with the specific goal_id
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("QUEST#"),
            FilterExpression=Attr("linkedGoalIds").contains(goal_id),
            ProjectionExpression="PK, SK, id, title, description, linkedGoalIds, #status, difficulty, kind, privacy, createdAt, updatedAt, startedAt, completedAt, failedAt, cancelledAt, #type, userid, rewardXp, category, version, deadline, linkedTaskIds, dependsOnQuestIds",
            ExpressionAttributeNames={"#type": "type", "#status": "status"}
        )
        
        quests = []
        for item in response.get("Items", []):
            quest_data = QuestResponse(
                id=str(item.get("id", "")),
                userId=str(item.get("userid", user_id)),  # Use userid from item or fallback to user_id
                title=str(item.get("title", "")),
                description=str(item.get("description", "")),
                difficulty=str(item.get("difficulty", "easy")),
                rewardXp=int(item.get("rewardXp", 0)),
                status=str(item.get("status", "draft")),
                category=str(item.get("category", "General")),
                tags=[],  # Default empty list
                privacy=str(item.get("privacy", "private")),
                deadline=int(item.get("deadline", 0)) if item.get("deadline") else None,
                createdAt=int(item.get("createdAt", 0)),
                updatedAt=int(item.get("updatedAt", 0)),
                startedAt=int(item.get("startedAt", 0)) if item.get("startedAt") else None,
                completedAt=int(item.get("completedAt", 0)) if item.get("completedAt") else None,
                failedAt=int(item.get("failedAt", 0)) if item.get("failedAt") else None,
                cancelledAt=int(item.get("cancelledAt", 0)) if item.get("cancelledAt") else None,
                version=int(item.get("version", 1)),
                kind=str(item.get("kind", "daily")),
                linkedGoalIds=item.get("linkedGoalIds", []),
                linkedTaskIds=item.get("linkedTaskIds", []),
                dependsOnQuestIds=item.get("dependsOnQuestIds", []),
            )
            quests.append(quest_data)
        
        logger.info('quest.get_quests_for_goal_success', 
                   user_id=user_id, 
                   goal_id=goal_id,
                   count=len(quests))
        
        return quests
        
    except Exception as e:
        logger.error('quest.get_quests_for_goal_failed', 
                    user_id=user_id, 
                    goal_id=goal_id,
                    exc_info=e)
        raise


def _to_response_with_access(item: Dict, access_type: str, current_user_id: str) -> GoalWithAccessResponse:
    """
    Convert DynamoDB item to GoalWithAccessResponse with access control information.
    
    Args:
        item: DynamoDB goal item
        access_type: "owner" or "collaborator"
        current_user_id: ID of the current user making the request
        
    Returns:
        GoalWithAccessResponse with access control fields
    """
    is_owner = access_type == "owner"
    
    return GoalWithAccessResponse(
        id=str(item.get("id")),
        userId=str(item.get("userId")),
        title=str(item.get("title", "")),
        description=_sanitize_string(item.get("description")),
        category=_sanitize_string(item.get("category")) if item.get("category") else None,
        tags=[str(tag) for tag in item.get("tags", []) if isinstance(tag, str)],
        answers=[AnswerOutput(**a) for a in _serialize_answers(item.get("answers"))],
        deadline=_normalize_deadline_output(item.get("deadline")),
        status=str(item.get("status", "active")),
        createdAt=int(item.get("createdAt", 0)),
        updatedAt=int(item.get("updatedAt", 0)),
        # Access control fields
        accessType=access_type,
        canEdit=is_owner,
        canDelete=is_owner,
        canAddTasks=is_owner,
        canComment=True,  # Both owners and collaborators can comment
    )


# ---------- Routes ----------
# GET /quests endpoint removed - now handled by AppSync GraphQL resolver


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


# GET /quests/{goal_id} endpoint removed - now handled by AppSync GraphQL resolver


@app.put("/quests/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    payload: GoalUpdatePayload,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    log_event(logger, 'quests.update_start', user_id=auth.user_id, goal_id=goal_id)
    
    # First, get the existing goal to ensure it exists and user owns it
    try:
        response = table.get_item(
            Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.update_get_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Unable to load goal") from exc

    existing_item = response.get("Item")
    if not existing_item:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Build update expression and values
    update_expression_parts = []
    expression_attribute_values = {}
    expression_attribute_names = {}

    if payload.title is not None:
        title = _sanitize_string(payload.title)
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        update_expression_parts.append("#title = :title")
        expression_attribute_values[":title"] = title
        expression_attribute_names["#title"] = "title"

    if payload.description is not None:
        description = _sanitize_string(payload.description)
        update_expression_parts.append("#description = :description")
        expression_attribute_values[":description"] = description
        expression_attribute_names["#description"] = "description"

    if payload.category is not None:
        category = _sanitize_string(payload.category) if payload.category else None
        update_expression_parts.append("#category = :category")
        expression_attribute_values[":category"] = category
        expression_attribute_names["#category"] = "category"

    if payload.deadline is not None:
        normalized_deadline = _normalize_date_only(payload.deadline)
        if not normalized_deadline:
            raise HTTPException(status_code=400, detail="Deadline must be in YYYY-MM-DD format")
        update_expression_parts.append("#deadline = :deadline")
        expression_attribute_values[":deadline"] = normalized_deadline
        expression_attribute_names["#deadline"] = "deadline"

    if payload.tags is not None:
        tags = _validate_tags(payload.tags)
        update_expression_parts.append("#tags = :tags")
        expression_attribute_values[":tags"] = tags
        expression_attribute_names["#tags"] = "tags"

    if payload.answers is not None:
        answers = _validate_answers(payload.answers)
        update_expression_parts.append("#answers = :answers")
        expression_attribute_values[":answers"] = answers
        expression_attribute_names["#answers"] = "answers"

    if payload.status is not None:
        if payload.status not in ["active", "paused", "completed", "archived"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        update_expression_parts.append("#status = :status")
        expression_attribute_values[":status"] = payload.status
        expression_attribute_names["#status"] = "status"

    if not update_expression_parts:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Always update the updatedAt timestamp
    now_ms = int(time.time() * 1000)
    update_expression_parts.append("#updatedAt = :updatedAt")
    expression_attribute_values[":updatedAt"] = now_ms
    expression_attribute_names["#updatedAt"] = "updatedAt"

    update_expression = "SET " + ", ".join(update_expression_parts)

    try:
        table.update_item(
            Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.update_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Could not update goal") from exc

    # Return updated goal
    try:
        response = table.get_item(
            Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"}
        )
        updated_item = response.get("Item")
        if not updated_item:
            raise HTTPException(status_code=500, detail="Goal not found after update")
        
        # Trigger progress recalculation if deadline was updated
        if payload.deadline is not None:
            try:
                # Calculate progress and update goal record
                progress_data = compute_goal_progress(goal_id, auth.user_id, table)
                
                # Update goal with progress data
                goal_update_expression = "SET progress = :progress, milestones = :milestones, completedTasks = :completedTasks, totalTasks = :totalTasks, updatedAt = :updatedAt"
                goal_expression_values = {
                    ":progress": progress_data.progressPercentage,
                    ":milestones": [milestone.dict() for milestone in progress_data.milestones],
                    ":completedTasks": progress_data.completedTasks,
                    ":totalTasks": progress_data.totalTasks,
                    ":updatedAt": int(time.time() * 1000)
                }
                
                table.update_item(
                    Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"},
                    UpdateExpression=goal_update_expression,
                    ExpressionAttributeValues=goal_expression_values
                )
                
                logger.info('progress.recalculated_after_goal_deadline_update', goal_id=goal_id, progress=progress_data.progressPercentage)
                
            except Exception as exc:
                # Log error but don't fail the goal update
                logger.error('progress.recalculation_failed_after_goal_deadline_update', goal_id=goal_id, exc_info=exc)

        log_event(logger, 'quests.update_success', user_id=auth.user_id, goal_id=goal_id)
        return _to_response(updated_item)
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.update_get_after_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Goal updated but could not retrieve updated data") from exc


@app.delete("/quests/{goal_id}")
async def delete_goal(
    goal_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    log_event(logger, 'quests.delete_start', user_id=auth.user_id, goal_id=goal_id)
    
    # First, check if goal exists and user owns it
    try:
        response = table.get_item(
            Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.delete_get_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Unable to load goal") from exc

    existing_item = response.get("Item")
    if not existing_item:
        raise HTTPException(status_code=404, detail="Goal not found")

    # First, find and delete all tasks associated with this goal
    try:
        # Query for all tasks with this goal_id using the main table
        # Tasks have SK pattern: TASK#{task_id} and goalId field
        query_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            FilterExpression="goalId = :goal_id",
            ExpressionAttributeValues={
                ":pk": f"USER#{auth.user_id}",
                ":sk_prefix": "TASK#",
                ":goal_id": goal_id
            }
        )
        
        # Delete each task
        for task_item in query_response.get("Items", []):
            task_id = task_item.get("id")
            if task_id:
                try:
                    table.delete_item(
                        Key={"PK": f"USER#{auth.user_id}", "SK": f"TASK#{task_id}"}
                    )
                    log_event(logger, 'quests.delete_task_success', user_id=auth.user_id, task_id=task_id, goal_id=goal_id)
                except (ClientError, BotoCoreError) as exc:
                    logger.warning(
                        'quests.delete_task_failed',
                        extra={'user_id': auth.user_id, 'task_id': task_id, 'goal_id': goal_id},
                        exc_info=exc,
                    )
                    # Continue with other tasks even if one fails
                    
    except (ClientError, BotoCoreError) as exc:
        logger.warning(
            'quests.delete_tasks_query_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        # Continue with goal deletion even if task cleanup fails

    # Delete the goal
    try:
        table.delete_item(
            Key={"PK": f"USER#{auth.user_id}", "SK": f"GOAL#{goal_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        logger.error(
            'quests.delete_failed',
            extra={'user_id': auth.user_id, 'goal_id': goal_id},
            exc_info=exc,
        )
        raise HTTPException(status_code=500, detail="Could not delete goal") from exc

    log_event(logger, 'quests.delete_success', user_id=auth.user_id, goal_id=goal_id)
    return {"message": "Goal and all associated tasks deleted successfully"}


# GET /quests/active-count endpoint removed - now handled by AppSync GraphQL resolver


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

  # Trigger progress recalculation for the goal (asynchronous)
  try:
    # Calculate progress and update goal record
    progress_data = compute_goal_progress(payload.goalId, user_id, table)
    
    # Update goal with progress data
    goal_update_expression = "SET progress = :progress, milestones = :milestones, completedTasks = :completedTasks, totalTasks = :totalTasks, updatedAt = :updatedAt"
    goal_expression_values = {
      ":progress": progress_data.progressPercentage,
      ":milestones": [milestone.dict() for milestone in progress_data.milestones],
      ":completedTasks": progress_data.completedTasks,
      ":totalTasks": progress_data.totalTasks,
      ":updatedAt": int(time.time() * 1000)
    }
    
    table.update_item(
      Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{payload.goalId}"},
      UpdateExpression=goal_update_expression,
      ExpressionAttributeValues=goal_expression_values
    )
    
    logger.info('progress.recalculated_after_task_creation', goal_id=payload.goalId, task_id=item.get('id'), progress=progress_data.progressPercentage)
    
  except Exception as exc:
    # Log error but don't fail the task creation
    logger.error('progress.recalculation_failed_after_task_creation', goal_id=payload.goalId, task_id=item.get('id'), exc_info=exc)

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

    # Trigger progress recalculation for the goal (asynchronous)
    goal_id = updated_task.get("goalId")
    if goal_id:
        try:
            # Calculate progress and update goal record
            progress_data = compute_goal_progress(goal_id, user_id, table)
            
            # Update goal with progress data
            goal_update_expression = "SET progress = :progress, milestones = :milestones, completedTasks = :completedTasks, totalTasks = :totalTasks, updatedAt = :updatedAt"
            from decimal import Decimal
            goal_expression_values = {
                ":progress": Decimal(str(progress_data.progressPercentage)),
                ":milestones": [milestone.dict() for milestone in progress_data.milestones],
                ":completedTasks": progress_data.completedTasks,
                ":totalTasks": progress_data.totalTasks,
                ":updatedAt": int(time.time() * 1000)
            }
            
            table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"},
                UpdateExpression=goal_update_expression,
                ExpressionAttributeValues=goal_expression_values
            )
            
            logger.info('progress.recalculated_after_task_update', goal_id=goal_id, task_id=task_id, progress=progress_data.progressPercentage)
            
        except Exception as exc:
            # Log error but don't fail the task update
            logger.error('progress.recalculation_failed_after_task_update', goal_id=goal_id, task_id=task_id, exc_info=exc)

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

    # Get goal ID before deleting task
    goal_id = task_item.get("goalId")
    
    # Delete the task
    try:
        table.delete_item(
            Key={"PK": f"USER#{user_id}", "SK": f"TASK#{task_id}"}
        )
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(status_code=500, detail="Could not delete task at this time")

    # Trigger progress recalculation for the goal (asynchronous)
    if goal_id:
        try:
            # Calculate progress and update goal record
            progress_data = compute_goal_progress(goal_id, user_id, table)
            
            # Update goal with progress data
            goal_update_expression = "SET progress = :progress, milestones = :milestones, completedTasks = :completedTasks, totalTasks = :totalTasks, updatedAt = :updatedAt"
            from decimal import Decimal
            goal_expression_values = {
                ":progress": Decimal(str(progress_data.progressPercentage)),
                ":milestones": [milestone.dict() for milestone in progress_data.milestones],
                ":completedTasks": progress_data.completedTasks,
                ":totalTasks": progress_data.totalTasks,
                ":updatedAt": int(time.time() * 1000)
            }
            
            table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"},
                UpdateExpression=goal_update_expression,
                ExpressionAttributeValues=goal_expression_values
            )
            
            logger.info('progress.recalculated_after_task_deletion', goal_id=goal_id, task_id=task_id, progress=progress_data.progressPercentage)
            
        except Exception as exc:
            # Log error but don't fail the task deletion
            logger.error('progress.recalculation_failed_after_task_deletion', goal_id=goal_id, task_id=task_id, exc_info=exc)

    return {"message": "Task deleted successfully"}


__all__ = ["app"]


# ---------- Quest Template Endpoints ----------

@app.get("/quests/templates/{template_id}", response_model=QuestTemplateResponse)
async def get_quest_template(
    template_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get a quest template by ID"""
    log_event(logger, 'quest_template.get_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        template = get_template(template_id, auth.user_id)
        log_event(logger, 'quest_template.get_success', user_id=auth.user_id, template_id=template_id)
        return template
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.get_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.get_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.get_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get quest template")


@app.put("/quests/templates/{template_id}", response_model=QuestTemplateResponse)
async def update_quest_template(
    template_id: str,
    payload: QuestTemplateUpdatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Update a quest template"""
    log_event(logger, 'quest_template.update_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        template = update_template(template_id, auth.user_id, payload)
        log_event(logger, 'quest_template.update_success', user_id=auth.user_id, template_id=template_id)
        return template
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.update_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.update_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateValidationError as e:
        log_event(logger, 'quest_template.update_validation_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.update_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update quest template")


@app.delete("/quests/templates/{template_id}")
async def delete_quest_template(
    template_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete a quest template"""
    log_event(logger, 'quest_template.delete_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        delete_template(template_id, auth.user_id)
        log_event(logger, 'quest_template.delete_success', user_id=auth.user_id, template_id=template_id)
        return {"success": True, "message": "Quest template deleted successfully"}
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.delete_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.delete_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.delete_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete quest template")


@app.get("/quests/templates", response_model=QuestTemplateListResponse)
async def list_quest_templates(
    auth: AuthContext = Depends(authenticate),
    limit: int = 50,
    next_token: str = None,
    privacy: str = "user"  # "user", "public", "all"
):
    """List quest templates"""
    log_event(logger, 'quest_template.list_start', user_id=auth.user_id, limit=limit, privacy=privacy)
    
    try:
        if privacy == "public":
            result = list_public_templates(limit, next_token)
        else:
            result = list_user_templates(auth.user_id, limit, next_token)
        
        log_event(logger, 'quest_template.list_success', 
                 user_id=auth.user_id, 
                 count=len(result['templates']), 
                 total=result['total'])
        
        return QuestTemplateListResponse(**result)
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.list_db_error', user_id=auth.user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list quest templates")
    except Exception as e:
        log_event(logger, 'quest_template.list_unexpected_error', user_id=auth.user_id, error=str(e), error_type=type(e).__name__)
        # Return empty list instead of error if user has no templates
        return QuestTemplateListResponse(templates=[], total=0, hasMore=False, nextToken=None)


# ---------- Goal Access Endpoints ----------

@app.get("/quests/{goal_id}", response_model=GoalWithAccessResponse)
async def get_goal(
    goal_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Get a specific goal by ID with collaboration access support.
    Returns access control information for the frontend.
    """
    logger.info('goal.get_requested', goal_id=goal_id, user_id=auth.user_id)
    
    try:
        # Check if user has access to the goal
        has_access, access_type, owner_user_id = check_goal_access(auth.user_id, goal_id, table)
        
        if not has_access:
            logger.warning('goal.access_denied', goal_id=goal_id, user_id=auth.user_id)
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Handle special case where user is collaborator but goal doesn't exist
        if access_type == "collaborator_missing_goal":
            logger.warning('goal.collaborator_access_but_goal_missing', 
                         goal_id=goal_id, 
                         user_id=auth.user_id,
                         message="User has collaboration access but goal doesn't exist")
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Use the actual owner's user_id to get the goal
        goal_user_id = owner_user_id if owner_user_id else auth.user_id
        
        logger.info('goal.access_granted', 
                   goal_id=goal_id, 
                   user_id=auth.user_id, 
                   access_type=access_type,
                   goal_user_id=goal_user_id)
        
        # Get the goal from the owner
        response = table.get_item(
            Key={"PK": f"USER#{goal_user_id}", "SK": f"GOAL#{goal_id}"}
        )
        
        if "Item" not in response:
            logger.warning('goal.not_found', 
                         goal_id=goal_id, 
                         user_id=auth.user_id,
                         goal_user_id=goal_user_id)
            raise HTTPException(status_code=404, detail="Goal not found")
        
        goal_item = response["Item"]
        goal_data = _to_response_with_access(goal_item, access_type, auth.user_id)
        
        logger.info('goal.get_success', 
                   goal_id=goal_id, 
                   user_id=auth.user_id,
                   access_type=access_type,
                   can_edit=goal_data.canEdit,
                   can_comment=goal_data.canComment)
        
        return goal_data
        
    except HTTPException:
        raise
    except Exception as exc:
        logger.error('goal.get_failed', goal_id=goal_id, user_id=auth.user_id, exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to get goal")


# ---------- Progress Calculation Endpoints ----------

@app.get("/quests/{goal_id}/progress", response_model=GoalProgressResponse)
async def get_goal_progress(
    goal_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Get progress information for a specific goal.
    
    Args:
        goal_id: The goal ID
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        GoalProgressResponse with calculated progress data
    """
    logger.info('progress.get_requested', goal_id=goal_id, user_id=auth.user_id)
    
    try:
        # Check if user has access to the goal
        has_access, access_type, owner_user_id = check_goal_access(auth.user_id, goal_id, table)
        
        if not has_access:
            logger.warning('progress.access_denied', goal_id=goal_id, user_id=auth.user_id)
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Use the actual owner's user_id for progress calculation
        progress_user_id = owner_user_id if owner_user_id else auth.user_id
        
        logger.info('progress.access_granted', 
                   goal_id=goal_id, 
                   user_id=auth.user_id, 
                   access_type=access_type,
                   progress_user_id=progress_user_id)
        
        progress_data = compute_goal_progress(goal_id, progress_user_id, table)
        logger.info('progress.calculated', goal_id=goal_id, progress=progress_data.progressPercentage)
        return progress_data
    except HTTPException:
        raise
    except Exception as exc:
        logger.error('progress.get_failed', goal_id=goal_id, user_id=auth.user_id, exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to calculate goal progress")


@app.get("/quests/progress", response_model=List[GoalProgressResponse])
async def get_all_goals_progress(
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Get progress information for all user goals.
    
    Args:
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        List of GoalProgressResponse objects
    """
    logger.info('progress.get_all_requested', user_id=auth.user_id)
    
    try:
        # Get all goals for the user
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{auth.user_id}") & Key("SK").begins_with("GOAL#")
        )
        goals = response.get("Items", [])
        
        progress_list = []
        for goal in goals:
            try:
                goal_id = goal.get("id")
                if goal_id:
                    progress_data = compute_goal_progress(goal_id, auth.user_id, table)
                    progress_list.append(progress_data)
            except Exception as exc:
                logger.error('progress.calculation_failed_for_goal', goal_id=goal.get("id"), exc_info=exc)
                # Continue with other goals even if one fails
                continue
        
        logger.info('progress.all_calculated', user_id=auth.user_id, count=len(progress_list))
        return progress_list
        
    except Exception as exc:
        logger.error('progress.get_all_failed', user_id=auth.user_id, exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to calculate goals progress")


# ---------- Progress Calculation Functions ----------

def get_goal_tasks(goal_id: str, user_id: str, table) -> List[Dict]:
    """
    Get all tasks for a specific goal.
    
    Args:
        goal_id: The goal ID
        user_id: The user ID
        table: DynamoDB table resource
        
    Returns:
        List of task dictionaries
    """
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("TASK#"),
            FilterExpression=Key("goalId").eq(goal_id)
        )
        return response.get("Items", [])
    except (ClientError, BotoCoreError) as exc:
        logger.error('progress.get_tasks_failed', goal_id=goal_id, user_id=user_id, exc_info=exc)
        return []


def calculate_time_progress(goal: Dict) -> float:
    """
    Calculate time-based progress percentage.
    Formula: (current_date - creation_date) / (deadline - creation_date) * 100
    
    Args:
        goal: Goal dictionary from DynamoDB
        
    Returns:
        Time progress percentage (0-100)
    """
    try:
        now = datetime.datetime.now()
        created_timestamp = float(goal['createdAt']) / 1000
        created = datetime.datetime.fromtimestamp(created_timestamp)
        deadline_str = goal.get('deadline')
        
        if not deadline_str:
            return 0.0
            
        deadline = datetime.datetime.strptime(deadline_str, '%Y-%m-%d')
        
        total_days = (deadline - created).days
        elapsed_days = (now - created).days
        
        if total_days <= 0:
            return 100.0 if now > deadline else 0.0
        
        time_progress = min(100.0, max(0.0, (elapsed_days / total_days) * 100))
        
        # If overdue, return 100% but mark as overdue
        if now > deadline:
            return 100.0
        
        return time_progress
    except (ValueError, KeyError, TypeError) as exc:
        logger.error('progress.time_calculation_failed', goal_id=goal.get('id'), exc_info=exc)
        return 0.0


def calculate_milestones(progress_percentage: float, goal_id: str) -> List[Milestone]:
    """
    Calculate milestones based on current progress percentage (non-retroactive).
    
    Args:
        progress_percentage: Current progress percentage
        goal_id: Goal ID for milestone IDs
        
    Returns:
        List of Milestone objects
    """
    milestones = []
    
    # Fixed milestone thresholds and names
    milestone_configs = [
        (25.0, "First Quarter"),
        (50.0, "Halfway Point"), 
        (75.0, "Three Quarters"),
        (100.0, "Complete")
    ]
    
    for threshold, name in milestone_configs:
        # Non-retroactive: only add milestone if current progress >= threshold
        if progress_percentage >= threshold:
            milestones.append(Milestone(
                id=f"milestone_{int(threshold)}_{goal_id}",
                name=name,
                percentage=threshold,
                achieved=True,
                achievedAt=int(time.time() * 1000),
                description=f"Reached {name} milestone"
            ))
        else:
            # Add unachieved milestone for progress bar markers
            milestones.append(Milestone(
                id=f"milestone_{int(threshold)}_{goal_id}",
                name=name,
                percentage=threshold,
                achieved=False,
                achievedAt=None,
                description=f"Next milestone: {name}"
            ))
    
    return milestones


def is_goal_overdue(goal: Dict) -> bool:
    """
    Check if a goal is overdue.
    
    Args:
        goal: Goal dictionary from DynamoDB
        
    Returns:
        True if goal is overdue, False otherwise
    """
    try:
        deadline_str = goal.get('deadline')
        if not deadline_str:
            return False
            
        deadline = datetime.datetime.strptime(deadline_str, '%Y-%m-%d')
        return datetime.datetime.now() > deadline
    except (ValueError, KeyError, TypeError):
        return False


def is_goal_urgent(goal: Dict) -> bool:
    """
    Check if a goal is urgent (due within 7 days).
    
    Args:
        goal: Goal dictionary from DynamoDB
        
    Returns:
        True if goal is urgent, False otherwise
    """
    try:
        deadline_str = goal.get('deadline')
        if not deadline_str:
            return False
            
        deadline = datetime.datetime.strptime(deadline_str, '%Y-%m-%d')
        days_remaining = (deadline - datetime.datetime.now()).days
        return 0 <= days_remaining <= 7
    except (ValueError, KeyError, TypeError):
        return False


def compute_goal_progress(goal_id: str, user_id: str, table) -> GoalProgressResponse:
    """
    Calculate goal progress using hybrid approach: task completion + time-based progress.
    
    Requirements:
    - Fixed 70/30 weight split (task/time)
    - Goals without tasks show 0% progress
    - Deadline is mandatory for all goals
    - Store progress data in Goal record
    - Asynchronous recalculation on task operations
    
    Args:
        goal_id: The goal ID
        user_id: The user ID
        table: DynamoDB table resource
        
    Returns:
        GoalProgressResponse with calculated progress data
    """
    try:
        # Step 1: Get all tasks for the goal
        tasks = get_goal_tasks(goal_id, user_id, table)
        
        # Step 2: Calculate task completion progress
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
        
        # Goals without tasks show 0% progress (not time-based fallback)
        task_progress = 0.0
        if total_tasks > 0:
            task_progress = (completed_tasks / total_tasks) * 100
        
        # Step 3: Get goal data for time calculation
        goal_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"}
        )
        goal = goal_response.get("Item")
        
        if not goal:
            logger.error('progress.goal_not_found', goal_id=goal_id, user_id=user_id)
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Step 4: Calculate time-based progress (deadline is mandatory)
        time_progress = calculate_time_progress(goal)
        
        # Step 5: Calculate hybrid progress (fixed 70/30 weight split)
        hybrid_progress = (task_progress * 0.7) + (time_progress * 0.3)
        
        # Step 6: Determine milestones (fixed thresholds, non-retroactive)
        milestones = calculate_milestones(hybrid_progress, goal_id)
        
        # Step 7: Determine urgency and overdue status
        is_overdue = is_goal_overdue(goal)
        is_urgent = is_goal_urgent(goal)
        
        return GoalProgressResponse(
            goalId=goal_id,
            progressPercentage=round(hybrid_progress, 2),
            taskProgress=round(task_progress, 2),
            timeProgress=round(time_progress, 2),
            completedTasks=completed_tasks,
            totalTasks=total_tasks,
            milestones=milestones,
            lastUpdated=int(time.time() * 1000),
            isOverdue=is_overdue,
            isUrgent=is_urgent
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        # Log error to CloudWatch and continue API operation
        logger.error('progress.calculation_failed', goal_id=goal_id, user_id=user_id, exc_info=exc)
        # Return minimal progress data to maintain API functionality
        return GoalProgressResponse(
            goalId=goal_id,
            progressPercentage=0.0,
            taskProgress=0.0,
            timeProgress=0.0,
            completedTasks=0,
            totalTasks=0,
            milestones=[],
            lastUpdated=int(time.time() * 1000),
            isOverdue=False,
            isUrgent=False
        )

# ---------- Quest Endpoints ----------

@app.post("/quests/createQuest", response_model=QuestResponse, status_code=201)
async def create_quest_endpoint(
    payload: QuestCreatePayload,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
    request: Request = None,
):
    """
    Create a new quest (creates as draft).
    
    Args:
        payload: Quest creation payload
        auth: Authentication context
        table: DynamoDB table resource
        request: HTTP request object for audit logging
        
    Returns:
        QuestResponse object
        
    Raises:
        HTTPException: If quest creation fails
    """
    audit_logger = get_audit_logger(logger)
    client_ip = request.client.host if request and request.client else None
    
    log_event(logger, 'quests.createQuest_start', user_id=auth.user_id)
    
    try:
        # Validate and sanitize input data
        validated_payload = QuestCreatePayload(
            title=validate_quest_title(payload.title),
            description=validate_quest_description(payload.description),
            difficulty=validate_difficulty(payload.difficulty),
            rewardXp=validate_reward_xp(payload.rewardXp),
            category=validate_category(payload.category),
            tags=validate_tags(payload.tags) if payload.tags else [],
            privacy=validate_privacy(payload.privacy),
            kind=validate_quest_kind(payload.kind),
            targetCount=validate_target_count(payload.targetCount) if payload.targetCount else None,
            countScope=validate_count_scope(payload.countScope) if payload.countScope else None,
            periodDays=validate_period_days(payload.periodDays) if payload.periodDays else None,
            linkedGoalIds=validate_linked_goal_ids(payload.linkedGoalIds) if payload.linkedGoalIds else None,
            linkedTaskIds=validate_linked_task_ids(payload.linkedTaskIds) if payload.linkedTaskIds else None,
            dependsOnQuestIds=validate_depends_on_quest_ids(payload.dependsOnQuestIds) if payload.dependsOnQuestIds else None,
            deadline=validate_deadline(payload.deadline) if payload.deadline else None,
        )
        
        # Check access to linked goals if any
        if validated_payload.linkedGoalIds:
            for goal_id in validated_payload.linkedGoalIds:
                has_access, access_type, owner_user_id = check_goal_access(auth.user_id, goal_id, table)
                if not has_access:
                    logger.warning('quest.create_quest_linked_goal_access_denied', 
                                 user_id=auth.user_id, 
                                 goal_id=goal_id,
                                 quest_title=validated_payload.title)
                    raise HTTPException(status_code=403, detail=f"Access denied to goal {goal_id}")
                
                # Log access check for audit
                logger.info('quest.create_quest_linked_goal_access_granted', 
                           user_id=auth.user_id, 
                           goal_id=goal_id,
                           access_type=access_type,
                           quest_title=validated_payload.title)
        
        # Create quest using database helper
        quest = create_quest(auth.user_id, validated_payload)
        
        # Log successful quest creation
        audit_logger.log_data_modification(
            user_id=auth.user_id,
            resource_type="quest",
            resource_id=quest.id,
            action="create",
            new_values={"title": quest.title, "difficulty": quest.difficulty, "privacy": quest.privacy},
            success=True,
            client_ip=client_ip
        )
        
        log_event(logger, 'quests.createQuest_success', 
                 user_id=auth.user_id, quest_id=quest.id)
        
        return quest
        
    except SecurityValidationError as e:
        audit_logger.log_input_validation_failed(
            user_id=auth.user_id,
            endpoint="quests/createQuest",
            validation_errors=[str(e)],
            input_data=payload.dict() if hasattr(payload, 'dict') else str(payload),
            client_ip=client_ip
        )
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    except QuestDBError as e:
        audit_logger.log_system_error(
            error_type="QuestDBError",
            error_message=str(e),
            user_id=auth.user_id,
            endpoint="quests/createQuest",
            client_ip=client_ip
        )
        logger.error('quests.createQuest_failed', 
                    user_id=auth.user_id, 
                    error=str(e),
                    exc_info=e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        audit_logger.log_system_error(
            error_type="UnexpectedError",
            error_message=str(e),
            user_id=auth.user_id,
            endpoint="quests/createQuest",
            client_ip=client_ip
        )
        logger.error('quests.createQuest_failed', 
                    user_id=auth.user_id, 
                    error=str(e),
                    exc_info=e)
        raise HTTPException(status_code=500, detail="Failed to create quest")


@app.get("/quests", response_model=List[QuestResponse])
async def list_user_quests_endpoint(
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    List all quests for the authenticated user.
    """
    logger.info('quest.list_user_quests_requested', user_id=auth.user_id)
    
    try:
        # Query for all quests for this user
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{auth.user_id}") & Key("SK").begins_with("QUEST#"),
            ProjectionExpression="PK, SK, id, title, description, linkedGoalIds, #status, difficulty, kind, privacy, createdAt, updatedAt, startedAt, completedAt, failedAt, cancelledAt, #type, userid, rewardXp, category, version, deadline, linkedTaskIds, dependsOnQuestIds, targetCount, countScope, periodDays",
            ExpressionAttributeNames={"#type": "type", "#status": "status"}
        )
        
        quests = []
        for item in response.get("Items", []):
            quest_data = QuestResponse(
                id=str(item.get("id", "")),
                userId=str(item.get("userid", auth.user_id)),
                title=str(item.get("title", "")),
                description=str(item.get("description", "")),
                difficulty=str(item.get("difficulty", "easy")),
                rewardXp=int(item.get("rewardXp", 0)),
                status=str(item.get("status", "draft")),
                category=str(item.get("category", "General")),
                tags=[],  # Default empty list
                privacy=str(item.get("privacy", "private")),
                deadline=int(item.get("deadline", 0)) if item.get("deadline") else None,
                createdAt=int(item.get("createdAt", 0)),
                updatedAt=int(item.get("updatedAt", 0)),
                startedAt=int(item.get("startedAt", 0)) if item.get("startedAt") else None,
                completedAt=int(item.get("completedAt", 0)) if item.get("completedAt") else None,
                failedAt=int(item.get("failedAt", 0)) if item.get("failedAt") else None,
                cancelledAt=int(item.get("cancelledAt", 0)) if item.get("cancelledAt") else None,
                version=int(item.get("version", 1)),
                kind=str(item.get("kind", "daily")),
                linkedGoalIds=item.get("linkedGoalIds", []),
                linkedTaskIds=item.get("linkedTaskIds", []),
                dependsOnQuestIds=item.get("dependsOnQuestIds", []),
                targetCount=item.get("targetCount"),
                countScope=item.get("countScope"),
                periodDays=item.get("periodDays"),
            )
            quests.append(quest_data)
        
        logger.info('quest.list_user_quests_success', 
                   user_id=auth.user_id,
                   count=len(quests))
        
        return quests
        
    except Exception as e:
        logger.error('quest.list_user_quests_failed', 
                     user_id=auth.user_id,
                     exc_info=e)
        raise HTTPException(status_code=500, detail="Failed to list user quests")

@app.get("/quests/{goal_id}/quests", response_model=List[QuestResponse])
async def list_goal_quests_endpoint(
    goal_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    List all quests for a specific goal with collaboration access support.
    """
    logger.info('quest.list_goal_quests_requested', user_id=auth.user_id, goal_id=goal_id)
    
    try:
        # First check if user has access to the goal
        has_access, access_type, owner_user_id = check_goal_access(auth.user_id, goal_id, table)
        
        if not has_access:
            logger.warning('quest.list_goal_quests_access_denied', goal_id=goal_id, user_id=auth.user_id)
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Handle special case where user is collaborator but goal doesn't exist
        if access_type == "collaborator_missing_goal":
            logger.warning('quest.list_goal_quests_collaborator_access_but_goal_missing', 
                         goal_id=goal_id, 
                         user_id=auth.user_id,
                         message="User has collaboration access but goal doesn't exist")
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Use the actual owner's user_id to get the quests
        quest_user_id = owner_user_id if owner_user_id else auth.user_id
        
        logger.info('quest.list_goal_quests_access_granted', 
                   goal_id=goal_id, 
                   user_id=auth.user_id, 
                   access_type=access_type,
                   quest_user_id=quest_user_id)
        
        # Get quests for the specific goal
        quests = get_quests_for_goal(quest_user_id, goal_id, table)
        
        logger.info('quest.list_goal_quests_success', 
                   user_id=auth.user_id, 
                   goal_id=goal_id,
                   count=len(quests),
                   access_type=access_type)
        
        return quests
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error('quest.list_goal_quests_failed', 
                    user_id=auth.user_id, 
                    goal_id=goal_id,
                    exc_info=e)
        raise HTTPException(status_code=500, detail="Failed to list goal quests")


@app.get("/quests/quests/{quest_id}", response_model=QuestResponse)
async def get_quest_endpoint(
    quest_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Get a specific quest by ID with collaboration access support.
    """
    logger.info('quest.get_requested', quest_id=quest_id, user_id=auth.user_id)
    
    try:
        # Use the existing get_quest function which already has collaboration access
        quest_data = get_quest(auth.user_id, quest_id)
        
        logger.info('quest.get_success', 
                   quest_id=quest_id, 
                   user_id=auth.user_id)
        
        return quest_data
        
    except QuestNotFoundError as e:
        logger.warning('quest.not_found', quest_id=quest_id, user_id=auth.user_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestPermissionError as e:
        logger.warning('quest.access_denied', quest_id=quest_id, user_id=auth.user_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except Exception as exc:
        logger.error('quest.get_failed', quest_id=quest_id, user_id=auth.user_id, exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to get quest")


@app.post("/quests/quests/{quest_id}/start", response_model=QuestResponse)
async def start_quest_endpoint(
    quest_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Start a quest (draft -> active).
    
    Args:
        quest_id: Quest ID
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        QuestResponse object
        
    Raises:
        HTTPException: If quest start fails
    """
    log_event(logger, 'quests.startQuest_start', 
             user_id=auth.user_id, quest_id=quest_id)
    
    try:
        # Change quest status to active
        quest = change_quest_status(auth.user_id, quest_id, "active")
        
        log_event(logger, 'quests.startQuest_success', 
                 user_id=auth.user_id, quest_id=quest_id)
        
        return quest
        
    except QuestNotFoundError as e:
        logger.warning('quests.startQuest_not_found', 
                      user_id=auth.user_id, quest_id=quest_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except QuestPermissionError as e:
        logger.warning('quests.startQuest_permission_denied', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestValidationError as e:
        logger.warning('quests.startQuest_validation_failed', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        # Return user-friendly error message
        raise HTTPException(status_code=400, detail={
            "error": "Quest validation failed",
            "message": str(e),
            "code": "QUEST_VALIDATION_ERROR"
        })
    except QuestDBError as e:
        logger.error('quests.startQuest_failed', 
                    user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start quest")


@app.put("/quests/quests/{quest_id}", response_model=QuestResponse)
async def update_quest_endpoint(
    quest_id: str,
    payload: QuestUpdatePayload,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Update a quest (draft only).
    
    Args:
        quest_id: Quest ID
        payload: Quest update payload
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        QuestResponse object
        
    Raises:
        HTTPException: If quest update fails
    """
    log_event(logger, 'quests.updateQuest_start', 
             user_id=auth.user_id, quest_id=quest_id)
    
    try:
        # Get current quest to get version for optimistic locking
        current_quest = get_quest(auth.user_id, quest_id)
        
        # Update quest using database helper
        quest = update_quest(auth.user_id, quest_id, payload, current_quest.version)
        
        log_event(logger, 'quests.updateQuest_success', 
                 user_id=auth.user_id, quest_id=quest_id)
        
        return quest
        
    except QuestNotFoundError as e:
        logger.warning('quests.updateQuest_not_found', 
                      user_id=auth.user_id, quest_id=quest_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except QuestPermissionError as e:
        logger.warning('quests.updateQuest_permission_denied', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestVersionConflictError as e:
        logger.warning('quests.updateQuest_version_conflict', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=409, detail="Quest was modified by another operation")
    except QuestDBError as e:
        logger.error('quests.updateQuest_failed', 
                    user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update quest")


@app.post("/quests/quests/{quest_id}/cancel", response_model=QuestResponse)
async def cancel_quest_endpoint(
    quest_id: str,
    payload: QuestCancelPayload = Body(...),
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Cancel a quest (active -> cancelled).
    
    Args:
        quest_id: Quest ID
        payload: Quest cancellation payload
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        QuestResponse object
        
    Raises:
        HTTPException: If quest cancellation fails
    """
    log_event(logger, 'quests.cancelQuest_start', 
             user_id=auth.user_id, quest_id=quest_id)
    
    try:
        # Change quest status to cancelled
        quest = change_quest_status(auth.user_id, quest_id, "cancelled", 
                                  payload.reason if payload else None)
        
        log_event(logger, 'quests.cancelQuest_success', 
                 user_id=auth.user_id, quest_id=quest_id)
        
        return quest
        
    except QuestNotFoundError as e:
        logger.warning('quests.cancelQuest_not_found', 
                      user_id=auth.user_id, quest_id=quest_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except QuestPermissionError as e:
        logger.warning('quests.cancelQuest_permission_denied', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestDBError as e:
        logger.error('quests.cancelQuest_failed', 
                    user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to cancel quest")


@app.post("/quests/quests/{quest_id}/fail", response_model=QuestResponse)
async def fail_quest_endpoint(
    quest_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Mark a quest as failed (active -> failed).
    
    Args:
        quest_id: Quest ID
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        QuestResponse object
        
    Raises:
        HTTPException: If quest failure marking fails
    """
    log_event(logger, 'quests.failQuest_start', 
             user_id=auth.user_id, quest_id=quest_id)
    
    try:
        # Change quest status to failed
        quest = change_quest_status(auth.user_id, quest_id, "failed")
        
        log_event(logger, 'quests.failQuest_success', 
                 user_id=auth.user_id, quest_id=quest_id)
        
        return quest
        
    except QuestNotFoundError as e:
        logger.warning('quests.failQuest_not_found', 
                      user_id=auth.user_id, quest_id=quest_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except QuestPermissionError as e:
        logger.warning('quests.failQuest_permission_denied', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestDBError as e:
        logger.error('quests.failQuest_failed', 
                    user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to mark quest as failed")


@app.delete("/quests/quests/{quest_id}")
async def delete_quest_endpoint(
    quest_id: str,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    """
    Delete a quest (admin-only for active+ quests).
    
    Args:
        quest_id: Quest ID
        auth: Authentication context
        table: DynamoDB table resource
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If quest deletion fails
    """
    log_event(logger, 'quests.deleteQuest_start', 
             user_id=auth.user_id, quest_id=quest_id)
    
    try:
        # Check if user has admin role
        is_admin = auth.claims.get('role') == 'admin'
        
        # Delete quest using database helper
        success = delete_quest(auth.user_id, quest_id, is_admin)
        
        if success:
            log_event(logger, 'quests.deleteQuest_success', 
                     user_id=auth.user_id, quest_id=quest_id)
            return {"message": "Quest deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete quest")
        
    except QuestNotFoundError as e:
        logger.warning('quests.deleteQuest_not_found', 
                      user_id=auth.user_id, quest_id=quest_id)
        raise HTTPException(status_code=404, detail="Quest not found")
    except QuestPermissionError as e:
        logger.warning('quests.deleteQuest_permission_denied', 
                      user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except QuestDBError as e:
        logger.error('quests.deleteQuest_failed', 
                    user_id=auth.user_id, quest_id=quest_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete quest")


class QuestCompletionRequest(BaseModel):
    completed_task_id: str
    completed_goal_id: str

@app.post("/quests/check-completion")
async def check_quest_completion(
    request: QuestCompletionRequest,
    auth: AuthContext = Depends(authenticate),
    table=Depends(get_goals_table),
):
    logger.info('quests.checkCompletion_endpoint_called', user_id=auth.user_id, task_id=request.completed_task_id, goal_id=request.completed_goal_id)
    """
    Check and auto-complete quests when a task is completed.
    This endpoint is called by the goals service when a task is marked as completed.
    Accessible via API Gateway.
    """
    try:
        logger.info('quests.checkCompletion_started', 
                   user_id=auth.user_id,
                   task_id=request.completed_task_id,
                   goal_id=request.completed_goal_id,
                   timestamp=time.time())
        
        # Import the quest auto-completion function
        from .db.quest_db import check_and_complete_quests
        
        logger.info('quests.checkCompletion_calling_function',
                   user_id=auth.user_id,
                   function='check_and_complete_quests')

        # Add a small delay to allow DynamoDB eventual consistency to propagate
        import asyncio
        await asyncio.sleep(0.1)  # 100ms delay

        # Check and complete quests
        result = await check_and_complete_quests(
            user_id=auth.user_id,
            completed_task_id=request.completed_task_id,
            completed_goal_id=request.completed_goal_id
        )
        
        logger.info('quests.checkCompletion_finished', 
                   user_id=auth.user_id,
                   completed_quests=result['completed_quests'],
                   errors=result['errors'],
                   result_summary={
                       'total_completed': len(result['completed_quests']),
                       'total_errors': len(result['errors']),
                       'completed_quest_ids': result['completed_quests'],
                       'error_messages': result['errors']
                   })
        
        return {
            "success": True,
            "completed_quests": result['completed_quests'],
            "errors": result['errors']
        }
        
    except Exception as e:
        logger.error('quests.checkCompletion_failed', 
                    user_id=auth.user_id,
                    task_id=request.completed_task_id,
                    goal_id=request.completed_goal_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    exc_info=e)
        raise HTTPException(status_code=500, detail="Failed to check quest completion")


# ============================================================================
# Quest Template Endpoints
# ============================================================================

@app.post("/quests/templates", response_model=QuestTemplateResponse, status_code=201)
async def create_quest_template(
    payload: QuestTemplateCreatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a new quest template"""
    log_event(logger, 'quest_template.create_start', user_id=auth.user_id, title=payload.title)
    
    try:
        template = create_template(auth.user_id, payload)
        log_event(logger, 'quest_template.create_success', user_id=auth.user_id, template_id=template.id)
        return template
    except QuestTemplateValidationError as e:
        log_event(logger, 'quest_template.create_validation_error', user_id=auth.user_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.create_db_error', user_id=auth.user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create quest template")


@app.get("/quests/analytics", response_model=QuestAnalytics)
async def get_quest_template(
    template_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get a quest template by ID"""
    log_event(logger, 'quest_template.get_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        template = get_template(template_id, auth.user_id)
        log_event(logger, 'quest_template.get_success', user_id=auth.user_id, template_id=template_id)
        return template
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.get_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.get_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.get_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get quest template")


@app.put("/quests/templates/{template_id}", response_model=QuestTemplateResponse)
async def update_quest_template(
    template_id: str,
    payload: QuestTemplateUpdatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Update a quest template"""
    log_event(logger, 'quest_template.update_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        template = update_template(template_id, auth.user_id, payload)
        log_event(logger, 'quest_template.update_success', user_id=auth.user_id, template_id=template_id)
        return template
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.update_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.update_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateValidationError as e:
        log_event(logger, 'quest_template.update_validation_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.update_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update quest template")


@app.delete("/quests/templates/{template_id}")
async def delete_quest_template(
    template_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete a quest template"""
    log_event(logger, 'quest_template.delete_start', user_id=auth.user_id, template_id=template_id)
    
    try:
        delete_template(template_id, auth.user_id)
        log_event(logger, 'quest_template.delete_success', user_id=auth.user_id, template_id=template_id)
        return {"success": True, "message": "Quest template deleted successfully"}
    except QuestTemplateNotFoundError as e:
        log_event(logger, 'quest_template.delete_not_found', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=404, detail=str(e))
    except QuestTemplatePermissionError as e:
        log_event(logger, 'quest_template.delete_permission_error', user_id=auth.user_id, template_id=template_id)
        raise HTTPException(status_code=403, detail=str(e))
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.delete_db_error', user_id=auth.user_id, template_id=template_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete quest template")


@app.get("/quests/templates", response_model=QuestTemplateListResponse)
async def list_quest_templates(
    auth: AuthContext = Depends(authenticate),
    limit: int = 50,
    next_token: str = None,
    privacy: str = "user"  # "user", "public", "all"
):
    """List quest templates"""
    log_event(logger, 'quest_template.list_start', user_id=auth.user_id, limit=limit, privacy=privacy)
    
    try:
        if privacy == "public":
            result = list_public_templates(limit, next_token)
        else:
            result = list_user_templates(auth.user_id, limit, next_token)
        
        log_event(logger, 'quest_template.list_success', 
                 user_id=auth.user_id, 
                 count=len(result['templates']), 
                 total=result['total'])
        
        return QuestTemplateListResponse(**result)
    except QuestTemplateDBError as e:
        log_event(logger, 'quest_template.list_db_error', user_id=auth.user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list quest templates")
    except Exception as e:
        log_event(logger, 'quest_template.list_unexpected_error', user_id=auth.user_id, error=str(e), error_type=type(e).__name__)
        # Return empty list instead of error if user has no templates
        return QuestTemplateListResponse(templates=[], total=0, hasMore=False, nextToken=None)


@app.get("/quests/analytics", response_model=QuestAnalytics)
async def get_quest_analytics(
    auth: AuthContext = Depends(authenticate),
    period: AnalyticsPeriod = "weekly",
    force_refresh: bool = False
):
    """
    Get quest analytics for the authenticated user.
    
    Args:
        auth: Authentication context
        period: Analytics period (daily, weekly, monthly, allTime)
        force_refresh: Force refresh of cached analytics data
    
    Returns:
        QuestAnalytics: Comprehensive analytics data
    """
    log_event(logger, 'quest_analytics.get_start', 
             user_id=auth.user_id, period=period, force_refresh=force_refresh)
    
    try:
        # Try to get cached analytics first (unless force refresh)
        if not force_refresh:
            try:
                cached_analytics = get_cached_analytics(auth.user_id, period)
                if cached_analytics:
                    log_event(logger, 'quest_analytics.get_cached_success', 
                             user_id=auth.user_id, period=period)
                    return cached_analytics
            except AnalyticsDBError:
                # Cache miss or error, continue to calculate
                pass
        
        # Get user's quests for the period
        quests = list_user_quests(auth.user_id)  # Get all quests for analytics
        
        # Calculate analytics
        analytics = calculate_quest_analytics(auth.user_id, period, quests)
        
        # Save to cache
        try:
            cache_analytics(analytics)
        except AnalyticsDBError as e:
            log_event(logger, 'quest_analytics.save_cache_error', 
                     user_id=auth.user_id, error=str(e))
            # Continue without caching if save fails
        
        log_event(logger, 'quest_analytics.get_success', 
                 user_id=auth.user_id, period=period, 
                 total_quests=analytics.totalQuests)
        
        return analytics
        
    except Exception as e:
        log_event(logger, 'quest_analytics.get_error', 
                 user_id=auth.user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get quest analytics")


# Lambda handler for both GraphQL resolvers and API Gateway requests
def lambda_handler(event, context):
    """
    Lambda handler for GraphQL resolver invocations and API Gateway requests
    """
    try:
        # Check if this is an API Gateway request
        if 'httpMethod' in event and 'path' in event:
            # This is an API Gateway request, use the FastAPI app
            # Note: mangum import is done here to avoid import-time dependency issues
            try:
                from mangum import Mangum  # type: ignore
                handler = Mangum(app)
                return handler(event, context)
            except ImportError:
                # Fallback if mangum is not available
                logger.error('mangum_import_failed', exc_info=True)
                return {
                    'statusCode': 500,
                    'body': '{"error": "Mangum adapter not available"}',
                    'headers': {'Content-Type': 'application/json'}
                }
        
        # Otherwise, handle as GraphQL resolver
        operation = event.get('operation')
        
        if operation == 'getGoalProgress':
            goal_id = event.get('goalId')
            user_id = event.get('userId')
            
            if not goal_id or not user_id:
                raise Exception('Missing required parameters: goalId and userId')
            
            # Get DynamoDB table
            table = get_goals_table()
            
            # Calculate progress
            progress_data = compute_goal_progress(goal_id, user_id, table)
            
            return progress_data.dict()
            
        elif operation == 'getAllGoalsProgress':
            user_id = event.get('userId')
            
            if not user_id:
                raise Exception('Missing required parameters: userId')
            
            # Get DynamoDB table
            table = get_goals_table()
            
            # Get all user goals
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("GOAL#")
            )
            goals = response.get("Items", [])
            
            # Calculate progress for each goal
            progress_list = []
            for goal in goals:
                goal_id = goal.get("id")
                if goal_id:
                    try:
                        progress_data = compute_goal_progress(goal_id, user_id, table)
                        progress_list.append(progress_data.dict())
                    except Exception as exc:
                        logger.error('progress.calculation_failed', goal_id=goal_id, user_id=user_id, exc_info=exc)
                        continue
            
            return progress_list
            
        elif operation == 'getMyGoalsWithCollaboration':
            user_id = event.get('userId')
            
            if not user_id:
                raise Exception('Missing required parameters: userId')
            
            # Get DynamoDB table
            table = get_goals_table()
            
            # Get owned goals
            owned_goals = []
            try:
                response = table.query(
                    KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("GOAL#")
                )
                owned_goals = response.get("Items", [])
            except Exception as e:
                logger.error(f"Failed to get owned goals for user {user_id}: {str(e)}")
            
            # Get collaborated goals
            collaborated_goals = []
            try:
                # Query GSI1 for user's collaborations
                gsi1pk = f"USER#{user_id}"
                collaborator_response = table.query(
                    IndexName="GSI1",
                    KeyConditionExpression=Key("GSI1PK").eq(gsi1pk) & Key("GSI1SK").begins_with("COLLAB#GOAL#"),
                    ScanIndexForward=False
                )
                
                # For each collaboration, get the actual goal from the owner
                for collab_item in collaborator_response.get("Items", []):
                    try:
                        # Extract goal ID from GSI1SK (COLLAB#GOAL#{goal_id})
                        gsi1sk = collab_item.get("GSI1SK", "")
                        if gsi1sk.startswith("COLLAB#GOAL#"):
                            goal_id = gsi1sk.replace("COLLAB#GOAL#", "")
                            
                            # Find the owner by scanning for the goal
                            owner_scan = table.scan(
                                FilterExpression=Attr("type").eq("Goal") & Attr("id").eq(goal_id),
                                ProjectionExpression="PK",
                                Limit=1
                            )
                            
                            if owner_scan.get("Items"):
                                owner_pk = owner_scan["Items"][0]["PK"]
                                owner_user_id = owner_pk.replace("USER#", "")
                                
                                # Get the goal from the owner
                                goal_response = table.get_item(
                                    Key={"PK": f"USER#{owner_user_id}", "SK": f"GOAL#{goal_id}"}
                                )
                                
                                if "Item" in goal_response:
                                    collaborated_goals.append(goal_response["Item"])
                    except Exception as e:
                        logger.warning(f"Failed to get collaborated goal: {str(e)}")
                        continue
                        
            except Exception as e:
                logger.error(f"Failed to get collaborated goals for user {user_id}: {str(e)}")
            
            # Combine and transform goals
            all_goals = owned_goals + collaborated_goals
            
            # Transform to GraphQL format
            goals_data = []
            for goal in all_goals:
                try:
                    goal_data = {
                        "id": goal.get("id"),
                        "userId": goal.get("userId"),
                        "title": goal.get("title"),
                        "description": goal.get("description", ""),
                        "category": goal.get("category"),
                        "tags": goal.get("tags", []),
                        "deadline": goal.get("deadline"),
                        "status": goal.get("status", "active"),
                        "createdAt": goal.get("createdAt", 0),
                        "updatedAt": goal.get("updatedAt", 0),
                        "answers": goal.get("answers", [])
                    }
                    goals_data.append(goal_data)
                except Exception as e:
                    logger.warning(f"Failed to transform goal {goal.get('id', 'unknown')}: {str(e)}")
                    continue
            
            return {"goals": goals_data}
            
        elif operation == 'getGoalWithAccess':
            user_id = event.get('userId')
            goal_id = event.get('goalId')
            
            if not user_id or not goal_id:
                raise Exception('Missing required parameters: userId and goalId')
            
            # Get DynamoDB table
            table = get_goals_table()
            
            # Check if user has access to the goal
            has_access, access_type, owner_user_id = check_goal_access(user_id, goal_id, table)
            
            if not has_access:
                logger.warning('goal.access_denied_graphql', 
                             user_id=user_id, 
                             goal_id=goal_id)
                return {"error": "Goal not found"}
            
            # Use the actual owner's user_id to get the goal
            goal_user_id = owner_user_id if owner_user_id else user_id
            
            try:
                # Get the goal from the owner
                response = table.get_item(
                    Key={"PK": f"USER#{goal_user_id}", "SK": f"GOAL#{goal_id}"}
                )
                
                if "Item" not in response:
                    logger.warning('goal.not_found_graphql', 
                                 user_id=user_id, 
                                 goal_id=goal_id,
                                 goal_user_id=goal_user_id)
                    return {"error": "Goal not found"}
                
                goal_item = response["Item"]
                
                logger.info('goal.access_granted_graphql', 
                           user_id=user_id, 
                           goal_id=goal_id,
                           access_type=access_type,
                           goal_user_id=goal_user_id)
                
                # Transform to GraphQL format
                goal_data = {
                    "id": goal_item.get("id"),
                    "userId": goal_item.get("userId"),
                    "title": goal_item.get("title"),
                    "description": goal_item.get("description", ""),
                    "category": goal_item.get("category"),
                    "tags": goal_item.get("tags", []),
                    "deadline": goal_item.get("deadline"),
                    "status": goal_item.get("status", "active"),
                    "createdAt": goal_item.get("createdAt", 0),
                    "updatedAt": goal_item.get("updatedAt", 0),
                    "answers": goal_item.get("answers", []),
                    "progress": goal_item.get("progress"),
                    "milestones": goal_item.get("milestones", []),
                    "completedTasks": goal_item.get("completedTasks"),
                    "totalTasks": goal_item.get("totalTasks")
                }
                
                return {"goal": goal_data}
                
            except Exception as e:
                logger.error('goal.get_failed_graphql', 
                           user_id=user_id, 
                           goal_id=goal_id,
                           error=str(e),
                           exc_info=e)
                return {"error": "Failed to get goal"}
        
        else:
            raise Exception(f'Unknown operation: {operation}')
            
    except Exception as exc:
        logger.error('lambda_handler.error', exc_info=exc)
        raise exc
