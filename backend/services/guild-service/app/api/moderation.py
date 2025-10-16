"""
Moderation API endpoints for the guild service.

This module handles all HTTP endpoints related to guild moderation,
including join requests, ownership transfer, and user management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer

from ..models.moderation import (
    TransferOwnershipRequest,
    ModeratorAssignmentPayload,
    ModerationActionPayload
)
from ..models.join_request import (
    GuildJoinRequestResponse,
    GuildJoinRequestListResponse,
    JoinRequestStatus
)
from ..db.guild_db import (
    create_join_request,
    get_guild_join_requests,
    update_join_request_status,
    transfer_guild_ownership,
    assign_moderator,
    remove_moderator,
    perform_moderation_action,
    GuildDBError,
    GuildNotFoundError,
    GuildPermissionError,
    GuildValidationError,
    GuildConflictError
)
from ..security.auth import get_current_user_id
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guild-moderation"])
security = HTTPBearer()

@router.post("/{guild_id}/join-requests", response_model=GuildJoinRequestResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests_per_hour=5)
async def create_join_request(
    guild_id: str,
    message: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a join request for an approval-required guild."""
    try:
        # TODO: Get user details from user service
        username = "User"  # Placeholder
        
        join_request = await create_join_request(
            guild_id=guild_id,
            user_id=current_user_id,
            username=username,
            message=message
        )
        return join_request
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create join request"
        )

@router.get("/{guild_id}/join-requests", response_model=GuildJoinRequestListResponse)
async def get_join_requests(
    guild_id: str,
    status: Optional[JoinRequestStatus] = Query(None, description="Filter by request status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get join requests for a guild (owners and moderators only)."""
    try:
        # TODO: Check if user is owner or moderator
        join_requests = await get_guild_join_requests(guild_id=guild_id)
        
        # Filter by status if provided
        if status:
            join_requests = [req for req in join_requests if req.status == status.value]
        
        return GuildJoinRequestListResponse(
            requests=join_requests,
            lastEvaluatedKey=None
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve join requests"
        )

@router.put("/{guild_id}/join-requests/{user_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
async def approve_join_request(
    guild_id: str,
    user_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Approve a join request."""
    try:
        await update_join_request_status(
            guild_id=guild_id,
            user_id=user_id,
            status=JoinRequestStatus.APPROVED.value,
            reviewed_by=current_user_id,
            review_reason=reason
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or join request not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve join request"
        )

@router.put("/{guild_id}/join-requests/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
async def reject_join_request(
    guild_id: str,
    user_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Reject a join request."""
    try:
        await update_join_request_status(
            guild_id=guild_id,
            user_id=user_id,
            status=JoinRequestStatus.REJECTED.value,
            reviewed_by=current_user_id,
            review_reason=reason
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or join request not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject join request"
        )

@router.post("/{guild_id}/ownership/transfer", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=1)
async def transfer_ownership(
    guild_id: str,
    payload: TransferOwnershipRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Transfer guild ownership to another member."""
    try:
        await transfer_guild_ownership(
            guild_id=guild_id,
            current_owner_id=current_user_id,
            new_owner_id=payload.newOwnerId,
            reason=payload.reason
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transfer ownership"
        )

@router.post("/{guild_id}/moderators/assign", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=10)
async def assign_moderator(
    guild_id: str,
    payload: ModeratorAssignmentPayload,
    current_user_id: str = Depends(get_current_user_id)
):
    """Assign a member as a moderator."""
    try:
        await assign_moderator(
            guild_id=guild_id,
            user_id=payload.userId,
            assigned_by=current_user_id
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign moderator"
        )

@router.delete("/{guild_id}/moderators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=10)
async def remove_moderator(
    guild_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Remove a member's moderator status."""
    try:
        await remove_moderator(
            guild_id=guild_id,
            user_id=user_id,
            removed_by=current_user_id
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove moderator"
        )

@router.post("/{guild_id}/moderation/action", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=30)
async def perform_moderation_action(
    guild_id: str,
    payload: ModerationActionPayload,
    current_user_id: str = Depends(get_current_user_id)
):
    """Perform a moderation action."""
    try:
        await perform_moderation_action(
            guild_id=guild_id,
            action=payload.action,
            target_user_id=payload.targetUserId,
            comment_id=payload.commentId,
            reason=payload.reason,
            performed_by=current_user_id
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform moderation action"
        )

