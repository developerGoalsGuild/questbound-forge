from __future__ import annotations

import json
import logging
import os
import sys
import traceback
from datetime import datetime, timezone
from typing import Any, Mapping


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _json_default(obj: Any) -> str:
    try:
        return str(obj)
    except Exception:
        return "<unserializable>"


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # pragma: no cover - trivial
        payload: dict[str, Any] = getattr(record, "_structured", None) or {}
        if not payload:
            payload = {"event": record.getMessage()}
        payload.setdefault("level", record.levelname)
        payload.setdefault("logger", record.name)
        payload.setdefault("ts", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        return json.dumps(payload, default=_json_default)


class StructuredLoggerAdapter(logging.LoggerAdapter):
    def __init__(self, logger: logging.Logger, enabled: bool) -> None:
        super().__init__(logger, {})
        self._enabled = enabled

    def process(self, msg: Any, kwargs: dict[str, Any]):
        # Extract any extra keyword arguments that are not standard logging parameters
        standard_kwargs = {'exc_info', 'stack_info', 'stacklevel', 'extra'}
        extra_fields: dict[str, Any] = {}
        
        # Move non-standard kwargs to extra_fields
        for key in list(kwargs.keys()):
            if key not in standard_kwargs:
                extra_fields[key] = kwargs.pop(key)
        
        # Also get any existing extra fields
        provided_extra = kwargs.pop("extra", None)
        if isinstance(provided_extra, Mapping):
            extra_fields.update(provided_extra)

        if not self._enabled:
            # When structured logging is disabled, still need to handle extra fields
            # to prevent "unexpected keyword argument" errors
            if extra_fields:
                kwargs["extra"] = extra_fields
            return msg, kwargs

        payload: dict[str, Any] = {"event": str(msg)}
        if extra_fields:
            payload.update(extra_fields)

        exc_info = kwargs.get("exc_info")
        if exc_info:
            if exc_info is True:
                exc_info = sys.exc_info()
            # Handle both tuple format (type, value, traceback) and exception objects
            if exc_info:
                if isinstance(exc_info, tuple) and len(exc_info) >= 2:
                    payload["error_type"] = exc_info[0].__name__ if exc_info[0] else None
                    payload["error"] = str(exc_info[1]) if exc_info[1] else None
                    payload["stack"] = "".join(traceback.format_exception(*exc_info))
                elif hasattr(exc_info, '__class__'):
                    # Handle exception objects directly
                    payload["error_type"] = exc_info.__class__.__name__
                    payload["error"] = str(exc_info)
                    payload["stack"] = traceback.format_exc()
            kwargs["exc_info"] = None

        kwargs.setdefault("extra", {})["_structured"] = payload
        return msg, kwargs


def get_structured_logger(
    name: str,
    *,
    env_flag: str,
    default_enabled: bool = True,
) -> StructuredLoggerAdapter:
    """Return a logger adapter that emits authorizer-style JSON logs."""
    enabled = _to_bool(os.getenv(env_flag), default_enabled)
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter: logging.Formatter
        if enabled:
            formatter = StructuredJsonFormatter()
        else:
            formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False

    return StructuredLoggerAdapter(logger, enabled)


def log_event(
    logger: StructuredLoggerAdapter,
    event: str,
    *,
    level: int = logging.INFO,
    **fields: Any,
) -> None:
    logger.log(level, event, extra=fields)
