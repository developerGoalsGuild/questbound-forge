import os
from typing import Optional
import boto3
from botocore.exceptions import ClientError

class Settings:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "dev")
        self.settings_ssm_prefix = os.getenv("SETTINGS_SSM_PREFIX", "/goalsguild/guild-service/")
        
        # JWT settings - get from user-service SSM parameter
        self.jwt_secret = self._get_ssm_parameter_from_path("/goalsguild/user-service/JWT_SECRET") or self._get_ssm_parameter("jwt-secret") or os.getenv("JWT_SECRET")
        self.jwt_audience = self._get_ssm_parameter("jwt-audience") or os.getenv("JWT_AUDIENCE") or "api://default"
        self.jwt_issuer = self._get_ssm_parameter("jwt-issuer") or os.getenv("JWT_ISSUER") or "https://auth.local"
        
        # Cognito settings - use environment variables as fallback
        self.cognito_region = self._get_ssm_parameter("cognito-region") or os.getenv("COGNITO_REGION") or "us-east-2"
        self.cognito_user_pool_id = self._get_ssm_parameter("cognito-user-pool-id") or os.getenv("COGNITO_USER_POOL_ID")
        self.cognito_client_id = self._get_ssm_parameter("cognito-client-id") or os.getenv("COGNITO_CLIENT_ID")
        
        # S3 settings
        self.guild_avatar_bucket = os.getenv("GUILD_AVATAR_BUCKET") or f"goalsguild-guild-avatars-{self.environment}"
    
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
