"""
Authentication utilities for the guild service.

This module provides authentication-related functions and dependencies
for the FastAPI application.
"""

from .auth_models import AuthContext


def get_current_user_id(auth: AuthContext) -> str:
    """
    Extract the current user ID from the authentication context.
    
    Args:
        auth: The authentication context containing user information
        
    Returns:
        str: The current user's ID
    """
    return auth.user_id
