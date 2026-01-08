from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class ModerationActionType(str, Enum):
    BLOCK_USER = "block_user"
    UNBLOCK_USER = "unblock_user"
    REMOVE_COMMENT = "remove_comment"
    TOGGLE_COMMENT_PERMISSION = "toggle_comment_permission"

class TransferOwnershipPayload(BaseModel):
    new_owner_id: str = Field(..., description="New owner user ID")
    reason: Optional[str] = Field(None, max_length=500, description="Transfer reason")

class ModerationActionPayload(BaseModel):
    action: ModerationActionType = Field(..., description="Moderation action type")
    target_user_id: Optional[str] = Field(None, description="Target user ID")
    comment_id: Optional[str] = Field(None, description="Comment ID (for comment actions)")
    reason: Optional[str] = Field(None, max_length=500, description="Action reason")

