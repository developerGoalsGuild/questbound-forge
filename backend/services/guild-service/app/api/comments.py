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
    GuildCommentCreatePayload,
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
from ..security.authentication import authenticate
from ..security.auth_models import AuthContext
from ..security.rate_limiter import rate_limit

router = APIRouter(prefix="/guilds", tags=["guild-comments"])
security = HTTPBearer()

@router.post("/{guild_id}/comments", response_model=GuildCommentResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests_per_hour=30)
async def create_comment(
    guild_id: str,
    payload: GuildCommentCreatePayload,
    auth: AuthContext = Depends(authenticate)
):
    """Create a new comment in a guild."""
    try:
        # Use nickname from JWT token if available, fallback to "Unknown"
        username = "Unknown"
        if auth and auth.claims:
            username = (
                auth.claims.get('nickname')
                or auth.claims.get('name')
                or auth.claims.get('preferred_username')
                or auth.claims.get('username')
                or "Unknown"
            )
        
        # For now, use "member" as default role - this should be determined from guild membership
        user_role = "member"
        
        comment = await create_guild_comment(
            guild_id=guild_id,
            user_id=auth.user_id,
            username=username,
            content=payload.content,
            user_role=user_role,
            parent_comment_id=payload.parent_comment_id
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
    auth: Optional[AuthContext] = Depends(authenticate)
):
    """Get all comments for a guild."""
    try:
        comments = await get_guild_comments(guild_id=guild_id, current_user_id=auth.user_id if auth else None)
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

# Update comment endpoint is not implemented in models; keeping commented for future implementation

@router.delete("/{guild_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
async def delete_comment(
    guild_id: str,
    comment_id: str,
    auth: AuthContext = Depends(authenticate)
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

@router.post("/{guild_id}/comments/{comment_id}/like")
@rate_limit(requests_per_hour=50)
async def like_comment(
    guild_id: str,
    comment_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Like or unlike a comment."""
    try:
        print(f"DEBUG: Liking comment {comment_id} in guild {guild_id} by user {auth.user_id}")
        result = await like_guild_comment(
            guild_id=guild_id,
            comment_id=comment_id,
            user_id=auth.user_id
        )
        print(f"DEBUG: Successfully liked comment {comment_id}, result: {result}")
        return result
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

