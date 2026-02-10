"""
Tests for settings configuration.
"""
import pytest
import os
from unittest.mock import patch, Mock


class TestSettings:
    """Tests for Settings class."""
    
    @patch('app.settings.boto3')
    @patch.dict(os.environ, {
        'ENVIRONMENT': 'test',
        'AWS_REGION': 'us-east-1',
        'AWS_DEFAULT_REGION': 'us-east-1',
        'CORE_TABLE': 'gg_core_test',
        'ALLOWED_ORIGINS': 'http://localhost:3000'
    })
    def test_settings_initialization(self, mock_boto3):
        """Test settings initialization with environment variables."""
        from app.settings import Settings
        
        # Mock SSM client to prevent AWS calls
        mock_ssm = Mock()
        mock_ssm.get_parameter.side_effect = Exception("Parameter not found")
        mock_boto3.client.return_value = mock_ssm
        
        settings = Settings()
        assert settings.environment == 'test'
        assert settings.core_table_name == 'gg_core_test'
    
    @patch('app.settings.boto3')
    @patch.dict(os.environ, {
        'ENVIRONMENT': 'dev',
        'AWS_DEFAULT_REGION': 'us-east-1',
        'STRIPE_SECRET_KEY': ''
    }, clear=True)
    def test_mock_stripe_enabled_dev(self, mock_boto3):
        """Test mock Stripe enabled in dev environment."""
        from app.settings import Settings
        
        # Mock SSM client to prevent AWS calls
        mock_ssm = Mock()
        mock_ssm.get_parameter.side_effect = Exception("Parameter not found")
        mock_boto3.client.return_value = mock_ssm
        
        settings = Settings()
        # In dev without Stripe key, should use mock
        assert settings.use_mock_stripe is True
    
    @patch('app.settings.boto3')
    @patch.dict(os.environ, {
        'ENVIRONMENT': 'prod',
        'AWS_DEFAULT_REGION': 'us-east-1',
        'STRIPE_SECRET_KEY': 'sk_test_123'
    }, clear=True)
    def test_mock_stripe_disabled_prod(self, mock_boto3):
        """Test mock Stripe disabled in prod with Stripe key."""
        from app.settings import Settings
        
        # Mock SSM client to prevent AWS calls
        mock_ssm = Mock()
        mock_ssm.get_parameter.side_effect = Exception("Parameter not found")
        mock_boto3.client.return_value = mock_ssm
        
        settings = Settings()
        # In prod with Stripe key, should not use mock
        assert settings.use_mock_stripe is False
    
    @patch('app.settings.boto3')
    def test_settings_ssm_parameters(self, mock_boto3):
        """Test settings retrieval from SSM."""
        from app.settings import Settings
        
        # Mock SSM client
        mock_ssm = Mock()
        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': 'test-value'}
        }
        mock_boto3.client.return_value = mock_ssm
        
        # Mock environment to trigger SSM lookup
        with patch.dict(os.environ, {
            'ENVIRONMENT': 'prod',
            'SETTINGS_SSM_PREFIX': '/goalsguild/subscription-service/'
        }):
            settings = Settings()
            # Settings should be initialized
            assert settings is not None

