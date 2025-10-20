"""
Members API endpoints for the guild service.

This module handles all HTTP endpoints related to guild members,
including listing members, updating member roles, and member management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer

from ..models.guild import GuildMemberResponse, GuildMemberRole
from ..db.guild_db import (
    get_guild,
    GuildDBError,
    GuildNotFoundError,
    GuildPermissionError
)
from ..security.authentication import authenticate
from ..security.auth_models import AuthContext
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guild-members"])
security = HTTPBearer()

@router.get("/{guild_id}/members", response_model=List[GuildMemberResponse])
@rate_limit(requests_per_hour=60)
async def get_guild_members(
    guild_id: str,
    auth: AuthContext = Depends(authenticate),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of members to return"),
    offset: int = Query(0, ge=0, description="Number of members to skip"),
    role: Optional[GuildMemberRole] = Query(None, description="Filter by member role")
):
    """Get all members of a guild."""
    try:
        # Get guild with members
        guild = await get_guild(guild_id=guild_id, include_members=True)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        if not guild.members:
            return []
        
        # Filter by role if specified
        members = guild.members
        if role:
            members = [member for member in members if member.role == role]
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_members = members[start_idx:end_idx]
        
        return paginated_members
        
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild members"
        )

@router.get("/{guild_id}/members/{user_id}", response_model=GuildMemberResponse)
@rate_limit(requests_per_hour=60)
async def get_guild_member(
    guild_id: str,
    user_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get a specific member of a guild."""
    try:
        # Get guild with members
        guild = await get_guild(guild_id=guild_id, include_members=True)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        if not guild.members:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild has no members"
            )
        
        # Find the specific member
        member = next((m for m in guild.members if m.user_id == user_id), None)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found in this guild"
            )
        
        return member
        
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild member"
        )

@router.get("/{guild_id}/members/me", response_model=GuildMemberResponse)
@rate_limit(requests_per_hour=60)
async def get_my_guild_membership(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Get the current user's membership in a guild."""
    try:
        # Get guild with members
        guild = await get_guild(guild_id=guild_id, include_members=True)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        if not guild.members:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild has no members"
            )
        
        # Find the current user's membership
        member = next((m for m in guild.members if m.user_id == auth.user_id), None)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a member of this guild"
            )
        
        return member
        
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your guild membership"
        )
