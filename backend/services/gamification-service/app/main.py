"""
Gamification Service - Main FastAPI application.

Handles XP, levels, badges, challenges, and leaderboards.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

# Add common module to path
def _add_common_to_path():
    """Add common module to Python path."""
    container_common = Path("/app/common")
    if container_common.exists():
        if str(container_common.parent) not in sys.path:
            sys.path.append(str(container_common.parent))
        return
    
    services_dir = Path(__file__).resolve().parents[3]
    if (services_dir / "common").exists():
        if str(services_dir) not in sys.path:
            sys.path.append(str(services_dir))
        return
    
    current_dir = Path(__file__).resolve().parent
    for _ in range(5):
        common_dir = current_dir / "common"
        if common_dir.exists():
            if str(current_dir) not in sys.path:
                sys.path.append(str(current_dir))
            return
        current_dir = current_dir.parent

_add_common_to_path()

from common.logging import get_structured_logger, log_event

# Lazy import routers to reduce cold start time
# Settings will be initialized lazily when needed

# Initialize logger (lightweight, can be done at import time)
logger = get_structured_logger("gamification-service", env_flag="GAMIFICATION_LOG_ENABLED", default_enabled=True)

# Settings will be initialized on first use
_settings = None

def get_settings():
    """Lazy initialization of settings."""
    global _settings
    if _settings is None:
        from .settings import Settings
        _settings = Settings()
    return _settings

# Create FastAPI app
app = FastAPI(
    title="GoalsGuild Gamification Service",
    version="1.0.0",
    description="XP, levels, badges, challenges, and leaderboards"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(RequestValidationError)
async def handle_validation_error(request, exc: RequestValidationError):
    logger.warning("validation.error", errors=exc.errors())
    return JSONResponse(status_code=400, content={"detail": exc.errors()})

@app.exception_handler(ValidationError)
async def handle_pydantic_validation(request, exc: ValidationError):
    logger.warning("pydantic.validation.error", errors=exc.errors())
    return JSONResponse(status_code=400, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def handle_unexpected(request, exc: Exception):
    logger.error("unhandled.exception", type=type(exc).__name__, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# Health check (lightweight, no dependencies)
@app.get("/health")
def health():
    return {"ok": True, "service": "gamification-service"}

# Load routers function (can be called manually for tests)
def _load_routers():
    """Load routers (used for both startup event and tests)."""
    from .api.xp_routes import router as xp_router
    from .api.badge_routes import router as badge_router
    from .api.level_routes import router as level_router
    from .api.challenge_routes import router as challenge_router
    from .api.leaderboard_routes import router as leaderboard_router
    
    app.include_router(xp_router)
    app.include_router(badge_router)
    app.include_router(level_router)
    app.include_router(challenge_router)
    app.include_router(leaderboard_router)

# Lazy load routers to reduce cold start time
# Routers are imported only when the app starts, not at module import time
@app.on_event("startup")
async def load_routers():
    """Load routers on startup (after Lambda is ready)."""
    _load_routers()

# For tests: load routers immediately if not in Lambda environment
# Check if we're in a test environment or if routers haven't been loaded
if os.getenv("PYTEST_CURRENT_TEST") or os.getenv("TESTING"):
    _load_routers()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

