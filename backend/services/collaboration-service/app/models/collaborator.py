"""
Collaborator models for the collaboration system.

This module contains Pydantic models for collaborator-related operations.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# Collaborator role options
CollaboratorRole = Literal["owner", "collaborator"]


class CollaboratorResponse(BaseModel):
    """Response model for a single collaborator."""
    
    user_id: str = Field(..., description="User ID of the collaborator")
    username: str = Field(..., description="Username of the collaborator")
    avatar_url: Optional[str] = Field(None, description="Avatar URL of the collaborator")
    email: Optional[str] = Field(None, description="Email of the collaborator (owner only)")
    role: CollaboratorRole = Field(..., description="Role of the collaborator")
    joined_at: datetime = Field(..., description="When the user joined as collaborator")
    last_seen_at: Optional[datetime] = Field(None, description="When the user was last seen")


class CollaboratorListResponse(BaseModel):
    """Response model for listing collaborators."""
    
    collaborators: List[CollaboratorResponse] = Field(..., description="List of collaborators")
    resource_type: str = Field(..., description="Type of resource")
    resource_id: str = Field(..., description="ID of the resource")
    total_count: int = Field(..., description="Total number of collaborators")
    
    @field_validator('collaborators')
    @classmethod
    def validate_collaborators_not_empty(cls, v):
        """Ensure collaborators list is not None."""
        if v is None:
            return []
        return v
