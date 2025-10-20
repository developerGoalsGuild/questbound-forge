"""
Authentication functions for the guild service.

This module contains the main authentication logic to avoid circular imports.
"""

import os
from functools import lru_cache
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from pydantic import BaseModel

from .auth_models import AuthContext
from .validation import validate_user_id, SecurityValidationError
from .audit_logger import get_audit_logger, AuditEventType
from common.logging import log_event, get_structured_logger
from ..auth import TokenVerifier, TokenVerificationError
from ..settings import Settings

# Use the shared structured logger helper to avoid missing symbol imports
logger = get_structured_logger(__name__, env_flag="GUILD_STRUCTURED_LOGGING")


@lru_cache(maxsize=1)
def _token_verifier() -> TokenVerifier:
    settings = Settings()
    return TokenVerifier(settings)


async def authenticate(request: Request) -> AuthContext:
    """Authenticate a request and return user context."""
    path = request.url.path if request.url else ""
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent', '')
    
    # Initialize audit logger
    audit_logger = get_audit_logger()
    
    log_event(
        logger,
        'auth.request_received',
        method=request.method,
        path=path,
        client=client_host,
    )

    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    if not auth_header:
        logger.warning(
            'auth.header_missing',
            extra={'method': request.method, 'path': path, 'client': client_host},
        )
        if audit_logger:
            audit_logger.log_security_violation(
                violation_type="missing_auth_header",
                client_ip=client_host,
                details={"method": request.method, "path": path}
            )
        raise HTTPException(status_code=401, detail='Authorization header is required')

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        logger.warning(
            'auth.header_invalid',
            extra={
                'method': request.method,
                'path': path,
                'client': client_host,
                'scheme': parts[0] if parts else None,
            },
        )
        if audit_logger:
            audit_logger.log_security_violation(
                violation_type="invalid_auth_header",
                client_ip=client_host,
                details={"method": request.method, "path": path, "scheme": parts[0] if parts else None}
            )
        raise HTTPException(status_code=401, detail='Authorization header must use Bearer token')

    token = parts[1]
    try:
        claims, provider = _token_verifier().verify(token)
    except TokenVerificationError as exc:
        logger.warning(
            'auth.token_verification_failed',
            extra={
                'method': request.method,
                'path': path,
                'client': client_host,
                'error_type': type(exc).__name__,
                'token_length': len(token),
            },
            exc_info=exc,
        )
        if audit_logger:
            audit_logger.log_security_violation(
                violation_type="token_verification_failed",
                client_ip=client_host,
                details={"method": request.method, "path": path, "error_type": type(exc).__name__}
            )
        raise HTTPException(status_code=401, detail='Unauthorized: token verification failed') from exc

    user_id = claims.get('sub')
    if not user_id:
        logger.warning(
            'auth.subject_missing',
            extra={'method': request.method, 'path': path, 'provider': provider},
        )
        if audit_logger:
            audit_logger.log_security_violation(
                violation_type="missing_subject_claim",
                client_ip=client_host,
                details={"method": request.method, "path": path, "provider": provider}
            )
        raise HTTPException(status_code=401, detail='Unauthorized: subject claim missing')

    # Validate user ID format
    try:
        user_id = validate_user_id(str(user_id))
    except SecurityValidationError as exc:
        if audit_logger:
            audit_logger.log_security_violation(
                violation_type="invalid_user_id_format",
                user_id=str(user_id),
                client_ip=client_host,
                details={"method": request.method, "path": path, "error": str(exc)}
            )
        raise HTTPException(status_code=401, detail='Unauthorized: invalid user ID format') from exc

    # Log successful authentication
    log_event(
        logger,
        'auth.success',
        method=request.method,
        path=path,
        provider=provider,
        user_id=user_id,
    )

    if audit_logger:
        # Align with available audit logger API (log_event)
        audit_logger.log_event(
            event_type=AuditEventType.AUTHENTICATION,
            user_id=user_id,
            resource_id=None,
            details={
                "provider": provider,
                "method": request.method,
                "path": path,
                "client_ip": client_host,
                "user_agent": user_agent,
            }
        )

    return AuthContext(
        user_id=user_id,
        claims=claims,
        provider=provider
    )