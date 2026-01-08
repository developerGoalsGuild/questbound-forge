from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class GuildCommentCreatePayload(BaseModel):
    content: str = Field(..., min_length=1, max_length=500, description="Comment content")
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID for replies")

class GuildCommentResponse(BaseModel):
    comment_id: str = Field(..., description="Comment ID")
    guild_id: str = Field(..., description="Guild ID")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    avatar_url: Optional[str] = Field(None, description="User avatar URL")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: Optional[datetime] = Field(None, description="Last update date")
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID")
    replies: Optional[List['GuildCommentResponse']] = Field(None, description="Comment replies")
    likes: int = Field(0, description="Number of likes")
    is_liked: bool = Field(False, description="Whether current user liked this comment")
    is_edited: bool = Field(False, description="Whether comment was edited")
    user_role: str = Field(..., description="User role in guild")

class GuildCommentListResponse(BaseModel):
    comments: List[GuildCommentResponse] = Field(..., description="List of comments")
    total: int = Field(..., description="Total number of comments")
    limit: int = Field(..., description="Limit applied")
    offset: int = Field(..., description="Offset applied")
    has_more: bool = Field(..., description="Whether there are more results")

