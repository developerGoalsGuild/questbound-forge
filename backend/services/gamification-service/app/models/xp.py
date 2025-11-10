from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class XPTransaction(BaseModel):
    """XP transaction record."""
    amount: int = Field(..., description="XP amount (positive for awards, negative for deductions)")
    source: str = Field(..., description="Source of XP (task_completion, goal_completion, quest_completion, challenge_completion, daily_login)")
    sourceId: Optional[str] = Field(None, description="ID of the source entity (task_id, goal_id, quest_id, challenge_id)")
    description: str = Field(..., description="Human-readable description")
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    eventId: Optional[str] = Field(None, description="Unique event ID for idempotency")


class XPSummary(BaseModel):
    """User XP summary."""
    userId: str = Field(..., description="User ID")
    totalXp: int = Field(0, description="Total accumulated XP")
    currentLevel: int = Field(1, description="Current level")
    xpForCurrentLevel: int = Field(0, description="XP required for current level")
    xpForNextLevel: int = Field(100, description="XP required for next level")
    xpProgress: float = Field(0.0, description="Progress to next level (0.0-1.0)")
    updatedAt: int = Field(..., description="Last update timestamp")


class XPHistoryResponse(BaseModel):
    """XP history response."""
    transactions: List[XPTransaction] = Field(default_factory=list)
    total: int = Field(0, description="Total number of transactions")
    limit: int = Field(50, description="Limit of transactions returned")
    offset: int = Field(0, description="Offset for pagination")


class XPAwardRequest(BaseModel):
    """Request to award XP (internal use)."""
    userId: str = Field(..., description="User ID")
    amount: int = Field(..., description="XP amount to award")
    source: str = Field(..., description="Source of XP")
    sourceId: Optional[str] = Field(None, description="ID of the source entity")
    description: str = Field(..., description="Description of the award")
    eventId: Optional[str] = Field(None, description="Unique event ID for idempotency")


class XPAwardResponse(BaseModel):
    """Response from XP award."""
    success: bool = Field(..., description="Whether the award was successful")
    totalXp: int = Field(..., description="New total XP")
    level: int = Field(..., description="Current level")
    levelUp: bool = Field(False, description="Whether user leveled up")
    previousLevel: Optional[int] = Field(None, description="Previous level if leveled up")

