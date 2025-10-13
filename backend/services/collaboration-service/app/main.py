"""
FastAPI application for collaboration service.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging

from .models.invite import InviteCreatePayload, InviteResponse, InviteListResponse
from .models.collaborator import CollaboratorResponse, CollaboratorListResponse
from .models.comment import CommentCreatePayload, CommentUpdatePayload, CommentResponse, CommentListResponse
from .models.reaction import ReactionPayload, ReactionSummaryResponse
from .db.invite_db import create_invite, get_invite, list_user_invites, accept_invite, decline_invite
from .db.collaborator_db import list_collaborators, remove_collaborator
from .db.comment_db import create_comment, get_comment, list_comments, update_comment, delete_comment
from .db.reaction_db import toggle_reaction, get_comment_reactions
from .auth import authenticate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Collaboration Service",
    description="API for managing collaboration features",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "collaboration-service"}


# Invitation endpoints
@app.post("/collaborations/invites", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_collaboration_invite(
    payload: InviteCreatePayload,
    current_user: dict = Depends(authenticate)
):
    """Create a new collaboration invite."""
    try:
        invite = create_invite(current_user["sub"], payload)
        logger.info(f"Invite created: {invite['inviteId']} by {current_user['sub']}")
        return invite
    except ValueError as e:
        logger.warning(f"Validation error creating invite: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating invite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create invite")


@app.get("/collaborations/invites", response_model=InviteListResponse)
async def list_collaboration_invites(
    status: Optional[str] = None,
    limit: int = 20,
    next_token: Optional[str] = None,
    current_user: dict = Depends(authenticate)
):
    """List collaboration invites for the current user."""
    try:
        invites = list_user_invites(current_user["sub"], status, limit, next_token)
        logger.info(f"Listed {len(invites.get('items', []))} invites for user {current_user['sub']}")
        return invites
    except Exception as e:
        logger.error(f"Error listing invites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list invites")


@app.post("/collaborations/invites/{invite_id}/accept", response_model=InviteResponse)
async def accept_collaboration_invite(
    invite_id: str,
    current_user: dict = Depends(authenticate)
):
    """Accept a collaboration invite."""
    try:
        invite = accept_invite(current_user["sub"], invite_id)
        logger.info(f"Invite {invite_id} accepted by {current_user['sub']}")
        return invite
    except ValueError as e:
        logger.warning(f"Error accepting invite: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error accepting invite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept invite")


@app.post("/collaborations/invites/{invite_id}/decline", response_model=InviteResponse)
async def decline_collaboration_invite(
    invite_id: str,
    current_user: dict = Depends(authenticate)
):
    """Decline a collaboration invite."""
    try:
        invite = decline_invite(current_user["sub"], invite_id)
        logger.info(f"Invite {invite_id} declined by {current_user['sub']}")
        return invite
    except ValueError as e:
        logger.warning(f"Error declining invite: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error declining invite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decline invite")


# Collaborator endpoints
@app.get("/collaborations/resources/{resource_type}/{resource_id}/collaborators", response_model=CollaboratorListResponse)
async def list_resource_collaborators(
    resource_type: str,
    resource_id: str,
    current_user: dict = Depends(authenticate)
):
    """List collaborators for a resource."""
    try:
        collaborators = list_collaborators(resource_type, resource_id)
        logger.info(f"Listed {len(collaborators.get('collaborators', []))} collaborators for {resource_type}/{resource_id}")
        return collaborators
    except ValueError as e:
        logger.warning(f"Error listing collaborators: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing collaborators: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list collaborators")


@app.delete("/collaborations/resources/{resource_type}/{resource_id}/collaborators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_resource_collaborator(
    resource_type: str,
    resource_id: str,
    user_id: str,
    current_user: dict = Depends(authenticate)
):
    """Remove a collaborator from a resource."""
    try:
        remove_collaborator(current_user["sub"], resource_type, resource_id, user_id)
        logger.info(f"Collaborator {user_id} removed from {resource_type}/{resource_id} by {current_user['sub']}")
        return None
    except ValueError as e:
        logger.warning(f"Error removing collaborator: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error removing collaborator: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove collaborator")


# Comment endpoints
@app.post("/collaborations/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_resource_comment(
    payload: CommentCreatePayload,
    current_user: dict = Depends(authenticate)
):
    """Create a new comment on a resource."""
    try:
        comment = create_comment(current_user["sub"], payload)
        logger.info(f"Comment created: {comment.comment_id} by {current_user['sub']}")
        return comment
    except ValueError as e:
        logger.warning(f"Validation error creating comment: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@app.get("/collaborations/comments/{comment_id}", response_model=CommentResponse)
async def get_resource_comment(
    comment_id: str,
    current_user: dict = Depends(authenticate)
):
    """Get a specific comment."""
    try:
        comment = get_comment(comment_id)
        logger.info(f"Comment retrieved: {comment_id} for user {current_user['sub']}")
        return comment
    except ValueError as e:
        logger.warning(f"Error getting comment: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get comment")


@app.get("/collaborations/resources/{resource_type}/{resource_id}/comments", response_model=CommentListResponse)
async def list_resource_comments(
    resource_type: str,
    resource_id: str,
    parent_id: Optional[str] = None,
    limit: int = 50,
    next_token: Optional[str] = None,
    current_user: dict = Depends(authenticate)
):
    """List comments for a resource."""
    try:
        comments = list_comments(resource_type, resource_id, parent_id, limit, next_token)
        logger.info(f"Listed {len(comments.comments)} comments for {resource_type}/{resource_id}")
        return comments
    except ValueError as e:
        logger.warning(f"Error listing comments: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list comments")


@app.put("/collaborations/comments/{comment_id}", response_model=CommentResponse)
async def update_resource_comment(
    comment_id: str,
    payload: CommentUpdatePayload,
    current_user: dict = Depends(authenticate)
):
    """Update a comment."""
    try:
        comment = update_comment(current_user["sub"], comment_id, payload)
        logger.info(f"Comment updated: {comment_id} by {current_user['sub']}")
        return comment
    except ValueError as e:
        logger.warning(f"Error updating comment: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update comment")


@app.delete("/collaborations/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource_comment(
    comment_id: str,
    current_user: dict = Depends(authenticate)
):
    """Delete a comment."""
    try:
        delete_comment(current_user["sub"], comment_id)
        logger.info(f"Comment deleted: {comment_id} by {current_user['sub']}")
        return None
    except ValueError as e:
        logger.warning(f"Error deleting comment: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")


# Reaction endpoints
@app.post("/collaborations/comments/{comment_id}/reactions", response_model=ReactionSummaryResponse)
async def toggle_comment_reaction(
    comment_id: str,
    payload: ReactionPayload,
    current_user: dict = Depends(authenticate)
):
    """Toggle (add/remove) a reaction on a comment."""
    try:
        reaction_summary = toggle_reaction(current_user["sub"], comment_id, payload)
        logger.info(f"Reaction toggled on comment {comment_id} by {current_user['sub']}: {payload.emoji}")
        return reaction_summary
    except ValueError as e:
        logger.warning(f"Validation error toggling reaction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error toggling reaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle reaction")


@app.get("/collaborations/comments/{comment_id}/reactions", response_model=ReactionSummaryResponse)
async def get_comment_reactions_summary(
    comment_id: str,
    current_user: dict = Depends(authenticate)
):
    """Get reaction summary for a comment."""
    try:
        reaction_summary = get_comment_reactions(comment_id, current_user["sub"])
        logger.info(f"Retrieved reactions for comment {comment_id}")
        return reaction_summary
    except Exception as e:
        logger.error(f"Error getting comment reactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get comment reactions")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

