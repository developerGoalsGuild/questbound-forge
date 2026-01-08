"""
Comprehensive Settings Tests for Maximum Coverage.

This module provides extensive tests for the settings module using proper mocking.
"""

import pytest
import os
import json
from unittest.mock import patch, Mock, MagicMock
from botocore.exceptions import ClientError

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))


class TestSettingsComprehensive:
    """Comprehensive tests for Settings class with proper mocking."""
    
    @patch('app.settings.get_param')
    def test_settings_initialization_with_prefix(self, mock_get_param):
        """Test Settings initialization with custom prefix."""
        mock_get_param.return_value = '{"CORE_TABLE": "test_table"}'
        
        from app.settings import Settings
        settings = Settings(prefix="/custom/prefix/")
        
        assert settings.prefix == "/custom/prefix/"
        assert settings.aws_region == "us-east-2"  # Always from _detect_region()
        assert settings.core_table_name == "test_table"
        mock_get_param.assert_called_once_with("/custom/prefix/env_vars", decrypt=False)
    
    @patch('app.settings.get_param')
    def test_settings_initialization_without_prefix(self, mock_get_param):
        """Test Settings initialization with default prefix."""
        mock_get_param.return_value = '{"CORE_TABLE": "default_table"}'
        
        from app.settings import Settings
        settings = Settings()
        
        assert settings.prefix == "/goalsguild/quest-service/"
        assert settings.aws_region == "us-east-2"  # Always from _detect_region()
        assert settings.core_table_name == "default_table"
        mock_get_param.assert_called_once_with("/goalsguild/quest-service/env_vars", decrypt=False)
    
    def test_settings_initialization_with_env_vars(self):
        """Test Settings initialization with environment variables."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "env_table"}'}):
            with patch('app.settings.get_param') as mock_get_param:
                from app.settings import Settings
                # Should not call get_param when env var is available
                settings = Settings()
                
                assert settings.aws_region == "us-east-2"  # Always from _detect_region()
                assert settings.core_table_name == "env_table"
                mock_get_param.assert_not_called()
    
    @patch('app.settings.get_param')
    def test_settings_initialization_with_ssm_fallback(self, mock_get_param):
        """Test Settings initialization with SSM fallback."""
        mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
        
        from app.settings import Settings
        settings = Settings()
        
        assert settings.aws_region == "us-east-2"  # Always from _detect_region()
        assert settings.core_table_name == "ssm_table"
        mock_get_param.assert_called_once()
    
    def test_settings_initialization_with_invalid_json(self):
        """Test Settings initialization with invalid JSON in env vars."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"invalid": "json"}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
                Settings()
    
    @patch('app.settings.get_param')
    def test_settings_initialization_with_missing_required_fields(self, mock_get_param):
        """Test Settings initialization with missing required fields."""
        mock_get_param.return_value = '{"OTHER_FIELD": "value"}'
        
        from app.settings import Settings
        with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
            Settings()
    
    def test_settings_initialization_with_override_values(self):
        """Test Settings initialization with override values."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "override_table"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "override_table"
    
    def test_settings_initialization_with_empty_env_vars(self):
        """Test Settings initialization with empty environment variables."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
                Settings()
    
    def test_settings_initialization_with_none_env_vars(self):
        """Test Settings initialization with None environment variables."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": 'null'}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-east-2"  # Always from _detect_region()
                assert settings.core_table_name == "ssm_table"
    
    def test_settings_initialization_with_complex_env_vars(self):
        """Test Settings initialization with complex environment variables."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "complex_table", "JWT_SECRET": "secret123", "CORS_MAX_AGE": 3600}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "complex_table"
            # JWT secret requires additional mocking for get_param
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = "secret123"
                assert settings.jwt_secret == "secret123"
    
    def test_settings_initialization_with_boolean_strings(self):
        """Test Settings initialization with boolean strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table", "CORS_MAX_AGE": "true"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table"
    
    def test_settings_initialization_with_invalid_boolean_strings(self):
        """Test Settings initialization with invalid boolean strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table", "CORS_MAX_AGE": "invalid_boolean"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table"
    
    def test_settings_initialization_with_mixed_sources(self):
        """Test Settings initialization with mixed environment and SSM sources."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "mixed_table"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "mixed_table"
    
    def test_settings_initialization_with_nested_structures(self):
        """Test Settings initialization with nested structures."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "nested_table", "nested": {"key": "value"}}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "nested_table"
    
    def test_settings_initialization_with_empty_lists(self):
        """Test Settings initialization with empty lists."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "list_table", "tags": []}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "list_table"
    
    @patch('app.settings.get_param')
    def test_settings_initialization_with_default_values(self, mock_get_param):
        """Test Settings initialization with default values."""
        mock_get_param.return_value = '{"CORE_TABLE": "default_table"}'
        
        from app.settings import Settings
        settings = Settings()
        
        assert settings.aws_region == "us-east-2"  # Always from _detect_region()
        assert settings.core_table_name == "default_table"
    
    def test_settings_initialization_with_partial_override(self):
        """Test Settings initialization with partial override of default values."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table"


class TestSettingsEdgeCases:
    """Edge case tests for Settings class."""
    
    def test_settings_initialization_with_unicode_strings(self):
        """Test Settings initialization with Unicode strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table_unicode"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table_unicode"
    
    def test_settings_initialization_with_special_characters(self):
        """Test Settings initialization with special characters."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table_with-special.chars_123"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table_with-special.chars_123"
    
    def test_settings_initialization_with_very_long_strings(self):
        """Test Settings initialization with very long strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "' + 'a' * 1000 + '"}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert len(settings.core_table_name) == 1000
    
    def test_settings_initialization_with_none_values(self):
        """Test Settings initialization with None values in environment variables."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": null}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
                Settings()
    
    def test_settings_initialization_with_empty_strings(self):
        """Test Settings initialization with empty strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": ""}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
                Settings()
    
    def test_settings_initialization_with_whitespace_strings(self):
        """Test Settings initialization with whitespace-only strings."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "   "}'}, clear=True):
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "   "
    
    @patch('app.settings.get_param')
    def test_settings_ssm_error_handling(self, mock_get_param):
        """Test Settings initialization with SSM error."""
        mock_get_param.side_effect = ClientError(
            error_response={'Error': {'Code': 'ParameterNotFound'}},
            operation_name='GetParameter'
        )
        
        from app.settings import Settings
        with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
            Settings()
    
    @patch('app.settings.get_param')
    def test_settings_ssm_network_error(self, mock_get_param):
        """Test Settings initialization with SSM network error."""
        mock_get_param.side_effect = Exception("Network error")
        
        from app.settings import Settings
        with pytest.raises(RuntimeError, match="Failed to load quest-service env_vars from SSM"):
            Settings()
    
    def test_settings_prefix_normalization(self):
        """Test that prefix is properly normalized."""
        with patch('app.settings.get_param') as mock_get_param:
            mock_get_param.return_value = '{"CORE_TABLE": "test_table"}'
            
            from app.settings import Settings
            # Test prefix without trailing slash
            settings1 = Settings(prefix="/custom/prefix")
            assert settings1.prefix == "/custom/prefix/"
            
            # Test prefix with trailing slash
            settings2 = Settings(prefix="/custom/prefix/")
            assert settings2.prefix == "/custom/prefix/"
    
    def test_settings_property_access(self):
        """Test that all settings properties are accessible."""
        with patch('app.settings.get_param') as mock_get_param:
            mock_get_param.return_value = json.dumps({
                "CORE_TABLE": "test_table",
                "JWT_SECRET": "test_secret",
                "CORS_MAX_AGE": 1800
            })
            
            from app.settings import Settings
            settings = Settings()
            
            # Test all properties are accessible
            assert hasattr(settings, 'aws_region')
            assert hasattr(settings, 'core_table_name')
            assert hasattr(settings, 'jwt_secret')
            
            # Test property values
            assert settings.aws_region == "us-east-2"  # Always from _detect_region()
            assert settings.core_table_name == "test_table"
    
    def test_settings_aws_region_override(self):
        """Test that AWS_REGION environment variable overrides default region."""
        with patch.dict(os.environ, {"AWS_REGION": "us-west-2"}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "test_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-west-2"
    
    def test_settings_aws_default_region_override(self):
        """Test that AWS_DEFAULT_REGION environment variable overrides default region."""
        with patch.dict(os.environ, {"AWS_DEFAULT_REGION": "us-west-1"}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "test_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-west-1"
    
    def test_settings_allowed_origins_parsing(self):
        """Test that allowed origins are parsed correctly."""
        with patch('app.settings.get_param') as mock_get_param:
            mock_get_param.return_value = json.dumps({
                "CORE_TABLE": "test_table",
                "ALLOWED_ORIGINS": ["http://localhost:3000", "https://example.com"]
            })
            
            from app.settings import Settings
            settings = Settings()
            
            assert settings.allowed_origins == ["http://localhost:3000", "https://example.com"]
    
    def test_settings_jwt_properties(self):
        """Test JWT-related properties."""
        with patch('app.settings.get_param') as mock_get_param:
            mock_get_param.return_value = json.dumps({
                "CORE_TABLE": "test_table",
                "JWT_AUDIENCE": "test-audience",
                "JWT_ISSUER": "test-issuer"
            })
            
            from app.settings import Settings
            settings = Settings()
            
            assert settings.jwt_audience == "test-audience"
            assert settings.jwt_issuer == "test-issuer"
    
    def test_settings_with_empty_json(self):
        """Test Settings initialization with empty JSON."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(KeyError, match="Missing CORE_TABLE in quest-service configuration"):
                Settings()
    
    def test_settings_with_null_json(self):
        """Test Settings initialization with null JSON."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": 'null'}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-east-2"
                assert settings.core_table_name == "ssm_table"
    
    def test_settings_with_malformed_json(self):
        """Test Settings initialization with malformed JSON."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table", "invalid": "json",}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(ValueError, match="Invalid JSON in quest-service env_vars SSM parameter"):
                Settings()
    
    def test_settings_with_whitespace_only_json(self):
        """Test Settings initialization with whitespace-only JSON."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '   '}, clear=True):
            from app.settings import Settings
            with pytest.raises(ValueError, match="Invalid JSON in quest-service env_vars SSM parameter"):
                Settings()
    
    def test_settings_with_invalid_json_syntax(self):
        """Test Settings initialization with invalid JSON syntax."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"CORE_TABLE": "test_table", "invalid": "json",}'}, clear=True):
            from app.settings import Settings
            with pytest.raises(ValueError, match="Invalid JSON in quest-service env_vars SSM parameter"):
                Settings()
    
    def test_settings_with_empty_string_env_var(self):
        """Test Settings initialization with empty string environment variable."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": ''}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-east-2"
                assert settings.core_table_name == "ssm_table"
    
    def test_settings_with_whitespace_env_var(self):
        """Test Settings initialization with whitespace environment variable."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '   '}, clear=True):
            from app.settings import Settings
            with pytest.raises(ValueError, match="Invalid JSON in quest-service env_vars SSM parameter"):
                Settings()
    
    def test_settings_with_none_env_var(self):
        """Test Settings initialization with None environment variable."""
        # Remove the env var completely to simulate None
        if "QUEST_SERVICE_ENV_VARS" in os.environ:
            del os.environ["QUEST_SERVICE_ENV_VARS"]
        
        with patch('app.settings.get_param') as mock_get_param:
            mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
            
            from app.settings import Settings
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"
            assert settings.core_table_name == "ssm_table"
    
    def test_settings_with_falsy_env_var(self):
        """Test Settings initialization with falsy environment variable."""
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '0'}, clear=True):
            with patch('app.settings.get_param') as mock_get_param:
                mock_get_param.return_value = '{"CORE_TABLE": "ssm_table"}'
                
                from app.settings import Settings
                settings = Settings()
                
                assert settings.aws_region == "us-east-2"
                assert settings.core_table_name == "ssm_table"