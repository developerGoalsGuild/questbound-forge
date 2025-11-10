"""
XP API routes.

Handles XP retrieval and internal XP award endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

from ..models.xp import XPSummary, XPHistoryResponse, XPAwardRequest, XPAwardResponse
from ..services.xp_service import award_xp, get_user_xp_summary
from ..db.xp_db import get_xp_transactions
from ..auth import TokenVerifier, TokenVerificationError
from ..settings import Settings

router = APIRouter(prefix="/xp", tags=["XP"])

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


@router.get("/current", response_model=XPSummary)
async def get_current_xp(user_id: str = Depends(authenticate)):
    """Get current XP summary for authenticated user."""
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
    # TODO: Implement internal key validation
    # For now, allow any request (should be secured in production)
    
    try:
        return award_xp(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award XP: {str(e)}")

