"""
XP Award Utility

Helper functions for awarding XP from other services (quest-service, etc.)
"""

import os
import httpx
from typing import Optional
from common.logging import get_structured_logger

logger = get_structured_logger("xp-award-util", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)


def get_gamification_service_url() -> str:
    """Get gamification service URL from environment or default."""
    return os.getenv(
        "GAMIFICATION_SERVICE_URL",
        os.getenv("GAMIFICATION_API_URL", "http://localhost:8000")
    )


async def award_xp_async(
    user_id: str,
    amount: int,
    source: str,
    source_id: Optional[str] = None,
    description: str = "",
    event_id: Optional[str] = None
) -> bool:
    """
    Award XP to a user asynchronously.
    
    This function makes an HTTP call to the gamification service.
    It's designed to be called from other services (quest-service, etc.)
    
    Args:
        user_id: User ID
        amount: XP amount to award
        source: Source type (task_completion, goal_completion, quest_completion, etc.)
        source_id: ID of the source entity
        description: Description of the award
        event_id: Unique event ID for idempotency
        
    Returns:
        True if successful, False otherwise
    """
    try:
        url = f"{get_gamification_service_url()}/xp/award"
        
        payload = {
            "userId": user_id,
            "amount": amount,
            "source": source,
            "description": description,
        }
        
        if source_id:
            payload["sourceId"] = source_id
        if event_id:
            payload["eventId"] = event_id
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"X-Internal-Key": os.getenv("INTERNAL_API_KEY", "")}
            )
            
            if response.status_code == 200:
                logger.info(
                    "xp.award.success",
                    user_id=user_id,
                    amount=amount,
                    source=source,
                    source_id=source_id
                )
                return True
            else:
                logger.warning(
                    "xp.award.failed",
                    user_id=user_id,
                    amount=amount,
                    source=source,
                    status_code=response.status_code,
                    response_text=response.text[:200]
                )
                return False
                
    except Exception as e:
        logger.error(
            "xp.award.error",
            user_id=user_id,
            amount=amount,
            source=source,
            error=str(e),
            exc_info=True
        )
        return False


def award_xp_sync(
    user_id: str,
    amount: int,
    source: str,
    source_id: Optional[str] = None,
    description: str = "",
    event_id: Optional[str] = None
) -> bool:
    """
    Award XP to a user synchronously (blocking).
    
    This function makes an HTTP call to the gamification service.
    Use award_xp_async for non-blocking calls.
    
    Args:
        user_id: User ID
        amount: XP amount to award
        source: Source type
        source_id: ID of the source entity
        description: Description of the award
        event_id: Unique event ID for idempotency
        
    Returns:
        True if successful, False otherwise
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(
            award_xp_async(user_id, amount, source, source_id, description, event_id)
        )
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(
            award_xp_async(user_id, amount, source, source_id, description, event_id)
        )

