"""
Rate limiting implementation for the quest service.

This module provides rate limiting functionality to prevent abuse and ensure
fair usage of the API endpoints.
"""

import time
from typing import Dict, Optional
from collections import defaultdict, deque
from fastapi import Request, HTTPException
import logging

logger = logging.getLogger("quest-service.rate_limiter")


class RateLimiter:
    """Rate limiter implementation using sliding window algorithm."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Check if request is allowed for the given identifier.
        
        Args:
            identifier: Unique identifier (e.g., user_id, ip_address)
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean old requests outside the window
        user_requests = self.requests[identifier]
        while user_requests and user_requests[0] < window_start:
            user_requests.popleft()
        
        # Check if under limit
        if len(user_requests) >= self.max_requests:
            logger.warning(
                'rate_limit_exceeded',
                extra={
                    'identifier': identifier,
                    'request_count': len(user_requests),
                    'max_requests': self.max_requests,
                    'window_seconds': self.window_seconds
                }
            )
            return False
        
        # Add current request
        user_requests.append(now)
        return True
    
    def get_remaining_requests(self, identifier: str) -> int:
        """Get remaining requests for the identifier."""
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean old requests
        user_requests = self.requests[identifier]
        while user_requests and user_requests[0] < window_start:
            user_requests.popleft()
        
        return max(0, self.max_requests - len(user_requests))
    
    def get_reset_time(self, identifier: str) -> float:
        """Get time when the rate limit resets."""
        user_requests = self.requests[identifier]
        if not user_requests:
            return time.time()
        
        return user_requests[0] + self.window_seconds


# Global rate limiters for different endpoints
general_limiter = RateLimiter(max_requests=100, window_seconds=60)  # 100 req/min
quest_creation_limiter = RateLimiter(max_requests=10, window_seconds=60)  # 10 quests/min
quest_completion_limiter = RateLimiter(max_requests=20, window_seconds=60)  # 20 completions/min
analytics_limiter = RateLimiter(max_requests=30, window_seconds=60)  # 30 analytics/min


def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client identifier string
    """
    # Try to get user ID from auth context if available
    if hasattr(request.state, 'auth_context'):
        return f"user:{request.state.auth_context.user_id}"
    
    # Fall back to IP address
    client_ip = request.client.host if request.client else "unknown"
    return f"ip:{client_ip}"


def check_rate_limit(limiter: RateLimiter, request: Request) -> None:
    """
    Check rate limit and raise exception if exceeded.
    
    Args:
        limiter: Rate limiter instance
        request: FastAPI request object
        
    Raises:
        HTTPException: If rate limit exceeded
    """
    identifier = get_client_identifier(request)
    
    if not limiter.is_allowed(identifier):
        reset_time = limiter.get_reset_time(identifier)
        retry_after = int(reset_time - time.time())
        
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": retry_after,
                "limit": limiter.max_requests,
                "window_seconds": limiter.window_seconds
            },
            headers={"Retry-After": str(retry_after)}
        )


def get_rate_limit_headers(limiter: RateLimiter, request: Request) -> Dict[str, str]:
    """
    Get rate limit headers for response.
    
    Args:
        limiter: Rate limiter instance
        request: FastAPI request object
        
    Returns:
        Dictionary of rate limit headers
    """
    identifier = get_client_identifier(request)
    remaining = limiter.get_remaining_requests(identifier)
    reset_time = limiter.get_reset_time(identifier)
    
    return {
        "X-RateLimit-Limit": str(limiter.max_requests),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(int(reset_time))
    }
