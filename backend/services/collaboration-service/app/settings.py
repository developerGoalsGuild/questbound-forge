"""
Settings configuration for the collaboration service.

This module handles configuration loading from environment variables and SSM parameters.
"""

import os
from typing import Optional


class Settings:
    """Settings for the collaboration service."""
    
    def __init__(self):
        """Initialize settings from environment variables."""
        self.environment = os.getenv("ENVIRONMENT", "dev")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.dynamodb_table_name = os.getenv("DYNAMODB_TABLE_NAME", "gg_core")
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        
        # Cognito settings
        self.cognito_user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
        self.cognito_user_pool_client_id = os.getenv("COGNITO_USER_POOL_CLIENT_ID")
        
        # API Gateway settings
        self.api_gateway_key = os.getenv("API_GATEWAY_KEY")
        
        # Rate limiting settings
        self.rate_limit_requests_per_hour = int(os.getenv("RATE_LIMIT_REQUESTS_PER_HOUR", "1000"))
        
        # Cache settings
        self.cache_ttl_seconds = int(os.getenv("CACHE_TTL_SECONDS", "300"))  # 5 minutes
        
        # Validation settings
        self.max_invites_per_user_per_hour = int(os.getenv("MAX_INVITES_PER_USER_PER_HOUR", "20"))
        self.max_comments_per_user_per_hour = int(os.getenv("MAX_COMMENTS_PER_USER_PER_HOUR", "100"))
    
    def get_ssm_parameter(self, parameter_name: str, default_value: Optional[str] = None) -> str:
        """
        Get SSM parameter value.
        
        Args:
            parameter_name: Name of the SSM parameter
            default_value: Default value if parameter not found
            
        Returns:
            Parameter value or default
        """
        try:
            import boto3
            ssm = boto3.client('ssm', region_name=self.aws_region)
            response = ssm.get_parameter(
                Name=f"/goalsguild/{self.environment}/{parameter_name}",
                WithDecryption=True
            )
            return response['Parameter']['Value']
        except Exception:
            if default_value is not None:
                return default_value
            raise ValueError(f"SSM parameter {parameter_name} not found and no default provided")
    
    def load_cognito_settings(self):
        """Load Cognito settings from SSM if not in environment variables."""
        if not self.cognito_user_pool_id:
            self.cognito_user_pool_id = self.get_ssm_parameter("cognito/user_pool_id")
        
        if not self.cognito_user_pool_client_id:
            self.cognito_user_pool_client_id = self.get_ssm_parameter("cognito/user_pool_client_id")
    
    def load_api_gateway_settings(self):
        """Load API Gateway settings from SSM if not in environment variables."""
        if not self.api_gateway_key:
            self.api_gateway_key = self.get_ssm_parameter("api_gateway/key")
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "dev"
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "prod"
    
    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.environment == "staging"

