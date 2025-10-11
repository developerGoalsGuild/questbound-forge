"""
Quest Template models for the GoalsGuild Quest feature.

This module contains Pydantic models for Quest Template operations including
creation, updates, and responses. All models include comprehensive
validation, XSS protection, and follow the existing quest-service patterns.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re

# Import quest-related types from the main quest models
from .quest import QuestDifficulty, QuestKind, QuestCountScope

# Quest template privacy options
QuestTemplatePrivacy = Literal["public", "followers", "private"]

# Validation constants
MAX_TITLE_LENGTH = 100
MIN_TITLE_LENGTH = 3
MAX_DESCRIPTION_LENGTH = 500
MAX_TAGS_COUNT = 10
MAX_TAG_LENGTH = 20
MAX_REWARD_XP = 1000
MIN_REWARD_XP = 0
DEFAULT_REWARD_XP = 50


class QuestTemplateCreatePayload(BaseModel):
    """Payload for creating a new quest template"""
    
    # Basic Information (Required)
    title: str = Field(
        min_length=MIN_TITLE_LENGTH,
        max_length=MAX_TITLE_LENGTH,
        description="Template title"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Template description"
    )
    category: str = Field(
        min_length=1,
        max_length=50,
        description="Template category"
    )
    difficulty: QuestDifficulty = Field(description="Template difficulty level")
    rewardXp: int = Field(
        default=DEFAULT_REWARD_XP,
        ge=MIN_REWARD_XP,
        le=MAX_REWARD_XP,
        description="XP reward for completing quests from this template"
    )
    tags: List[str] = Field(
        default_factory=list,
        max_length=MAX_TAGS_COUNT,
        description="Template tags"
    )
    privacy: QuestTemplatePrivacy = Field(
        default="private",
        description="Template privacy level"
    )
    kind: QuestKind = Field(description="Template quest kind")
    
    # Template-specific fields
    targetCount: Optional[int] = Field(
        default=None,
        ge=1,
        le=1000,
        description="Target count for quantitative quests"
    )
    countScope: Optional[QuestCountScope] = Field(
        default=None,
        description="Count scope for quantitative quests"
    )
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and sanitize title"""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        
        # Basic XSS protection
        sanitized = re.sub(r'<[^>]+>', '', v.strip())
        if len(sanitized) < MIN_TITLE_LENGTH:
            raise ValueError(f"Title must be at least {MIN_TITLE_LENGTH} characters")
        
        return sanitized
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if not v:
            return None
        
        # Basic XSS protection
        sanitized = re.sub(r'<[^>]+>', '', v.strip())
        if len(sanitized) > MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description must be {MAX_DESCRIPTION_LENGTH} characters or less")
        
        return sanitized if sanitized else None
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Validate category"""
        if not v or not v.strip():
            raise ValueError("Category cannot be empty")
        
        # Basic XSS protection
        sanitized = re.sub(r'<[^>]+>', '', v.strip())
        if len(sanitized) > 50:
            raise ValueError("Category must be 50 characters or less")
        
        return sanitized
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate and sanitize tags"""
        if len(v) > MAX_TAGS_COUNT:
            raise ValueError(f"Maximum {MAX_TAGS_COUNT} tags allowed")
        
        sanitized_tags = []
        for tag in v:
            if not tag or not tag.strip():
                continue
            
            # Basic XSS protection and validation
            sanitized = re.sub(r'<[^>]+>', '', tag.strip())
            if len(sanitized) > MAX_TAG_LENGTH:
                raise ValueError(f"Tag '{tag}' must be {MAX_TAG_LENGTH} characters or less")
            
            if len(sanitized) < 1:
                continue
                
            sanitized_tags.append(sanitized)
        
        return sanitized_tags
    
    @field_validator('targetCount')
    @classmethod
    def validate_target_count(cls, v: Optional[int], info) -> Optional[int]:
        """Validate target count based on quest kind"""
        if v is None:
            return None
        
        # For quantitative quests, target count is required
        if info.data.get('kind') == 'quantitative' and v is None:
            raise ValueError("Target count is required for quantitative quest templates")
        
        return v
    
    @field_validator('countScope')
    @classmethod
    def validate_count_scope(cls, v: Optional[QuestCountScope], info) -> Optional[QuestCountScope]:
        """Validate count scope based on quest kind"""
        if v is None:
            return None
        
        # For quantitative quests, count scope is required
        if info.data.get('kind') == 'quantitative' and v is None:
            raise ValueError("Count scope is required for quantitative quest templates")
        
        return v


class QuestTemplateUpdatePayload(BaseModel):
    """Payload for updating an existing quest template"""
    
    # All fields are optional for updates
    title: Optional[str] = Field(
        default=None,
        min_length=MIN_TITLE_LENGTH,
        max_length=MAX_TITLE_LENGTH,
        description="Template title"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Template description"
    )
    category: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
        description="Template category"
    )
    difficulty: Optional[QuestDifficulty] = Field(
        default=None,
        description="Template difficulty level"
    )
    rewardXp: Optional[int] = Field(
        default=None,
        ge=MIN_REWARD_XP,
        le=MAX_REWARD_XP,
        description="XP reward for completing quests from this template"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        max_length=MAX_TAGS_COUNT,
        description="Template tags"
    )
    privacy: Optional[QuestTemplatePrivacy] = Field(
        default=None,
        description="Template privacy level"
    )
    kind: Optional[QuestKind] = Field(
        default=None,
        description="Template quest kind"
    )
    targetCount: Optional[int] = Field(
        default=None,
        ge=1,
        le=1000,
        description="Target count for quantitative quests"
    )
    countScope: Optional[QuestCountScope] = Field(
        default=None,
        description="Count scope for quantitative quests"
    )
    
    # Apply same validators as create payload
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return QuestTemplateCreatePayload.validate_title(v)
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return QuestTemplateCreatePayload.validate_description(v)
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return QuestTemplateCreatePayload.validate_category(v)
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        return QuestTemplateCreatePayload.validate_tags(v)


class QuestTemplateResponse(BaseModel):
    """Response model for quest template operations"""
    
    id: str = Field(description="Template ID")
    userId: str = Field(description="User ID who created the template")
    title: str = Field(description="Template title")
    description: Optional[str] = Field(description="Template description")
    category: str = Field(description="Template category")
    difficulty: QuestDifficulty = Field(description="Template difficulty level")
    rewardXp: int = Field(description="XP reward for completing quests from this template")
    tags: List[str] = Field(description="Template tags")
    privacy: QuestTemplatePrivacy = Field(description="Template privacy level")
    kind: QuestKind = Field(description="Template quest kind")
    targetCount: Optional[int] = Field(description="Target count for quantitative quests")
    countScope: Optional[QuestCountScope] = Field(description="Count scope for quantitative quests")
    createdAt: int = Field(description="Template creation timestamp")
    updatedAt: int = Field(description="Template last update timestamp")
    
    class Config:
        from_attributes = True


class QuestTemplateListResponse(BaseModel):
    """Response model for listing quest templates"""
    
    templates: List[QuestTemplateResponse] = Field(description="List of quest templates")
    total: int = Field(description="Total number of templates")
    hasMore: bool = Field(description="Whether there are more templates available")
    nextToken: Optional[str] = Field(description="Token for pagination")
