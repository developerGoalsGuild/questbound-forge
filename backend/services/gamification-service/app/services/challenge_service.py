"""
Challenge service for managing challenge progress and rankings.
"""

from typing import List, Optional
from ..db.challenge_db import (
    get_challenge, get_challenge_participants,
    update_participant_progress, ChallengeDBError
)
from ..services.xp_service import award_xp
from ..models.xp import XPAwardRequest
from ..models.challenge import ChallengeParticipant
from common.logging import get_structured_logger

logger = get_structured_logger("challenge-service", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)


def update_challenge_progress(
    challenge_id: str,
    user_id: str,
    achievement_type: str,
    achievement_value: int
):
    """
    Update challenge progress based on achievements.
    
    Args:
        challenge_id: Challenge ID
        user_id: User ID
        achievement_type: Type of achievement (quest_completion, xp_accumulation, goal_completion)
        achievement_value: Achievement value
    """
    try:
        challenge = get_challenge(challenge_id)
        if not challenge:
            logger.warning("challenge.not_found", challenge_id=challenge_id)
            return
        
        if challenge.type != achievement_type:
            # Achievement type doesn't match challenge type
            return
        
        # Get current participant progress
        participants = get_challenge_participants(challenge_id)
        participant = None
        for p in participants:
            if p.userId == user_id:
                participant = p
                break
        
        if not participant:
            logger.warning("challenge.participant_not_found", challenge_id=challenge_id, user_id=user_id)
            return
        
        # Update progress
        target_value = challenge.targetValue or 1
        new_value = participant.currentValue + achievement_value
        progress = min(1.0, float(new_value) / float(target_value))
        
        update_participant_progress(challenge_id, user_id, new_value, progress)
        
        # Check if challenge completed
        if progress >= 1.0 and not participant.completedAt:
            # Award XP
            try:
                award_xp(XPAwardRequest(
                    userId=user_id,
                    amount=challenge.xpReward,
                    source="challenge_completion",
                    sourceId=challenge_id,
                    description=f"Completed challenge: {challenge.title}"
                ))
            except Exception as e:
                logger.error("challenge.xp_award_error", challenge_id=challenge_id, user_id=user_id, error=str(e))
        
        logger.info("challenge.progress.updated", challenge_id=challenge_id, user_id=user_id, value=new_value, progress=progress)
    
    except Exception as e:
        logger.error("challenge.progress.update_error", challenge_id=challenge_id, user_id=user_id, error=str(e), exc_info=True)

