"""
Unit tests for invitation database operations.

This module tests the invite database operations with mocked DynamoDB.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from uuid import uuid4

from app.db.invite_db import (
    create_invite,
    get_invite,
    list_user_invites,
    accept_invite,
    decline_invite,
    check_duplicate_invite,
    CollaborationInviteDBError,
    CollaborationInviteNotFoundError,
    CollaborationInvitePermissionError,
    CollaborationInviteValidationError
)
from app.models.invite import InviteCreatePayload


class TestInviteDatabaseOperations:
    """Test invitation database operations."""
    
    @pytest.fixture
    def mock_settings(self):
        """Mock settings for testing."""
        with patch('app.db.invite_db._get_settings') as mock:
            mock_settings = Mock()
            mock_settings.aws_region = "us-east-1"
            mock_settings.dynamodb_table_name = "gg_core"
            mock.return_value = mock_settings
            yield mock_settings
    
    @pytest.fixture
    def mock_table(self):
        """Mock DynamoDB table."""
        with patch('app.db.invite_db._get_dynamodb_table') as mock:
            table = Mock()
            mock.return_value = table
            yield table
    
    @pytest.fixture
    def sample_payload(self):
        """Sample invitation payload."""
        return InviteCreatePayload(
            resource_type="goal",
            resource_id="goal-123",
            invitee_identifier="user@example.com",
            message="Would you like to collaborate on this goal?"
        )
    
    def test_create_invite_success(self, mock_settings, mock_table, sample_payload):
        """Test successful invite creation."""
        # Mock table.put_item
        mock_table.put_item.return_value = {}
        
        # Mock logger
        with patch('app.db.invite_db.logger'):
            result = create_invite("user-123", sample_payload)
        
        # Verify result
        assert result.inviter_id == "user-123"
        assert result.resource_type == "goal"
        assert result.resource_id == "goal-123"
        assert result.status == "pending"
        assert result.message == "Would you like to collaborate on this goal?"
        
        # Verify DynamoDB call
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        item = call_args[1]["Item"]
        
        assert item["type"] == "CollaborationInvite"
        assert item["inviterId"] == "user-123"
        assert item["resourceType"] == "goal"
        assert item["resourceId"] == "goal-123"
        assert item["status"] == "pending"
        assert "ttl" in item  # TTL should be set
    
    def test_create_invite_validation_error(self, mock_settings, mock_table):
        """Test invite creation with validation error."""
        # Invalid payload - this should fail at the Pydantic validation level
        with pytest.raises(Exception):  # Should raise validation error
            invalid_payload = InviteCreatePayload(
                resource_type="invalid",  # Invalid resource type
                resource_id="goal-123",
                invitee_identifier="user@example.com"
            )
    
    def test_get_invite_success(self, mock_settings, mock_table):
        """Test successful invite retrieval."""
        # Mock scan response
        mock_item = {
            "inviteId": "inv-123",
            "inviterId": "user-123",
            "inviteeId": "user-456",
            "resourceType": "goal",
            "resourceId": "goal-123",
            "status": "pending",
            "message": "Test message",
            "expiresAt": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        mock_table.scan.return_value = {"Items": [mock_item]}
        
        with patch('app.db.invite_db.logger'):
            result = get_invite("inv-123")
        
        assert result.invite_id == "inv-123"
        assert result.inviter_id == "user-123"
        assert result.resource_type == "goal"
        assert result.status == "pending"
    
    def test_get_invite_not_found(self, mock_settings, mock_table):
        """Test invite retrieval when invite not found."""
        # Mock empty scan response
        mock_table.scan.return_value = {"Items": []}
        
        with patch('app.db.invite_db.logger'):
            with pytest.raises(CollaborationInviteNotFoundError):
                get_invite("nonexistent-invite")
    
    def test_list_user_invites_success(self, mock_settings, mock_table):
        """Test successful user invites listing."""
        # Mock query response
        mock_items = [
            {
                "inviteId": "inv-123",
                "inviterId": "user-123",
                "inviteeId": "user-456",
                "resourceType": "goal",
                "resourceId": "goal-123",
                "status": "pending",
                "expiresAt": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
        ]
        
        mock_table.query.return_value = {"Items": mock_items}
        
        with patch('app.db.invite_db.logger'):
            result = list_user_invites("user-456")
        
        assert len(result.invites) == 1
        assert result.invites[0].invite_id == "inv-123"
        assert result.total_count == 1
    
    def test_accept_invite_success(self, mock_settings, mock_table):
        """Test successful invite acceptance."""
        # Mock get_invite response
        mock_invite = Mock()
        mock_invite.invitee_id = "user-456"
        mock_invite.status = "pending"
        mock_invite.expires_at = datetime.utcnow() + timedelta(days=30)
        mock_invite.resource_type = "goal"
        mock_invite.resource_id = "goal-123"
        
        # Mock update_item response
        mock_table.update_item.return_value = {}
        
        with patch('app.db.invite_db.get_invite', return_value=mock_invite), \
             patch('app.db.invite_db.logger'):
            result = accept_invite("user-456", "inv-123")
        
        assert result.status == "accepted"
        mock_table.update_item.assert_called_once()
    
    def test_accept_invite_wrong_user(self, mock_settings, mock_table):
        """Test accepting invite with wrong user."""
        # Mock get_invite response
        mock_invite = Mock()
        mock_invite.invitee_id = "user-456"
        mock_invite.status = "pending"
        mock_invite.expires_at = datetime.utcnow() + timedelta(days=30)
        
        with patch('app.db.invite_db.get_invite', return_value=mock_invite):
            with pytest.raises(CollaborationInvitePermissionError):
                accept_invite("wrong-user", "inv-123")
    
    def test_accept_invite_already_processed(self, mock_settings, mock_table):
        """Test accepting already processed invite."""
        # Mock get_invite response
        mock_invite = Mock()
        mock_invite.invitee_id = "user-456"
        mock_invite.status = "accepted"  # Already accepted
        mock_invite.expires_at = datetime.utcnow() + timedelta(days=30)
        
        with patch('app.db.invite_db.get_invite', return_value=mock_invite):
            with pytest.raises(CollaborationInviteValidationError):
                accept_invite("user-456", "inv-123")
    
    def test_accept_invite_expired(self, mock_settings, mock_table):
        """Test accepting expired invite."""
        # Mock get_invite response
        mock_invite = Mock()
        mock_invite.invitee_id = "user-456"
        mock_invite.status = "pending"
        mock_invite.expires_at = datetime.utcnow() - timedelta(days=1)  # Expired
        
        with patch('app.db.invite_db.get_invite', return_value=mock_invite):
            with pytest.raises(CollaborationInviteValidationError):
                accept_invite("user-456", "inv-123")
    
    def test_decline_invite_success(self, mock_settings, mock_table):
        """Test successful invite decline."""
        # Mock get_invite response
        mock_invite = Mock()
        mock_invite.invitee_id = "user-456"
        mock_invite.status = "pending"
        mock_invite.resource_type = "goal"
        mock_invite.resource_id = "goal-123"
        
        # Mock update_item response
        mock_table.update_item.return_value = {}
        
        with patch('app.db.invite_db.get_invite', return_value=mock_invite), \
             patch('app.db.invite_db.logger'):
            result = decline_invite("user-456", "inv-123")
        
        assert result.status == "declined"
        mock_table.update_item.assert_called_once()
    
    def test_check_duplicate_invite_exists(self, mock_settings, mock_table):
        """Test checking for duplicate invite when one exists."""
        # Mock query response with existing invite
        mock_table.query.return_value = {
            "Items": [{"inviteId": "existing-invite"}]
        }
        
        with patch('app.db.invite_db.logger'):
            result = check_duplicate_invite("goal", "goal-123", "user-456")
        
        assert result is True
    
    def test_check_duplicate_invite_not_exists(self, mock_settings, mock_table):
        """Test checking for duplicate invite when none exists."""
        # Mock empty query response
        mock_table.query.return_value = {"Items": []}
        
        with patch('app.db.invite_db.logger'):
            result = check_duplicate_invite("goal", "goal-123", "user-456")
        
        assert result is False


if __name__ == "__main__":
    pytest.main([__file__])
