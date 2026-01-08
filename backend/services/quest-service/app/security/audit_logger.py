"""
Audit logging for security and compliance.
"""

import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from enum import Enum


class AuditEventType(Enum):
    """Types of audit events."""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"
    SECURITY_VIOLATION = "security_violation"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    INPUT_VALIDATION_FAILED = "input_validation_failed"
    SYSTEM_ERROR = "system_error"


class AuditLogger:
    """Audit logger for security events."""
    
    def __init__(self, logger):
        self.logger = logger
    
    def log_auth_event(
        self,
        event_type: AuditEventType,
        user_id: str,
        success: bool,
        details: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log authentication events."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type.value,
            "user_id": user_id,
            "success": success,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "details": details or {}
        }
        
        self.logger.info(
            "audit.auth_event",
            extra=audit_data
        )
    
    def log_data_access(
        self,
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        success: bool,
        details: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None
    ):
        """Log data access events."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.DATA_ACCESS.value,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "success": success,
            "client_ip": client_ip,
            "details": details or {}
        }
        
        self.logger.info(
            "audit.data_access",
            extra=audit_data
        )
    
    def log_data_modification(
        self,
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None
    ):
        """Log data modification events."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.DATA_MODIFICATION.value,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "old_values": old_values,
            "new_values": new_values,
            "success": success,
            "client_ip": client_ip,
            "details": details or {}
        }
        
        self.logger.info(
            "audit.data_modification",
            extra=audit_data
        )
    
    def log_security_violation(
        self,
        violation_type: str,
        user_id: Optional[str] = None,
        client_ip: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: str = "medium"
    ):
        """Log security violations."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.SECURITY_VIOLATION.value,
            "violation_type": violation_type,
            "user_id": user_id,
            "client_ip": client_ip,
            "severity": severity,
            "details": details or {}
        }
        
        # Use warning level for security violations
        self.logger.warning(
            "audit.security_violation",
            extra=audit_data
        )
    
    def log_rate_limit_exceeded(
        self,
        user_id: str,
        endpoint: str,
        rate_limit: int,
        client_ip: Optional[str] = None
    ):
        """Log rate limit exceeded events."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.RATE_LIMIT_EXCEEDED.value,
            "user_id": user_id,
            "endpoint": endpoint,
            "rate_limit": rate_limit,
            "client_ip": client_ip
        }
        
        self.logger.warning(
            "audit.rate_limit_exceeded",
            extra=audit_data
        )
    
    def log_input_validation_failed(
        self,
        user_id: str,
        endpoint: str,
        validation_errors: list,
        input_data: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None
    ):
        """Log input validation failures."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.INPUT_VALIDATION_FAILED.value,
            "user_id": user_id,
            "endpoint": endpoint,
            "validation_errors": validation_errors,
            "input_data": input_data,
            "client_ip": client_ip
        }
        
        self.logger.warning(
            "audit.input_validation_failed",
            extra=audit_data
        )
    
    def log_system_error(
        self,
        error_type: str,
        error_message: str,
        user_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        client_ip: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log system errors."""
        audit_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": AuditEventType.SYSTEM_ERROR.value,
            "error_type": error_type,
            "error_message": error_message,
            "user_id": user_id,
            "endpoint": endpoint,
            "client_ip": client_ip,
            "details": details or {}
        }
        
        self.logger.error(
            "audit.system_error",
            extra=audit_data
        )


# Global audit logger instance
_audit_logger = None


def get_audit_logger(logger) -> AuditLogger:
    """Get or create audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger(logger)
    return _audit_logger
