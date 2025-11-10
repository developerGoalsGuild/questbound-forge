"""
Tests for database operations (subscription and credit DB).
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
from botocore.exceptions import ClientError


class TestSubscriptionDB:
    """Tests for subscription database operations."""
    
    @patch('app.db.subscription_db.dynamodb')
    def test_create_subscription(self, mock_dynamodb):
        """Test subscription creation in database."""
        from app.db.subscription_db import create_subscription
        
        mock_table = Mock()
        mock_table.put_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
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
        mock_table.put_item.assert_called_once()
    
    @patch('app.db.subscription_db.dynamodb')
    def test_get_subscription(self, mock_dynamodb):
        """Test subscription retrieval from database."""
        from app.db.subscription_db import get_subscription
        
        mock_table = Mock()
        mock_table.get_item.return_value = {
            "Item": {
                "PK": "USER#test-user-123",
                "SK": "SUBSCRIPTION#active",
                "subscription_id": "sub_test123",
                "plan_tier": "INITIATE",
                "status": "active"
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        result = get_subscription("test-user-123")
        
        assert result is not None
        assert result["subscription_id"] == "sub_test123"
        assert result["plan_tier"] == "INITIATE"
        mock_table.get_item.assert_called_once()
    
    @patch('app.db.subscription_db.dynamodb')
    def test_get_subscription_not_found(self, mock_dynamodb):
        """Test subscription retrieval when not found."""
        from app.db.subscription_db import get_subscription
        
        mock_table = Mock()
        mock_table.get_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        result = get_subscription("test-user-123")
        
        assert result is None
    
    @patch('app.db.subscription_db.dynamodb')
    def test_update_subscription(self, mock_dynamodb):
        """Test subscription update."""
        from app.db.subscription_db import update_subscription
        
        mock_table = Mock()
        mock_table.update_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        result = update_subscription(
            user_id="test-user-123",
            status="canceled",
            cancel_at_period_end=True
        )
        
        assert result is not None
        mock_table.update_item.assert_called_once()
    
    @patch('app.db.subscription_db.dynamodb')
    def test_cancel_subscription(self, mock_dynamodb):
        """Test subscription cancellation."""
        from app.db.subscription_db import cancel_subscription
        
        mock_table = Mock()
        mock_table.update_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        result = cancel_subscription("test-user-123")
        
        assert result is not None
        mock_table.update_item.assert_called_once()


class TestCreditDB:
    """Tests for credit database operations."""
    
    @patch('app.db.credit_db.dynamodb')
    def test_get_or_create_credits(self, mock_dynamodb):
        """Test getting or creating credit record."""
        from app.db.credit_db import get_or_create_credits
        
        mock_table = Mock()
        mock_table.get_item.return_value = {
            "Item": {
                "PK": "USER#test-user-123",
                "SK": "CREDITS",
                "balance": 100,
                "last_reset": "2025-01-01T00:00:00Z"
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        result = get_or_create_credits("test-user-123")
        
        assert result is not None
        assert result["balance"] == 100
        mock_table.get_item.assert_called_once()
    
    @patch('app.db.credit_db.dynamodb')
    def test_get_or_create_credits_new_user(self, mock_dynamodb):
        """Test creating credit record for new user."""
        from app.db.credit_db import get_or_create_credits
        
        mock_table = Mock()
        mock_table.get_item.return_value = {}
        mock_table.put_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        result = get_or_create_credits("test-user-123")
        
        assert result is not None
        assert result["balance"] == 0  # Default balance
        mock_table.put_item.assert_called_once()
    
    @patch('app.db.credit_db.dynamodb')
    def test_update_credits(self, mock_dynamodb):
        """Test credit balance update."""
        from app.db.credit_db import update_credits
        
        mock_table = Mock()
        mock_table.update_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table
        
        result = update_credits("test-user-123", 50)
        
        assert result is not None
        mock_table.update_item.assert_called_once()
    
    @patch('app.db.credit_db.dynamodb')
    def test_consume_credits_success(self, mock_dynamodb):
        """Test successful credit consumption."""
        from app.db.credit_db import consume_credits
        
        mock_table = Mock()
        mock_table.update_item.return_value = {
            "Attributes": {
                "balance": 50  # After consuming
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        result = consume_credits("test-user-123", "video_generation", 10)
        
        assert result is not None
        assert result["success"] is True
        assert result["remaining_balance"] == 50
        mock_table.update_item.assert_called_once()
    
    @patch('app.db.credit_db.dynamodb')
    def test_consume_credits_insufficient(self, mock_dynamodb):
        """Test credit consumption with insufficient balance."""
        from app.db.credit_db import consume_credits
        
        mock_table = Mock()
        # Simulate ConditionalCheckFailedException
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        mock_table.update_item.side_effect = error
        mock_dynamodb.Table.return_value = mock_table
        
        result = consume_credits("test-user-123", "video_generation", 1000)
        
        assert result is not None
        assert result["success"] is False
        assert "insufficient" in result["message"].lower() or "balance" in result["message"].lower()

