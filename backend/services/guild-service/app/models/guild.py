from typing import List, Optional, Dict, Any, Literal
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

# Guild Quest Models (ONLY quantitative and percentual - exclusive to guilds)
GuildQuestStatus = Literal["draft", "active", "completed", "failed", "archived", "cancelled"]
GuildQuestDifficulty = Literal["easy", "medium", "hard"]
GuildQuestKind = Literal["quantitative", "percentual"]  # Only these two types for guild quests
GuildQuestCountScope = Literal["goals", "tasks", "guild_quest"]  # For quantitative: choose ONE
GuildQuestPercentualType = Literal["goal_task_completion", "member_completion"]  # For percentual

# Reuse quest categories
QUEST_CATEGORIES = [
    "Health", "Work", "Personal", "Learning", "Fitness", "Creative", 
    "Financial", "Social", "Spiritual", "Hobby", "Travel", "Other"
]

class GuildQuestCreatePayload(BaseModel):
    """Payload for creating a guild quest (quantitative or percentual only)"""
    title: str = Field(..., min_length=3, max_length=100, description="Quest title")
    description: Optional[str] = Field(None, max_length=500, description="Quest description")
    difficulty: GuildQuestDifficulty = Field(default="medium", description="Quest difficulty")
    # Note: rewardXp is now auto-calculated and not part of input
    category: str = Field(..., description="Quest category")
    tags: List[str] = Field(default_factory=list, max_items=10, description="Quest tags")
    deadline: Optional[int] = Field(None, description="Deadline as epoch milliseconds")
    kind: GuildQuestKind = Field(..., description="Quest type: quantitative or percentual")
    
    # Quantitative quest fields
    targetCount: Optional[int] = Field(None, ge=1, description="Target count for quantitative quests")
    countScope: Optional[GuildQuestCountScope] = Field(None, description="Count scope: goals (user goals), tasks, or guild_quest")
    targetQuestId: Optional[str] = Field(None, description="Target quest ID if counting guild quest completions")
    periodDays: Optional[int] = Field(None, ge=1, description="Period duration in days (optional)")
    
    # Percentual quest fields
    percentualType: Optional[GuildQuestPercentualType] = Field(None, description="Percentual type: goal_task_completion or member_completion")
    targetPercentage: Optional[float] = Field(None, ge=0, le=100, description="Target percentage (0-100)")
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked user goal IDs for goal_task_completion type (references goals from guild members)")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs for goal_task_completion type")
    percentualCountScope: Optional[Literal["goals", "tasks", "both"]] = Field(None, description="Count scope for goal_task_completion (goals = user goals from guild members)")

class GuildQuestUpdatePayload(BaseModel):
    """Payload for updating a guild quest (only draft quests)"""
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    difficulty: Optional[GuildQuestDifficulty] = None
    # Note: rewardXp is now auto-calculated and not part of input
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(None, max_items=10)
    deadline: Optional[int] = None
    kind: Optional[GuildQuestKind] = None  # Cannot change kind after creation
    
    # Quantitative quest fields
    targetCount: Optional[int] = Field(None, ge=1)
    countScope: Optional[GuildQuestCountScope] = None
    targetQuestId: Optional[str] = None
    periodDays: Optional[int] = Field(None, ge=1)
    
    # Percentual quest fields
    percentualType: Optional[GuildQuestPercentualType] = None
    targetPercentage: Optional[float] = Field(None, ge=0, le=100)
    linkedGoalIds: Optional[List[str]] = None
    linkedTaskIds: Optional[List[str]] = None
    percentualCountScope: Optional[Literal["goals", "tasks", "both"]] = None
    
    status: Optional[GuildQuestStatus] = None  # For status changes (draft -> active, active -> archived)

class GuildQuestCompletionPayload(BaseModel):
    """Payload for completing a guild quest"""
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked goal IDs used for completion")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs used for completion")
    notes: Optional[str] = Field(None, max_length=500, description="Optional completion notes")
    completionMethod: Literal["auto", "manual"] = Field(default="auto", description="Completion method")

class GuildQuestCompletionResponse(BaseModel):
    """Response for guild quest completion"""
    questId: str = Field(..., description="Quest ID")
    userId: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    completedAt: int = Field(..., description="Completion timestamp (epoch ms)")
    rewardXp: int = Field(..., description="Reward XP earned")
    completionMethod: str = Field(..., description="Completion method")
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked goal IDs")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs")
    notes: Optional[str] = Field(None, description="Completion notes")

class GuildQuestProgressResponse(BaseModel):
    """Response for guild quest progress"""
    questId: str = Field(..., description="Quest ID")
    userId: str = Field(..., description="User ID")
    isCompleted: bool = Field(..., description="Whether quest is completed")
    completedAt: Optional[int] = Field(None, description="Completion timestamp")
    progress: Dict[str, Any] = Field(default_factory=dict, description="Progress details")

class GuildQuestResponse(BaseModel):
    """Response model for guild quest (quantitative or percentual only)"""
    questId: str = Field(..., description="Quest ID")
    guildId: str = Field(..., description="Guild ID")
    title: str = Field(..., description="Quest title")
    description: Optional[str] = Field(None, description="Quest description")
    difficulty: str = Field(..., description="Quest difficulty")
    rewardXp: int = Field(..., description="Reward XP")
    status: str = Field(..., description="Quest status")
    category: str = Field(..., description="Quest category")
    tags: List[str] = Field(default_factory=list, description="Quest tags")
    createdBy: str = Field(..., description="Creator user ID")
    createdByNickname: Optional[str] = Field(None, description="Creator nickname for quick display")
    createdAt: int = Field(..., description="Creation timestamp (epoch ms)")
    updatedAt: int = Field(..., description="Update timestamp (epoch ms)")
    updatedByNickname: Optional[str] = Field(None, description="Last updater nickname for quick display")
    deadline: Optional[int] = Field(None, description="Deadline (epoch ms)")
    startedAt: Optional[int] = Field(None, description="Start timestamp (epoch ms)")
    finishedAt: Optional[int] = Field(None, description="Finish timestamp (epoch ms)")
    kind: str = Field(..., description="Quest type: quantitative or percentual")
    
    # Quantitative quest fields
    targetCount: Optional[int] = Field(None, description="Target count")
    countScope: Optional[str] = Field(None, description="Count scope: goals, tasks, or guild_quest")
    targetQuestId: Optional[str] = Field(None, description="Target quest ID if counting guild quest completions")
    currentCount: Optional[int] = Field(None, description="Current guild-wide count")
    periodDays: Optional[int] = Field(None, description="Period duration in days")
    periodStartAt: Optional[int] = Field(None, description="Period start timestamp")
    
    # Percentual quest fields
    percentualType: Optional[str] = Field(None, description="Percentual type: goal_task_completion or member_completion")
    targetPercentage: Optional[float] = Field(None, description="Target percentage (0-100)")
    linkedGoalIds: Optional[List[str]] = Field(None, description="Linked goal IDs for goal_task_completion")
    linkedTaskIds: Optional[List[str]] = Field(None, description="Linked task IDs for goal_task_completion")
    percentualCountScope: Optional[str] = Field(None, description="Count scope: goals, tasks, or both")
    memberTotal: Optional[int] = Field(None, description="Total guild members (for member_completion)")
    membersCompletedCount: Optional[int] = Field(None, description="Members who completed (for member_completion)")
    
    totalCompletions: int = Field(default=0, description="Total completion count")
    completedByCount: int = Field(default=0, description="Number of unique members who completed")
    lastCompletedAt: Optional[int] = Field(None, description="Last completion timestamp")
    # User-specific fields
    userCompletion: Optional[GuildQuestCompletionResponse] = Field(None, description="User's completion if applicable")
    userProgress: Optional[GuildQuestProgressResponse] = Field(None, description="User's progress")

class GuildQuestListResponse(BaseModel):
    """Response for listing guild quests"""
    quests: List[GuildQuestResponse] = Field(default_factory=list, description="List of quests")
    total: int = Field(..., description="Total number of quests")
    limit: int = Field(..., description="Limit applied")
    offset: int = Field(..., description="Offset applied")

