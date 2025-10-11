"""
Quest models for the GoalsGuild Quest feature.

This module contains Pydantic models for Quest-related operations including
creation, updates, cancellation, and responses. All models include comprehensive
validation, XSS protection, and follow the existing quest-service patterns.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re

# Quest status options
QuestStatus = Literal["draft", "active", "completed", "cancelled", "failed"]

# Quest difficulty options  
QuestDifficulty = Literal["easy", "medium", "hard"]

# Quest kind options
QuestKind = Literal["linked", "quantitative"]

# Quest count scope options
QuestCountScope = Literal["completed_tasks", "completed_goals", "any"]  # 'any' for backward compatibility

# Quest privacy options
QuestPrivacy = Literal["public", "followers", "private"]

# Predefined categories
QUEST_CATEGORIES = [
    "Health", "Work", "Personal", "Learning", "Fitness", "Creative", 
    "Financial", "Social", "Spiritual", "Hobby", "Travel", "Other"
]

# Validation constants
MAX_TITLE_LENGTH = 100
MIN_TITLE_LENGTH = 3
MAX_DESCRIPTION_LENGTH = 500
MAX_TAGS_COUNT = 10
MAX_TAG_LENGTH = 20
MAX_REWARD_XP = 1000
MIN_REWARD_XP = 0
DEFAULT_REWARD_XP = 50


class Quest(BaseModel):
    """Quest model for internal use (matches QuestResponse structure)"""
    
    # Core fields
    id: str = Field(..., description="Quest ID")
    userId: str = Field(..., description="User ID who owns the quest")
    title: str = Field(..., description="Quest title")
    description: Optional[str] = Field(None, description="Quest description")
    difficulty: QuestDifficulty = Field(..., description="Quest difficulty")
    rewardXp: int = Field(..., description="Reward XP")
    status: QuestStatus = Field(..., description="Quest status")
    category: str = Field(..., description="Quest category")
    tags: List[str] = Field(default_factory=list, description="Quest tags")
    privacy: QuestPrivacy = Field(..., description="Quest privacy setting")
    deadline: Optional[int] = Field(None, description="Quest deadline (epoch ms)")
    createdAt: int = Field(..., description="Creation timestamp (epoch ms)")
    updatedAt: int = Field(..., description="Last update timestamp (epoch ms)")
    startedAt: Optional[int] = Field(None, description="Quest start timestamp (epoch ms)")
    completedAt: Optional[int] = Field(None, description="Quest completion timestamp (epoch ms)")
    version: int = Field(..., description="Optimistic locking version")
    
    # Quest type and configuration
    kind: QuestKind = Field(..., description="Quest type")
    
    # Linked Quest fields
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked goal IDs")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs")
    dependsOnQuestIds: Optional[List[str]] = Field(None, description="Dependent quest IDs")
    
    # Quantitative Quest fields
    targetCount: Optional[int] = Field(None, description="Target count for quantitative quests")
    countScope: Optional[QuestCountScope] = Field(None, description="Count scope for quantitative quests")
    periodDays: Optional[int] = Field(None, description="Period duration for quantitative quests")
    
    # Audit trail
    auditTrail: List[dict] = Field(default_factory=list, description="Audit trail events")
    
    # Additional fields for analytics
    linkedTasks: List[dict] = Field(default_factory=list, description="Linked tasks for analytics")
    quantitativeTasks: List[dict] = Field(default_factory=list, description="Quantitative tasks for analytics")


class QuestCreatePayload(BaseModel):
    """Payload for creating a new quest (creates as draft)"""
    
    # Basic Information (Required)
    title: str = Field(
        ..., 
        min_length=MIN_TITLE_LENGTH, 
        max_length=MAX_TITLE_LENGTH,
        description="Quest title (3-100 characters)"
    )
    category: str = Field(
        ..., 
        description="Quest category (must be from predefined list)"
    )
    difficulty: QuestDifficulty = Field(
        default="medium",
        description="Quest difficulty level"
    )
    
    # Basic Information (Optional)
    description: Optional[str] = Field(
        None,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Quest description (max 500 characters)"
    )
    rewardXp: int = Field(
        default=DEFAULT_REWARD_XP,
        ge=MIN_REWARD_XP,
        le=MAX_REWARD_XP,
        description="Reward XP (0-1000, default 50)"
    )
    tags: List[str] = Field(
        default_factory=list,
        max_length=MAX_TAGS_COUNT,
        description="Quest tags (max 10 tags)"
    )
    deadline: Optional[int] = Field(
        None,
        description="Quest deadline as epoch milliseconds"
    )
    privacy: QuestPrivacy = Field(
        default="private",
        description="Quest template sharing privacy"
    )
    
    # Quest Type and Configuration
    kind: QuestKind = Field(
        default="linked",
        description="Quest type: linked or quantitative"
    )
    
    # Linked Quest Fields (Optional)
    linkedGoalIds: Optional[List[str]] = Field(
        None,
        description="Goal IDs to link (own goals + permitted external goals)"
    )
    linkedTaskIds: Optional[List[str]] = Field(
        None,
        description="Task IDs to link (own tasks only)"
    )
    dependsOnQuestIds: Optional[List[str]] = Field(
        None,
        description="Quest IDs this quest depends on (own quests only)"
    )
    
    # Quantitative Quest Fields (Optional)
    targetCount: Optional[int] = Field(
        None,
        gt=0,
        description="Target count for quantitative quests"
    )
    countScope: Optional[QuestCountScope] = Field(
        None,
        description="Scope for counting in quantitative quests"
    )
    periodDays: Optional[int] = Field(
        None,
        gt=0,
        description="Counting period duration in days"
    )
    
    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and sanitize title"""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        
        # Remove extra whitespace and validate length
        sanitized = re.sub(r'\s+', ' ', v.strip())
        if len(sanitized) < MIN_TITLE_LENGTH:
            raise ValueError(f"Title must be at least {MIN_TITLE_LENGTH} characters")
        if len(sanitized) > MAX_TITLE_LENGTH:
            raise ValueError(f"Title must be no more than {MAX_TITLE_LENGTH} characters")
        
        return sanitized
    
    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if v is None:
            return None
        
        # Remove extra whitespace and validate length
        sanitized = re.sub(r'\s+', ' ', v.strip())
        if len(sanitized) > MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description must be no more than {MAX_DESCRIPTION_LENGTH} characters")
        
        return sanitized if sanitized else None
    
    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Validate category against predefined list"""
        if not v or not v.strip():
            raise ValueError("Category is required")
        
        sanitized = v.strip()
        if sanitized not in QUEST_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(QUEST_CATEGORIES)}")
        
        return sanitized
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate and sanitize tags"""
        if not v:
            return []
        
        if len(v) > MAX_TAGS_COUNT:
            raise ValueError(f"Maximum {MAX_TAGS_COUNT} tags allowed")
        
        sanitized_tags = []
        for tag in v:
            if not isinstance(tag, str):
                raise ValueError("All tags must be strings")
            
            sanitized = tag.strip()
            if not sanitized:
                continue
                
            if len(sanitized) > MAX_TAG_LENGTH:
                raise ValueError(f"Each tag must be no more than {MAX_TAG_LENGTH} characters")
            
            # Basic XSS protection
            if re.search(r'[<>"\']', sanitized):
                raise ValueError("Tags cannot contain HTML/script characters")
            
            sanitized_tags.append(sanitized)
        
        return sanitized_tags
    
    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, v: Optional[int]) -> Optional[int]:
        """Validate deadline is in the future"""
        if v is None:
            return None
        
        now_ms = int(datetime.now().timestamp() * 1000)
        if v <= now_ms:
            raise ValueError("Deadline must be in the future")
        
        # Require at least 1 hour in the future
        one_hour_ms = 60 * 60 * 1000
        if v <= now_ms + one_hour_ms:
            raise ValueError("Deadline must be at least 1 hour in the future")
        
        return v
    
    @field_validator("linkedGoalIds", "linkedTaskIds", "dependsOnQuestIds")
    @classmethod
    def validate_id_lists(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate ID lists are non-empty and contain valid IDs"""
        if v is None:
            return None
        
        if not v:
            raise ValueError("ID list cannot be empty if provided")
        
        # Basic UUID/ULID validation (simplified)
        id_pattern = re.compile(r'^[a-zA-Z0-9_-]{8,}$')
        for idx, id_val in enumerate(v):
            if not isinstance(id_val, str) or not id_val.strip():
                raise ValueError(f"ID at index {idx} must be a non-empty string")
            
            if not id_pattern.match(id_val.strip()):
                raise ValueError(f"ID at index {idx} is not a valid format")
        
        return [id_val.strip() for id_val in v]
    
    @field_validator("targetCount")
    @classmethod
    def validate_target_count(cls, v: Optional[int]) -> Optional[int]:
        """Validate target count for quantitative quests"""
        if v is None:
            return None
        
        if v <= 0:
            raise ValueError("Target count must be greater than 0")
        
        if v > 10000:  # Reasonable upper limit
            raise ValueError("Target count must be no more than 10,000")
        
        return v
    
    
    @field_validator("periodDays")
    @classmethod
    def validate_period_days(cls, v: Optional[int]) -> Optional[int]:
        """Validate period duration for quantitative quests"""
        if v is None:
            return None
        
        if v <= 0:
            raise ValueError("Period must be greater than 0 days")
        
        # Maximum 1 year
        max_period = 365
        if v > max_period:
            raise ValueError("Period cannot exceed 1 year")
        
        return v
    
    def model_post_init(self, __context) -> None:
        """Post-initialization validation for quest type consistency"""
        # Validate quantitative quest requirements
        if self.kind == "quantitative":
            if self.targetCount is None:
                raise ValueError("targetCount is required for quantitative quests")
            if self.countScope is None:
                raise ValueError("countScope is required for quantitative quests")
            if self.periodDays is None:
                raise ValueError("periodDays is required for quantitative quests")
        
        # Note: For linked quests, we allow creation without linked items
        # The validation will happen when the quest is started, not when created


class QuestUpdatePayload(BaseModel):
    """Payload for updating a quest (draft only)"""
    
    # Only allow updating certain fields for draft quests
    title: Optional[str] = Field(
        None,
        min_length=MIN_TITLE_LENGTH,
        max_length=MAX_TITLE_LENGTH,
        description="Quest title (3-100 characters)"
    )
    description: Optional[str] = Field(
        None,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Quest description (max 500 characters)"
    )
    category: Optional[str] = Field(
        None,
        description="Quest category (must be from predefined list)"
    )
    difficulty: Optional[QuestDifficulty] = Field(
        None,
        description="Quest difficulty level"
    )
    rewardXp: Optional[int] = Field(
        None,
        ge=MIN_REWARD_XP,
        le=MAX_REWARD_XP,
        description="Reward XP (0-1000)"
    )
    tags: Optional[List[str]] = Field(
        None,
        max_length=MAX_TAGS_COUNT,
        description="Quest tags (max 10 tags)"
    )
    deadline: Optional[int] = Field(
        None,
        description="Quest deadline as epoch milliseconds"
    )
    privacy: Optional[QuestPrivacy] = Field(
        None,
        description="Quest template sharing privacy"
    )
    kind: Optional[QuestKind] = Field(
        None,
        description="Quest type (linked or quantitative)"
    )
    
    # Linked Quest Fields
    linkedGoalIds: Optional[List[str]] = Field(
        None,
        description="Goal IDs to link"
    )
    linkedTaskIds: Optional[List[str]] = Field(
        None,
        description="Task IDs to link"
    )
    dependsOnQuestIds: Optional[List[str]] = Field(
        None,
        description="Quest IDs this quest depends on"
    )
    
    # Quantitative Quest Fields
    targetCount: Optional[int] = Field(
        None,
        gt=0,
        description="Target count for quantitative quests"
    )
    countScope: Optional[QuestCountScope] = Field(
        None,
        description="Scope for counting in quantitative quests"
    )
    periodDays: Optional[int] = Field(
        None,
        gt=0,
        description="Counting period duration in days"
    )
    
    # Reuse validation methods from QuestCreatePayload
    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize title"""
        if v is None:
            return None
        return QuestCreatePayload.validate_title(v)
    
    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if v is None:
            return None
        return QuestCreatePayload.validate_description(v)
    
    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        """Validate category against predefined list"""
        if v is None:
            return None
        return QuestCreatePayload.validate_category(v)
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and sanitize tags"""
        if v is None:
            return None
        return QuestCreatePayload.validate_tags(v)
    
    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, v: Optional[int]) -> Optional[int]:
        """Validate deadline is in the future"""
        if v is None:
            return None
        return QuestCreatePayload.validate_deadline(v)
    
    @field_validator("kind")
    @classmethod
    def validate_kind(cls, v: Optional[QuestKind]) -> Optional[QuestKind]:
        """Validate quest kind"""
        if v is None:
            return None
        # QuestKind is an enum, so it's already validated by Pydantic
        return v
    
    @field_validator("linkedGoalIds", "linkedTaskIds", "dependsOnQuestIds")
    @classmethod
    def validate_id_lists(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate ID lists are non-empty and contain valid IDs"""
        if v is None:
            return None
        return QuestCreatePayload.validate_id_lists(v)
    
    @field_validator("targetCount")
    @classmethod
    def validate_target_count(cls, v: Optional[int]) -> Optional[int]:
        """Validate target count for quantitative quests"""
        if v is None:
            return None
        return QuestCreatePayload.validate_target_count(v)
    
    
    @field_validator("periodDays")
    @classmethod
    def validate_period_days(cls, v: Optional[int]) -> Optional[int]:
        """Validate period duration for quantitative quests"""
        if v is None:
            return None
        return QuestCreatePayload.validate_period_days(v)


class QuestCancelPayload(BaseModel):
    """Payload for cancelling a quest (optional reason)"""
    
    reason: Optional[str] = Field(
        None,
        max_length=200,
        description="Optional reason for cancelling the quest"
    )
    
    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize cancellation reason"""
        if v is None:
            return None
        
        sanitized = re.sub(r'\s+', ' ', v.strip())
        if len(sanitized) > 200:
            raise ValueError("Reason must be no more than 200 characters")
        
        return sanitized if sanitized else None


class QuestResponse(BaseModel):
    """Response model for Quest (mirrors GraphQL Quest type)"""
    
    # Core fields
    id: str = Field(..., description="Quest ID")
    userId: str = Field(..., description="User ID who owns the quest")
    title: str = Field(..., description="Quest title")
    description: Optional[str] = Field(None, description="Quest description")
    difficulty: QuestDifficulty = Field(..., description="Quest difficulty")
    rewardXp: int = Field(..., description="Reward XP")
    status: QuestStatus = Field(..., description="Quest status")
    category: str = Field(..., description="Quest category")
    tags: List[str] = Field(default_factory=list, description="Quest tags")
    privacy: QuestPrivacy = Field(..., description="Quest privacy setting")
    deadline: Optional[int] = Field(None, description="Quest deadline (epoch ms)")
    createdAt: int = Field(..., description="Creation timestamp (epoch ms)")
    updatedAt: int = Field(..., description="Last update timestamp (epoch ms)")
    startedAt: Optional[int] = Field(None, description="Quest start timestamp (epoch ms)")
    completedAt: Optional[int] = Field(None, description="Quest completion timestamp (epoch ms)")
    version: int = Field(..., description="Optimistic locking version")
    
    # Quest type and configuration
    kind: QuestKind = Field(..., description="Quest type")
    
    # Linked Quest fields
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked goal IDs")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs")
    dependsOnQuestIds: Optional[List[str]] = Field(None, description="Dependent quest IDs")
    
    # Quantitative Quest fields
    targetCount: Optional[int] = Field(None, description="Target count for quantitative quests")
    countScope: Optional[QuestCountScope] = Field(None, description="Count scope for quantitative quests")
    periodDays: Optional[int] = Field(None, description="Period duration for quantitative quests")
    
    # Audit trail
    auditTrail: List[dict] = Field(default_factory=list, description="Audit trail events")