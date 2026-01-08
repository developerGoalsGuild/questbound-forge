"""
Quest Reward Calculator

Automatically calculates quest reward XP based on:
- Base XP: 50 (single base for all quests)
- Scope multiplier (linear): Number of items in scope
- Period multiplier (square root): Compensates for longer periods with diminishing returns
- Difficulty weights: Tasks = 1x, Goals = 2x, Guild quests = 3x
"""

import math
from typing import Optional, List, Dict, Any


# Constants
BASE_XP = 50
MIN_REWARD_XP = 0
MAX_REWARD_XP = 1000

# Difficulty weights
TASK_WEIGHT = 1.0
GOAL_WEIGHT = 2.0
GUILD_QUEST_WEIGHT = 3.0


def calculate_quest_reward(
    kind: str,
    linked_goal_ids: Optional[List[str]] = None,
    linked_task_ids: Optional[List[str]] = None,
    target_count: Optional[int] = None,
    count_scope: Optional[str] = None,
    period_days: Optional[int] = None,
    is_guild_quest: bool = False,
    percentual_type: Optional[str] = None,
    member_total: Optional[int] = None,
    percentual_count_scope: Optional[str] = None
) -> int:
    """
    Calculate reward XP for a quest based on scope, period, and difficulty.
    
    Args:
        kind: Quest type ("linked", "quantitative", "percentual")
        linked_goal_ids: List of linked goal IDs (for linked or percentual quests)
        linked_task_ids: List of linked task IDs (for linked or percentual quests)
        target_count: Target count for quantitative quests
        count_scope: Scope for quantitative quests ("completed_tasks", "completed_goals", "goals", "tasks", "guild_quest")
        period_days: Period duration in days
        is_guild_quest: Whether this is a guild quest (applies 3x weight)
        percentual_type: Type for percentual quests ("goal_task_completion", "member_completion")
        member_total: Total guild members (for member_completion percentual quests)
        percentual_count_scope: Count scope for goal_task_completion ("goals", "tasks", "both")
    
    Returns:
        Calculated reward XP (capped between MIN_REWARD_XP and MAX_REWARD_XP)
    """
    # Calculate scope (weighted item count)
    scope = _calculate_scope(
        kind=kind,
        linked_goal_ids=linked_goal_ids,
        linked_task_ids=linked_task_ids,
        target_count=target_count,
        count_scope=count_scope,
        percentual_type=percentual_type,
        member_total=member_total,
        percentual_count_scope=percentual_count_scope
    )
    
    # Calculate period multiplier (square root for diminishing returns)
    period_multiplier = _calculate_period_multiplier(period_days)
    
    # Calculate difficulty weight
    difficulty_weight = _calculate_difficulty_weight(
        kind=kind,
        count_scope=count_scope,
        is_guild_quest=is_guild_quest,
        percentual_type=percentual_type,
        percentual_count_scope=percentual_count_scope
    )
    
    # Apply formula: base_xp * scope * period_multiplier * difficulty_weight
    reward = BASE_XP * scope * period_multiplier * difficulty_weight
    
    # Cap between min and max
    reward = max(MIN_REWARD_XP, min(MAX_REWARD_XP, int(reward)))
    
    return reward


def _calculate_scope(
    kind: str,
    linked_goal_ids: Optional[List[str]] = None,
    linked_task_ids: Optional[List[str]] = None,
    target_count: Optional[int] = None,
    count_scope: Optional[str] = None,
    percentual_type: Optional[str] = None,
    member_total: Optional[int] = None,
    percentual_count_scope: Optional[str] = None
) -> float:
    """Calculate scope (weighted item count) based on quest type."""
    linked_goal_ids = linked_goal_ids or []
    linked_task_ids = linked_task_ids or []
    
    if kind == "linked":
        # Linked quests: count weighted goals and tasks
        goals_count = len(linked_goal_ids)
        tasks_count = len(linked_task_ids)
        # Weighted scope: goals × 2x + tasks × 1x
        return (goals_count * GOAL_WEIGHT) + (tasks_count * TASK_WEIGHT)
    
    elif kind == "quantitative":
        # Quantitative quests: use targetCount as scope, weighted by countScope
        if target_count is None or target_count <= 0:
            return 1.0  # Default to 1 if no target
        
        # Apply difficulty weight based on what we're counting
        if count_scope == "completed_goals" or count_scope == "goals":
            # Goals are harder: multiply by GOAL_WEIGHT
            return float(target_count) * GOAL_WEIGHT
        elif count_scope == "completed_tasks" or count_scope == "tasks":
            # Tasks are easier: multiply by TASK_WEIGHT
            return float(target_count) * TASK_WEIGHT
        else:
            # Default (guild_quest or unknown): use base count
            return float(target_count)
    
    elif kind == "percentual":
        if percentual_type == "goal_task_completion":
            # Count linked goals/tasks with weights
            goals_count = len(linked_goal_ids or [])
            tasks_count = len(linked_task_ids or [])
            
            if percentual_count_scope == "goals":
                return goals_count * GOAL_WEIGHT
            elif percentual_count_scope == "tasks":
                return tasks_count * TASK_WEIGHT
            elif percentual_count_scope == "both":
                return (goals_count * GOAL_WEIGHT) + (tasks_count * TASK_WEIGHT)
            else:
                # Default: both if scope not specified
                return (goals_count * GOAL_WEIGHT) + (tasks_count * TASK_WEIGHT)
        
        elif percentual_type == "member_completion":
            # Use total guild members as scope
            if member_total is None or member_total <= 0:
                return 1.0  # Default to 1 if no members
            return float(member_total)
    
    # Default scope
    return 1.0


def _calculate_period_multiplier(period_days: Optional[int]) -> float:
    """Calculate period multiplier using square root for diminishing returns."""
    if period_days is None or period_days <= 0:
        return 1.0  # No period multiplier if not specified
    
    # Use square root for diminishing returns
    return math.sqrt(float(period_days))


def _calculate_difficulty_weight(
    kind: str,
    count_scope: Optional[str] = None,
    is_guild_quest: bool = False,
    percentual_type: Optional[str] = None,
    percentual_count_scope: Optional[str] = None
) -> float:
    """
    Calculate difficulty weight based on quest type.
    
    Guild quests get an additional 3x multiplier.
    User quests get 1x (weights already applied in scope calculation).
    """
    if is_guild_quest:
        # Guild quests always get 3x weight
        return GUILD_QUEST_WEIGHT
    
    # For user quests, weights are already applied in scope calculation
    return 1.0

