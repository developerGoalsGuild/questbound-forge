"""
Reaction models for the collaboration system.

This module contains Pydantic models for reaction-related operations.
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field, field_validator

# Allowed emoji reactions
ALLOWED_EMOJIS = ["👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🚀"]


class ReactionPayload(BaseModel):
    """Payload for adding/removing a reaction."""
    
    emoji: str = Field(..., description="Emoji reaction")
    
    @field_validator('emoji')
    @classmethod
    def validate_emoji(cls, v):
        """Validate emoji is in the allowed list."""
        if v not in ALLOWED_EMOJIS:
            raise ValueError(f"Emoji must be one of: {', '.join(ALLOWED_EMOJIS)}")
        return v


class ReactionSummaryResponse(BaseModel):
    """Response model for reaction summary."""
    
    reactions: Dict[str, int] = Field(default_factory=dict, description="Reactions summary {emoji: count}")
    user_reaction: Optional[str] = Field(None, description="Current user's reaction emoji")
    
    @field_validator('reactions')
    @classmethod
    def validate_reactions(cls, v):
        """Validate reactions dictionary."""
        if v is None:
            return {}
        
        # Ensure all emojis are in allowed list
        for emoji in v.keys():
            if emoji not in ALLOWED_EMOJIS:
                raise ValueError(f"Invalid emoji in reactions: {emoji}")
        
        return v
    
    @field_validator('user_reaction')
    @classmethod
    def validate_user_reaction(cls, v):
        """Validate user reaction emoji."""
        if v is not None and v not in ALLOWED_EMOJIS:
            raise ValueError(f"User reaction emoji must be one of: {', '.join(ALLOWED_EMOJIS)}")
        return v

