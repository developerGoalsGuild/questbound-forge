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
    GuildSettings,
    GuildQuestCreatePayload,
    GuildQuestUpdatePayload,
    GuildQuestResponse,
    GuildQuestListResponse,
    GuildQuestCompletionPayload,
    GuildQuestCompletionResponse,
    GuildQuestProgressResponse
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
    get_guild_rankings,
    create_guild_quest,
    get_guild_quest,
    list_guild_quests,
    update_guild_quest,
    delete_guild_quest,
    activate_guild_quest,
    finish_guild_quest,
    complete_guild_quest,
    get_guild_quest_completions,
    get_guild_quest_progress,
    get_guild_activities,
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

@router.get("/rankings")
async def get_guild_rankings_endpoint(
    limit: int = Query(50, description="Maximum number of rankings to return"),
    auth: AuthContext = Depends(authenticate)
):
    """Get guild rankings."""
    try:
        rankings = await get_guild_rankings(limit=limit)
        return {"rankings": rankings}
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get guild rankings"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{guild_id}", response_model=GuildResponse)
async def get_guild_endpoint(
    guild_id: str,
    include_members: bool = Query(False, description="Include guild members"),
    include_goals: bool = Query(False, description="Include user goals from guild members (not guild-level goals)"),
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
        # Extract username/nickname from JWT claims
        username = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            'Unknown'
        )
        await join_guild(guild_id=guild_id, user_id=auth.user_id, username=username, nickname=username)
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
        # Extract username/nickname from JWT claims
        username = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            'Unknown'
        )
        await leave_guild(guild_id=guild_id, user_id=auth.user_id, username=username, nickname=username)
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


# ============================================================================
# GUILD QUEST ENDPOINTS (Exclusive to guilds - quantitative and percentual only)
# ============================================================================

@router.post("/{guild_id}/quests", response_model=GuildQuestResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests_per_hour=20)
async def create_guild_quest_endpoint(
    guild_id: str,
    payload: GuildQuestCreatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a new guild quest (owner/moderator only)."""
    try:
        # Extract nickname from JWT claims (prefer nickname, fallback to other username fields)
        creator_nickname = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            None  # Will fallback to member lookup if None
        )
        
        quest = await create_guild_quest(
            guild_id=guild_id,
            payload=payload,
            created_by=auth.user_id,
            created_by_nickname=creator_nickname
        )
        return quest
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
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create guild quest"
        )


@router.get("/{guild_id}/quests", response_model=GuildQuestListResponse)
async def list_guild_quests_endpoint(
    guild_id: str,
    status: Optional[str] = Query(None, description="Filter by status (active, draft, archived)"),
    limit: int = Query(20, ge=1, le=100, description="Number of quests to return"),
    offset: int = Query(0, ge=0, description="Number of quests to skip"),
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """List guild quests."""
    try:
        user_id = auth.user_id if auth else None
        result = await list_guild_quests(
            guild_id=guild_id,
            status=status,
            limit=limit,
            offset=offset,
            user_id=user_id
        )
        return result
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list guild quests"
        )


@router.get("/{guild_id}/quests/{quest_id}", response_model=GuildQuestResponse)
async def get_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get a specific guild quest with user progress."""
    try:
        user_id = auth.user_id if auth else None
        quest = await get_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            user_id=user_id
        )
        return quest
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get guild quest"
        )


@router.put("/{guild_id}/quests/{quest_id}", response_model=GuildQuestResponse)
@rate_limit(requests_per_hour=30)
async def update_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    payload: GuildQuestUpdatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Update a guild quest (owner/moderator only, draft quests only)."""
    try:
        # Extract nickname from JWT claims (prefer nickname, fallback to other username fields)
        updater_nickname = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            None  # Will fallback to member lookup if None
        )
        
        quest = await update_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            payload=payload,
            updated_by=auth.user_id,
            updated_by_nickname=updater_nickname
        )
        return quest
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update guild quest"
        )


@router.delete("/{guild_id}/quests/{quest_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=10)
async def delete_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    action: str = Query("delete", description="Action: delete or archive"),
    auth: AuthContext = Depends(authenticate)
):
    """Delete or archive a guild quest (owner/moderator only)."""
    try:
        await delete_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            deleted_by=auth.user_id,
            action=action
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete guild quest"
        )


@router.post("/{guild_id}/quests/{quest_id}/activate", response_model=GuildQuestResponse)
@rate_limit(requests_per_hour=30)
async def activate_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Activate a guild quest (owner/moderator only, draft quests only)."""
    try:
        # Extract nickname from JWT claims (prefer nickname, fallback to other username fields)
        activator_nickname = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            None  # Will fallback to member lookup if None
        )
        
        quest = await activate_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            activated_by=auth.user_id,
            activated_by_nickname=activator_nickname
        )
        return quest
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate guild quest"
        )


@router.post("/{guild_id}/quests/{quest_id}/finish", response_model=GuildQuestResponse)
@rate_limit(requests_per_hour=30)
async def finish_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Finish a guild quest (owner/moderator only, active quests only). Sets status to completed or failed based on goals."""
    try:
        # Extract nickname from JWT claims (prefer nickname, fallback to other username fields)
        finisher_nickname = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            None  # Will fallback to member lookup if None
        )
        
        quest = await finish_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            finished_by=auth.user_id,
            finished_by_nickname=finisher_nickname
        )
        return quest
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to finish guild quest"
        )


@router.post("/{guild_id}/quests/{quest_id}/complete", response_model=GuildQuestCompletionResponse)
@rate_limit(requests_per_hour=50)
async def complete_guild_quest_endpoint(
    guild_id: str,
    quest_id: str,
    payload: Optional[GuildQuestCompletionPayload] = None,
    auth: AuthContext = Depends(authenticate)
):
    """Complete a guild quest (member action)."""
    try:
        # Extract nickname from JWT claims (prefer nickname, fallback to other username fields)
        user_nickname = (
            auth.claims.get('nickname') or
            auth.claims.get('name') or
            auth.claims.get('preferred_username') or
            auth.claims.get('username') or
            None  # Will fallback to member lookup if None
        )
        
        completion = await complete_guild_quest(
            guild_id=guild_id,
            quest_id=quest_id,
            user_id=auth.user_id,
            payload=payload,
            user_nickname=user_nickname
        )
        return completion
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
            detail="Failed to complete guild quest"
        )


@router.get("/{guild_id}/quests/{quest_id}/completions")
async def get_guild_quest_completions_endpoint(
    guild_id: str,
    quest_id: str,
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get quest completion list (members see their own, owners/moderators see all)."""
    try:
        user_id = auth.user_id if auth else None
        result = await get_guild_quest_completions(
            guild_id=guild_id,
            quest_id=quest_id,
            user_id=user_id
        )
        return result
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quest completions"
        )


@router.get("/{guild_id}/quests/{quest_id}/progress", response_model=GuildQuestProgressResponse)
async def get_guild_quest_progress_endpoint(
    guild_id: str,
    quest_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get user's progress on a guild quest."""
    try:
        progress = await get_guild_quest_progress(
            guild_id=guild_id,
            quest_id=quest_id,
            user_id=auth.user_id
        )
        return progress
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild quest not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quest progress"
        )


@router.get("/{guild_id}/activities")
async def get_guild_activities_endpoint(
    guild_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of activities to return"),
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get recent guild activities (quest created, member joined/left, quest completed)."""
    try:
        activities = await get_guild_activities(guild_id=guild_id, limit=limit)
        return {"activities": activities, "total": len(activities)}
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get guild activities"
        )

