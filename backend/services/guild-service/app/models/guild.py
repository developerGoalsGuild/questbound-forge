from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class GuildType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    APPROVAL = "approval"

class GuildMemberRole(str, Enum):
    OWNER = "owner"
    MODERATOR = "moderator"
    MEMBER = "member"

class GuildSettings(BaseModel):
    allow_join_requests: bool = True
    require_approval: bool = False
    allow_comments: bool = True

class GuildUserPermissions(BaseModel):
    is_member: bool = Field(False, description="Whether the user is a member of this guild")
    is_owner: bool = Field(False, description="Whether the user is the owner of this guild")
    is_moderator: bool = Field(False, description="Whether the user is a moderator of this guild")
    can_join: bool = Field(False, description="Whether the user can join this guild")
    can_request_join: bool = Field(False, description="Whether the user can request to join this guild")
    has_pending_request: bool = Field(False, description="Whether the user has a pending join request")
    can_leave: bool = Field(False, description="Whether the user can leave this guild")
    can_manage: bool = Field(False, description="Whether the user can manage this guild")

class GuildCreatePayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Guild name")
    description: Optional[str] = Field(None, max_length=500, description="Guild description")
    guild_type: GuildType = Field(..., description="Guild type")
    tags: Optional[List[str]] = Field(default_factory=list, max_items=10, description="Guild tags")
    settings: Optional[GuildSettings] = Field(default_factory=GuildSettings, description="Guild settings")

class GuildUpdatePayload(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Guild name")
    description: Optional[str] = Field(None, max_length=500, description="Guild description")
    guild_type: Optional[GuildType] = Field(None, description="Guild type")
    tags: Optional[List[str]] = Field(None, max_items=10, description="Guild tags")
    settings: Optional[GuildSettings] = Field(None, description="Guild settings")

class GuildMemberResponse(BaseModel):
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    nickname: Optional[str] = Field(None, description="Display nickname")
    email: Optional[str] = Field(None, description="User email")
    avatar_url: Optional[str] = Field(None, description="User avatar URL")
    role: GuildMemberRole = Field(..., description="Member role")
    joined_at: datetime = Field(..., description="Join date")
    last_seen_at: Optional[datetime] = Field(None, description="Last seen date")
    invited_by: Optional[str] = Field(None, description="User who invited this member")
    is_blocked: bool = Field(False, description="Whether user is blocked from commenting")
    blocked_at: Optional[datetime] = Field(None, description="Block date")
    blocked_by: Optional[str] = Field(None, description="User who blocked this member")
    can_comment: bool = Field(True, description="Whether user can comment")

class GuildResponse(BaseModel):
    guild_id: str = Field(..., description="Guild ID")
    name: str = Field(..., description="Guild name")
    description: Optional[str] = Field(None, description="Guild description")
    created_by: str = Field(..., description="Creator user ID")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: Optional[datetime] = Field(None, description="Last update date")
    member_count: int = Field(..., description="Number of members")
    goal_count: int = Field(0, description="Number of associated goals")
    quest_count: int = Field(0, description="Number of associated quests")
    guild_type: GuildType = Field(..., description="Guild type")
    tags: List[str] = Field(default_factory=list, description="Guild tags")
    members: Optional[List[GuildMemberResponse]] = Field(None, description="Guild members")
    owner_username: Optional[str] = Field(None, description="Owner username")
    owner_nickname: Optional[str] = Field(None, description="Owner nickname")
    goals: Optional[List[Dict[str, Any]]] = Field(None, description="Associated goals")
    quests: Optional[List[Dict[str, Any]]] = Field(None, description="Associated quests")
    
    # Ranking data
    position: Optional[int] = Field(None, description="Current ranking position")
    previous_position: Optional[int] = Field(None, description="Previous ranking position")
    total_score: Optional[float] = Field(None, description="Total ranking score")
    activity_score: Optional[float] = Field(None, description="Activity score")
    growth_rate: Optional[float] = Field(None, description="Growth rate")
    badges: Optional[List[str]] = Field(None, description="Guild badges")
    
    # Avatar data
    avatar_url: Optional[str] = Field(None, description="Guild avatar URL")
    avatar_key: Optional[str] = Field(None, description="Guild avatar S3 key")
    
    # Moderation data
    moderators: Optional[List[str]] = Field(None, description="Moderator user IDs")
    pending_requests: Optional[int] = Field(None, description="Number of pending join requests")
    settings: Optional[GuildSettings] = Field(None, description="Guild settings")
    
    # User permissions (computed based on current user)
    user_permissions: Optional[GuildUserPermissions] = Field(None, description="Current user's permissions for this guild")

class GuildListResponse(BaseModel):
    guilds: List[GuildResponse] = Field(..., description="List of guilds")
    total: int = Field(..., description="Total number of guilds")
    limit: int = Field(..., description="Limit applied")
    offset: int = Field(..., description="Offset applied")
    has_more: bool = Field(..., description="Whether there are more results")

class GuildNameCheckRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Guild name to check")

class GuildNameCheckResponse(BaseModel):
    available: bool = Field(..., description="Whether the guild name is available")
    message: Optional[str] = Field(None, description="Optional message about name availability")

