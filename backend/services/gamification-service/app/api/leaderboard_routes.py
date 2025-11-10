"""
Leaderboard API routes.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from ..db.leaderboard_db import (
    get_global_xp_leaderboard, get_level_leaderboard, get_badge_leaderboard,
    LeaderboardEntry
)

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/global", response_model=List[dict])
async def get_global_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    """Get global XP leaderboard."""
    entries = get_global_xp_leaderboard(limit=limit)
    return [
        {
            "userId": entry.userId,
            "rank": entry.rank,
            "value": entry.value,
            "metadata": entry.metadata
        }
        for entry in entries
    ]


@router.get("/level", response_model=List[dict])
async def get_level_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    """Get level leaderboard."""
    entries = get_level_leaderboard(limit=limit)
    return [
        {
            "userId": entry.userId,
            "rank": entry.rank,
            "value": entry.value,
            "metadata": entry.metadata
        }
        for entry in entries
    ]


@router.get("/badges", response_model=List[dict])
async def get_badge_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    """Get badge leaderboard."""
    entries = get_badge_leaderboard(limit=limit)
    return [
        {
            "userId": entry.userId,
            "rank": entry.rank,
            "value": entry.value,
            "metadata": entry.metadata
        }
        for entry in entries
    ]

