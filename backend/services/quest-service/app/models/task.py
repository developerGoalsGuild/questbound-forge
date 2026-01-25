"""
Task models for the GoalsGuild Quest service.

This module contains Pydantic models for Task-related operations including
creation, updates, and responses.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class TaskInput(BaseModel):
    """Input model for creating a new task."""
    goalId: str = Field(..., description="ID of the goal to which the task belongs")
    title: str = Field(..., min_length=1, description="Title of the task")
    dueAt: int = Field(..., description="Task due date as epoch seconds")
    tags: List[str] = Field(..., description="Tags associated with the task")

    @field_validator("tags")
    def tags_must_not_be_empty(cls, v):
        if not v or not all(isinstance(tag, str) and tag.strip() for tag in v):
            raise ValueError("Tags must be a non-empty list of non-empty strings")
        return v


class TaskResponse(BaseModel):
    """Response model for Task data."""
    id: str
    goalId: str
    title: str
    dueAt: int
    status: str
    createdAt: int
    updatedAt: int
    tags: List[str]
    completionNote: Optional[str] = None
    completedAt: Optional[int] = None
    verificationStatus: Optional[str] = None
    verificationEvidenceIds: Optional[List[str]] = None


class TaskUpdateInput(BaseModel):
    """Input model for updating an existing task."""
    title: Optional[str] = Field(None, min_length=1, description="Title of the task")
    dueAt: Optional[int] = Field(None, description="Task due date as epoch seconds")
    status: Optional[str] = Field(None, description="Task status (active, completed, cancelled)")
    tags: Optional[List[str]] = Field(None, description="Tags associated with the task")
    completionNote: Optional[str] = Field(
        None,
        max_length=500,
        description="Completion note required when marking task as completed"
    )
    verificationEvidenceIds: Optional[List[str]] = Field(
        None,
        description="Evidence IDs attached to the task completion"
    )

    @field_validator("tags")
    @classmethod
    def tags_must_not_be_empty(cls, v):
        if v is not None and (not v or not all(isinstance(tag, str) and tag.strip() for tag in v)):
            raise ValueError("Tags must be a non-empty list of non-empty strings")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ["active", "completed", "cancelled", "paused", "archived"]:
            raise ValueError("Status must be one of: active, completed, cancelled")
        return v


class TaskVerificationSubmission(BaseModel):
    """Payload for submitting verification evidence."""
    completionNote: str = Field(..., min_length=10, max_length=500)
    evidenceType: str = Field(..., min_length=2, max_length=50)
    evidencePayload: Dict[str, Any] = Field(default_factory=dict)


class TaskVerificationReview(BaseModel):
    """Payload for approving/rejecting a verification submission."""
    decision: str = Field(..., description="approved or rejected")
    reason: Optional[str] = Field(None, max_length=500)

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v):
        if v not in ["approved", "rejected"]:
            raise ValueError("Decision must be one of: approved, rejected")
        return v


class TaskVerificationFlag(BaseModel):
    """Payload for flagging a task completion."""
    reason: str = Field(..., min_length=5, max_length=500)
