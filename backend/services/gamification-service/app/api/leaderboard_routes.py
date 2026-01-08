"""
Leaderboard API routes.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

# Lazy loading of heavy imports
router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/global", response_model=List[dict])
async def get_global_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    """Get global XP leaderboard."""
    from ..db.leaderboard_db import get_global_xp_leaderboard
    
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
    from ..db.leaderboard_db import get_level_leaderboard as get_level_leaderboard_db
    
    entries = get_level_leaderboard_db(limit=limit)
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
    from ..db.leaderboard_db import get_badge_leaderboard as get_badge_leaderboard_db
    
    entries = get_badge_leaderboard_db(limit=limit)
    return [
        {
            "userId": entry.userId,
            "rank": entry.rank,
            "value": entry.value,
            "metadata": entry.metadata
        }
        for entry in entries
    ]

