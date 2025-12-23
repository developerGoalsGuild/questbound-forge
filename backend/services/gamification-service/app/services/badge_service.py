"""
Badge service for managing badge assignments.
"""

from threading import Lock
from typing import List, Optional

from ..db.badge_db import (
    assign_badge,
    get_user_badges,
    has_badge,
    get_badge_definition,
    list_badge_definitions,
    BadgeDBError,
)
from ..models.badge import (
    BadgeDefinition,
    UserBadge,
    BadgeWithDefinition,
    BadgeEvaluationRequest,
)
from common.logging import get_structured_logger

logger = get_structured_logger("badge-service", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)


# Predefined badge IDs
BADGE_IDS = {
    "FIRST_QUEST": "first_quest_completed",
    "QUEST_10": "quests_10_completed",
    "QUEST_50": "quests_50_completed",
    "QUEST_100": "quests_100_completed",
    "LEVEL_5": "level_5_milestone",
    "LEVEL_10": "level_10_milestone",
    "LEVEL_20": "level_20_milestone",
    "LEVEL_50": "level_50_milestone",
    "STREAK_7": "streak_7_days",
    "STREAK_30": "streak_30_days",
    "STREAK_100": "streak_100_days",
    "CHALLENGE_WINNER": "challenge_winner",
}

_DEFAULT_BADGES_INITIALIZED = False
_BADGE_INIT_LOCK = Lock()


def initialize_default_badges():
    """Initialize default badge definitions."""
    import time
    now_ms = int(time.time() * 1000)
    badges = [
        BadgeDefinition(
            id=BADGE_IDS["FIRST_QUEST"],
            name="First Quest",
            description="Completed your first quest",
            category="quest",
            rarity="common",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["QUEST_10"],
            name="Quest Master",
            description="Completed 10 quests",
            category="quest",
            rarity="rare",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["QUEST_50"],
            name="Quest Champion",
            description="Completed 50 quests",
            category="quest",
            rarity="epic",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["QUEST_100"],
            name="Quest Legend",
            description="Completed 100 quests",
            category="quest",
            rarity="legendary",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["LEVEL_5"],
            name="Rising Star",
            description="Reached level 5",
            category="level",
            rarity="common",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["LEVEL_10"],
            name="Experienced",
            description="Reached level 10",
            category="level",
            rarity="rare",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["LEVEL_20"],
            name="Veteran",
            description="Reached level 20",
            category="level",
            rarity="epic",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["LEVEL_50"],
            name="Master",
            description="Reached level 50",
            category="level",
            rarity="legendary",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["STREAK_7"],
            name="Week Warrior",
            description="7 day login streak",
            category="streak",
            rarity="common",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["STREAK_30"],
            name="Monthly Master",
            description="30 day login streak",
            category="streak",
            rarity="rare",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["STREAK_100"],
            name="Centurion",
            description="100 day login streak",
            category="streak",
            rarity="legendary",
            createdAt=now_ms,
        ),
        BadgeDefinition(
            id=BADGE_IDS["CHALLENGE_WINNER"],
            name="Challenge Winner",
            description="Won a challenge",
            category="challenge",
            rarity="epic",
            createdAt=now_ms,
        ),
    ]
    
    for badge in badges:
        try:
            from ..db.badge_db import create_badge_definition
            create_badge_definition(badge)
        except Exception as e:
            logger.warning("badge.init_error", badge_id=badge.id, error=str(e))


def ensure_default_badges():
    """Ensure seed badges exist exactly once."""
    global _DEFAULT_BADGES_INITIALIZED
    with _BADGE_INIT_LOCK:
        if _DEFAULT_BADGES_INITIALIZED:
            first_badge = get_badge_definition(BADGE_IDS["FIRST_QUEST"])
            if first_badge:
                return
        initialize_default_badges()
        _DEFAULT_BADGES_INITIALIZED = True


def check_and_assign_badges(user_id: str, achievement_type: str, achievement_data: dict):
    """
    Check achievements and assign badges automatically.
    
    Args:
        user_id: User ID
        achievement_type: Type of achievement (quest_completed, level_up, streak, challenge_won)
        achievement_data: Achievement data
    """
    ensure_default_badges()
    try:
        if achievement_type == "quest_completed":
            quest_count = achievement_data.get("quest_count", 0)
            
            if quest_count == 1:
                assign_badge(user_id, BADGE_IDS["FIRST_QUEST"])
            elif quest_count == 10:
                assign_badge(user_id, BADGE_IDS["QUEST_10"])
            elif quest_count == 50:
                assign_badge(user_id, BADGE_IDS["QUEST_50"])
            elif quest_count == 100:
                assign_badge(user_id, BADGE_IDS["QUEST_100"])
        
        elif achievement_type == "level_up":
            level = achievement_data.get("level", 0)
            
            if level == 5:
                assign_badge(user_id, BADGE_IDS["LEVEL_5"])
            elif level == 10:
                assign_badge(user_id, BADGE_IDS["LEVEL_10"])
            elif level == 20:
                assign_badge(user_id, BADGE_IDS["LEVEL_20"])
            elif level == 50:
                assign_badge(user_id, BADGE_IDS["LEVEL_50"])
        
        elif achievement_type == "streak":
            streak_days = achievement_data.get("streak_days", 0)
            
            if streak_days == 7:
                assign_badge(user_id, BADGE_IDS["STREAK_7"])
            elif streak_days == 30:
                assign_badge(user_id, BADGE_IDS["STREAK_30"])
            elif streak_days == 100:
                assign_badge(user_id, BADGE_IDS["STREAK_100"])
        
        elif achievement_type == "challenge_won":
            assign_badge(user_id, BADGE_IDS["CHALLENGE_WINNER"], metadata={"challenge_id": achievement_data.get("challenge_id")})
    
    except Exception as e:
        logger.error("badge.auto_assign_error", user_id=user_id, achievement_type=achievement_type, error=str(e), exc_info=True)


def evaluate_badges(request: BadgeEvaluationRequest) -> List[BadgeWithDefinition]:
    """
    Evaluate badge triggers based on an explicit request payload.
    """
    check_and_assign_badges(request.userId, request.achievementType, request.achievementData or {})
    return get_user_badges_with_definitions(request.userId)


def get_badge_catalog(category: Optional[str] = None, rarity: Optional[str] = None) -> List[BadgeDefinition]:
    """Return available badge definitions with optional filters."""
    ensure_default_badges()
    return list_badge_definitions(category=category, rarity=rarity)


def get_user_badges_with_definitions(user_id: str, category: Optional[str] = None, rarity: Optional[str] = None) -> List[BadgeWithDefinition]:
    """
    Get user badges with full definitions.
    
    Args:
        user_id: User ID
        
    Returns:
        List of BadgeWithDefinition objects
    """
    ensure_default_badges()
    user_badges = get_user_badges(user_id)
    result = []
    
    for user_badge in user_badges:
        definition: Optional[BadgeDefinition] = None
        if user_badge.definitionName:
            definition = BadgeDefinition(
                id=user_badge.badgeId,
                name=user_badge.definitionName,
                description=user_badge.definitionDescription or "",
                icon=user_badge.definitionIcon,
                category=user_badge.definitionCategory or "quest",
                rarity=user_badge.definitionRarity or "common",
                createdAt=user_badge.earnedAt
            )
        else:
            definition = get_badge_definition(user_badge.badgeId)
        if not definition:
            continue
        if category and definition.category != category:
            continue
        if rarity and definition.rarity != rarity:
            continue
        result.append(BadgeWithDefinition(badge=user_badge, definition=definition))
    
    return result

