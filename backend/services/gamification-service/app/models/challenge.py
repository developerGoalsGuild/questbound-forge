from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Challenge(BaseModel):
    """Challenge model."""
    id: str = Field(..., description="Challenge ID")
    title: str = Field(..., description="Challenge title")
    description: str = Field(..., description="Challenge description")
    type: str = Field(..., description="Challenge type (quest_completion, xp_accumulation, goal_completion)")
    startDate: int = Field(..., description="Start timestamp")
    endDate: int = Field(..., description="End timestamp")
    xpReward: int = Field(0, description="XP reward for completion")
    createdBy: str = Field(..., description="User ID of creator")
    status: str = Field("active", description="Challenge status (active, completed, cancelled)")
    targetValue: Optional[int] = Field(None, description="Target value for challenge")
    createdAt: int = Field(..., description="Creation timestamp")
    updatedAt: int = Field(..., description="Last update timestamp")


class ChallengeParticipant(BaseModel):
    """Challenge participant."""
    userId: str = Field(..., description="User ID")
    challengeId: str = Field(..., description="Challenge ID")
    progress: float = Field(0.0, description="Progress (0.0-1.0)")
    currentValue: int = Field(0, description="Current value")
    rank: Optional[int] = Field(None, description="Current rank")
    joinedAt: int = Field(..., description="Join timestamp")
    completedAt: Optional[int] = Field(None, description="Completion timestamp")


class ChallengeWithParticipants(BaseModel):
    """Challenge with participant information."""
    challenge: Challenge = Field(..., description="Challenge")
    participants: List[ChallengeParticipant] = Field(default_factory=list)
    participantCount: int = Field(0, description="Number of participants")
    myProgress: Optional[ChallengeParticipant] = Field(None, description="Current user's progress")


class ChallengeListResponse(BaseModel):
    """List of challenges response."""
    challenges: List[Challenge] = Field(default_factory=list)
    total: int = Field(0, description="Total number of challenges")


class ChallengeCreateRequest(BaseModel):
    """Request to create a challenge."""
    title: str = Field(..., description="Challenge title")
    description: str = Field(..., description="Challenge description")
    type: str = Field(..., description="Challenge type")
    startDate: int = Field(..., description="Start timestamp")
    endDate: int = Field(..., description="End timestamp")
    xpReward: int = Field(0, description="XP reward")
    targetValue: Optional[int] = Field(None, description="Target value")


class ChallengeJoinRequest(BaseModel):
    """Request to join a challenge."""
    challengeId: str = Field(..., description="Challenge ID")

