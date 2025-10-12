"""
Invite models for the collaboration system.

This module contains Pydantic models for invitation-related operations including
creation, responses, and status management.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re

# Invite status options
InviteStatus = Literal["pending", "accepted", "declined", "expired"]

# Resource type options
ResourceType = Literal["goal", "quest", "task"]

# Validation constants
MAX_MESSAGE_LENGTH = 500
MIN_RESOURCE_ID_LENGTH = 1
MAX_RESOURCE_ID_LENGTH = 50
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 30


class InviteCreatePayload(BaseModel):
    """Payload for creating a collaboration invitation."""
    
    resource_type: ResourceType = Field(..., description="Type of resource to collaborate on")
    resource_id: str = Field(..., description="ID of the resource")
    invitee_identifier: str = Field(..., description="Email or username of the invitee")
    message: Optional[str] = Field(None, max_length=MAX_MESSAGE_LENGTH, description="Optional invitation message")
    
    @field_validator('resource_type')
    @classmethod
    def validate_resource_type(cls, v):
        """Validate resource type is one of the allowed values."""
        allowed_types = ["goal", "quest", "task"]
        if v not in allowed_types:
            raise ValueError(f"Resource type must be one of: {', '.join(allowed_types)}")
        return v
    
    @field_validator('resource_id')
    @classmethod
    def validate_resource_id(cls, v):
        """Validate resource ID format."""
        if not v or len(v) < MIN_RESOURCE_ID_LENGTH or len(v) > MAX_RESOURCE_ID_LENGTH:
            raise ValueError(f"Resource ID must be between {MIN_RESOURCE_ID_LENGTH} and {MAX_RESOURCE_ID_LENGTH} characters")
        
        # Allow alphanumeric, hyphens, and underscores
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Resource ID can only contain alphanumeric characters, hyphens, and underscores")
        
        return v
    
    @field_validator('invitee_identifier')
    @classmethod
    def validate_invitee_identifier(cls, v):
        """Validate invitee identifier (email or username)."""
        if not v or len(v) < 3:
            raise ValueError("Invitee identifier must be at least 3 characters")
        
        # Check if it's an email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if re.match(email_pattern, v):
            return v
        
        # Check if it's a username (alphanumeric + underscore)
        username_pattern = r'^[a-zA-Z0-9_]+$'
        if re.match(username_pattern, v) and MIN_USERNAME_LENGTH <= len(v) <= MAX_USERNAME_LENGTH:
            return v
        
        raise ValueError("Invitee identifier must be a valid email address or username (3-30 chars, alphanumeric + underscore)")
    
    @field_validator('message')
    @classmethod
    def sanitize_message(cls, v):
        """Sanitize invitation message."""
        if v is None:
            return v
        
        # Remove HTML tags and XSS vectors
        import html
        v = html.escape(v)
        
        # Remove any remaining script tags
        v = re.sub(r'<script.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
        
        # Limit length
        if len(v) > MAX_MESSAGE_LENGTH:
            v = v[:MAX_MESSAGE_LENGTH]
        
        return v


class InviteResponse(BaseModel):
    """Response model for collaboration invitations."""
    
    invite_id: str = Field(..., description="Unique invitation ID")
    inviter_id: str = Field(..., description="ID of the user who sent the invitation")
    inviter_username: str = Field(..., description="Username of the inviter")
    invitee_id: Optional[str] = Field(None, description="ID of the invitee (if found)")
    invitee_email: Optional[str] = Field(None, description="Email of the invitee")
    resource_type: ResourceType = Field(..., description="Type of resource")
    resource_id: str = Field(..., description="ID of the resource")
    resource_title: str = Field(..., description="Title of the resource")
    status: InviteStatus = Field(..., description="Current status of the invitation")
    message: Optional[str] = Field(None, description="Invitation message")
    expires_at: datetime = Field(..., description="When the invitation expires")
    created_at: datetime = Field(..., description="When the invitation was created")
    updated_at: datetime = Field(..., description="When the invitation was last updated")


class InviteListResponse(BaseModel):
    """Response model for listing invitations."""
    
    invites: List[InviteResponse] = Field(..., description="List of invitations")
    next_token: Optional[str] = Field(None, description="Token for pagination")
    total_count: int = Field(..., description="Total number of invitations")
    
    @field_validator('invites')
    @classmethod
    def validate_invites_not_empty(cls, v):
        """Ensure invites list is not None."""
        if v is None:
            return []
        return v

