"""
Task models for the GoalsGuild Quest service.

This module contains Pydantic models for Task-related operations including
creation, updates, and responses.
"""

from typing import List, Optional
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


class TaskUpdateInput(BaseModel):
    """Input model for updating an existing task."""
    title: Optional[str] = Field(None, min_length=1, description="Title of the task")
    dueAt: Optional[int] = Field(None, description="Task due date as epoch seconds")
    status: Optional[str] = Field(None, description="Task status (active, completed, cancelled)")
    tags: Optional[List[str]] = Field(None, description="Tags associated with the task")

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
