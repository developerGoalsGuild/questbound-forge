"""
Comment models for the collaboration system.

This module contains Pydantic models for comment-related operations including
creation, updates, and responses with threading support.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re
import html

# Validation constants
MIN_TEXT_LENGTH = 1
MAX_TEXT_LENGTH = 2000
MAX_MENTIONS = 10


class CommentCreatePayload(BaseModel):
    """Payload for creating a comment."""
    
    resource_type: str = Field(..., description="Type of resource")
    resource_id: str = Field(..., description="ID of the resource")
    parent_id: Optional[str] = Field(None, description="ID of parent comment for threading")
    text: str = Field(..., min_length=MIN_TEXT_LENGTH, max_length=MAX_TEXT_LENGTH, description="Comment text")
    
    @field_validator('text')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize comment text and extract mentions."""
        if not v or len(v.strip()) < MIN_TEXT_LENGTH:
            raise ValueError(f"Comment text must be at least {MIN_TEXT_LENGTH} character")
        
        # Remove HTML tags and XSS vectors
        v = html.escape(v)
        
        # Remove any remaining script tags
        v = re.sub(r'<script.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
        
        # Limit length
        if len(v) > MAX_TEXT_LENGTH:
            v = v[:MAX_TEXT_LENGTH]
        
        return v.strip()
    
    @field_validator('parent_id')
    @classmethod
    def validate_parent_id(cls, v):
        """Validate parent ID format if provided."""
        if v is not None and not v.strip():
            return None
        return v


class CommentUpdatePayload(BaseModel):
    """Payload for updating a comment."""
    
    text: str = Field(..., min_length=MIN_TEXT_LENGTH, max_length=MAX_TEXT_LENGTH, description="Updated comment text")
    
    @field_validator('text')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize comment text."""
        if not v or len(v.strip()) < MIN_TEXT_LENGTH:
            raise ValueError(f"Comment text must be at least {MIN_TEXT_LENGTH} character")
        
        # Remove HTML tags and XSS vectors
        v = html.escape(v)
        
        # Remove any remaining script tags
        v = re.sub(r'<script.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
        
        # Limit length
        if len(v) > MAX_TEXT_LENGTH:
            v = v[:MAX_TEXT_LENGTH]
        
        return v.strip()


class CommentResponse(BaseModel):
    """Response model for a single comment."""
    
    comment_id: str = Field(..., description="Unique comment ID")
    parent_id: Optional[str] = Field(None, description="ID of parent comment")
    user_id: str = Field(..., description="ID of the user who wrote the comment")
    username: str = Field(..., description="Username of the commenter")
    user_avatar: Optional[str] = Field(None, description="Avatar URL of the commenter")
    text: str = Field(..., description="Comment text")
    mentions: List[str] = Field(default_factory=list, description="List of mentioned user IDs")
    reactions: Dict[str, int] = Field(default_factory=dict, description="Reactions summary {emoji: count}")
    user_reaction: Optional[str] = Field(None, description="Current user's reaction emoji")
    reply_count: int = Field(0, description="Number of replies to this comment")
    is_edited: bool = Field(False, description="Whether the comment has been edited")
    created_at: datetime = Field(..., description="When the comment was created")
    updated_at: Optional[datetime] = Field(None, description="When the comment was last updated")


class CommentListResponse(BaseModel):
    """Response model for listing comments."""
    
    comments: List[CommentResponse] = Field(..., description="List of comments")
    next_token: Optional[str] = Field(None, description="Token for pagination")
    total_count: int = Field(..., description="Total number of comments")
    
    @field_validator('comments')
    @classmethod
    def validate_comments_not_empty(cls, v):
        """Ensure comments list is not None."""
        if v is None:
            return []
        return v


def extract_mentions(text: str) -> List[str]:
    """
    Extract @username mentions from comment text.
    
    Args:
        text: Comment text to analyze
        
    Returns:
        List of user IDs mentioned in the text
    """
    # Find all @username patterns
    mention_pattern = r'@([a-zA-Z0-9_]+)'
    mentions = re.findall(mention_pattern, text)
    
    # Remove duplicates and limit count
    unique_mentions = list(dict.fromkeys(mentions))[:MAX_MENTIONS]
    
    return unique_mentions

