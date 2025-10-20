import re
from typing import Optional

class SecurityValidationError(Exception):
    """Raised when a security validation fails."""
    pass

def validate_user_id(user_id: str) -> str:
    """Validate user ID format."""
    if not user_id:
        raise SecurityValidationError("User ID cannot be empty")
    
    # Basic validation - should be a UUID or similar format
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        raise SecurityValidationError("Invalid user ID format")
    
    if len(user_id) < 3 or len(user_id) > 100:
        raise SecurityValidationError("User ID must be between 3 and 100 characters")
    
    return user_id

