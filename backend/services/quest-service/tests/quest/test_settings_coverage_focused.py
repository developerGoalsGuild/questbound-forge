"""
Focused Settings Tests for Quest Service Coverage.

This module provides targeted unit tests for settings.py to achieve 90% coverage.
"""

import pytest
import os
from unittest.mock import patch, Mock, MagicMock
from botocore.exceptions import ClientError

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from app.settings import Settings, get_settings


class TestSettingsBasicCoverage:
    """Test Settings class for basic coverage."""
    
    def test_settings_default_values(self):
        """Test settings with default values."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter retrieval
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-2'}},  # AWS_REGION
                {'Parameter': {'Value': 'gg_core'}}     # CORE_TABLE
            ]
            
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"
            assert settings.core_table == "gg_core"
            assert settings.jwt_secret is None
            assert settings.allowed_origins == ["http://localhost:3000", "http://localhost:8080"]
            assert settings.cors_allow_credentials is True
            assert settings.cors_allow_headers == ["*"]
            assert settings.cors_allow_methods == ["*"]
            assert settings.cors_max_age == 600
    
    def test_settings_with_environment_variables(self):
        """Test settings with environment variables."""
        with patch.dict(os.environ, {
            'AWS_REGION': 'us-west-2',
            'CORE_TABLE': 'gg_core_test',
            'QUEST_SERVICE_JWT_SECRET': 'test-jwt-secret',
            'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com',
            'CORS_ALLOW_CREDENTIALS': 'false',
            'CORS_ALLOW_HEADERS': 'Content-Type,Authorization',
            'CORS_ALLOW_METHODS': 'GET,POST,PUT,DELETE',
            'CORS_MAX_AGE': '300'
        }):
            with patch('app.settings.boto3.client') as mock_client:
                # Mock SSM client (shouldn't be called due to env vars)
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                
                settings = Settings()
                
                assert settings.aws_region == "us-west-2"
                assert settings.core_table == "gg_core_test"
                assert settings.jwt_secret == "test-jwt-secret"
                assert settings.allowed_origins == ["http://localhost:3000", "https://example.com"]
                assert settings.cors_allow_credentials is False
                assert settings.cors_allow_headers == ["Content-Type", "Authorization"]
                assert settings.cors_allow_methods == ["GET", "POST", "PUT", "DELETE"]
                assert settings.cors_max_age == 300
    
    def test_settings_ssm_parameter_retrieval(self):
        """Test settings with SSM parameter retrieval."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter retrieval
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-1'}},  # AWS_REGION
                {'Parameter': {'Value': 'gg_core_prod'}} # CORE_TABLE
            ]
            
            settings = Settings()
            
            assert settings.aws_region == "us-east-1"
            assert settings.core_table == "gg_core_prod"
            
            # Verify SSM calls
            assert mock_ssm.get_parameter.call_count == 2
            mock_ssm.get_parameter.assert_any_call(
                Name='/goalsguild/quest-service/aws-region',
                WithDecryption=True
            )
            mock_ssm.get_parameter.assert_any_call(
                Name='/goalsguild/quest-service/core-table',
                WithDecryption=True
            )
    
    def test_settings_ssm_parameter_error(self):
        """Test settings with SSM parameter error."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter error
            mock_ssm.get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound'}},
                'GetParameter'
            )
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
    
    def test_settings_ssm_partial_error(self):
        """Test settings with partial SSM parameter error."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock partial SSM parameter retrieval
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-west-1'}},  # AWS_REGION success
                ClientError(                              # CORE_TABLE error
                    {'Error': {'Code': 'ParameterNotFound'}},
                    'GetParameter'
                )
            ]
            
            settings = Settings()
            
            assert settings.aws_region == "us-west-1"  # From SSM
            assert settings.core_table == "gg_core"    # Default fallback
    
    def test_settings_jwt_secret_priority(self):
        """Test JWT secret priority (env var > SSM > None)."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter retrieval (no JWT secret)
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-2'}},  # AWS_REGION
                {'Parameter': {'Value': 'gg_core'}}     # CORE_TABLE
            ]
            
            # Test with environment variable
            with patch.dict(os.environ, {'QUEST_SERVICE_JWT_SECRET': 'env-jwt-secret'}):
                settings = Settings()
                assert settings.jwt_secret == "env-jwt-secret"
            
            # Test without environment variable (should be None)
            with patch.dict(os.environ, {}, clear=True):
                settings = Settings()
                assert settings.jwt_secret is None
    
    def test_settings_jwt_secret_from_ssm(self):
        """Test JWT secret retrieval from SSM."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter retrieval including JWT secret
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-2'}},  # AWS_REGION
                {'Parameter': {'Value': 'gg_core'}},    # CORE_TABLE
                {'Parameter': {'Value': 'ssm-jwt-secret'}} # JWT_SECRET
            ]
            
            settings = Settings()
            
            assert settings.jwt_secret == "ssm-jwt-secret"
            
            # Verify SSM calls
            assert mock_ssm.get_parameter.call_count == 3
            mock_ssm.get_parameter.assert_any_call(
                Name='/goalsguild/quest-service/jwt-secret',
                WithDecryption=True
            )
    
    def test_settings_allowed_origins_parsing(self):
        """Test allowed origins parsing from environment variable."""
        with patch.dict(os.environ, {
            'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com,https://app.example.com'
        }):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                assert settings.allowed_origins == [
                    "http://localhost:3000",
                    "https://example.com",
                    "https://app.example.com"
                ]
    
    def test_settings_cors_boolean_parsing(self):
        """Test CORS boolean parsing from environment variable."""
        with patch.dict(os.environ, {
            'CORS_ALLOW_CREDENTIALS': 'true'
        }):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                # Test true value
                assert settings.cors_allow_credentials is True
                
                # Test false value
                with patch.dict(os.environ, {'CORS_ALLOW_CREDENTIALS': 'false'}):
                    settings = Settings()
                    assert settings.cors_allow_credentials is False
                
                # Test invalid value (should default to True)
                with patch.dict(os.environ, {'CORS_ALLOW_CREDENTIALS': 'invalid'}):
                    settings = Settings()
                    assert settings.cors_allow_credentials is True
    
    def test_settings_cors_max_age_parsing(self):
        """Test CORS max age parsing from environment variable."""
        with patch.dict(os.environ, {'CORS_MAX_AGE': '1200'}):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                assert settings.cors_max_age == 1200
    
    def test_settings_cors_max_age_invalid(self):
        """Test CORS max age with invalid value."""
        with patch.dict(os.environ, {'CORS_MAX_AGE': 'invalid'}):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                # Should fall back to default
                assert settings.cors_max_age == 600
    
    def test_settings_ssm_client_error(self):
        """Test settings with SSM client creation error."""
        with patch('app.settings.boto3.client', side_effect=Exception("SSM client error")):
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_decryption_error(self):
        """Test settings with SSM parameter decryption error."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter decryption error
            mock_ssm.get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'AccessDenied'}},
                'GetParameter'
            )
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_timeout(self):
        """Test settings with SSM parameter timeout."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter timeout
            mock_ssm.get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'RequestTimeout'}},
                'GetParameter'
            )
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_throttling(self):
        """Test settings with SSM parameter throttling."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock SSM parameter throttling
            mock_ssm.get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ThrottlingException'}},
                'GetParameter'
            )
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_invalid_response(self):
        """Test settings with invalid SSM parameter response."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock invalid SSM parameter response
            mock_ssm.get_parameter.return_value = {
                'Parameter': {'Value': None}  # Invalid value
            }
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_missing_value(self):
        """Test settings with missing SSM parameter value."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock missing SSM parameter value
            mock_ssm.get_parameter.return_value = {
                'Parameter': {}  # Missing Value key
            }
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None
    
    def test_settings_ssm_parameter_missing_parameter(self):
        """Test settings with missing SSM parameter."""
        with patch('app.settings.boto3.client') as mock_client:
            # Mock SSM client
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            
            # Mock missing SSM parameter
            mock_ssm.get_parameter.return_value = {}  # Missing Parameter key
            
            # Should fall back to defaults
            settings = Settings()
            
            assert settings.aws_region == "us-east-2"  # Default
            assert settings.core_table == "gg_core"    # Default
            assert settings.jwt_secret is None


class TestGetSettingsCoverage:
    """Test get_settings function for coverage."""
    
    def test_get_settings_singleton(self):
        """Test get_settings returns singleton instance."""
        with patch('app.settings.boto3.client') as mock_client:
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-2'}},
                {'Parameter': {'Value': 'gg_core'}}
            ]
            
            settings1 = get_settings()
            settings2 = get_settings()
            
            assert settings1 is settings2
    
    def test_get_settings_multiple_calls(self):
        """Test get_settings with multiple calls."""
        with patch('app.settings.boto3.client') as mock_client:
            mock_ssm = Mock()
            mock_client.return_value = mock_ssm
            mock_ssm.get_parameter.side_effect = [
                {'Parameter': {'Value': 'us-east-2'}},
                {'Parameter': {'Value': 'gg_core'}}
            ]
            
            # First call
            settings1 = get_settings()
            assert settings1.aws_region == "us-east-2"
            
            # Second call (should return same instance)
            settings2 = get_settings()
            assert settings2.aws_region == "us-east-2"
            assert settings1 is settings2
            
            # SSM should only be called once due to caching
            assert mock_ssm.get_parameter.call_count == 2  # Only for first call


class TestSettingsEdgeCasesCoverage:
    """Test settings edge cases and error handling for coverage."""
    
    def test_settings_empty_environment_variables(self):
        """Test settings with empty environment variables."""
        with patch.dict(os.environ, {
            'AWS_REGION': '',
            'CORE_TABLE': '',
            'QUEST_SERVICE_JWT_SECRET': '',
            'ALLOWED_ORIGINS': '',
            'CORS_ALLOW_CREDENTIALS': '',
            'CORS_ALLOW_HEADERS': '',
            'CORS_ALLOW_METHODS': '',
            'CORS_MAX_AGE': ''
        }):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                # Should fall back to defaults
                assert settings.aws_region == "us-east-2"  # Default
                assert settings.core_table == "gg_core"    # Default
                assert settings.jwt_secret is None
                assert settings.allowed_origins == ["http://localhost:3000", "http://localhost:8080"]
                assert settings.cors_allow_credentials is True
                assert settings.cors_allow_headers == ["*"]
                assert settings.cors_allow_methods == ["*"]
                assert settings.cors_max_age == 600
    
    def test_settings_whitespace_environment_variables(self):
        """Test settings with whitespace environment variables."""
        with patch.dict(os.environ, {
            'AWS_REGION': '  us-west-2  ',
            'CORE_TABLE': '  gg_core_test  ',
            'ALLOWED_ORIGINS': '  http://localhost:3000 , https://example.com  '
        }):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                assert settings.aws_region == "  us-west-2  "  # Not trimmed
                assert settings.core_table == "  gg_core_test  "  # Not trimmed
                assert settings.allowed_origins == ["http://localhost:3000", "https://example.com"]  # Trimmed
    
    def test_settings_special_characters_in_environment_variables(self):
        """Test settings with special characters in environment variables."""
        with patch.dict(os.environ, {
            'AWS_REGION': 'us-east-2',
            'CORE_TABLE': 'gg_core_test',
            'ALLOWED_ORIGINS': 'http://localhost:3000,https://example.com:8080,https://sub.example.com'
        }):
            with patch('app.settings.boto3.client') as mock_client:
                mock_ssm = Mock()
                mock_client.return_value = mock_ssm
                mock_ssm.get_parameter.side_effect = [
                    {'Parameter': {'Value': 'us-east-2'}},
                    {'Parameter': {'Value': 'gg_core'}}
                ]
                
                settings = Settings()
                
                assert settings.allowed_origins == [
                    "http://localhost:3000",
                    "https://example.com:8080",
                    "https://sub.example.com"
                ]
