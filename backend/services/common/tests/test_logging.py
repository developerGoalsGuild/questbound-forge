import json
import logging
import os
import pytest
from io import StringIO
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

from common.logging import (
    StructuredJsonFormatter,
    StructuredLoggerAdapter,
    get_structured_logger,
    log_event,
    _to_bool,
    _json_default,
)


class TestToBool:
    def test_to_bool_with_various_inputs(self):
        assert _to_bool("1") is True
        assert _to_bool("true") is True
        assert _to_bool("TRUE") is True
        assert _to_bool("yes") is True
        assert _to_bool("YES") is True
        assert _to_bool("on") is True
        assert _to_bool("ON") is True
        assert _to_bool("false") is False
        assert _to_bool("FALSE") is False
        assert _to_bool("0") is False
        assert _to_bool("no") is False
        assert _to_bool("off") is False
        assert _to_bool("") is False
        assert _to_bool("random") is False
        assert _to_bool(None) is False
        assert _to_bool(None, True) is True


class TestJsonDefault:
    def test_json_default_with_serializable_objects(self):
        assert _json_default("string") == "string"
        assert _json_default(123) == 123
        assert _json_default([1, 2, 3]) == [1, 2, 3]

    def test_json_default_with_non_serializable_objects(self):
        class NonSerializable:
            pass

        result = _json_default(NonSerializable())
        assert result == "<unserializable>"


class TestStructuredJsonFormatter:
    def test_format_with_structured_payload(self):
        formatter = StructuredJsonFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )

        # Add structured payload to record
        record._structured = {
            "event": "test_event",
            "field1": "value1",
            "field2": 123
        }

        result = formatter.format(record)
        parsed = json.loads(result)

        assert parsed["event"] == "test_event"
        assert parsed["field1"] == "value1"
        assert parsed["field2"] == 123
        assert parsed["level"] == "INFO"
        assert parsed["logger"] == "test_logger"
        assert "ts" in parsed

    def test_format_without_structured_payload(self):
        formatter = StructuredJsonFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.WARNING,
            pathname="test.py",
            lineno=1,
            msg="Plain message",
            args=(),
            exc_info=None
        )

        result = formatter.format(record)
        parsed = json.loads(result)

        assert parsed["event"] == "Plain message"
        assert parsed["level"] == "WARNING"
        assert parsed["logger"] == "test_logger"

    def test_format_with_exception_info(self):
        formatter = StructuredJsonFormatter()

        try:
            raise ValueError("Test error")
        except ValueError:
            exc_info = None  # Will be set by logging system

        record = logging.LogRecord(
            name="test_logger",
            level=logging.ERROR,
            pathname="test.py",
            lineno=1,
            msg="Error occurred",
            args=(),
            exc_info=exc_info
        )

        # Manually set exc_info for testing
        import sys
        record.exc_info = sys.exc_info()
        record._structured = {"event": "test_error"}

        result = formatter.format(record)
        parsed = json.loads(result)

        assert parsed["event"] == "test_error"
        assert "error_type" in parsed
        assert "error" in parsed
        assert "stack" in parsed


class TestStructuredLoggerAdapter:
    def test_process_with_enabled_adapter(self):
        mock_logger = MagicMock()
        adapter = StructuredLoggerAdapter(mock_logger, enabled=True)

        msg, kwargs = adapter.process("Test event", extra={"field1": "value1"})

        assert msg == "Test event"
        assert "_structured" in kwargs["extra"]
        structured = kwargs["extra"]["_structured"]
        assert structured["event"] == "Test event"
        assert structured["field1"] == "value1"

    def test_process_with_disabled_adapter(self):
        mock_logger = MagicMock()
        adapter = StructuredLoggerAdapter(mock_logger, enabled=False)

        msg, kwargs = adapter.process("Test event", extra={"field1": "value1"})

        assert msg == "Test event"
        assert kwargs == {"extra": {"field1": "value1"}}

    def test_process_with_exception_info(self):
        mock_logger = MagicMock()
        adapter = StructuredLoggerAdapter(mock_logger, enabled=True)

        try:
            raise RuntimeError("Test exception")
        except RuntimeError:
            pass

        msg, kwargs = adapter.process("Error event", exc_info=True, extra={"context": "test"})

        structured = kwargs["extra"]["_structured"]
        assert structured["event"] == "Error event"
        assert structured["context"] == "test"
        assert structured["error_type"] == "RuntimeError"
        assert "error" in structured
        assert "stack" in structured


class TestGetStructuredLogger:
    @patch('common.logging.logging.getLogger')
    @patch('common.logging.StructuredLoggerAdapter')
    def test_get_structured_logger_enabled(self, mock_adapter_class, mock_get_logger):
        mock_logger = MagicMock()
        mock_get_logger.return_value = mock_logger
        mock_adapter = MagicMock()
        mock_adapter_class.return_value = mock_adapter

        with patch.dict(os.environ, {'TEST_LOG_ENABLED': 'true'}):
            result = get_structured_logger("test_logger", env_flag="TEST_LOG_ENABLED")

        mock_get_logger.assert_called_once_with("test_logger")
        mock_adapter_class.assert_called_once_with(mock_logger, True)
        assert result == mock_adapter

    @patch('common.logging.logging.getLogger')
    @patch('common.logging.StructuredLoggerAdapter')
    def test_get_structured_logger_disabled(self, mock_adapter_class, mock_get_logger):
        mock_logger = MagicMock()
        mock_get_logger.return_value = mock_logger
        mock_adapter = MagicMock()
        mock_adapter_class.return_value = mock_adapter

        with patch.dict(os.environ, {'TEST_LOG_ENABLED': 'false'}):
            result = get_structured_logger("test_logger", env_flag="TEST_LOG_ENABLED")

        mock_adapter_class.assert_called_once_with(mock_logger, False)

    @patch('common.logging.logging.getLogger')
    @patch('common.logging.StructuredLoggerAdapter')
    def test_get_structured_logger_with_handlers_setup(self, mock_adapter_class, mock_get_logger):
        mock_logger = MagicMock()
        mock_logger.handlers = []  # No handlers initially
        mock_get_logger.return_value = mock_logger
        mock_adapter = MagicMock()
        mock_adapter_class.return_value = mock_adapter

        with patch('common.logging.logging.StreamHandler') as mock_handler_class, \
             with patch('common.logging.StructuredJsonFormatter') as mock_formatter_class:

            mock_handler = MagicMock()
            mock_handler_class.return_value = mock_handler
            mock_formatter = MagicMock()
            mock_formatter_class.return_value = mock_formatter

            with patch.dict(os.environ, {'TEST_LOG_ENABLED': 'true', 'LOG_LEVEL': 'DEBUG'}):
                get_structured_logger("test_logger", env_flag="TEST_LOG_ENABLED")

            mock_handler_class.assert_called_once()
            mock_formatter_class.assert_called_once()
            mock_handler.setFormatter.assert_called_once_with(mock_formatter)
            mock_logger.addHandler.assert_called_once_with(mock_handler)
            mock_logger.setLevel.assert_called_once_with(logging.DEBUG)


class TestLogEvent:
    def test_log_event_with_structured_logger(self):
        mock_logger = MagicMock()
        adapter = StructuredLoggerAdapter(mock_logger, enabled=True)

        log_event(adapter, "test_event", field1="value1", field2=123)

        # Verify the logger was called with structured data
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args
        assert call_args[0][0] == logging.INFO  # default level
        assert call_args[0][1] == "test_event"

        # Check that structured data was passed
        extra = call_args[1]["extra"]
        assert "_structured" in extra
        structured = extra["_structured"]
        assert structured["event"] == "test_event"
        assert structured["field1"] == "value1"
        assert structured["field2"] == 123

    def test_log_event_with_custom_level(self):
        mock_logger = MagicMock()
        adapter = StructuredLoggerAdapter(mock_logger, enabled=True)

        log_event(adapter, "error_event", level=logging.ERROR, error_code=500)

        mock_logger.log.assert_called_once_with(
            logging.ERROR, "error_event",
            extra={"_structured": {"event": "error_event", "error_code": 500}}
        )


class TestIntegration:
    def test_full_logging_workflow(self):
        # Test the complete logging workflow
        stream = StringIO()
        handler = logging.StreamHandler(stream)
        formatter = StructuredJsonFormatter()
        handler.setFormatter(formatter)

        logger = logging.getLogger("test_integration")
        logger.handlers = []  # Clear existing handlers
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

        adapter = StructuredLoggerAdapter(logger, enabled=True)

        # Log an event
        log_event(adapter, "integration_test", user_id="user123", action="login")

        # Get the logged output
        output = stream.getvalue()
        parsed = json.loads(output)

        assert parsed["event"] == "integration_test"
        assert parsed["user_id"] == "user123"
        assert parsed["action"] == "login"
        assert parsed["level"] == "INFO"
        assert parsed["logger"] == "test_integration"
        assert "ts" in parsed

    def test_disabled_structured_logging_falls_back_to_standard(self):
        # Test that when structured logging is disabled, it falls back to standard logging
        stream = StringIO()
        handler = logging.StreamHandler(stream)
        formatter = logging.Formatter('%(levelname)s %(message)s')
        handler.setFormatter(formatter)

        logger = logging.getLogger("test_disabled")
        logger.handlers = []
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

        adapter = StructuredLoggerAdapter(logger, enabled=False)

        log_event(adapter, "disabled_test", user_id="user123")

        # Should log as plain message without structured data
        output = stream.getvalue().strip()
        assert "INFO disabled_test" in output
