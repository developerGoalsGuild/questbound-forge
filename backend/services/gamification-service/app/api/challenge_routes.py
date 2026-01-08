"""
Challenge API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from uuid import uuid4

# Import models at module level (needed for response_model decorators)
from ..models.challenge import (
    Challenge, ChallengeListResponse, ChallengeCreateRequest,
    ChallengeJoinRequest, ChallengeWithParticipants, ChallengeParticipant
)

# Lazy loading of heavy imports
router = APIRouter(prefix="/challenges", tags=["Challenges"])

# Lazy initialization of settings and verifier
_settings = None
_verifier = None

def _get_settings():
    """Lazy initialization of settings."""
    global _settings
    if _settings is None:
        from ..settings import Settings
        _settings = Settings()
    return _settings

def _get_verifier():
    """Lazy initialization of token verifier."""
    global _verifier
    if _verifier is None:
        from ..auth import TokenVerifier
        _verifier = TokenVerifier(_get_settings())
    return _verifier


async def authenticate(authorization: Optional[str] = Header(None)):
    """Authenticate user from JWT token."""
    from ..auth import TokenVerificationError
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header must be Bearer token")
    
    token = authorization[7:]
    
    try:
        verifier = _get_verifier()
        claims, provider = verifier.verify(token)
        return claims.get("sub")
    except TokenVerificationError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("", response_model=Challenge, status_code=201)
async def create_challenge_endpoint(
    request: ChallengeCreateRequest,
    user_id: str = Depends(authenticate)
):
    """Create a new challenge."""
    from ..db.challenge_db import create_challenge
    import time
    
    challenge = Challenge(
        id=str(uuid4()),
        title=request.title,
        description=request.description,
        type=request.type,
        startDate=request.startDate,
        endDate=request.endDate,
        xpReward=request.xpReward,
        createdBy=user_id,
        status="active",
        targetValue=request.targetValue,
        createdAt=int(time.time() * 1000),
        updatedAt=int(time.time() * 1000)
    )
    
    return create_challenge(challenge)


@router.get("", response_model=ChallengeListResponse)
async def list_challenges_endpoint(status: Optional[str] = None, limit: int = 50):
    """List challenges."""
    from ..db.challenge_db import list_challenges
    
    challenges = list_challenges(status=status, limit=limit)
    return ChallengeListResponse(challenges=challenges, total=len(challenges))


@router.get("/{challenge_id}", response_model=ChallengeWithParticipants)
async def get_challenge_endpoint(
    challenge_id: str,
    user_id: Optional[str] = Depends(authenticate)
):
    """Get challenge details with participant information."""
    from ..db.challenge_db import get_challenge, get_challenge_participants
    
    challenge = get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    participants = get_challenge_participants(challenge_id)
    
    # Get current user's progress if authenticated
    my_progress = None
    if user_id:
        for participant in participants:
            if participant.userId == user_id:
                my_progress = participant
                break
    
    return ChallengeWithParticipants(
        challenge=challenge,
        participants=participants,
        participantCount=len(participants),
        myProgress=my_progress
    )


@router.post("/{challenge_id}/join", response_model=ChallengeParticipant)
async def join_challenge_endpoint(
    challenge_id: str,
    user_id: str = Depends(authenticate)
):
    """Join a challenge."""
    from ..db.challenge_db import get_challenge, join_challenge
    import time
    
    challenge = get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.status != "active":
        raise HTTPException(status_code=400, detail="Challenge is not active")
    
    now_ms = int(time.time() * 1000)
    if now_ms < challenge.startDate or now_ms > challenge.endDate:
        raise HTTPException(status_code=400, detail="Challenge is not currently active")
    
    return join_challenge(user_id, challenge_id)


@router.post("/{challenge_id}/progress", response_model=dict)
async def update_challenge_progress_endpoint(
    challenge_id: str,
    current_value: int,
    user_id: str = Depends(authenticate),
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")
):
    """
    Update challenge progress (internal endpoint).
    
    This endpoint is called by other services to update challenge progress.
    """
    from ..db.challenge_db import get_challenge, update_participant_progress
    
    challenge = get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    target_value = challenge.targetValue or 1
    progress = min(1.0, float(current_value) / float(target_value))
    
    update_participant_progress(challenge_id, user_id, current_value, progress)
    
    return {"success": True, "progress": progress, "currentValue": current_value}

