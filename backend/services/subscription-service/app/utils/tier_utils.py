"""
Subscription tier utility functions.
"""

from typing import Literal

# Tier hierarchy for access control
TIER_HIERARCHY = {
    "free": 0,
    "INITIATE": 1,
    "JOURNEYMAN": 2,
    "SAGE": 3,
    "GUILDMASTER": 4,
}

SubscriptionTier = Literal["free", "INITIATE", "JOURNEYMAN", "SAGE", "GUILDMASTER"]


def tier_has_access(user_tier: str, required_tier: str) -> bool:
    """
    Check if user tier has access to a feature requiring minimum tier.
    
    Args:
        user_tier: User's current tier
        required_tier: Minimum tier required for feature
    
    Returns:
        True if user has access, False otherwise
    """
    user_level = TIER_HIERARCHY.get(user_tier, 0)
    required_level = TIER_HIERARCHY.get(required_tier, 0)
    return user_level >= required_level


def get_tier_level(tier: str) -> int:
    """Get numeric level of tier (0 = free, 4 = GUILDMASTER)."""
    return TIER_HIERARCHY.get(tier, 0)

