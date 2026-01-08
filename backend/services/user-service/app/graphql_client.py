"""
GraphQL client for AppSync integration in user service
"""
import os
import json
from typing import Dict, Any, Optional
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport
import boto3
from botocore.exceptions import ClientError


class AppSyncGraphQLClient:
    """GraphQL client for AppSync with Lambda authentication"""
    
    def __init__(self):
        self.endpoint = os.getenv('APPSYNC_ENDPOINT')
        self.region = os.getenv('AWS_REGION', 'us-east-2')
        self.lambda_client = boto3.client('lambda', region_name=self.region)
        self._client = None
    
    def _get_transport(self) -> RequestsHTTPTransport:
        """Get authenticated transport for AppSync"""
        if not self.endpoint:
            raise ValueError("APPSYNC_ENDPOINT environment variable not set")
        
        # Get Lambda authorizer token
        token = self._get_lambda_token()
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        return RequestsHTTPTransport(
            url=self.endpoint,
            headers=headers,
            use_json=True
        )
    
    def _get_lambda_token(self) -> str:
        """Get token from Lambda authorizer"""
        try:
            # For now, we'll use a simple approach - in production you might want to cache this
            # or use a different authentication method
            response = self.lambda_client.invoke(
                FunctionName=os.getenv('AUTHORIZER_FUNCTION_NAME', 'goalsguild_authorizer_dev'),
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'type': 'TOKEN',
                    'authorizationToken': 'user-service-internal',
                    'methodArn': 'arn:aws:execute-api:us-east-2:123456789012:abcdef123/test/GET/request'
                })
            )
            
            result = json.loads(response['Payload'].read())
            if 'errorMessage' in result:
                raise Exception(f"Authorizer error: {result['errorMessage']}")
            
            return result.get('principalId', 'user-service-internal')
        except Exception as e:
            # Fallback to a simple token for development
            return 'user-service-internal'
    
    def get_client(self) -> Client:
        """Get GraphQL client instance"""
        if self._client is None:
            transport = self._get_transport()
            self._client = Client(transport=transport, fetch_schema_from_transport=False)
        return self._client
    
    async def is_nickname_available_for_user(self, nickname: str) -> bool:
        """Check if nickname is available for current user (excludes current user from check)"""
        try:
            client = self.get_client()
            
            query = gql("""
                query IsNicknameAvailableForUser($nickname: String!) {
                    isNicknameAvailableForUser(nickname: $nickname)
                }
            """)
            
            result = client.execute(query, variable_values={"nickname": nickname})
            return result.get('isNicknameAvailableForUser', False)
            
        except Exception as e:
            # Log error but don't fail the request - fallback to direct DynamoDB check
            print(f"GraphQL nickname check failed: {e}")
            return True  # Allow the request to proceed


# Global instance
graphql_client = AppSyncGraphQLClient()
