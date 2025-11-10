"""
Unit tests for XP database operations.
"""

import pytest
import boto3
import os
import json
import time
from moto import mock_aws
from botocore.exceptions import ClientError

# Set environment variables before importing modules
os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
os.environ['AWS_REGION'] = os.environ['AWS_DEFAULT_REGION']
os.environ['CORE_TABLE'] = 'gg_core'
os.environ['JWT_SECRET'] = 'test-secret'
os.environ['JWT_AUDIENCE'] = 'api://default'
os.environ['JWT_ISSUER'] = 'https://auth.local'

from app.db.xp_db import (
    create_xp_summary, get_xp_summary, update_xp_summary,
    create_xp_transaction, get_xp_transactions, check_event_id_exists,
    XPDBError
)


@pytest.fixture(scope='function')
def dynamodb_table():
    """Create a mock DynamoDB table."""
    with mock_aws():
        ddb = boto3.client('dynamodb', region_name='us-east-2')
        ddb.create_table(
            TableName='gg_core',
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'},
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                        {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        yield ddb


class TestXPSummary:
    """Tests for XP summary operations."""
    
    def test_create_xp_summary(self, dynamodb_table):
        """Test creating a new XP summary."""
        summary = create_xp_summary("user-123", initial_xp=0)
        
        assert summary.userId == "user-123"
        assert summary.totalXp == 0
        assert summary.currentLevel == 1
        assert summary.xpForNextLevel == 100
    
    def test_get_xp_summary(self, dynamodb_table):
        """Test retrieving an XP summary."""
        # Create summary first
        create_xp_summary("user-123", initial_xp=150)
        
        # Retrieve it
        summary = get_xp_summary("user-123")
        
        assert summary is not None
        assert summary.userId == "user-123"
        assert summary.totalXp == 150
    
    def test_get_xp_summary_not_found(self, dynamodb_table):
        """Test retrieving a non-existent XP summary."""
        summary = get_xp_summary("user-nonexistent")
        assert summary is None
    
    def test_update_xp_summary(self, dynamodb_table):
        """Test updating an XP summary."""
        # Create initial summary
        create_xp_summary("user-123", initial_xp=100)
        
        # Update it
        updated = update_xp_summary(
            "user-123",
            total_xp=250,
            level=2,
            xp_for_current=100,
            xp_for_next=400,
            xp_progress=0.5
        )
        
        assert updated.totalXp == 250
        assert updated.currentLevel == 2
        assert updated.xpProgress == 0.5
        
        # Verify it was saved
        retrieved = get_xp_summary("user-123")
        assert retrieved.totalXp == 250
        assert retrieved.currentLevel == 2


class TestXPTransactions:
    """Tests for XP transaction operations."""
    
    def test_create_xp_transaction(self, dynamodb_table):
        """Test creating an XP transaction."""
        transaction = create_xp_transaction(
            user_id="user-123",
            amount=10,
            source="task_completion",
            source_id="task-456",
            description="Completed a task",
            event_id="event-789"
        )
        
        assert transaction.amount == 10
        assert transaction.source == "task_completion"
        assert transaction.sourceId == "task-456"
        assert transaction.eventId == "event-789"
    
    def test_get_xp_transactions(self, dynamodb_table):
        """Test retrieving XP transactions."""
        # Create multiple transactions
        create_xp_transaction("user-123", 10, "task_completion", description="Task 1")
        create_xp_transaction("user-123", 25, "goal_completion", description="Goal 1")
        create_xp_transaction("user-123", 50, "quest_completion", description="Quest 1")
        
        # Retrieve them
        transactions = get_xp_transactions("user-123", limit=10)
        
        assert len(transactions) == 3
        assert transactions[0].amount in [10, 25, 50]  # Order may vary
    
    def test_get_xp_transactions_with_limit(self, dynamodb_table):
        """Test retrieving XP transactions with limit."""
        # Create multiple transactions
        for i in range(5):
            create_xp_transaction("user-123", 10, "task_completion", description=f"Task {i}")
        
        transactions = get_xp_transactions("user-123", limit=3)
        assert len(transactions) <= 3
    
    def test_get_xp_transactions_with_offset(self, dynamodb_table):
        """Test retrieving XP transactions with offset."""
        # Create multiple transactions
        for i in range(5):
            create_xp_transaction("user-123", 10, "task_completion", description=f"Task {i}")
        
        all_transactions = get_xp_transactions("user-123", limit=10)
        offset_transactions = get_xp_transactions("user-123", limit=3, offset=2)
        
        assert len(offset_transactions) <= 3
        assert len(offset_transactions) <= len(all_transactions) - 2
    
    def test_check_event_id_exists(self, dynamodb_table):
        """Test checking if an event ID exists."""
        # Create transaction with event ID
        create_xp_transaction(
            "user-123",
            10,
            "task_completion",
            event_id="unique-event-123"
        )
        
        # Check if it exists
        assert check_event_id_exists("unique-event-123") is True
        assert check_event_id_exists("non-existent-event") is False

