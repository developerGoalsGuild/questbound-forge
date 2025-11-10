"""
Level calculation service.

Calculates user levels based on total XP using exponential progression.
"""

import math
from typing import Tuple


# Level thresholds configuration
# Using exponential progression: level = floor(sqrt(totalXP / 100)) + 1
# This means:
# Level 1: 0-99 XP
# Level 2: 100-399 XP
# Level 3: 400-899 XP
# Level 4: 900-1599 XP
# etc.

BASE_XP_FOR_LEVEL = 100


def calculate_level(total_xp: int) -> int:
    """
    Calculate user level based on total XP.
    
    Args:
        total_xp: Total accumulated XP
        
    Returns:
        Current level (minimum 1)
    """
    if total_xp < 0:
        total_xp = 0
    
    # Exponential progression: level = floor(sqrt(totalXP / 100)) + 1
    level = math.floor(math.sqrt(total_xp / BASE_XP_FOR_LEVEL)) + 1
    
    # Ensure minimum level of 1
    return max(1, level)


def get_level_thresholds(level: int) -> Tuple[int, int]:
    """
    Get XP thresholds for a given level.
    
    Args:
        level: Level number
        
    Returns:
        Tuple of (xp_for_current_level, xp_for_next_level)
    """
    if level < 1:
        level = 1
    
    # XP required to reach this level
    xp_for_current = int((level - 1) ** 2 * BASE_XP_FOR_LEVEL)
    
    # XP required to reach next level
    xp_for_next = int(level ** 2 * BASE_XP_FOR_LEVEL)
    
    return (xp_for_current, xp_for_next)


def calculate_xp_progress(total_xp: int, level: int) -> float:
    """
    Calculate progress to next level (0.0 to 1.0).
    
    Args:
        total_xp: Total accumulated XP
        level: Current level
        
    Returns:
        Progress as float between 0.0 and 1.0
    """
    xp_for_current, xp_for_next = get_level_thresholds(level)
    
    if xp_for_next == xp_for_current:
        return 1.0
    
    xp_in_level = total_xp - xp_for_current
    xp_needed_for_level = xp_for_next - xp_for_current
    
    progress = xp_in_level / xp_needed_for_level
    
    # Clamp between 0.0 and 1.0
    return max(0.0, min(1.0, progress))


def get_level_info(total_xp: int) -> Tuple[int, int, int, float]:
    """
    Get complete level information for a user.
    
    Args:
        total_xp: Total accumulated XP
        
    Returns:
        Tuple of (level, xp_for_current, xp_for_next, progress)
    """
    level = calculate_level(total_xp)
    xp_for_current, xp_for_next = get_level_thresholds(level)
    progress = calculate_xp_progress(total_xp, level)
    
    return (level, xp_for_current, xp_for_next, progress)

