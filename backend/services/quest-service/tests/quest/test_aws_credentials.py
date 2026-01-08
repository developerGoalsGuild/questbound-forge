"""
Test AWS credentials in subprocess environment.
"""
import os
import boto3
from botocore.exceptions import ClientError

def test_aws_credentials_in_subprocess():
    """Test if AWS credentials work in subprocess environment."""
    print(f"AWS_ACCESS_KEY_ID: {os.getenv('AWS_ACCESS_KEY_ID', 'Not set')}")
    print(f"AWS_SECRET_ACCESS_KEY: {os.getenv('AWS_SECRET_ACCESS_KEY', 'Not set')}")
    print(f"AWS_SESSION_TOKEN: {os.getenv('AWS_SESSION_TOKEN', 'Not set')}")
    print(f"AWS_REGION: {os.getenv('AWS_REGION', 'Not set')}")
    
    try:
        # Test DynamoDB access
        dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
        tables = list(dynamodb.tables.all())
        print(f"Successfully accessed DynamoDB. Found {len(tables)} tables.")
        
        # Test specific table access
        table = dynamodb.Table('gg_core_temp')
        response = table.scan(Limit=1)
        print(f"Successfully scanned table. Item count: {response.get('Count', 0)}")
        
        return True
    except ClientError as e:
        print(f"DynamoDB access failed: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_aws_credentials_in_subprocess()
