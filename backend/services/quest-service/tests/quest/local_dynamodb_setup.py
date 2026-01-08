"""
Local DynamoDB Setup for Performance Testing.

This module sets up a local DynamoDB instance using Docker
and creates the necessary tables for quest service testing.
"""

import subprocess
import time
import boto3
from botocore.exceptions import ClientError
import json
import os
from pathlib import Path

class LocalDynamoDBSetup:
    """Manages local DynamoDB setup for testing."""
    
    def __init__(self):
        self.container_name = "quest-test-dynamodb"
        self.port = 8000
        self.endpoint_url = f"http://localhost:{self.port}"
        self.region = "us-east-2"
        self.table_name = "gg_core_test_local"
        
    def start_local_dynamodb(self):
        """Start local DynamoDB container."""
        print("Starting local DynamoDB container...")
        
        # Stop existing container if running
        self.stop_local_dynamodb()
        
        # Start new container
        cmd = [
            "docker", "run", "-d",
            "--name", self.container_name,
            "-p", f"{self.port}:8000",
            "amazon/dynamodb-local:latest",
            "-jar", "DynamoDBLocal.jar",
            "-sharedDb",
            "-inMemory"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"Container started: {result.stdout.strip()}")
            
            # Wait for DynamoDB to be ready
            self._wait_for_dynamodb()
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Failed to start DynamoDB container: {e}")
            print(f"Error: {e.stderr}")
            return False
    
    def _wait_for_dynamodb(self, max_attempts=30):
        """Wait for DynamoDB to be ready."""
        print("Waiting for DynamoDB to be ready...")
        
        for attempt in range(max_attempts):
            try:
                dynamodb = boto3.resource(
                    'dynamodb',
                    endpoint_url=self.endpoint_url,
                    region_name=self.region,
                    aws_access_key_id='dummy',
                    aws_secret_access_key='dummy'
                )
                
                # Try to list tables
                tables = list(dynamodb.tables.all())
                print("DynamoDB is ready!")
                return True
                
            except Exception as e:
                if attempt < max_attempts - 1:
                    time.sleep(1)
                    print(f"Attempt {attempt + 1}/{max_attempts}...")
                else:
                    print(f"DynamoDB not ready after {max_attempts} attempts: {e}")
                    return False
        
        return False
    
    def create_test_table(self):
        """Create the test table with proper schema."""
        print(f"Creating table: {self.table_name}")
        
        try:
            dynamodb = boto3.resource(
                'dynamodb',
                endpoint_url=self.endpoint_url,
                region_name=self.region,
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy'
            )
            
            # Check if table exists
            try:
                table = dynamodb.Table(self.table_name)
                table.load()
                print(f"Table {self.table_name} already exists")
                return True
            except ClientError:
                # Table doesn't exist, create it
                pass
            
            # Create table
            table = dynamodb.create_table(
                TableName=self.table_name,
                KeySchema=[
                    {
                        'AttributeName': 'PK',
                        'KeyType': 'HASH'
                    },
                    {
                        'AttributeName': 'SK',
                        'KeyType': 'RANGE'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'PK',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'SK',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'GSI1PK',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'GSI1SK',
                        'AttributeType': 'S'
                    }
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'GSI1',
                        'KeySchema': [
                            {
                                'AttributeName': 'GSI1PK',
                                'KeyType': 'HASH'
                            },
                            {
                                'AttributeName': 'GSI1SK',
                                'KeyType': 'RANGE'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                ],
                BillingMode='PROVISIONED',
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            
            # Wait for table to be active
            table.wait_until_exists()
            print(f"Table {self.table_name} created successfully")
            return True
            
        except Exception as e:
            print(f"Failed to create table: {e}")
            return False
    
    def get_dynamodb_client(self):
        """Get DynamoDB client for local instance."""
        return boto3.client(
            'dynamodb',
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    
    def get_dynamodb_resource(self):
        """Get DynamoDB resource for local instance."""
        return boto3.resource(
            'dynamodb',
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    
    def stop_local_dynamodb(self):
        """Stop local DynamoDB container."""
        print("Stopping local DynamoDB container...")
        
        try:
            # Stop container
            subprocess.run(
                ["docker", "stop", self.container_name],
                capture_output=True,
                text=True
            )
            
            # Remove container
            subprocess.run(
                ["docker", "rm", self.container_name],
                capture_output=True,
                text=True
            )
            
            print("Local DynamoDB stopped")
            return True
            
        except Exception as e:
            print(f"Error stopping DynamoDB: {e}")
            return False
    
    def cleanup(self):
        """Clean up local DynamoDB setup."""
        print("Cleaning up local DynamoDB...")
        self.stop_local_dynamodb()

def main():
    """Main function to set up local DynamoDB."""
    setup = LocalDynamoDBSetup()
    
    try:
        # Start DynamoDB
        if not setup.start_local_dynamodb():
            print("Failed to start local DynamoDB")
            return False
        
        # Create table
        if not setup.create_test_table():
            print("Failed to create test table")
            return False
        
        print("Local DynamoDB setup complete!")
        print(f"Endpoint: {setup.endpoint_url}")
        print(f"Table: {setup.table_name}")
        print("Press Ctrl+C to stop...")
        
        # Keep running until interrupted
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
            setup.cleanup()
        
        return True
        
    except Exception as e:
        print(f"Setup failed: {e}")
        setup.cleanup()
        return False

if __name__ == "__main__":
    main()
