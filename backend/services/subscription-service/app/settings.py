import os
from typing import Optional
import boto3
from botocore.exceptions import ClientError


class Settings:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "dev")
        self.settings_ssm_prefix = os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/subscription-service/")
        
        # Stripe settings - from SSM Parameter Store
        # In dev, these can be empty to use mock mode
        self.stripe_secret_key = self._get_ssm_parameter_from_path("/goalsguild/subscription-service/STRIPE_SECRET_KEY") or os.getenv("STRIPE_SECRET_KEY") or ""
        self.stripe_webhook_secret = self._get_ssm_parameter_from_path("/goalsguild/subscription-service/STRIPE_WEBHOOK_SECRET") or os.getenv("STRIPE_WEBHOOK_SECRET") or ""
        self.stripe_publishable_key = self._get_ssm_parameter_from_path("/goalsguild/subscription-service/STRIPE_PUBLISHABLE_KEY") or os.getenv("STRIPE_PUBLISHABLE_KEY") or ""
        
        # Check if we're in dev mode (will use mock Stripe)
        self.use_mock_stripe = (
            self.environment.lower() == "dev" and 
            not self.stripe_secret_key
        )
        
        # JWT settings - get from user-service SSM parameter
        self.jwt_secret = self._get_ssm_parameter_from_path("/goalsguild/user-service/JWT_SECRET") or self._get_ssm_parameter("jwt-secret") or os.getenv("JWT_SECRET")
        self.jwt_audience = self._get_ssm_parameter("jwt-audience") or os.getenv("JWT_AUDIENCE") or "api://default"
        self.jwt_issuer = self._get_ssm_parameter("jwt-issuer") or os.getenv("JWT_ISSUER") or "https://auth.local"
        
        # Cognito settings - for group management
        self.cognito_region = self._get_ssm_parameter("cognito-region") or os.getenv("COGNITO_REGION") or "us-east-2"
        self.cognito_user_pool_id = self._get_ssm_parameter_from_path("/goalsguild/cognito/user_pool_id") or os.getenv("COGNITO_USER_POOL_ID")
        
        # DynamoDB settings
        self.core_table_name = self._get_ssm_parameter("core-table") or os.getenv("CORE_TABLE") or "gg_core"
        
        # Frontend settings
        self.frontend_base_url = os.getenv("FRONTEND_BASE_URL") or "http://localhost:8080"
        self.allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else ["http://localhost:8080"]
    
    def _get_ssm_parameter(self, parameter_name: str) -> Optional[str]:
        """Get parameter from SSM Parameter Store."""
        try:
            ssm = boto3.client('ssm')
            response = ssm.get_parameter(
                Name=f"{self.settings_ssm_prefix}{parameter_name}",
                WithDecryption=True
            )
            return response['Parameter']['Value']
        except ClientError:
            return None
    
    def _get_ssm_parameter_from_path(self, parameter_path: str) -> Optional[str]:
        """Get parameter from SSM Parameter Store using full path."""
        try:
            ssm = boto3.client('ssm')
            response = ssm.get_parameter(
                Name=parameter_path,
                WithDecryption=True
            )
            return response['Parameter']['Value']
        except ClientError:
            return None

