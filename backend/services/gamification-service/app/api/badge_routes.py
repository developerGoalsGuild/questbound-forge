"""
Badge API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from typing import Optional, List

# Import models at module level (needed for response_model decorators)
from ..models.badge import (
    BadgeListResponse,
    BadgeWithDefinition,
    BadgeDefinition,
    BadgeAssignmentRequest,
    BadgeEvaluationRequest,
)

# Lazy loading of heavy imports
router = APIRouter(prefix="/badges", tags=["Badges"])

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


def _validate_internal_key(provided: Optional[str]):
    settings = _get_settings()
    expected = settings.internal_api_key
    if expected and provided != expected:
        raise HTTPException(status_code=403, detail="Invalid internal key")


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


@router.get("", response_model=List[BadgeDefinition])
async def list_available_badges(
    category: Optional[str] = Query(default=None),
    rarity: Optional[str] = Query(default=None),
):
    """List all available badge definitions."""
    from ..services.badge_service import get_badge_catalog

    return get_badge_catalog(category=category, rarity=rarity)


@router.get("/catalog", response_model=List[BadgeDefinition])
async def list_badge_catalog(
    category: Optional[str] = Query(default=None),
    rarity: Optional[str] = Query(default=None),
):
    """Explicit catalog endpoint (alias for GET /badges)."""
    from ..services.badge_service import get_badge_catalog

    return get_badge_catalog(category=category, rarity=rarity)


@router.get("/me", response_model=BadgeListResponse)
async def get_my_badges(
    category: Optional[str] = Query(default=None),
    rarity: Optional[str] = Query(default=None),
    user_id: str = Depends(authenticate),
):
    """Get badges for authenticated user."""
    from ..services.badge_service import get_user_badges_with_definitions
    
    badges = get_user_badges_with_definitions(user_id, category=category, rarity=rarity)
    return BadgeListResponse(badges=badges, total=len(badges))


@router.get("/{user_id}", response_model=BadgeListResponse)
async def get_user_badges_endpoint(
    user_id: str,
    category: Optional[str] = Query(default=None),
    rarity: Optional[str] = Query(default=None),
):
    """Get badges for a specific user (public endpoint)."""
    from ..services.badge_service import get_user_badges_with_definitions
    
    badges = get_user_badges_with_definitions(user_id, category=category, rarity=rarity)
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
    from ..db.badge_db import assign_badge
    
    _validate_internal_key(x_internal_key)
    
    try:
        badge = assign_badge(request.userId, request.badgeId, request.metadata)
        return {"success": True, "badge": badge.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign badge: {str(e)}")


@router.post("/evaluate", response_model=BadgeListResponse)
async def evaluate_badges_endpoint(
    request: BadgeEvaluationRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
):
    """Trigger badge evaluation for a user when other services detect an achievement."""
    from ..services.badge_service import evaluate_badges

    _validate_internal_key(x_internal_key)

    try:
        badges = evaluate_badges(request)
        return BadgeListResponse(badges=badges, total=len(badges))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate badges: {str(exc)}") from exc

