"""
Comments API endpoints for the guild service.

This module handles all HTTP endpoints related to guild comments,
including CRUD operations, likes, and moderation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer

from ..models.comment import (
    GuildCommentResponse,
    CommentCreatePayload,
    CommentUpdatePayload
)
from ..db.guild_db import (
    create_guild_comment,
    get_guild_comments,
    update_guild_comment,
    delete_guild_comment,
    like_guild_comment,
    GuildDBError,
    GuildNotFoundError,
    GuildPermissionError
)
from ..security.auth import get_current_user_id
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guild-comments"])
security = HTTPBearer()

@router.post("/{guild_id}/comments", response_model=GuildCommentResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests_per_hour=30)
async def create_comment(
    guild_id: str,
    payload: CommentCreatePayload,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new comment in a guild."""
    try:
        # TODO: Get user details from user service
        username = "User"  # Placeholder
        user_role = "member"  # Placeholder - should be determined from guild membership
        
        comment = await create_guild_comment(
            guild_id=guild_id,
            user_id=current_user_id,
            username=username,
            content=payload.content,
            user_role=user_role,
            parent_comment_id=payload.parentCommentId
        )
        return comment
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
            detail="Failed to create comment"
        )

@router.get("/{guild_id}/comments", response_model=List[GuildCommentResponse])
async def get_comments(
    guild_id: str,
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    """Get all comments for a guild."""
    try:
        comments = await get_guild_comments(guild_id=guild_id)
        return comments
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve comments"
        )

@router.put("/{guild_id}/comments/{comment_id}", response_model=GuildCommentResponse)
@rate_limit(requests_per_hour=20)
async def update_comment(
    guild_id: str,
    comment_id: str,
    payload: CommentUpdatePayload,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update a comment."""
    try:
        # TODO: Check if user is the comment author or has moderation permissions
        comment = await update_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            content=payload.content
        )
        return comment
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or comment not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update comment"
        )

@router.delete("/{guild_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
async def delete_comment(
    guild_id: str,
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a comment."""
    try:
        # TODO: Check if user is the comment author or has moderation permissions
        await delete_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or comment not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete comment"
        )

@router.post("/{guild_id}/comments/{comment_id}/like", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=50)
async def like_comment(
    guild_id: str,
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Like or unlike a comment."""
    try:
        # TODO: Check if user has already liked the comment
        is_liking = True  # Placeholder - should be determined from existing likes
        await like_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            user_id=current_user_id,
            is_liking=is_liking
        )
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild or comment not found"
        )
    except GuildDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to like comment"
        )

