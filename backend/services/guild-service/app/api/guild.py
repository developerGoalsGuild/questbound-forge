"""
Guild API endpoints for the guild service.

This module handles all HTTP endpoints related to guild operations,
including CRUD operations, membership management, and guild discovery.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer

from ..models.guild import (
    GuildResponse, 
    GuildListResponse, 
    GuildCreatePayload, 
    GuildUpdatePayload,
    GuildType,
    GuildSettings
)
from ..models.join_request import (
    GuildJoinRequestResponse,
    GuildJoinRequestListResponse,
    JoinRequestStatus
)
from ..db.guild_db import (
    create_guild,
    get_guild,
    update_guild,
    delete_guild,
    list_guilds,
    list_user_guilds,
    join_guild,
    leave_guild,
    remove_user_from_guild,
    GuildDBError,
    GuildNotFoundError,
    GuildPermissionError,
    GuildValidationError,
    GuildConflictError
)
from ..security.authentication import authenticate
from ..security.auth_models import AuthContext
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guilds"])
security = HTTPBearer()

@router.post("/", response_model=GuildResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests_per_hour=10)
async def create_guild_endpoint(
    payload: GuildCreatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a new guild."""
    try:
        # Business rule validation: If guild type is "approval", require_approval must be true
        settings = payload.settings or GuildSettings()
        if payload.guild_type == GuildType.APPROVAL:
            settings.require_approval = True
        
        # Extract username from JWT claims
        username = auth.claims.get('username') or auth.claims.get('nickname') or auth.claims.get('preferred_username') or 'Unknown'
        
        guild = await create_guild(
            name=payload.name,
            description=payload.description,
            guild_type=payload.guild_type,
            tags=payload.tags,
            created_by=auth.user_id,
            created_by_username=username,
            settings=settings
        )
        return guild
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create guild"
        )

@router.get("/{guild_id}", response_model=GuildResponse)
async def get_guild_endpoint(
    guild_id: str,
    include_members: bool = Query(False, description="Include guild members"),
    include_goals: bool = Query(False, description="Include guild goals"),
    include_quests: bool = Query(False, description="Include guild quests")
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        return guild
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild"
        )

@router.put("/{guild_id}", response_model=GuildResponse)
@rate_limit(requests_per_hour=20)
async def update_guild_endpoint(
    guild_id: str,
    payload: GuildUpdatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Update guild details."""
    try:
        # Get current guild data for validation
        current_guild = await get_guild(guild_id=guild_id)
        
        # Convert payload to kwargs
        update_data = {}
        if payload.name is not None:
            update_data['name'] = payload.name
        if payload.description is not None:
            update_data['description'] = payload.description
        if payload.guild_type is not None:
            update_data['guild_type'] = payload.guild_type
        if payload.tags is not None:
            update_data['tags'] = payload.tags
        if payload.settings is not None:
            update_data['settings'] = payload.settings.dict()
        
        # Business rule validation: If guild type is "approval", require_approval must be true
        new_guild_type = update_data.get('guild_type', current_guild.guild_type)
        new_settings = update_data.get('settings', current_guild.settings)
        
        if new_guild_type == GuildType.APPROVAL:
            # If settings are being updated, check the new require_approval value
            if payload.settings is not None:
                if not new_settings.get('require_approval', False):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Guilds with type 'Approval Required' must have 'require_approval' set to true. Change the guild type to modify this setting."
                    )
            else:
                # If settings are not being updated, ensure current require_approval is true
                if not current_guild.settings.get('require_approval', False):
                    # Automatically set require_approval to true
                    if 'settings' not in update_data:
                        update_data['settings'] = current_guild.settings.copy()
                    update_data['settings']['require_approval'] = True
        
        guild = await update_guild(
            guild_id=guild_id,
            updated_by=auth.user_id,
            **update_data
        )
        return guild
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update guild"
        )

@router.delete("/{guild_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=5)
async def delete_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete a guild."""
    try:
        await delete_guild(guild_id=guild_id, deleted_by=auth.user_id)
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete guild"
        )

@router.get("/", response_model=GuildListResponse)
async def list_guilds_endpoint(
    search: Optional[str] = Query(None, description="Search guilds by name or description"),
    guild_type: Optional[str] = Query(None, description="Filter by guild type"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    limit: int = Query(20, ge=1, le=100, description="Number of guilds to return"),
    offset: int = Query(0, ge=0, description="Number of guilds to skip")
):
    """List guilds with optional filtering."""
    try:
        result = await list_guilds(
            search=search,
            guild_type=guild_type,
            tags=tags,
            limit=limit,
            offset=offset
        )
        return result
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list guilds"
        )

@router.get("/user/{user_id}", response_model=GuildListResponse)
async def list_user_guilds_endpoint(user_id: str):
    """List guilds for a specific user."""
    try:
        result = await list_user_guilds(user_id=user_id)
        return result
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list user guilds"
        )

@router.post("/{guild_id}/join", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=10)
async def join_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Join a guild."""
    try:
        await join_guild(guild_id=guild_id, user_id=auth.user_id)
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join guild"
        )

@router.post("/{guild_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=10)
async def leave_guild_endpoint(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Leave a guild."""
    try:
        await leave_guild(guild_id=guild_id, user_id=auth.user_id)
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave guild"
        )

@router.delete("/{guild_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
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
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or user not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove user from guild"
        )

