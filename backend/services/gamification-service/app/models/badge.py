from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BadgeDefinition(BaseModel):
    """Badge definition/metadata."""
    id: str = Field(..., description="Badge ID")
    name: str = Field(..., description="Badge name")
    description: str = Field(..., description="Badge description")
    icon: Optional[str] = Field(None, description="Badge icon URL or identifier")
    category: str = Field(..., description="Badge category (quest, level, challenge, streak)")
    rarity: str = Field("common", description="Badge rarity (common, rare, epic, legendary)")
    criteria: Optional[dict] = Field(None, description="Criteria for earning this badge")
    createdAt: int = Field(..., description="Creation timestamp")


class UserBadge(BaseModel):
    """User badge assignment."""
    userId: str = Field(..., description="User ID")
    badgeId: str = Field(..., description="Badge ID")
    earnedAt: int = Field(..., description="Timestamp when badge was earned")
    progress: Optional[float] = Field(None, description="Progress towards badge (0.0-1.0)")
    metadata: Optional[dict] = Field(None, description="Additional metadata")
    definitionName: Optional[str] = Field(None, description="Snapshot of badge name")
    definitionDescription: Optional[str] = Field(None, description="Snapshot of badge description")
    definitionCategory: Optional[str] = Field(None, description="Snapshot of badge category")
    definitionRarity: Optional[str] = Field(None, description="Snapshot of badge rarity")
    definitionIcon: Optional[str] = Field(None, description="Snapshot of badge icon reference")


class BadgeWithDefinition(BaseModel):
    """Badge with full definition."""
    badge: UserBadge = Field(..., description="User badge")
    definition: BadgeDefinition = Field(..., description="Badge definition")


class BadgeListResponse(BaseModel):
    """List of badges response."""
    badges: List[BadgeWithDefinition] = Field(default_factory=list)
    total: int = Field(0, description="Total number of badges")


class BadgeAssignmentRequest(BaseModel):
    """Request to assign a badge (internal use)."""
    userId: str = Field(..., description="User ID")
    badgeId: str = Field(..., description="Badge ID")
    metadata: Optional[dict] = Field(None, description="Additional metadata")


class BadgeEvaluationRequest(BaseModel):
    """Request payload for evaluating badge criteria."""
    userId: str = Field(..., description="User ID")
    achievementType: str = Field(..., description="Type of achievement (quest_completed, level_up, streak, challenge_won)")
    achievementData: dict = Field(default_factory=dict, description="Additional data (e.g., counts, streak days)")
