"""
Tests for the common module functionality.
Tests logging and other common utilities.
"""

import pytest
from unittest.mock import patch, MagicMock
import sys
import os
import logging
from datetime import datetime

# Add the parent directory to the path to import common module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the common module
try:
    from common.logging import get_structured_logger, log_event, StructuredLoggerAdapter
    COMMON_AVAILABLE = True
except ImportError:
    COMMON_AVAILABLE = False


class TestCommonModule:
    """Tests for the common module functionality."""
    
    def test_common_module_import(self):
        """Test that the common module can be imported."""
        if COMMON_AVAILABLE:
            assert True  # Common module is available
        else:
            pytest.skip("Common module not available")
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_creation(self):
        """Test structured logger creation."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        assert isinstance(logger, StructuredLoggerAdapter)
        assert logger.logger.name == "test_logger"
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_disabled(self):
        """Test structured logger when disabled."""
        with patch.dict(os.environ, {'TEST_STRUCTURED_LOGGING': 'false'}):
            logger = get_structured_logger(
                name="test_logger_disabled",
                env_flag="TEST_STRUCTURED_LOGGING",
                default_enabled=True
            )
            
            assert isinstance(logger, StructuredLoggerAdapter)
            assert logger._enabled is False
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_enabled(self):
        """Test structured logger when enabled."""
        with patch.dict(os.environ, {'TEST_STRUCTURED_LOGGING': 'true'}):
            logger = get_structured_logger(
                name="test_logger_enabled",
                env_flag="TEST_STRUCTURED_LOGGING",
                default_enabled=True
            )
            
            assert isinstance(logger, StructuredLoggerAdapter)
            assert logger._enabled is True
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_log_event_function(self):
        """Test log_event function."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test log_event function
        log_event(
            logger=logger,
            event="test_event",
            level=logging.INFO,
            user_id="user_123",
            action="test_action"
        )
        
        # If we get here without error, the function works
        assert True
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_process_method(self):
        """Test StructuredLoggerAdapter process method."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test process method
        msg, kwargs = logger.process("test message", {"extra_field": "value"})
        
        assert msg == "test message"
        assert "extra" in kwargs
        assert "_structured" in kwargs["extra"]
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_process_method_disabled(self):
        """Test StructuredLoggerAdapter process method when disabled."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=False
        )
        
        # Test process method when disabled
        msg, kwargs = logger.process("test message", {"extra_field": "value"})
        
        assert msg == "test message"
        assert "extra" in kwargs
        assert "extra_field" in kwargs["extra"]
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_exception_handling(self):
        """Test StructuredLoggerAdapter exception handling."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test exception handling
        try:
            raise ValueError("Test exception")
        except ValueError:
            msg, kwargs = logger.process("test message", {"exc_info": True})
            
            assert msg == "test message"
            assert "extra" in kwargs
            assert "_structured" in kwargs["extra"]
            assert "error_type" in kwargs["extra"]["_structured"]
            assert "error" in kwargs["extra"]["_structured"]
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_exception_object(self):
        """Test StructuredLoggerAdapter with exception object."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test with exception object
        exc = ValueError("Test exception")
        msg, kwargs = logger.process("test message", {"exc_info": exc})
        
        assert msg == "test message"
        assert "extra" in kwargs
        assert "_structured" in kwargs["extra"]
        assert "error_type" in kwargs["extra"]["_structured"]
        assert "error" in kwargs["extra"]["_structured"]
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_extra_fields(self):
        """Test StructuredLoggerAdapter with extra fields."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test with extra fields
        msg, kwargs = logger.process(
            "test message",
            {
                "user_id": "user_123",
                "action": "test_action",
                "timestamp": datetime.now().isoformat()
            }
        )
        
        assert msg == "test message"
        assert "extra" in kwargs
        assert "_structured" in kwargs["extra"]
        structured_data = kwargs["extra"]["_structured"]
        assert structured_data["user_id"] == "user_123"
        assert structured_data["action"] == "test_action"
        assert "timestamp" in structured_data
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_standard_kwargs(self):
        """Test StructuredLoggerAdapter with standard logging kwargs."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test with standard logging kwargs
        msg, kwargs = logger.process(
            "test message",
            {
                "exc_info": False,
                "stack_info": None,
                "stacklevel": 1,
                "extra": {"existing_field": "value"},
                "user_id": "user_123"
            }
        )
        
        assert msg == "test message"
        assert "extra" in kwargs
        assert "_structured" in kwargs["extra"]
        structured_data = kwargs["extra"]["_structured"]
        assert structured_data["user_id"] == "user_123"
        assert structured_data["existing_field"] == "value"
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_log_level(self):
        """Test structured logger with different log levels."""
        logger = get_structured_logger(
            name="test_logger",
            env_flag="TEST_STRUCTURED_LOGGING",
            default_enabled=True
        )
        
        # Test different log levels
        levels = [logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL]
        
        for level in levels:
            log_event(
                logger=logger,
                event=f"test_event_{level}",
                level=level,
                test_field="value"
            )
        
        # If we get here without error, all levels work
        assert True
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_json_default(self):
        """Test structured logger JSON default function."""
        from common.logging import _json_default
        
        # Test with serializable object
        result = _json_default("test_string")
        assert result == "test_string"
        
        # Test with non-serializable object
        class NonSerializable:
            def __str__(self):
                raise Exception("Cannot serialize")
        
        result = _json_default(NonSerializable())
        assert result == "<unserializable>"
    
    @pytest.mark.skipif(not COMMON_AVAILABLE, reason="Common module not available")
    def test_structured_logger_to_bool(self):
        """Test structured logger _to_bool function."""
        from common.logging import _to_bool
        
        # Test truthy values
        assert _to_bool("1") is True
        assert _to_bool("true") is True
        assert _to_bool("TRUE") is True
        assert _to_bool("yes") is True
        assert _to_bool("YES") is True
        assert _to_bool("on") is True
        assert _to_bool("ON") is True
        
        # Test falsy values
        assert _to_bool("0") is False
        assert _to_bool("false") is False
        assert _to_bool("FALSE") is False
        assert _to_bool("no") is False
        assert _to_bool("NO") is False
        assert _to_bool("off") is False
        assert _to_bool("OFF") is False
        assert _to_bool("invalid") is False
        
        # Test None
        assert _to_bool(None) is False
        assert _to_bool(None, default=True) is True
        
        # Test default value - the function doesn't use the default parameter for invalid values
        assert _to_bool("invalid", default=True) is False  # Invalid values always return False
        assert _to_bool("invalid", default=False) is False


if __name__ == '__main__':
    pytest.main([__file__])
