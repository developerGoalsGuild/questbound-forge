from enum import Enum
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger("guild-service.audit")

class AuditEventType(Enum):
    AUTHENTICATION = "authentication"
    GUILD_CREATED = "guild_created"
    GUILD_UPDATED = "guild_updated"
    GUILD_DELETED = "guild_deleted"
    GUILD_JOINED = "guild_joined"
    GUILD_LEFT = "guild_left"
    USER_REMOVED = "user_removed"
    AVATAR_UPLOADED = "avatar_uploaded"
    AVATAR_DELETED = "avatar_deleted"

class AuditLogger:
    def __init__(self):
        self.logger = logger
    
    def log_event(self, event_type: AuditEventType, user_id: str, resource_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log an audit event."""
        log_data = {
            "event_type": event_type.value,
            "user_id": user_id,
            "resource_id": resource_id,
            "details": details or {}
        }
        self.logger.info("Audit event", extra=log_data)
    
    def log_security_violation(self, violation_type: str, user_id: Optional[str] = None, client_ip: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log a security violation."""
        log_data = {
            "violation_type": violation_type,
            "user_id": user_id,
            "client_ip": client_ip,
            "details": details or {}
        }
        self.logger.warning("Security violation", extra=log_data)

def get_audit_logger() -> Optional[AuditLogger]:
    """Get the audit logger instance."""
    try:
        return AuditLogger()
    except Exception:
        return None

