"""
Authentication models and utilities for the guild service.

This module contains authentication-related models and functions
to avoid circular imports.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel


class AuthContext(BaseModel):
    """Authentication context containing user information."""
    
    user_id: str
    claims: Dict[str, Any]
    provider: str
