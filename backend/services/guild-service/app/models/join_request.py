from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class JoinRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class GuildJoinRequestPayload(BaseModel):
    message: Optional[str] = Field(None, max_length=500, description="Join request message")

class GuildJoinRequestResponse(BaseModel):
    guild_id: str = Field(..., description="Guild ID")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: Optional[str] = Field(None, description="User email")
    avatar_url: Optional[str] = Field(None, description="User avatar URL")
    requested_at: datetime = Field(..., description="Request date")
    status: JoinRequestStatus = Field(..., description="Request status")
    reviewed_by: Optional[str] = Field(None, description="User who reviewed the request")
    reviewed_at: Optional[datetime] = Field(None, description="Review date")
    review_reason: Optional[str] = Field(None, description="Review reason")

class GuildJoinRequestListResponse(BaseModel):
    requests: list[GuildJoinRequestResponse] = Field(..., description="List of join requests")
    total: int = Field(..., description="Total number of requests")

class GuildJoinRequestApprovalPayload(BaseModel):
    reason: Optional[str] = Field(None, max_length=500, description="Approval reason")

class GuildJoinRequestRejectionPayload(BaseModel):
    reason: Optional[str] = Field(None, max_length=500, description="Rejection reason")

