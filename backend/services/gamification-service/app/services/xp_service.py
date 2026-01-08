"""
XP service for awarding and managing XP.

Handles XP awards, level calculations, and integration with other services.
"""

import time
from typing import Optional

from ..db.xp_db import (
    create_xp_summary,
    get_xp_summary,
    update_xp_summary,
    create_xp_transaction,
    check_event_id_exists,
    XPDBError,
    record_level_event,
    get_level_events,
)
from ..services.level_service import get_level_info
from ..models.xp import (
    XPAwardRequest,
    XPAwardResponse,
    XPSummary,
    LevelProgress,
    LevelEvent,
)
from ..services.badge_service import check_and_assign_badges
from common.logging import get_structured_logger

logger = get_structured_logger("xp-service", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)


# XP award amounts by source
XP_AWARDS = {
    "task_completion": 10,
    "goal_completion": 25,
    "quest_completion": None,  # Uses quest rewardXp field
    "challenge_completion": None,  # Variable, defined per challenge
    "daily_login": 5,
}


def get_xp_award_amount(source: str, source_data: Optional[dict] = None) -> int:
    """
    Get XP award amount for a source.
    
    Args:
        source: Source type
        source_data: Optional data about the source (e.g., quest rewardXp)
        
    Returns:
        XP amount to award
    """
    base_amount = XP_AWARDS.get(source, 0)
    
    if source == "quest_completion" and source_data:
        # Use quest rewardXp if available
        return source_data.get("rewardXp", base_amount)
    
    if source == "challenge_completion" and source_data:
        # Use challenge XP if available
        return source_data.get("xpReward", base_amount)
    
    return base_amount if base_amount is not None else 0


def award_xp(request: XPAwardRequest) -> XPAwardResponse:
    """
    Award XP to a user.
    
    Args:
        request: XP award request
        
    Returns:
        XP award response with updated totals and level info
    """
    # Check for idempotency
    if request.eventId and check_event_id_exists(request.eventId):
        logger.info("xp.award.duplicate_event", user_id=request.userId, event_id=request.eventId)
        # Return existing state
        summary = get_xp_summary(request.userId)
        if summary:
            return XPAwardResponse(
                success=True,
                totalXp=summary.totalXp,
                level=summary.currentLevel,
                levelUp=False,
                previousLevel=None
            )
        # If no summary exists, create one
        summary = create_xp_summary(request.userId, 0)
        return XPAwardResponse(
            success=True,
            totalXp=0,
            level=1,
            levelUp=False,
            previousLevel=None
        )
    
    # Get or create XP summary
    summary = get_xp_summary(request.userId)
    if not summary:
        summary = create_xp_summary(request.userId, 0)
    
    previous_level = summary.currentLevel
    previous_xp = summary.totalXp
    
    # Calculate new totals
    new_total_xp = previous_xp + request.amount
    
    # Calculate new level
    level, xp_for_current, xp_for_next, progress = get_level_info(new_total_xp)
    
    # Update summary
    updated_summary = update_xp_summary(
        request.userId,
        new_total_xp,
        level,
        xp_for_current,
        xp_for_next,
        progress
    )
    
    # Create transaction record
    try:
        create_xp_transaction(
            user_id=request.userId,
            amount=request.amount,
            source=request.source,
            source_id=request.sourceId,
            description=request.description,
            event_id=request.eventId
        )
    except Exception as e:
        logger.error("xp.award.transaction_error", user_id=request.userId, error=str(e), exc_info=True)
        # Continue even if transaction record fails
    
    level_up = level > previous_level
    metadata = request.metadata or {}
    
    logger.info(
        "xp.award.success",
        user_id=request.userId,
        amount=request.amount,
        total_xp=new_total_xp,
        user_level=level,
        level_up=level_up,
        source=request.source
    )

    if level_up:
        record_level_event(request.userId, level, new_total_xp, request.source)
        check_and_assign_badges(
            request.userId,
            "level_up",
            {"level": level}
        )

    _maybe_trigger_activity_badges(request.userId, request.source, metadata)
    
    return XPAwardResponse(
        success=True,
        totalXp=new_total_xp,
        level=level,
        levelUp=level_up,
        previousLevel=previous_level if level_up else None
    )


def get_user_xp_summary(user_id: str) -> Optional[XPSummary]:
    """
    Get XP summary for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        XPSummary or None if not found
    """
    summary = get_xp_summary(user_id)
    
    if not summary:
        # Create default summary if doesn't exist
        summary = create_xp_summary(user_id, 0)
    
    return summary


def get_level_progress(user_id: str) -> LevelProgress:
    """
    Return structured level progress for a user.
    """
    summary = get_user_xp_summary(user_id)
    if not summary:
        raise XPDBError("XP summary missing")
    return LevelProgress(
        userId=summary.userId,
        totalXp=summary.totalXp,
        currentLevel=summary.currentLevel,
        xpForCurrentLevel=summary.xpForCurrentLevel,
        xpForNextLevel=summary.xpForNextLevel,
        xpProgress=summary.xpProgress,
        updatedAt=summary.updatedAt,
    )


def get_level_history(user_id: str, limit: int = 20, next_token: str | None = None) -> tuple[list[LevelEvent], Optional[str]]:
    """
    Fetch level events with pagination token.
    """
    return get_level_events(user_id, limit=limit, next_token=next_token)


def _maybe_trigger_activity_badges(user_id: str, source: str, metadata: dict):
    """
    Map XP award metadata to badge achievements.
    """
    if not metadata:
        metadata = {}

    achievement_type = metadata.get("achievementType") or source

    # Normalize metadata keys
    quest_count = metadata.get("quest_count", metadata.get("questCount"))
    streak_days = metadata.get("streak_days", metadata.get("streakDays"))
    challenge_id = metadata.get("challenge_id", metadata.get("challengeId"))

    if quest_count:
        check_and_assign_badges(user_id, "quest_completed", {"quest_count": quest_count})
    if streak_days:
        check_and_assign_badges(user_id, "streak", {"streak_days": streak_days})
    if challenge_id or source == "challenge_completion":
        check_and_assign_badges(user_id, "challenge_won", {"challenge_id": challenge_id})

    if achievement_type not in {"quest_completed", "streak", "challenge_won", "level_up"} and metadata:
        check_and_assign_badges(user_id, achievement_type, metadata)

