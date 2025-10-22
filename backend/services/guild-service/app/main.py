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
from fastapi import Body, Depends, FastAPI, HTTPException, Query, Request, UploadFile, File
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from .models import (
    GuildCreatePayload, GuildUpdatePayload, GuildResponse, GuildListResponse,
    GuildMemberResponse, GuildJoinRequestPayload, GuildJoinRequestResponse,
    GuildJoinRequestListResponse, TransferOwnershipPayload, ModerationActionPayload, 
    AvatarUploadResponse, AvatarGetResponse, GuildNameCheckRequest, GuildNameCheckResponse
)
from .db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild, list_user_guilds,
    list_guilds, join_guild, leave_guild, remove_user_from_guild,
    get_guild_rankings, update_guild_ranking, calculate_guild_rankings,
    check_guild_name_availability, create_guild_comment, get_guild_comments,
    update_guild_comment, delete_guild_comment, like_guild_comment,
    create_join_request, get_guild_join_requests, approve_join_request, reject_join_request,
    has_pending_join_request,
    perform_moderation_action, assign_moderator, remove_moderator,
    GuildDBError, GuildNotFoundError, GuildPermissionError, GuildValidationError, GuildConflictError
)
from .security.validation import validate_user_id, SecurityValidationError
from .security.audit_logger import get_audit_logger, AuditEventType
from .security.auth_models import AuthContext
from .security.authentication import authenticate
from .settings import Settings
from .api.avatar import router as avatar_router
from .api.comments import router as comments_router
from .api.members import router as members_router
from .api.moderation import router as moderation_router
from common.logging import log_event
# TODO: Implement these modules
# from .db.guild_member_db import (
#     get_guild_members, add_guild_member, remove_guild_member, update_member_role,
#     block_user, unblock_user, toggle_comment_permission
# )
# from .db.guild_join_request_db import (
#     create_join_request, get_join_requests, approve_join_request, reject_join_request
# )
# from .db.guild_comment_db import (
#     create_comment, get_comments, update_comment, delete_comment, like_comment
# )
# from .db.guild_ranking_db import (
#     calculate_guild_rankings, get_guild_rankings, update_guild_ranking
# )
# from .analytics.guild_analytics import calculate_guild_analytics

# Stub functions for missing modules
async def get_guild_members(guild_id: str, limit: int = 50, offset: int = 0, role: str = None):
    """Stub function for get_guild_members."""
    return {"members": [], "total": 0, "limit": limit, "offset": offset, "has_more": False}

async def block_user(guild_id: str, user_id: str, blocked_by: str):
    """Block a user from commenting in the guild."""
    from .db.guild_db import perform_moderation_action
    await perform_moderation_action(
        guild_id=guild_id,
        action='block_user',
        target_user_id=user_id,
        comment_id=None,
        reason='Blocked by moderator',
        performed_by=blocked_by
    )

async def unblock_user(guild_id: str, user_id: str, unblocked_by: str):
    """Unblock a user from commenting in the guild."""
    from .db.guild_db import perform_moderation_action
    await perform_moderation_action(
        guild_id=guild_id,
        action='unblock_user',
        target_user_id=user_id,
        comment_id=None,
        reason='Unblocked by moderator',
        performed_by=unblocked_by
    )

async def toggle_comment_permission(guild_id: str, user_id: str, can_comment: bool, updated_by: str):
    """Stub function for toggle_comment_permission."""
    raise NotImplementedError("toggle_comment_permission not implemented yet")

# Join request functions are now imported from guild_db.py

async def create_comment(guild_id: str, user_id: str, content: str, parent_comment_id: Optional[str] = None, auth: AuthContext = None):
    """Create a comment in the guild."""
    try:
        # Get user information from guild membership
        guild = await get_guild(guild_id, include_members=True)
        if not guild:
            raise GuildNotFoundError(f"Guild {guild_id} not found")
        
        # Find the user's role in the guild
        if not guild.members:
            raise GuildPermissionError(f"Guild {guild_id} has no members data")
        
        user_member = None
        for member in guild.members:
            if member.user_id == user_id:
                user_member = member
                break
        
        if not user_member:
            raise GuildPermissionError(f"User {user_id} is not a member of guild {guild_id}")
        
        # Use nickname from JWT token if available, fallback to username from guild membership
        username = "Unknown"
        if auth and auth.claims:
            username = (
                auth.claims.get('nickname')
                or auth.claims.get('name')
                or auth.claims.get('preferred_username')
                or auth.claims.get('username')
                or user_member.username
                or "Unknown"
            )
        else:
            username = user_member.username or "Unknown"
        
        user_role = user_member.role
        
        comment = await create_guild_comment(
            guild_id=guild_id,
            user_id=user_id,
            username=username,
            content=content,
            user_role=user_role,
            parent_comment_id=parent_comment_id
        )
        return comment
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise

async def get_comments(guild_id: str, limit: int = 50, offset: int = 0, current_user_id: str = None):
    """Get comments for a guild."""
    try:
        comments = await get_guild_comments(guild_id, current_user_id)
        return {
            "comments": comments,
            "total": len(comments),
            "limit": limit,
            "offset": offset,
            "has_more": len(comments) > offset + limit
        }
    except Exception as e:
        logger.error(f"Error getting comments: {str(e)}")
        raise

async def update_comment(guild_id: str, comment_id: str, user_id: str, content: str):
    """Update a comment in the guild."""
    try:
        comment = await update_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            content=content,
            user_id=user_id
        )
        return comment
    except Exception as e:
        logger.error(f"Error updating comment: {str(e)}")
        raise

async def delete_comment(guild_id: str, comment_id: str, deleted_by: str):
    """Delete a comment from the guild."""
    try:
        await delete_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id
        )
        return {"message": "Comment deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting comment: {str(e)}")
        raise

async def like_comment(guild_id: str, comment_id: str, user_id: str):
    """Like or unlike a comment."""
    try:
        await like_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            user_id=user_id
        )
        return {"message": "Comment liked successfully"}
    except Exception as e:
        logger.error(f"Error liking comment: {str(e)}")
        raise

# Real ranking functions are now imported from guild_db

async def calculate_guild_analytics(guild_id: str):
    """Calculate comprehensive analytics for a guild."""
    try:
        # Get guild data
        guild = await get_guild(guild_id)
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        # Get guild members
        members = guild.members or []
        total_members = len(members)
        active_members = len([m for m in members if m.last_seen_at and 
                             (datetime.now() - m.last_seen_at).days <= 7])
        
        # Get guild goals and quests
        goals = guild.goals or []
        quests = guild.quests or []
        
        total_goals = len(goals)
        completed_goals = len([g for g in goals if g.get('status') == 'completed'])
        
        total_quests = len(quests)
        completed_quests = len([q for q in quests if q.get('status') == 'completed'])
        
        # Calculate completion rates
        goal_completion_rate = (completed_goals / total_goals * 100) if total_goals > 0 else 0
        quest_completion_rate = (completed_quests / total_quests * 100) if total_quests > 0 else 0
        
        # Calculate activity metrics
        weekly_activity = min(active_members / total_members * 100, 100) if total_members > 0 else 0
        monthly_activity = min(active_members / total_members * 80, 100) if total_members > 0 else 0
        
        # Generate member leaderboard (top 10)
        member_leaderboard = []
        for member in members[:10]:
            member_leaderboard.append({
                'user_id': member.user_id,
                'username': member.username,
                'avatar_url': member.avatar_url,
                'activity_score': getattr(member, 'activity_score', 0),
                'goals_completed': getattr(member, 'goals_completed', 0),
                'quests_completed': getattr(member, 'quests_completed', 0),
                'joined_at': member.joined_at.isoformat() if member.joined_at else None,
                'last_seen_at': member.last_seen_at.isoformat() if member.last_seen_at else None
            })
        
        # Sort by activity score
        member_leaderboard.sort(key=lambda x: x['activity_score'], reverse=True)
        
        # Calculate trends (mock data for now)
        weekly_trend = {
            'members': [total_members - 2, total_members - 1, total_members],
            'goals': [total_goals - 1, total_goals, total_goals + 1],
            'quests': [total_quests - 1, total_quests, total_quests + 1]
        }
        
        monthly_trend = {
            'members': [total_members - 5, total_members - 3, total_members - 1, total_members],
            'goals': [total_goals - 3, total_goals - 1, total_goals, total_goals + 1],
            'quests': [total_quests - 2, total_quests - 1, total_quests, total_quests + 1]
        }
        
        # Return analytics data
        return {
            'guild_id': guild_id,
            'guild_name': guild.name,
            'guild_type': guild.guild_type.value if hasattr(guild.guild_type, 'value') else str(guild.guild_type),
            'created_at': guild.created_at.isoformat() if guild.created_at else None,
            'last_activity_at': guild.updated_at.isoformat() if guild.updated_at else None,
            
            # Basic metrics
            'total_members': total_members,
            'active_members': active_members,
            'total_goals': total_goals,
            'completed_goals': completed_goals,
            'total_quests': total_quests,
            'completed_quests': completed_quests,
            
            # Activity metrics
            'weekly_activity': round(weekly_activity, 2),
            'monthly_activity': round(monthly_activity, 2),
            'average_goal_completion': round(goal_completion_rate, 2),
            'average_quest_completion': round(quest_completion_rate, 2),
            
            # Member leaderboard
            'member_leaderboard': member_leaderboard,
            
            # Trends
            'weekly_trend': weekly_trend,
            'monthly_trend': monthly_trend,
            
            # Performance indicators
            'performance_score': round((weekly_activity + goal_completion_rate + quest_completion_rate) / 3, 2),
            'engagement_level': 'high' if weekly_activity > 70 else 'medium' if weekly_activity > 40 else 'low',
            'growth_rate': round((total_members / max(1, total_goals + total_quests)) * 100, 2)
        }
        
    except Exception as e:
        logger.error("Error calculating guild analytics", extra={"guild_id": guild_id, "error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate guild analytics")
# TODO: Implement these modules
# from .utils import (
#     _normalize_date_only, _sanitize_string, _validate_tags, _validate_guild_name,
#     _validate_guild_description, _validate_guild_type
# )
# from .security.input_validation import (
#     validate_user_id, validate_guild_name, validate_guild_description,
#     validate_guild_type, validate_tags, validate_moderation_action,
#     SecurityValidationError
# )
# from .security.audit_logger import get_audit_logger, AuditEventType

# Stub functions for missing utils
def _normalize_date_only(date_str: str) -> str:
    """Stub function for _normalize_date_only."""
    return date_str

def _sanitize_string(text: str) -> str:
    """Stub function for _sanitize_string."""
    return text.strip() if text else ""

def _validate_tags(tags: list) -> list:
    """Stub function for _validate_tags."""
    return tags if tags else []

def _validate_guild_name(name: str) -> str:
    """Stub function for _validate_guild_name."""
    return name.strip() if name else ""

def _validate_guild_description(description: str) -> str:
    """Stub function for _validate_guild_description."""
    return description.strip() if description else ""

def _validate_guild_type(guild_type: str) -> str:
    """Stub function for _validate_guild_type."""
    return guild_type if guild_type in ['public', 'private', 'approval'] else 'public'

# Stub functions for missing security
def validate_user_id(user_id: str) -> str:
    """Stub function for validate_user_id."""
    return user_id

def validate_guild_name(name: str) -> str:
    """Stub function for validate_guild_name."""
    return name.strip() if name else ""

def validate_guild_description(description: str) -> str:
    """Stub function for validate_guild_description."""
    return description.strip() if description else ""

def validate_guild_type(guild_type: str) -> str:
    """Stub function for validate_guild_type."""
    return guild_type if guild_type in ['public', 'private', 'approval'] else 'public'

def validate_tags(tags: list) -> list:
    """Stub function for validate_tags."""
    return tags if tags else []

def validate_moderation_action(action: str) -> str:
    """Stub function for validate_moderation_action."""
    return action

class SecurityValidationError(Exception):
    """Stub exception for SecurityValidationError."""
    pass

def get_audit_logger():
    """Stub function for get_audit_logger."""
    return None

class AuditEventType:
    """Stub class for AuditEventType."""
    GUILD_CREATED = "guild_created"
    GUILD_UPDATED = "guild_updated"
    GUILD_DELETED = "guild_deleted"
    MEMBER_JOINED = "member_joined"
    MEMBER_LEFT = "member_left"
    MEMBER_REMOVED = "member_removed"

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
s3_client = boto3_session.client('s3', config=AWS_CONFIG)

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
# TODO: Implement these modules
# from common.auth import get_current_user, verify_token
# from common.exceptions import (
#     AuthenticationError, AuthorizationError, ValidationError, 
#     ResourceNotFoundError, ConflictError, RateLimitError
# )

# Authentication imports
from .auth import TokenVerificationError, TokenVerifier
from .settings import Settings

# Initialize settings
settings = Settings()

@lru_cache(maxsize=1)
def _token_verifier() -> TokenVerifier:
    return TokenVerifier(settings)


# JWT verification is now handled by the TokenVerifier class

# Stub functions for missing implementations
def transfer_guild_ownership(guild_id: str, new_owner_id: str, current_owner_id: str):
    """Transfer guild ownership."""
    # TODO: Implement guild ownership transfer
    pass

# assign_moderator function is now properly implemented in db/guild_db.py

def remove_moderator(guild_id: str, user_id: str, removed_by: str):
    """Remove moderator role from user."""
    # TODO: Implement moderator removal
    pass

# Stub exceptions for missing exceptions module
class AuthenticationError(Exception):
    """Stub exception for AuthenticationError."""
    pass

class AuthorizationError(Exception):
    """Stub exception for AuthorizationError."""
    pass

class ValidationError(Exception):
    """Stub exception for ValidationError."""
    pass

class ResourceNotFoundError(Exception):
    """Stub exception for ResourceNotFoundError."""
    pass

class ConflictError(Exception):
    """Stub exception for ConflictError."""
    pass

class RateLimitError(Exception):
    """Stub exception for RateLimitError."""
    pass

# Initialize logger
logger = get_structured_logger(__name__, env_flag="GUILD_STRUCTURED_LOGGING")

# Initialize FastAPI app
app = FastAPI(
    title="GoalsGuild Guild Service",
    description="Guild management service for GoalsGuild platform",
    version="1.0.0",
    docs_url="/docs" if os.getenv('ENVIRONMENT') != 'prod' else None,
    redoc_url="/redoc" if os.getenv('ENVIRONMENT') != 'prod' else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(avatar_router)
app.include_router(comments_router)
app.include_router(members_router)
app.include_router(moderation_router)


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("Validation error", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": exc.errors()}
    )

@app.exception_handler(AuthenticationError)
async def authentication_exception_handler(request: Request, exc: AuthenticationError):
    logger.warning("Authentication error", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=401,
        content={"detail": "Authentication required"}
    )

@app.exception_handler(AuthorizationError)
async def authorization_exception_handler(request: Request, exc: AuthorizationError):
    logger.warning("Authorization error", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=403,
        content={"detail": "Insufficient permissions"}
    )

@app.exception_handler(ResourceNotFoundError)
async def not_found_exception_handler(request: Request, exc: ResourceNotFoundError):
    logger.info("Resource not found", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)}
    )

@app.exception_handler(ConflictError)
async def conflict_exception_handler(request: Request, exc: ConflictError):
    logger.warning("Conflict error", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=409,
        content={"detail": str(exc)}
    )

@app.exception_handler(RateLimitError)
async def rate_limit_exception_handler(request: Request, exc: RateLimitError):
    logger.warning("Rate limit exceeded", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unexpected error", extra={"error": str(exc), "path": request.url.path}, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancer."""
    return {"status": "healthy", "service": "guild-service", "timestamp": datetime.datetime.utcnow().isoformat()}

# Guild CRUD operations
@app.post("/guilds", response_model=GuildResponse)
async def create_guild_endpoint(
    guild_data: GuildCreatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a new guild."""
    try:
        # Validate input
        validate_guild_name(guild_data.name)
        if guild_data.description:
            validate_guild_description(guild_data.description)
        validate_guild_type(guild_data.guild_type)
        if guild_data.tags:
            validate_tags(guild_data.tags)
        
        # Extract display nickname from JWT claims (prefer nickname)
        username = (
            auth.claims.get('nickname')
            or auth.claims.get('name')
            or auth.claims.get('preferred_username')
            or auth.claims.get('username')
            or 'Unknown'
        )
        
        # Create guild
        guild = await create_guild(
            name=guild_data.name,
            description=guild_data.description,
            guild_type=guild_data.guild_type,
            tags=guild_data.tags or [],
            created_by=auth.user_id,
            created_by_username=username,
            settings=guild_data.settings
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_CREATED,
                user_id=auth.user_id,
                resource_id=guild.guild_id,
                details={"guild_name": guild.name, "guild_type": guild.guild_type}
            )
        
        return guild
        
    except SecurityValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GuildDBError as e:
        logger.error("Database error creating guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to create guild")
    except Exception as e:
        logger.error("Unexpected error creating guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild rankings - must be before /guilds/{guild_id} route
@app.get("/guilds/rankings")
async def get_guild_rankings_endpoint(
    limit: int = 50,
    auth: AuthContext = Depends(authenticate)
):
    """Get guild rankings."""
    try:
        rankings = await get_guild_rankings(limit=limit)
        return {"rankings": rankings}
        
    except GuildDBError as e:
        logger.error("Database error getting guild rankings", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to get guild rankings")
    except Exception as e:
        logger.error("Unexpected error getting guild rankings", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/guilds/{guild_id}", response_model=GuildResponse)
async def get_guild_endpoint(
    guild_id: str,
    include_members: bool = False,
    include_goals: bool = False,
    include_quests: bool = False,
    auth: AuthContext = Depends(authenticate)
):
    """Get guild details."""
    try:
        # Validate guild_id
        if not guild_id or guild_id == "undefined" or guild_id == "null":
            raise HTTPException(status_code=400, detail="Invalid guild ID")
        
        guild = await get_guild(
            guild_id=guild_id,
            include_members=include_members,
            include_goals=include_goals,
            include_quests=include_quests,
            current_user_id=auth.user_id
        )
        
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        return guild
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildDBError as e:
        logger.error("Database error getting guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to get guild")
    except Exception as e:
        logger.error("Unexpected error getting guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/guilds/{guild_id}", response_model=GuildResponse)
async def update_guild_endpoint(
    guild_id: str,
    guild_data: GuildUpdatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Update guild details."""
    try:
        # Validate input
        if guild_data.name:
            validate_guild_name(guild_data.name)
        if guild_data.description:
            validate_guild_description(guild_data.description)
        if guild_data.guild_type:
            validate_guild_type(guild_data.guild_type)
        if guild_data.tags:
            validate_tags(guild_data.tags)
        
        # Update guild
        guild = await update_guild(
            guild_id=guild_id,
            updated_by=auth.user_id,
            **guild_data.dict(exclude_unset=True)
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_UPDATED,
                user_id=auth.user_id,
                resource_id=guild_id,
                details={"updated_fields": list(guild_data.dict(exclude_unset=True).keys())}
            )
        
        return guild
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to update guild")
    except SecurityValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GuildDBError as e:
        logger.error("Database error updating guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to update guild")
    except Exception as e:
        logger.error("Unexpected error updating guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/guilds/{guild_id}")
async def delete_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete a guild."""
    try:
        await delete_guild(guild_id=guild_id, deleted_by=auth.user_id)
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_DELETED,
                user_id=auth.user_id,
                resource_id=guild_id,
                details={}
            )
        
        return {"message": "Guild deleted successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete guild")
    except GuildDBError as e:
        logger.error("Database error deleting guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to delete guild")
    except Exception as e:
        logger.error("Unexpected error deleting guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild name availability check
@app.post("/guilds/check-name", response_model=GuildNameCheckResponse)
async def check_guild_name_endpoint(
    check_data: GuildNameCheckRequest,
    auth: AuthContext = Depends(authenticate)
):
    """Check if a guild name is available."""
    try:
        # Validate the guild name
        validate_guild_name(check_data.name)

        # Check availability in database
        is_available = await check_guild_name_availability(check_data.name)

        return GuildNameCheckResponse(
            available=is_available,
            message="Guild name is available" if is_available else "Guild name is already taken"
        )

    except SecurityValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GuildDBError as e:
        logger.error("Database error checking guild name availability", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to check guild name availability")
    except Exception as e:
        logger.error("Unexpected error checking guild name availability", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild membership operations
@app.post("/guilds/{guild_id}/join")
async def join_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Join a guild."""
    try:
        # Extract username from JWT claims
        username = (
            auth.claims.get('nickname')
            or auth.claims.get('name')
            or auth.claims.get('preferred_username')
            or auth.claims.get('username')
            or 'Unknown'
        )
        
        await join_guild(guild_id=guild_id, user_id=auth.user_id, username=username)
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_JOINED,
                user_id=auth.user_id,
                resource_id=guild_id,
                details={}
            )
        
        return {"message": "Successfully joined guild"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except GuildDBError as e:
        logger.error("Database error joining guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to join guild")
    except Exception as e:
        logger.error("Unexpected error joining guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/leave")
async def leave_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Leave a guild."""
    try:
        await leave_guild(guild_id=guild_id, user_id=auth.user_id)
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_LEFT,
                user_id=auth.user_id,
                resource_id=guild_id,
                details={}
            )
        
        return {"message": "Successfully left guild"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Cannot leave guild")
    except GuildDBError as e:
        logger.error("Database error leaving guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to leave guild")
    except Exception as e:
        logger.error("Unexpected error leaving guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/guilds/{guild_id}/members/{user_id}")
async def remove_user_from_guild_endpoint(
    guild_id: str,
    user_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Remove a user from a guild."""
    try:
        await remove_user_from_guild(
            guild_id=guild_id,
            user_id=user_id,
            removed_by=auth.user_id
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        if audit_logger:
            audit_logger.log_event(
                event_type=AuditEventType.GUILD_MEMBER_REMOVED,
                user_id=auth.user_id,
                resource_id=guild_id,
                details={"removed_user_id": user_id}
            )
        
        return {"message": "User removed from guild successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to remove user")
    except GuildDBError as e:
        logger.error("Database error removing user from guild", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to remove user from guild")
    except Exception as e:
        logger.error("Unexpected error removing user from guild", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild discovery
@app.get("/guilds", response_model=GuildListResponse)
async def list_guilds_endpoint(
    search: Optional[str] = Query(None, description="Search guilds by name or description"),
    guild_type: Optional[str] = Query(None, description="Filter by guild type"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    limit: int = Query(50, ge=1, le=100, description="Number of guilds to return"),
    offset: int = Query(0, ge=0, description="Number of guilds to skip"),
    auth: AuthContext = Depends(authenticate)
):
    """List guilds with optional filtering, search, and pagination."""
    try:
        # Parse tags if provided
        tag_list = tags.split(',') if tags else None
        
        guilds = await list_guilds(
            search=search,
            guild_type=guild_type,
            tags=tag_list,
            limit=limit,
            offset=offset,
            current_user_id=auth.user_id
        )
        
        return guilds
        
    except GuildDBError as e:
        logger.error("Database error listing guilds", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to list guilds")
    except Exception as e:
        logger.error("Unexpected error listing guilds", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/users/{user_id}/guilds", response_model=GuildListResponse)
async def list_user_guilds_endpoint(
    user_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """List guilds for a specific user."""
    try:
        # Validate user access
        if user_id != auth.user_id:
            raise HTTPException(status_code=403, detail="Cannot access other user's guilds")
        
        guilds = await list_user_guilds(user_id=user_id)
        return guilds
        
    except GuildDBError as e:
        logger.error("Database error listing user guilds", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to list user guilds")
    except Exception as e:
        logger.error("Unexpected error listing user guilds", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild rankings route moved to before /guilds/{guild_id} to avoid routing conflicts

@app.post("/guilds/rankings/calculate")
async def calculate_guild_rankings_endpoint(
    auth: AuthContext = Depends(authenticate)
):
    """Calculate guild rankings (admin only)."""
    try:
        await calculate_guild_rankings()
        return {"message": "Guild rankings calculated successfully"}
        
    except GuildDBError as e:
        logger.error("Database error calculating guild rankings", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to calculate guild rankings")
    except Exception as e:
        logger.error("Unexpected error calculating guild rankings", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

## Avatar routes handled by avatar_router (streaming from S3). Removed duplicates here to avoid conflicts.

# Join request operations
@app.post("/guilds/{guild_id}/join-request")
async def create_join_request_endpoint(
    guild_id: str,
    request_data: GuildJoinRequestPayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a join request for an approval-required guild."""
    try:
        # Extract username from JWT claims
        username = (
            auth.claims.get('nickname')
            or auth.claims.get('name')
            or auth.claims.get('preferred_username')
            or auth.claims.get('username')
            or 'Unknown'
        )
        
        join_request = await create_join_request(
            guild_id=guild_id,
            user_id=auth.user_id,
            username=username,
            message=request_data.message
        )
        
        return join_request
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except GuildDBError as e:
        logger.error("Database error creating join request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to create join request")
    except Exception as e:
        logger.error("Unexpected error creating join request", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/guilds/{guild_id}/join-requests", response_model=GuildJoinRequestListResponse)
async def get_join_requests_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get pending join requests for a guild."""
    try:
        requests = await get_guild_join_requests(guild_id=guild_id)
        return GuildJoinRequestListResponse(
            requests=requests,
            total=len(requests)
        )
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to view join requests")
    except GuildDBError as e:
        logger.error("Database error getting join requests", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to get join requests")
    except Exception as e:
        logger.error("Unexpected error getting join requests", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/join-requests/{user_id}/approve")
async def approve_join_request_endpoint(
    guild_id: str,
    user_id: str,
    request: Request,
    auth: AuthContext = Depends(authenticate)
):
    """Approve a join request."""
    try:
        # Parse request body manually to avoid model dependency
        body = await request.json()
        reason = body.get('reason') if body else None
        
        await approve_join_request(
            guild_id=guild_id,
            user_id=user_id,
            approved_by=auth.user_id,
            reason=reason
        )
        
        return {"message": "Join request approved successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to approve join requests")
    except GuildDBError as e:
        logger.error("Database error approving join request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to approve join request")
    except Exception as e:
        logger.error("Unexpected error approving join request", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/join-requests/{user_id}/reject")
async def reject_join_request_endpoint(
    guild_id: str,
    user_id: str,
    request: Request,
    auth: AuthContext = Depends(authenticate)
):
    """Reject a join request."""
    try:
        # Parse request body manually to avoid model dependency
        body = await request.json()
        reason = body.get('reason') if body else None
        
        await reject_join_request(
            guild_id=guild_id,
            user_id=user_id,
            rejected_by=auth.user_id,
            reason=reason
        )
        
        return {"message": "Join request rejected successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to reject join requests")
    except GuildDBError as e:
        logger.error("Database error rejecting join request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to reject join request")
    except Exception as e:
        logger.error("Unexpected error rejecting join request", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/guilds/{guild_id}/join-requests/check")
async def check_pending_join_request_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Check if the current user has a pending join request for the guild."""
    try:
        has_pending = await has_pending_join_request(guild_id=guild_id, user_id=auth.user_id)
        
        return {
            "hasPendingRequest": has_pending
        }
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildDBError as e:
        logger.error("Database error checking pending join request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to check pending join request")
    except Exception as e:
        logger.error("Unexpected error checking pending join request", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Ownership transfer
@app.post("/guilds/{guild_id}/transfer-ownership")
async def transfer_ownership_endpoint(
    guild_id: str,
    transfer_data: TransferOwnershipPayload,
    auth: AuthContext = Depends(authenticate)
):
    """Transfer guild ownership to another member."""
    try:
        await transfer_guild_ownership(
            guild_id=guild_id,
            new_owner_id=transfer_data.new_owner_id,
            reason=transfer_data.reason,
            transferred_by=auth.user_id
        )
        
        return {"message": "Ownership transferred successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to transfer ownership")
    except GuildDBError as e:
        logger.error("Database error transferring ownership", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to transfer ownership")
    except Exception as e:
        logger.error("Unexpected error transferring ownership", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Moderation operations
@app.post("/guilds/{guild_id}/moderation/action")
async def moderation_action_endpoint(
    guild_id: str,
    action_data: dict,
    auth: AuthContext = Depends(authenticate)
):
    """Perform a moderation action on a guild."""
    try:
        # Extract action data
        action = action_data.get('action')
        target_user_id = action_data.get('targetUserId')
        comment_id = action_data.get('commentId')
        reason = action_data.get('reason')
        
        # Validate required fields
        if not action:
            raise HTTPException(status_code=400, detail="Action is required")
        
        # Validate action type
        valid_actions = ['block_user', 'unblock_user', 'remove_comment', 'toggle_comment_permission']
        if action not in valid_actions:
            raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
        
        # Validate target user for user-related actions
        if action in ['block_user', 'unblock_user', 'toggle_comment_permission'] and not target_user_id:
            raise HTTPException(status_code=400, detail="targetUserId is required for this action")
        
        # Validate comment ID for comment-related actions
        if action in ['remove_comment'] and not comment_id:
            raise HTTPException(status_code=400, detail="commentId is required for this action")
        
        # Perform the moderation action
        await perform_moderation_action(
            guild_id=guild_id,
            action=action,
            target_user_id=target_user_id,
            comment_id=comment_id,
            reason=reason,
            performed_by=auth.user_id
        )
        
        return {"message": "Moderation action performed successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to perform moderation actions")
    except GuildDBError as e:
        logger.error("Database error performing moderation action", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to perform moderation action")
    except Exception as e:
        logger.error("Unexpected error performing moderation action", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Moderation operations
@app.get("/guilds/{guild_id}/moderators")
async def get_moderators_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get all moderators of a guild."""
    try:
        # Get guild with members to filter moderators
        guild = await get_guild(guild_id=guild_id, include_members=True)
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        # Filter members with moderator role
        moderators = []
        if guild.members:
            moderators = [
                member for member in guild.members 
                if member.role == 'moderator'
            ]
        
        return {
            "moderators": moderators,
            "total": len(moderators)
        }
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildDBError as e:
        logger.error("Database error getting moderators", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to get moderators")
    except Exception as e:
        logger.error("Unexpected error getting moderators", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/moderators")
async def assign_moderator_endpoint(
    guild_id: str,
    user_id: str = Body(..., embed=True),
    auth: AuthContext = Depends(authenticate)
):
    """Assign a user as a guild moderator."""
    try:
        await assign_moderator(
            guild_id=guild_id,
            user_id=user_id,
            assigned_by=auth.user_id
        )
        
        return {"message": "Moderator assigned successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to assign moderators")
    except GuildDBError as e:
        logger.error("Database error assigning moderator", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to assign moderator")
    except Exception as e:
        logger.error("Unexpected error assigning moderator", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/guilds/{guild_id}/moderators/{user_id}")
async def remove_moderator_endpoint(
    guild_id: str,
    user_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Remove a user as a guild moderator."""
    try:
        await remove_moderator(
            guild_id=guild_id,
            user_id=user_id,
            removed_by=auth.user_id
        )
        
        return {"message": "Moderator removed successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to remove moderators")
    except GuildDBError as e:
        logger.error("Database error removing moderator", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to remove moderator")
    except Exception as e:
        logger.error("Unexpected error removing moderator", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/block-user")
async def block_user_endpoint(
    guild_id: str,
    user_id: str = Body(..., embed=True),
    auth: AuthContext = Depends(authenticate)
):
    """Block a user from commenting in the guild."""
    try:
        await block_user(
            guild_id=guild_id,
            user_id=user_id,
            blocked_by=auth.user_id
        )
        
        return {"message": "User blocked successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to block users")
    except GuildDBError as e:
        logger.error("Database error blocking user", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to block user")
    except Exception as e:
        logger.error("Unexpected error blocking user", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/unblock-user")
async def unblock_user_endpoint(
    guild_id: str,
    user_id: str = Body(..., embed=True),
    auth: AuthContext = Depends(authenticate)
):
    """Unblock a user from commenting in the guild."""
    try:
        await unblock_user(
            guild_id=guild_id,
            user_id=user_id,
            unblocked_by=auth.user_id
        )
        
        return {"message": "User unblocked successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to unblock users")
    except GuildDBError as e:
        logger.error("Database error unblocking user", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to unblock user")
    except Exception as e:
        logger.error("Unexpected error unblocking user", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/comment-permission")
async def toggle_comment_permission_endpoint(
    guild_id: str,
    user_id: str = Body(..., embed=True),
    can_comment: bool = Body(..., embed=True),
    auth: AuthContext = Depends(authenticate)
):
    """Toggle a user's comment permission in the guild."""
    try:
        await toggle_comment_permission(
            guild_id=guild_id,
            user_id=user_id,
            can_comment=can_comment,
            updated_by=auth.user_id
        )
        
        return {"message": "Comment permission updated successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to update comment permissions")
    except GuildDBError as e:
        logger.error("Database error updating comment permission", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to update comment permission")
    except Exception as e:
        logger.error("Unexpected error updating comment permission", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild comments
@app.post("/guilds/{guild_id}/comments")
async def create_comment_endpoint(
    guild_id: str,
    content: str = Body(..., embed=True),
    parent_comment_id: Optional[str] = Body(None, embed=True),
    auth: AuthContext = Depends(authenticate)
):
    """Create a comment in the guild."""
    try:
        comment = await create_comment(
            guild_id=guild_id,
            user_id=auth.user_id,
            content=content,
            parent_comment_id=parent_comment_id,
            auth=auth
        )
        
        return comment
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to comment")
    except GuildDBError as e:
        logger.error("Database error creating comment", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to create comment")
    except Exception as e:
        logger.error("Unexpected error creating comment", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/guilds/{guild_id}/comments")
async def get_comments_endpoint(
    guild_id: str,
    limit: int = 20,
    offset: int = 0,
    auth: AuthContext = Depends(authenticate)
):
    """Get comments for a guild."""
    try:
        comments = await get_comments(
            guild_id=guild_id,
            limit=limit,
            offset=offset,
            current_user_id=auth.user_id
        )
        
        return {"comments": comments}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to view comments")
    except GuildDBError as e:
        logger.error("Database error getting comments", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to get comments")
    except Exception as e:
        logger.error("Unexpected error getting comments", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/guilds/{guild_id}/comments/{comment_id}")
async def delete_comment_endpoint(
    guild_id: str,
    comment_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete a comment."""
    try:
        await delete_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            deleted_by=auth.user_id
        )
        
        return {"message": "Comment deleted successfully"}
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete comment")
    except GuildDBError as e:
        logger.error("Database error deleting comment", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to delete comment")
    except Exception as e:
        logger.error("Unexpected error deleting comment", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/guilds/{guild_id}/comments/{comment_id}/like")
async def like_comment_endpoint(
    guild_id: str,
    comment_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Like or unlike a comment."""
    try:
        print(f"DEBUG MAIN: Liking comment {comment_id} in guild {guild_id} by user {auth.user_id}")
        result = await like_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            user_id=auth.user_id
        )
        print(f"DEBUG MAIN: Successfully liked comment {comment_id}, result: {result}")
        return result
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild or comment not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to like comment")
    except GuildDBError as e:
        logger.error("Database error liking comment", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to like comment")
    except Exception as e:
        logger.error("Unexpected error liking comment", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild analytics
@app.get("/guilds/{guild_id}/analytics")
async def get_guild_analytics_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get guild analytics."""
    try:
        analytics = await calculate_guild_analytics(guild_id=guild_id)
        return analytics
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to view analytics")
    except Exception as e:
        logger.error("Unexpected error getting analytics", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

