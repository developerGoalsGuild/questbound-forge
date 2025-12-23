"""
XP API routes.

Handles XP retrieval and internal XP award endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

# Import models at module level (needed for response_model decorators)
from ..models.xp import XPSummary, XPHistoryResponse, XPAwardRequest, XPAwardResponse

# Lazy loading of heavy imports
router = APIRouter(prefix="/xp", tags=["XP"])

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


@router.get("/current", response_model=XPSummary)
async def get_current_xp(user_id: str = Depends(authenticate)):
    """Get current XP summary for authenticated user."""
    from ..services.xp_service import get_user_xp_summary
    
    summary = get_user_xp_summary(user_id)
    if not summary:
        raise HTTPException(status_code=404, detail="XP summary not found")
    return summary


@router.get("/history", response_model=XPHistoryResponse)
async def get_xp_history(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(authenticate)
):
    """Get XP transaction history for authenticated user."""
    from ..db.xp_db import get_xp_transactions
    
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative")
    
    transactions = get_xp_transactions(user_id, limit=limit, offset=offset)
    
    return XPHistoryResponse(
        transactions=transactions,
        total=len(transactions),
        limit=limit,
        offset=offset
    )


@router.post("/award", response_model=XPAwardResponse)
async def award_xp_endpoint(
    request: XPAwardRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")
):
    """
    Award XP to a user (internal endpoint).
    
    This endpoint is called by other services (quest-service, etc.) to award XP.
    Requires X-Internal-Key header for security.
    """
    from ..services.xp_service import award_xp
    _validate_internal_key(x_internal_key)
    
    try:
        return award_xp(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award XP: {str(e)}")

