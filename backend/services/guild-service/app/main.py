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
from fastapi import Body, Depends, FastAPI, HTTPException, Request, UploadFile, File
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from .models import (
    GuildCreatePayload, GuildUpdatePayload, GuildResponse, GuildListResponse,
    GuildMemberResponse, GuildJoinRequestPayload, GuildJoinRequestResponse,
    GuildJoinRequestListResponse, TransferOwnershipPayload, ModerationActionPayload,
    AvatarUploadResponse, AvatarGetResponse
)
from .db.guild_db import (
    create_guild, get_guild, update_guild, delete_guild, list_user_guilds,
    list_guilds, join_guild, leave_guild, remove_user_from_guild,
    GuildDBError, GuildNotFoundError, GuildPermissionError, GuildValidationError
)
from .db.guild_member_db import (
    get_guild_members, add_guild_member, remove_guild_member, update_member_role,
    block_user, unblock_user, toggle_comment_permission
)
from .db.guild_join_request_db import (
    create_join_request, get_join_requests, approve_join_request, reject_join_request
)
from .db.guild_comment_db import (
    create_comment, get_comments, update_comment, delete_comment, like_comment
)
from .db.guild_ranking_db import (
    calculate_guild_rankings, get_guild_rankings, update_guild_ranking
)
from .analytics.guild_analytics import calculate_guild_analytics
from .utils import (
    _normalize_date_only, _sanitize_string, _validate_tags, _validate_guild_name,
    _validate_guild_description, _validate_guild_type
)
from .security.input_validation import (
    validate_user_id, validate_guild_name, validate_guild_description,
    validate_guild_type, validate_tags, validate_moderation_action,
    SecurityValidationError
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
from common.auth import get_current_user, verify_token
from common.exceptions import (
    AuthenticationError, AuthorizationError, ValidationError, 
    ResourceNotFoundError, ConflictError, RateLimitError
)

# Initialize logger
logger = get_structured_logger(__name__)

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
    current_user: dict = Depends(get_current_user)
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
        
        # Create guild
        guild = await create_guild(
            name=guild_data.name,
            description=guild_data.description,
            guild_type=guild_data.guild_type,
            tags=guild_data.tags or [],
            created_by=current_user['user_id'],
            settings=guild_data.settings
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_CREATED,
            user_id=current_user['user_id'],
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

@app.get("/guilds/{guild_id}", response_model=GuildResponse)
async def get_guild_endpoint(
    guild_id: str,
    include_members: bool = False,
    include_goals: bool = False,
    include_quests: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get guild details."""
    try:
        guild = await get_guild(
            guild_id=guild_id,
            include_members=include_members,
            include_goals=include_goals,
            include_quests=include_quests
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
    current_user: dict = Depends(get_current_user)
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
            updated_by=current_user['user_id'],
            **guild_data.dict(exclude_unset=True)
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_UPDATED,
            user_id=current_user['user_id'],
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
    current_user: dict = Depends(get_current_user)
):
    """Delete a guild."""
    try:
        await delete_guild(guild_id=guild_id, deleted_by=current_user['user_id'])
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_DELETED,
            user_id=current_user['user_id'],
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

# Guild membership operations
@app.post("/guilds/{guild_id}/join")
async def join_guild_endpoint(
    guild_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Join a guild."""
    try:
        await join_guild(guild_id=guild_id, user_id=current_user['user_id'])
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_JOINED,
            user_id=current_user['user_id'],
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
    current_user: dict = Depends(get_current_user)
):
    """Leave a guild."""
    try:
        await leave_guild(guild_id=guild_id, user_id=current_user['user_id'])
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_LEFT,
            user_id=current_user['user_id'],
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
    current_user: dict = Depends(get_current_user)
):
    """Remove a user from a guild."""
    try:
        await remove_user_from_guild(
            guild_id=guild_id,
            user_id=user_id,
            removed_by=current_user['user_id']
        )
        
        # Log audit event
        audit_logger = get_audit_logger()
        audit_logger.log_event(
            event_type=AuditEventType.GUILD_MEMBER_REMOVED,
            user_id=current_user['user_id'],
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
    search: Optional[str] = None,
    guild_type: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """List guilds with optional filtering."""
    try:
        # Parse tags if provided
        tag_list = tags.split(',') if tags else None
        
        guilds = await list_guilds(
            search=search,
            guild_type=guild_type,
            tags=tag_list,
            limit=limit,
            offset=offset
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
    current_user: dict = Depends(get_current_user)
):
    """List guilds for a specific user."""
    try:
        # Validate user access
        if user_id != current_user['user_id']:
            raise HTTPException(status_code=403, detail="Cannot access other user's guilds")
        
        guilds = await list_user_guilds(user_id=user_id)
        return guilds
        
    except GuildDBError as e:
        logger.error("Database error listing user guilds", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Failed to list user guilds")
    except Exception as e:
        logger.error("Unexpected error listing user guilds", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Guild rankings
@app.get("/guilds/rankings")
async def get_guild_rankings_endpoint(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
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

# Guild avatar operations
@app.post("/guilds/{guild_id}/avatar", response_model=AvatarUploadResponse)
async def upload_guild_avatar_endpoint(
    guild_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload guild avatar."""
    try:
        # Validate file
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Upload to S3
        bucket_name = os.getenv('GUILD_AVATAR_BUCKET')
        if not bucket_name:
            raise HTTPException(status_code=500, detail="Avatar bucket not configured")
        
        file_key = f"guilds/{guild_id}/avatar/{uuid4()}.{file.filename.split('.')[-1]}"
        
        # Read file content
        content = await file.read()
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=content,
            ContentType=file.content_type,
            ACL='public-read'
        )
        
        # Generate public URL
        avatar_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{file_key}"
        
        # Update guild with avatar URL
        await update_guild(
            guild_id=guild_id,
            updated_by=current_user['user_id'],
            avatar_url=avatar_url,
            avatar_key=file_key
        )
        
        return AvatarUploadResponse(
            avatar_url=avatar_url,
            avatar_key=file_key,
            message="Avatar uploaded successfully"
        )
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except GuildPermissionError:
        raise HTTPException(status_code=403, detail="Insufficient permissions to upload avatar")
    except Exception as e:
        logger.error("Unexpected error uploading avatar", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload avatar")

@app.get("/guilds/{guild_id}/avatar", response_model=AvatarGetResponse)
async def get_guild_avatar_endpoint(
    guild_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get guild avatar URL."""
    try:
        guild = await get_guild(guild_id=guild_id)
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        return AvatarGetResponse(
            avatar_url=guild.avatar_url,
            avatar_key=guild.avatar_key
        )
        
    except GuildNotFoundError:
        raise HTTPException(status_code=404, detail="Guild not found")
    except Exception as e:
        logger.error("Unexpected error getting avatar", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get avatar")

# Join request operations
@app.post("/guilds/{guild_id}/join-request")
async def create_join_request_endpoint(
    guild_id: str,
    request_data: GuildJoinRequestPayload,
    current_user: dict = Depends(get_current_user)
):
    """Create a join request for an approval-required guild."""
    try:
        join_request = await create_join_request(
            guild_id=guild_id,
            user_id=current_user['user_id'],
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
    current_user: dict = Depends(get_current_user)
):
    """Get pending join requests for a guild."""
    try:
        requests = await get_join_requests(guild_id=guild_id, requested_by=current_user['user_id'])
        return requests
        
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
    current_user: dict = Depends(get_current_user)
):
    """Approve a join request."""
    try:
        await approve_join_request(
            guild_id=guild_id,
            user_id=user_id,
            approved_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Reject a join request."""
    try:
        await reject_join_request(
            guild_id=guild_id,
            user_id=user_id,
            rejected_by=current_user['user_id']
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

# Ownership transfer
@app.post("/guilds/{guild_id}/transfer-ownership")
async def transfer_ownership_endpoint(
    guild_id: str,
    transfer_data: TransferOwnershipPayload,
    current_user: dict = Depends(get_current_user)
):
    """Transfer guild ownership to another member."""
    try:
        await transfer_guild_ownership(
            guild_id=guild_id,
            new_owner_id=transfer_data.new_owner_id,
            reason=transfer_data.reason,
            transferred_by=current_user['user_id']
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
@app.post("/guilds/{guild_id}/moderators")
async def assign_moderator_endpoint(
    guild_id: str,
    user_id: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Assign a user as a guild moderator."""
    try:
        await assign_moderator(
            guild_id=guild_id,
            user_id=user_id,
            assigned_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Remove a user as a guild moderator."""
    try:
        await remove_moderator(
            guild_id=guild_id,
            user_id=user_id,
            removed_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Block a user from commenting in the guild."""
    try:
        await block_user(
            guild_id=guild_id,
            user_id=user_id,
            blocked_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Unblock a user from commenting in the guild."""
    try:
        await unblock_user(
            guild_id=guild_id,
            user_id=user_id,
            unblocked_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Toggle a user's comment permission in the guild."""
    try:
        await toggle_comment_permission(
            guild_id=guild_id,
            user_id=user_id,
            can_comment=can_comment,
            updated_by=current_user['user_id']
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
    current_user: dict = Depends(get_current_user)
):
    """Create a comment in the guild."""
    try:
        comment = await create_comment(
            guild_id=guild_id,
            user_id=current_user['user_id'],
            content=content,
            parent_comment_id=parent_comment_id
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
    current_user: dict = Depends(get_current_user)
):
    """Get comments for a guild."""
    try:
        comments = await get_comments(
            guild_id=guild_id,
            limit=limit,
            offset=offset
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
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment."""
    try:
        await delete_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            deleted_by=current_user['user_id']
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

# Guild analytics
@app.get("/guilds/{guild_id}/analytics")
async def get_guild_analytics_endpoint(
    guild_id: str,
    current_user: dict = Depends(get_current_user)
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

