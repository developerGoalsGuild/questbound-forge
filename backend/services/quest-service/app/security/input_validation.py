"""
Enhanced input validation and sanitization for security.
"""

import re
import html
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator


class SecurityValidationError(Exception):
    """Raised when input validation fails security checks."""
    pass


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input to prevent XSS and injection attacks."""
    if not isinstance(value, str):
        raise SecurityValidationError("Input must be a string")
    
    # Remove null bytes and control characters
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
    
    # HTML escape to prevent XSS
    value = html.escape(value, quote=True)
    
    # Limit length
    if len(value) > max_length:
        raise SecurityValidationError(f"Input exceeds maximum length of {max_length} characters")
    
    return value.strip()


def validate_user_id(user_id: str) -> str:
    """Validate user ID format."""
    if not user_id or not isinstance(user_id, str):
        raise SecurityValidationError("User ID is required and must be a string")
    
    # Check for valid UUID format or Cognito sub format
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    cognito_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    
    if not (re.match(uuid_pattern, user_id) or re.match(cognito_pattern, user_id)):
        raise SecurityValidationError("Invalid user ID format")
    
    return user_id


def validate_tags(tags: List[str]) -> List[str]:
    """Validate and sanitize tags."""
    if not isinstance(tags, list):
        raise SecurityValidationError("Tags must be a list")
    
    if len(tags) > 10:
        raise SecurityValidationError("Maximum 10 tags allowed")
    
    sanitized_tags = []
    for tag in tags:
        if not isinstance(tag, str):
            raise SecurityValidationError("All tags must be strings")
        
        # Sanitize tag
        sanitized_tag = sanitize_string(tag, max_length=20)
        
        # Check for valid tag format (alphanumeric, hyphens, underscores)
        if not re.match(r'^[a-zA-Z0-9_-]+$', sanitized_tag):
            raise SecurityValidationError("Tags can only contain alphanumeric characters, hyphens, and underscores")
        
        sanitized_tags.append(sanitized_tag)
    
    return sanitized_tags


def validate_quest_title(title: str) -> str:
    """Validate quest title."""
    if not title or not isinstance(title, str):
        raise SecurityValidationError("Quest title is required")
    
    sanitized = sanitize_string(title, max_length=100)
    
    if len(sanitized) < 3:
        raise SecurityValidationError("Quest title must be at least 3 characters long")
    
    return sanitized


def validate_quest_description(description: Optional[str]) -> Optional[str]:
    """Validate quest description."""
    if not description:
        return None
    
    if not isinstance(description, str):
        raise SecurityValidationError("Quest description must be a string")
    
    return sanitize_string(description, max_length=500)


def validate_difficulty(difficulty: str) -> str:
    """Validate quest difficulty."""
    valid_difficulties = ["easy", "medium", "hard"]
    
    if difficulty not in valid_difficulties:
        raise SecurityValidationError(f"Difficulty must be one of: {', '.join(valid_difficulties)}")
    
    return difficulty


def validate_reward_xp(reward_xp: int) -> int:
    """Validate reward XP."""
    if not isinstance(reward_xp, int):
        raise SecurityValidationError("Reward XP must be an integer")
    
    if reward_xp < 0 or reward_xp > 1000:
        raise SecurityValidationError("Reward XP must be between 0 and 1000")
    
    return reward_xp


def validate_category(category: str) -> str:
    """Validate quest category."""
    valid_categories = [
        "Health", "Work", "Personal", "Learning", "Fitness", "Creative",
        "Financial", "Social", "Spiritual", "Hobby", "Travel", "Other"
    ]
    
    if category not in valid_categories:
        raise SecurityValidationError(f"Category must be one of: {', '.join(valid_categories)}")
    
    return category


def validate_privacy(privacy: str) -> str:
    """Validate quest privacy setting."""
    valid_privacy = ["public", "followers", "private"]
    
    if privacy not in valid_privacy:
        raise SecurityValidationError(f"Privacy must be one of: {', '.join(valid_privacy)}")
    
    return privacy


def validate_quest_kind(kind: str) -> str:
    """Validate quest kind."""
    valid_kinds = ["linked", "quantitative"]
    
    if kind not in valid_kinds:
        raise SecurityValidationError(f"Quest kind must be one of: {', '.join(valid_kinds)}")
    
    return kind


def validate_count_scope(count_scope: Optional[str]) -> Optional[str]:
    """Validate count scope for quantitative quests."""
    if not count_scope:
        return None
    
    valid_scopes = ["completed_tasks", "completed_goals", "any"]
    
    if count_scope not in valid_scopes:
        raise SecurityValidationError(f"Count scope must be one of: {', '.join(valid_scopes)}")
    
    return count_scope


def validate_target_count(target_count: Optional[int]) -> Optional[int]:
    """Validate target count for quantitative quests."""
    if target_count is None:
        return None
    
    if not isinstance(target_count, int):
        raise SecurityValidationError("Target count must be an integer")
    
    if target_count < 1 or target_count > 10000:
        raise SecurityValidationError("Target count must be between 1 and 10000")
    
    return target_count


def validate_period_days(period_days: Optional[int]) -> Optional[int]:
    """Validate period days for quantitative quests."""
    if period_days is None:
        return None
    
    if not isinstance(period_days, int):
        raise SecurityValidationError("Period days must be an integer")
    
    if period_days < 1 or period_days > 365:
        raise SecurityValidationError("Period days must be between 1 and 365")
    
    return period_days


def validate_estimated_duration(estimated_duration: Optional[int]) -> Optional[int]:
    """Validate estimated duration in days."""
    if estimated_duration is None:
        return None
    
    if not isinstance(estimated_duration, int):
        raise SecurityValidationError("Estimated duration must be an integer")
    
    if estimated_duration < 1 or estimated_duration > 365:
        raise SecurityValidationError("Estimated duration must be between 1 and 365 days")
    
    return estimated_duration


def validate_instructions(instructions: Optional[str]) -> Optional[str]:
    """Validate quest instructions."""
    if not instructions:
        return None
    
    if not isinstance(instructions, str):
        raise SecurityValidationError("Instructions must be a string")
    
    return sanitize_string(instructions, max_length=2000)


def validate_linked_goal_ids(goal_ids: Optional[List[str]]) -> Optional[List[str]]:
    """Validate linked goal IDs."""
    if not goal_ids:
        return None
    
    if not isinstance(goal_ids, list):
        raise SecurityValidationError("Linked goal IDs must be a list")
    
    if len(goal_ids) > 10:
        raise SecurityValidationError("Maximum 10 linked goals allowed")
    
    validated_ids = []
    for goal_id in goal_ids:
        if not isinstance(goal_id, str):
            raise SecurityValidationError("All goal IDs must be strings")
        
        # Basic UUID validation
        if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', goal_id):
            raise SecurityValidationError("Invalid goal ID format")
        
        validated_ids.append(goal_id)
    
    return validated_ids


def validate_linked_task_ids(task_ids: Optional[List[str]]) -> Optional[List[str]]:
    """Validate linked task IDs."""
    if not task_ids:
        return None
    
    if not isinstance(task_ids, list):
        raise SecurityValidationError("Linked task IDs must be a list")
    
    if len(task_ids) > 50:
        raise SecurityValidationError("Maximum 50 linked tasks allowed")
    
    validated_ids = []
    for task_id in task_ids:
        if not isinstance(task_id, str):
            raise SecurityValidationError("All task IDs must be strings")
        
        # Basic UUID validation
        if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', task_id):
            raise SecurityValidationError("Invalid task ID format")
        
        validated_ids.append(task_id)
    
    return validated_ids


def validate_depends_on_quest_ids(quest_ids: Optional[List[str]]) -> Optional[List[str]]:
    """Validate dependent quest IDs."""
    if not quest_ids:
        return None
    
    if not isinstance(quest_ids, list):
        raise SecurityValidationError("Dependent quest IDs must be a list")
    
    if len(quest_ids) > 5:
        raise SecurityValidationError("Maximum 5 dependent quests allowed")
    
    validated_ids = []
    for quest_id in quest_ids:
        if not isinstance(quest_id, str):
            raise SecurityValidationError("All quest IDs must be strings")
        
        # Basic UUID validation
        if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', quest_id):
            raise SecurityValidationError("Invalid quest ID format")
        
        validated_ids.append(quest_id)
    
    return validated_ids


def validate_deadline(deadline: Optional[int]) -> Optional[int]:
    """Validate quest deadline timestamp."""
    if deadline is None:
        return None
    
    if not isinstance(deadline, int):
        raise SecurityValidationError("Deadline must be an integer timestamp")
    
    # Check if deadline is in the future (at least 1 hour from now)
    import time
    current_time = int(time.time() * 1000)  # Convert to milliseconds
    min_deadline = current_time + (60 * 60 * 1000)  # 1 hour in milliseconds
    
    if deadline < min_deadline:
        raise SecurityValidationError("Deadline must be at least 1 hour in the future")
    
    # Check if deadline is not too far in the future (max 1 year)
    max_deadline = current_time + (365 * 24 * 60 * 60 * 1000)  # 1 year in milliseconds
    
    if deadline > max_deadline:
        raise SecurityValidationError("Deadline cannot be more than 1 year in the future")
    
    return deadline
