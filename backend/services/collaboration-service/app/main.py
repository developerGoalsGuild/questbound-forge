"""
FastAPI application for collaboration service.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging

from .models.invite import InviteCreatePayload, InviteResponse, InviteListResponse
from .models.collaborator import CollaboratorResponse, CollaboratorListResponse
from .db.invite_db import create_invite, get_invite, list_user_invites, accept_invite, decline_invite
from .db.collaborator_db import list_collaborators, remove_collaborator
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

