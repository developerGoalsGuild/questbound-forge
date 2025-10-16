from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class GuildAnalyticsResponse(BaseModel):
    guild_id: str = Field(..., description="Guild ID")
    total_members: int = Field(..., description="Total number of members")
    active_members: int = Field(..., description="Number of active members")
    total_goals: int = Field(..., description="Total number of goals")
    completed_goals: int = Field(..., description="Number of completed goals")
    total_quests: int = Field(..., description="Total number of quests")
    completed_quests: int = Field(..., description="Number of completed quests")
    total_comments: int = Field(..., description="Total number of comments")
    member_growth_rate: float = Field(..., description="Member growth rate")
    goal_completion_rate: float = Field(..., description="Goal completion rate")
    quest_completion_rate: float = Field(..., description="Quest completion rate")
    activity_score: float = Field(..., description="Overall activity score")
    last_updated: datetime = Field(..., description="Last update timestamp")

class GuildRankingResponse(BaseModel):
    guild_id: str = Field(..., description="Guild ID")
    name: str = Field(..., description="Guild name")
    avatar_url: Optional[str] = Field(None, description="Guild avatar URL")
    position: int = Field(..., description="Current ranking position")
    previous_position: Optional[int] = Field(None, description="Previous ranking position")
    total_score: float = Field(..., description="Total ranking score")
    activity_score: float = Field(..., description="Activity score")
    growth_rate: float = Field(..., description="Growth rate")
    member_count: int = Field(..., description="Number of members")
    badges: List[str] = Field(default_factory=list, description="Guild badges")
    trend: str = Field(..., description="Trend indicator (up, down, stable)")

