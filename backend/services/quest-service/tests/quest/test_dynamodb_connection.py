"""
Test DynamoDB connection.
"""

import boto3
from botocore.exceptions import ClientError

def test_connection():
    """Test connection to local DynamoDB."""
    try:
        # Create DynamoDB client
        dynamodb = boto3.resource(
            'dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='us-east-2',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
        
        # Test connection by listing tables
        tables = list(dynamodb.tables.all())
        print(f"✅ Connected to DynamoDB. Found {len(tables)} tables.")
        
        # Try to create a test table
        table_name = "gg_core_test_local"
        
        try:
            table = dynamodb.Table(table_name)
            table.load()
            print(f"✅ Table {table_name} exists and is accessible.")
        except ClientError:
            print(f"⚠️  Table {table_name} doesn't exist yet. This is normal.")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to connect to DynamoDB: {e}")
        return False

if __name__ == "__main__":
    test_connection()
