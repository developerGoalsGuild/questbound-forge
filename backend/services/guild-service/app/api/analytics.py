"""
Analytics API endpoints for the guild service.

This module handles all HTTP endpoints related to guild analytics,
including member statistics, goal/quest metrics, and leaderboards.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer

from ..models.analytics import GuildAnalyticsResponse, MemberLeaderboardItem
from ..db.guild_db import get_guild_analytics, get_guild_rankings, GuildDBError, GuildNotFoundError
from ..security.authentication import authenticate
from ..security.auth_models import AuthContext
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guild-analytics"])
security = HTTPBearer()

@router.get("/{guild_id}/analytics", response_model=GuildAnalyticsResponse)
async def get_guild_analytics_endpoint(
    guild_id: str,
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get analytics for a specific guild."""
    try:
        analytics = await get_guild_analytics(guild_id=guild_id)
        return analytics
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild analytics"
        )

@router.get("/{guild_id}/analytics/leaderboard", response_model=List[MemberLeaderboardItem])
async def get_guild_leaderboard(
    guild_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of members to return"),
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get member leaderboard for a specific guild."""
    try:
        analytics = await get_guild_analytics(guild_id=guild_id)
        leaderboard = analytics.member_leaderboard[:limit]
        return leaderboard
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild leaderboard"
        )

@router.get("/rankings", response_model=List[dict])
async def get_guild_rankings_endpoint(
    limit: int = Query(50, ge=1, le=100, description="Number of guilds to return"),
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get guild rankings."""
    try:
        rankings = await get_guild_rankings(limit=limit)
        return rankings
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guild rankings"
        )

