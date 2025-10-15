"""
Goal models for the GoalsGuild Quest service.

This module contains Pydantic models for Goal-related operations including
creation, updates, progress tracking, and responses.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AnswerInput(BaseModel):
    """Input model for goal answers."""
    key: str
    answer: Optional[str] = ""


class AnswerOutput(BaseModel):
    """Output model for goal answers."""
    key: str
    answer: str


class GoalCreatePayload(BaseModel):
    """Payload for creating a new goal."""
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    deadline: str
    answers: List[AnswerInput] = Field(default_factory=list)


class GoalUpdatePayload(BaseModel):
    """Payload for updating an existing goal."""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[List[str]] = None
    answers: Optional[List[AnswerInput]] = None
    status: Optional[str] = None


class Milestone(BaseModel):
    """Model for goal milestones."""
    id: str
    name: str
    percentage: float
    achieved: bool
    achievedAt: Optional[int] = None
    description: Optional[str] = None


class GoalProgressResponse(BaseModel):
    """Response model for goal progress data."""
    goalId: str
    progressPercentage: float
    taskProgress: float
    timeProgress: float
    completedTasks: int
    totalTasks: int
    milestones: List[Milestone]
    lastUpdated: int
    isOverdue: bool
    isUrgent: bool


class GoalResponse(BaseModel):
    """Response model for Goal data."""
    id: str
    userId: str
    title: str
    description: str
    category: Optional[str]
    tags: List[str]
    answers: List[AnswerOutput]
    deadline: Optional[str]
    status: str
    createdAt: int
    updatedAt: int
    # Progress fields
    progress: Optional[float] = None
    milestones: Optional[List[Milestone]] = None
    completedTasks: Optional[int] = None
    totalTasks: Optional[int] = None


class GoalWithAccessResponse(BaseModel):
    """Response model for Goal data with access control information."""
    id: str
    userId: str
    title: str
    description: str
    category: Optional[str]
    tags: List[str]
    answers: List[AnswerOutput]
    deadline: Optional[str]
    status: str
    createdAt: int
    updatedAt: int
    # Progress fields
    progress: Optional[float] = None
    milestones: Optional[List[Milestone]] = None
    completedTasks: Optional[int] = None
    totalTasks: Optional[int] = None
    # Access control fields
    accessType: str  # "owner" or "collaborator"
    canEdit: bool
    canDelete: bool
    canAddTasks: bool
    canComment: bool