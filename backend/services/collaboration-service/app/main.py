"""
FastAPI application for collaboration service.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging
import sys

from .models.invite import InviteCreatePayload, InviteResponse, InviteListResponse
from .models.collaborator import CollaboratorResponse, CollaboratorListResponse
from .models.comment import CommentCreatePayload, CommentUpdatePayload, CommentResponse, CommentListResponse
from .models.reaction import ReactionPayload, ReactionSummaryResponse
from .db.invite_db import create_invite, get_invite, list_user_invites, accept_invite, decline_invite, CollaborationInviteValidationError, CollaborationInviteNotFoundError, CollaborationInviteDBError
from .db.collaborator_db import list_collaborators, remove_collaborator, cleanup_orphaned_invites, list_user_collaborations
from .db.comment_db import create_comment, get_comment, list_comments, update_comment, delete_comment, CommentNotFoundError, CommentPermissionError, CommentDBError
from .db.reaction_db import toggle_reaction, get_comment_reactions, ReactionDBError
from .auth import authenticate
from .settings import get_settings

# Initialize settings
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info(f"collaboration.service.startup - environment={settings.environment}, aws_region={settings.aws_region}, dynamodb_table={settings.dynamodb_table_name}, log_level={settings.log_level}")

app = FastAPI(
    title="Collaboration Service",
    description="API for managing collaboration features",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure based on environment using settings
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
        logger.info(f"Invite created: {invite.invite_id} by {current_user['sub']}")
        return invite
    except CollaborationInviteValidationError as e:
        logger.warning(f"Validation error creating invite: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except CollaborationInviteNotFoundError as e:
        logger.warning(f"Not found error creating invite: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except CollaborationInviteDBError as e:
        logger.error(f"Database error creating invite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating invite: {str(e)}")
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
        logger.info(f"Listed {len(invites.invites)} invites for user {current_user['sub']}")
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
        logger.info(f"Listed {len(collaborators.collaborators)} collaborators for {resource_type}/{resource_id}")
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


@app.post("/collaborations/resources/{resource_type}/{resource_id}/cleanup-orphaned-invites")
async def cleanup_resource_orphaned_invites(
    resource_type: str,
    resource_id: str,
    current_user: dict = Depends(authenticate)
):
    """Clean up orphaned invite records for users who are no longer collaborators.
    This fixes the issue where removed collaborators cannot be re-invited."""
    try:
        cleaned_count = cleanup_orphaned_invites(resource_type, resource_id)
        logger.info(f"Cleaned up {cleaned_count} orphaned invites for {resource_type}/{resource_id} by {current_user['sub']}")
        return {"message": f"Cleaned up {cleaned_count} orphaned invite records", "cleaned_count": cleaned_count}
    except ValueError as e:
        logger.warning(f"Error cleaning up orphaned invites: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cleaning up orphaned invites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup orphaned invites")


@app.get("/collaborations/my-collaborations")
async def get_my_collaborations(
    resource_type: Optional[str] = None,
    current_user: dict = Depends(authenticate)
):
    """Get all resources the current user is collaborating on."""
    try:
        collaborations = list_user_collaborations(current_user["sub"], resource_type)
        logger.info(f"Listed {len(collaborations)} collaborations for user {current_user['sub']}")
        return {"collaborations": collaborations, "total_count": len(collaborations)}
    except Exception as e:
        logger.error(f"Error listing user collaborations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list collaborations")


@app.get("/collaborations/access/{resource_type}/{resource_id}")
async def check_resource_access(
    resource_type: str,
    resource_id: str,
    current_user: dict = Depends(authenticate)
):
    """Check if the current user has access to a resource (as owner or collaborator)."""
    try:
        from .db.collaborator_db import check_resource_access
        
        has_access = check_resource_access(current_user["sub"], resource_type, resource_id)
        logger.info(f"Access check for user {current_user['sub']} on {resource_type}/{resource_id}: {has_access}")
        
        return {
            "has_access": has_access,
            "user_id": current_user["sub"],
            "resource_type": resource_type,
            "resource_id": resource_id
        }
    except Exception as e:
        logger.error(f"Error checking resource access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check resource access")


# Comment endpoints
@app.post("/collaborations/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_resource_comment(
    payload: CommentCreatePayload,
    current_user: dict = Depends(authenticate)
):
    """Create a new comment on a resource."""
    try:
        comment = create_comment(current_user["sub"], payload)
        logger.info(f"Comment created: {comment.commentId} by {current_user['sub']}")
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
    except CommentNotFoundError as e:
        logger.warning(f"Comment not found for update: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except CommentPermissionError as e:
        logger.warning(f"Permission denied for comment update: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
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
    except CommentNotFoundError as e:
        logger.warning(f"Comment not found for deletion: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except CommentPermissionError as e:
        logger.warning(f"Permission denied for comment deletion: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
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

