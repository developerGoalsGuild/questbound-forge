"""
Level API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from typing import Optional

from ..models.xp import LevelProgress, LevelHistoryResponse
from .xp_routes import authenticate

router = APIRouter(prefix="/levels", tags=["Levels"])


@router.get("/me", response_model=LevelProgress)
async def get_my_level_progress(user_id: str = Depends(authenticate)):
    """Return the authenticated user's current level progress."""
    from ..services.xp_service import get_level_progress
    from ..db.xp_db import XPDBError

    try:
        return get_level_progress(user_id)
    except XPDBError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/history", response_model=LevelHistoryResponse)
async def get_my_level_history(
    limit: int = Query(20, ge=1, le=100),
    next_token: Optional[str] = Query(default=None, alias="nextToken"),
    user_id: str = Depends(authenticate),
):
    """Return paginated level history for the authenticated user."""
    from ..services.xp_service import get_level_history

    events, token = get_level_history(user_id, limit=limit, next_token=next_token)
    return LevelHistoryResponse(items=events, nextToken=token)

