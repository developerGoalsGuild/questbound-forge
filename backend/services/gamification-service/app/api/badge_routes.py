"""
Badge API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional, List

from ..models.badge import BadgeListResponse, BadgeWithDefinition, BadgeDefinition, BadgeAssignmentRequest
from ..services.badge_service import get_user_badges_with_definitions, check_and_assign_badges
from ..db.badge_db import list_badge_definitions, assign_badge, get_badge_definition
from ..auth import TokenVerifier, TokenVerificationError
from ..settings import Settings

router = APIRouter(prefix="/badges", tags=["Badges"])

_settings = Settings()
_verifier = TokenVerifier(_settings)


async def authenticate(authorization: Optional[str] = Header(None)):
    """Authenticate user from JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header must be Bearer token")
    
    token = authorization[7:]
    
    try:
        claims, provider = _verifier.verify(token)
        return claims.get("sub")
    except TokenVerificationError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("", response_model=List[BadgeDefinition])
async def list_available_badges(category: Optional[str] = None):
    """List all available badge definitions."""
    return list_badge_definitions(category=category)


@router.get("/me", response_model=BadgeListResponse)
async def get_my_badges(user_id: str = Depends(authenticate)):
    """Get badges for authenticated user."""
    badges = get_user_badges_with_definitions(user_id)
    return BadgeListResponse(badges=badges, total=len(badges))


@router.get("/{user_id}", response_model=BadgeListResponse)
async def get_user_badges_endpoint(user_id: str):
    """Get badges for a specific user (public endpoint)."""
    badges = get_user_badges_with_definitions(user_id)
    return BadgeListResponse(badges=badges, total=len(badges))


@router.post("/assign", response_model=dict)
async def assign_badge_endpoint(
    request: BadgeAssignmentRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")
):
    """
    Assign a badge to a user (internal endpoint).
    
    This endpoint is called by other services to assign badges.
    Requires X-Internal-Key header for security.
    """
    # TODO: Implement internal key validation
    
    try:
        badge = assign_badge(request.userId, request.badgeId, request.metadata)
        return {"success": True, "badge": badge.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign badge: {str(e)}")

