"""
Tests for database operations (subscription and credit DB).
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
from botocore.exceptions import ClientError


class TestSubscriptionDB:
    """Tests for subscription database operations."""
    
    @patch('app.db.subscription_db.table')
    def test_create_subscription(self, mock_table):
        """Test subscription creation in database."""
        from app.db.subscription_db import create_subscription
        
        mock_table.put_item.return_value = {}
        
        result = create_subscription(
            user_id="test-user-123",
            subscription_id="sub_test123",
            plan_tier="INITIATE",
            stripe_customer_id="cus_test123",
            status="active",
            current_period_start="2025-01-01T00:00:00Z",
            current_period_end="2025-02-01T00:00:00Z"
        )
        
        assert result is not None
        assert result["subscriptionId"] == "sub_test123"
        mock_table.put_item.assert_called_once()
    
    @patch('app.db.subscription_db.table')
    def test_get_subscription(self, mock_table):
        """Test subscription retrieval from database."""
        from app.db.subscription_db import get_subscription
        
        # get_subscription without subscription_id uses query()
        mock_table.query.return_value = {
            "Items": [{
                "PK": "USER#test-user-123",
                "SK": "SUBSCRIPTION#sub_test123",
                "subscriptionId": "sub_test123",
                "planTier": "INITIATE",
                "status": "active"
            }]
        }
        
        result = get_subscription("test-user-123")
        
        assert result is not None
        assert result["subscriptionId"] == "sub_test123"
        assert result["planTier"] == "INITIATE"
        mock_table.query.assert_called_once()
    
    @patch('app.db.subscription_db.table')
    def test_get_subscription_not_found(self, mock_table):
        """Test subscription retrieval when not found."""
        from app.db.subscription_db import get_subscription
        
        mock_table.query.return_value = {"Items": []}
        
        result = get_subscription("test-user-123")
        
        assert result is None
    
    @patch('app.db.subscription_db.table')
    def test_update_subscription(self, mock_table):
        """Test subscription update."""
        from app.db.subscription_db import update_subscription
        
        mock_table.update_item.return_value = {
            "Attributes": {
                "subscriptionId": "sub_test123",
                "status": "canceled",
                "cancelAtPeriodEnd": True
            }
        }
        
        result = update_subscription(
            user_id="test-user-123",
            subscription_id="sub_test123",
            updates={"status": "canceled", "cancelAtPeriodEnd": True}
        )
        
        assert result is not None
        assert result["status"] == "canceled"
        mock_table.update_item.assert_called_once()


class TestCreditDB:
    """Tests for credit database operations."""
    
    @patch('app.db.credit_db.table')
    def test_get_or_create_credits(self, mock_table):
        """Test getting or creating credit record."""
        from app.db.credit_db import get_or_create_credits
        
        mock_table.get_item.return_value = {
            "Item": {
                "PK": "USER#test-user-123",
                "SK": "CREDITS#BALANCE",
                "balance": 100,
                "lastReset": "2025-01-01T00:00:00Z"
            }
        }
        
        result = get_or_create_credits("test-user-123")
        
        assert result is not None
        assert result["balance"] == 100
        mock_table.get_item.assert_called_once()
    
    @patch('app.db.credit_db.table')
    def test_get_or_create_credits_new_user(self, mock_table):
        """Test creating credit record for new user."""
        from app.db.credit_db import get_or_create_credits
        
        mock_table.get_item.return_value = {}
        mock_table.put_item.return_value = {}
        
        result = get_or_create_credits("test-user-123")
        
        assert result is not None
        assert result["balance"] == 0  # Default balance
        mock_table.put_item.assert_called_once()
    
    @patch('app.db.credit_db.table')
    def test_update_credits(self, mock_table):
        """Test credit balance update."""
        from app.db.credit_db import update_credits
        
        mock_table.update_item.return_value = {
            "Attributes": {
                "balance": 50
            }
        }
        
        result = update_credits("test-user-123", 50, operation="add")
        
        assert result is not None
        assert result["balance"] == 50
        mock_table.update_item.assert_called_once()
    
    @patch('app.db.credit_db.table')
    def test_consume_credits_success(self, mock_table):
        """Test successful credit consumption."""
        from app.db.credit_db import consume_credits
        
        # First get_or_create_credits call
        mock_table.get_item.return_value = {
            "Item": {"balance": 60}
        }
        # Then update_item call
        mock_table.update_item.return_value = {
            "Attributes": {
                "balance": 50  # After consuming 10
            }
        }
        
        result = consume_credits("test-user-123", "video_generation", 10)
        
        assert result is not None
        assert result["success"] is True
        assert result["remaining_balance"] == 50
        mock_table.update_item.assert_called_once()
    
    @patch('app.db.credit_db.table')
    def test_consume_credits_insufficient(self, mock_table):
        """Test credit consumption with insufficient balance."""
        from app.db.credit_db import consume_credits
        
        # First get_or_create_credits call
        mock_table.get_item.return_value = {
            "Item": {"balance": 5}
        }
        # Simulate ConditionalCheckFailedException
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        mock_table.update_item.side_effect = error
        
        result = consume_credits("test-user-123", "video_generation", 1000)
        
        assert result is not None
        assert result["success"] is False
        assert "insufficient" in result["message"].lower() or "balance" in result["message"].lower()

