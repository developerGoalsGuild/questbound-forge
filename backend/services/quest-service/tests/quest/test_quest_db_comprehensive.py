"""
Comprehensive Quest Database Tests for Maximum Coverage.

This module provides extensive tests for the quest_db module using proper mocking.
"""

import pytest
import os
from unittest.mock import patch, Mock, MagicMock
from botocore.exceptions import ClientError

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from app.db.quest_db import (
    _get_dynamodb_table, _get_settings, create_quest, get_quest, 
    update_quest, change_quest_status, delete_quest, list_user_quests,
    QuestNotFoundError, QuestDBError, QuestVersionConflictError, QuestPermissionError
)
from app.models.quest import QuestCreatePayload, QuestUpdatePayload


class TestQuestDatabaseComprehensive:
    """Comprehensive tests for Quest database operations with mocking."""
    
    @patch('app.db.quest_db._get_settings')
    def test_get_dynamodb_table_success(self, mock_get_settings):
        """Test successful DynamoDB table retrieval."""
        # Mock settings
        mock_settings = Mock()
        mock_settings.aws_region = "us-east-2"
        mock_settings.core_table_name = "gg_core_temp"
        mock_get_settings.return_value = mock_settings
        
        # Mock boto3 and DynamoDB resource and table
        with patch('boto3.resource') as mock_boto3_resource:
            mock_table = Mock()
            mock_resource = Mock()
            mock_resource.Table.return_value = mock_table
            mock_boto3_resource.return_value = mock_resource
            
            # Call function
            result = _get_dynamodb_table()
            
            # Assertions
            assert result == mock_table
            mock_boto3_resource.assert_called_once_with('dynamodb', region_name="us-east-2")
            mock_resource.Table.assert_called_once_with("gg_core_temp")
    
    @patch('app.db.quest_db.Settings')
    def test_get_settings_success(self, mock_settings_class):
        """Test successful settings retrieval."""
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        
        result = _get_settings()
        
        assert result == mock_settings
        mock_settings_class.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_success(self, mock_get_table):
        """Test successful quest creation."""
        # Mock table and response
        mock_table = Mock()
        mock_table.put_item.return_value = {}
        mock_get_table.return_value = mock_table
        
        # Test data
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        
        # Call function
        result = create_quest(user_id, payload)
        
        # Assertions
        assert hasattr(result, 'id')  # QuestResponse object
        assert result.userId == user_id
        assert result.title == "Test Quest"
        mock_table.put_item.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_success(self, mock_get_table):
        """Test successful quest retrieval."""
        # Mock table and response with correct DynamoDB item structure
        mock_table = Mock()
        mock_item = {
            "id": "quest-123",
            "userId": "user-123",
            "title": "Test Quest",
            "status": "draft",
            "difficulty": "easy",
            "rewardXp": 50,
            "category": "Health",
            "privacy": "private",
            "kind": "linked",  # Required field
            "createdAt": 1234567890,
            "updatedAt": 1234567890,
            "version": 1
        }
        mock_table.get_item.return_value = {"Item": mock_item}
        mock_get_table.return_value = mock_table
        
        # Call function
        result = get_quest("user-123", "quest-123")
        
        # Assertions
        assert hasattr(result, 'id')  # QuestResponse object
        assert result.id == "quest-123"
        assert result.userId == "user-123"
        assert result.title == "Test Quest"
        assert result.kind == "linked"
        mock_table.get_item.assert_called_once_with(
            Key={"PK": "USER#user-123", "SK": "QUEST#quest-123"}
        )
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_not_found(self, mock_get_table):
        """Test quest retrieval when quest not found."""
        # Mock table and response
        mock_table = Mock()
        mock_table.get_item.return_value = {}
        mock_get_table.return_value = mock_table
        
        # Call function and expect exception
        with pytest.raises(QuestNotFoundError):
            get_quest("user-123", "quest-123")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_dynamodb_error(self, mock_get_table):
        """Test quest retrieval with DynamoDB error."""
        # Mock table and error
        mock_table = Mock()
        mock_table.get_item.side_effect = ClientError(
            error_response={'Error': {'Code': 'ResourceNotFoundException'}},
            operation_name='GetItem'
        )
        mock_get_table.return_value = mock_table
        
        # Call function and expect exception
        with pytest.raises(QuestDBError):
            get_quest("user-123", "quest-123")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_success(self, mock_get_table):
        """Test successful quest update."""
        # Mock table and responses
        mock_table = Mock()
        
        # Mock get_quest response
        mock_quest_response = Mock()
        mock_quest_response.id = "quest-123"
        mock_quest_response.userId = "user-123"
        mock_quest_response.status = "draft"
        mock_quest_response.version = 1
        
        # Mock update_item response
        mock_updated_item = {
            "id": "quest-123",
            "userId": "user-123",
            "title": "Updated Quest",
            "status": "draft",
            "difficulty": "easy",
            "rewardXp": 50,
            "category": "Health",
            "privacy": "private",
            "kind": "linked",
            "createdAt": 1234567890,
            "updatedAt": 1234567890,
            "version": 2
        }
        mock_table.update_item.return_value = {"Attributes": mock_updated_item}
        mock_get_table.return_value = mock_table
        
        # Mock get_quest function
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.return_value = mock_quest_response
            
            # Test data
            user_id = "user-123"
            quest_id = "quest-123"
            payload = QuestUpdatePayload(title="Updated Quest")
            current_version = 1
            
            # Call function
            result = update_quest(user_id, quest_id, payload, current_version)
            
            # Assertions
            assert hasattr(result, 'id')  # QuestResponse object
            assert result.id == "quest-123"
            assert result.title == "Updated Quest"
            mock_table.update_item.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_not_found(self, mock_get_table):
        """Test quest update when quest not found."""
        # Mock table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock get_quest to raise QuestNotFoundError
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestNotFoundError("Quest not found")
            
            # Test data
            user_id = "user-123"
            quest_id = "quest-123"
            payload = QuestUpdatePayload(title="Updated Quest")
            current_version = 1
            
            # Call function and expect exception
            with pytest.raises(QuestNotFoundError):
                update_quest(user_id, quest_id, payload, current_version)
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_dynamodb_error(self, mock_get_table):
        """Test quest update with DynamoDB error."""
        # Mock table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock get_quest to raise QuestDBError
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestDBError("Database error")
            
            # Test data
            user_id = "user-123"
            quest_id = "quest-123"
            payload = QuestUpdatePayload(title="Updated Quest")
            current_version = 1
            
            # Call function and expect exception
            with pytest.raises(QuestDBError):
                update_quest(user_id, quest_id, payload, current_version)
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_change_quest_status_success(self, mock_get_table):
        """Test successful quest status change."""
        # Mock table and responses
        mock_table = Mock()
        
        # Mock get_quest response
        mock_quest_response = Mock()
        mock_quest_response.id = "quest-123"
        mock_quest_response.userId = "user-123"
        mock_quest_response.status = "draft"
        mock_quest_response.version = 1
        
        # Mock update_item response
        mock_updated_item = {
            "id": "quest-123",
            "userId": "user-123",
            "title": "Test Quest",
            "status": "active",
            "difficulty": "easy",
            "rewardXp": 50,
            "category": "Health",
            "privacy": "private",
            "kind": "linked",
            "createdAt": 1234567890,
            "updatedAt": 1234567890,
            "version": 2
        }
        mock_table.update_item.return_value = {"Attributes": mock_updated_item}
        mock_get_table.return_value = mock_table
        
        # Mock get_quest function
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.return_value = mock_quest_response
            
            # Call function
            result = change_quest_status("user-123", "quest-123", "active")
            
            # Assertions
            assert hasattr(result, 'id')  # QuestResponse object
            assert result.id == "quest-123"
            assert result.status == "active"
            mock_table.update_item.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_change_quest_status_not_found(self, mock_get_table):
        """Test quest status change when quest not found."""
        # Mock table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock get_quest to raise QuestNotFoundError
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestNotFoundError("Quest not found")
            
            # Call function and expect exception
            with pytest.raises(QuestNotFoundError):
                change_quest_status("user-123", "quest-123", "active")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_change_quest_status_dynamodb_error(self, mock_get_table):
        """Test quest status change with DynamoDB error."""
        # Mock table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock get_quest to raise QuestDBError
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestDBError("Database error")
            
            # Call function and expect exception
            with pytest.raises(QuestDBError):
                change_quest_status("user-123", "quest-123", "active")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_delete_quest_success(self, mock_get_table):
        """Test successful quest deletion."""
        # Mock table and get_quest response
        mock_table = Mock()
        mock_table.delete_item.return_value = {}
        
        # Mock get_quest to return a quest response with draft status
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_quest_response = Mock()
            mock_quest_response.id = "quest-123"
            mock_quest_response.userId = "user-123"
            mock_quest_response.status = "draft"  # Allow deletion
            mock_get_quest.return_value = mock_quest_response
            
            mock_get_table.return_value = mock_table
            
            # Call function
            result = delete_quest("user-123", "quest-123")
            
            # Assertions - delete_quest returns True on success
            assert result is True
            mock_table.delete_item.assert_called_once_with(
                Key={"PK": "USER#user-123", "SK": "QUEST#quest-123"}
            )
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_delete_quest_not_found(self, mock_get_table):
        """Test quest deletion when quest not found."""
        # Mock table
        mock_table = Mock()
        
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestNotFoundError("Quest not found")
            mock_get_table.return_value = mock_table
            
            # Call function and expect exception
            with pytest.raises(QuestNotFoundError):
                delete_quest("user-123", "quest-123")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_delete_quest_dynamodb_error(self, mock_get_table):
        """Test quest deletion with DynamoDB error."""
        # Mock table
        mock_table = Mock()
        
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.side_effect = QuestDBError("Database error")
            mock_get_table.return_value = mock_table
            
            # Call function and expect exception
            with pytest.raises(QuestDBError):
                delete_quest("user-123", "quest-123")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_success(self, mock_get_table):
        """Test successful quest listing."""
        # Mock table and response with correct DynamoDB item structure
        mock_table = Mock()
        mock_items = [
            {
                "id": "quest-1",
                "userId": "user-123",
                "title": "Quest 1",
                "status": "draft",
                "difficulty": "easy",
                "rewardXp": 50,
                "category": "Health",
                "privacy": "private",
                "kind": "linked",  # Required field
                "createdAt": 1234567890,
                "updatedAt": 1234567890,
                "version": 1
            },
            {
                "id": "quest-2",
                "userId": "user-123",
                "title": "Quest 2",
                "status": "active",
                "difficulty": "medium",
                "rewardXp": 100,
                "category": "Work",
                "privacy": "private",
                "kind": "linked",  # Required field
                "createdAt": 1234567890,
                "updatedAt": 1234567890,
                "version": 1
            }
        ]
        mock_table.query.return_value = {"Items": mock_items}
        mock_get_table.return_value = mock_table
        
        # Call function
        result = list_user_quests("user-123")
        
        # Assertions
        assert len(result) == 2
        assert all(hasattr(quest, 'id') for quest in result)  # QuestResponse objects
        assert result[0].id == "quest-1"
        assert result[1].id == "quest-2"
        assert result[0].kind == "linked"
        assert result[1].kind == "linked"
        mock_table.query.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_empty(self, mock_get_table):
        """Test quest listing with empty result."""
        # Mock table and response
        mock_table = Mock()
        mock_table.query.return_value = {"Items": []}
        mock_get_table.return_value = mock_table
        
        # Call function
        result = list_user_quests("user-123")
        
        # Assertions
        assert result == []
        mock_table.query.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_dynamodb_error(self, mock_get_table):
        """Test quest listing with DynamoDB error."""
        # Mock table and error
        mock_table = Mock()
        mock_table.query.side_effect = ClientError(
            error_response={'Error': {'Code': 'ResourceNotFoundException'}},
            operation_name='Query'
        )
        mock_get_table.return_value = mock_table
        
        # Call function and expect exception
        with pytest.raises(QuestDBError):
            list_user_quests("user-123")


class TestQuestDatabaseEdgeCases:
    """Edge case tests for Quest database operations."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_with_quantitative_fields(self, mock_get_table):
        """Test quest creation with quantitative fields."""
        # Mock table
        mock_table = Mock()
        mock_table.put_item.return_value = {}
        mock_get_table.return_value = mock_table
        
        # Test data with quantitative fields - use future timestamp and add periodSeconds
        user_id = "user-123"
        future_time = 1759670554080  # Future timestamp
        payload = QuestCreatePayload(
            title="Quantitative Quest",
            category="Fitness",
            difficulty="medium",
            kind="quantitative",
            targetCount=10,
            countScope="completed_tasks",  # Use valid literal value
            startAt=future_time,  # Use future timestamp
            periodDays=1  # Add required periodDays for quantitative quests
        )
        
        # Call function
        result = create_quest(user_id, payload)
        
        # Assertions
        assert hasattr(result, 'id')  # QuestResponse object
        assert result.kind == "quantitative"
        assert result.targetCount == 10
        assert result.countScope == "completed_tasks"
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_with_deadline(self, mock_get_table):
        """Test quest creation with deadline."""
        # Mock table
        mock_table = Mock()
        mock_table.put_item.return_value = {}
        mock_get_table.return_value = mock_table
        
        # Test data with deadline
        user_id = "user-123"
        future_time = 1759670554080  # Future timestamp
        payload = QuestCreatePayload(
            title="Deadline Quest",
            category="Work",
            difficulty="hard",
            deadline=future_time
        )
        
        # Call function
        result = create_quest(user_id, payload)
        
        # Assertions
        assert hasattr(result, 'id')  # QuestResponse object
        assert result.deadline == future_time
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_with_partial_fields(self, mock_get_table):
        """Test quest update with partial fields."""
        # Mock table and responses
        mock_table = Mock()
        
        # Mock get_quest response
        mock_quest_response = Mock()
        mock_quest_response.id = "quest-123"
        mock_quest_response.userId = "user-123"
        mock_quest_response.status = "draft"
        mock_quest_response.version = 1
        
        # Mock update_item response
        mock_updated_item = {
            "id": "quest-123",
            "userId": "user-123",
            "title": "Updated Quest",
            "status": "draft",
            "difficulty": "easy",
            "rewardXp": 50,
            "category": "Health",
            "privacy": "private",
            "kind": "linked",
            "createdAt": 1234567890,
            "updatedAt": 1234567890,
            "version": 2
        }
        mock_table.update_item.return_value = {"Attributes": mock_updated_item}
        mock_get_table.return_value = mock_table
        
        # Mock get_quest function
        with patch('app.db.quest_db.get_quest') as mock_get_quest:
            mock_get_quest.return_value = mock_quest_response
            
            # Test data with only title update
            user_id = "user-123"
            quest_id = "quest-123"
            payload = QuestUpdatePayload(title="Updated Quest")
            current_version = 1
            
            # Call function
            result = update_quest(user_id, quest_id, payload, current_version)
            
            # Assertions
            assert hasattr(result, 'id')  # QuestResponse object
            assert result.title == "Updated Quest"
            mock_table.update_item.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_with_pagination(self, mock_get_table):
        """Test quest listing with pagination."""
        # Mock table and response with correct DynamoDB item structure
        mock_table = Mock()
        mock_items = [
            {
                "id": "quest-1",
                "userId": "user-123",
                "title": "Quest 1",
                "status": "draft",
                "difficulty": "easy",
                "rewardXp": 50,
                "category": "Health",
                "privacy": "private",
                "kind": "linked",
                "createdAt": 1234567890,
                "updatedAt": 1234567890,
                "version": 1
            },
            {
                "id": "quest-2",
                "userId": "user-123",
                "title": "Quest 2",
                "status": "active",
                "difficulty": "medium",
                "rewardXp": 100,
                "category": "Work",
                "privacy": "private",
                "kind": "linked",
                "createdAt": 1234567890,
                "updatedAt": 1234567890,
                "version": 1
            }
        ]
        mock_table.query.return_value = {"Items": mock_items}
        mock_get_table.return_value = mock_table
        
        # Call function
        result = list_user_quests("user-123")
        
        # Assertions
        assert len(result) == 2
        assert all(hasattr(quest, 'id') for quest in result)  # QuestResponse objects
        mock_table.query.assert_called_once()
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_quest_operations_with_special_characters(self, mock_get_table):
        """Test quest operations with special characters."""
        # Mock table
        mock_table = Mock()
        mock_table.put_item.return_value = {}
        mock_get_table.return_value = mock_table
        
        # Test data with special characters
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Quest with Special Chars: !@#$%^&*()",
            category="Health",
            difficulty="easy",
            description="Description with émojis 🎯 and special chars"
        )
        
        # Call function
        result = create_quest(user_id, payload)
        
        # Assertions
        assert hasattr(result, 'id')  # QuestResponse object
        assert "Special Chars" in result.title
        assert "émojis" in result.description