"""
Focused Database Tests for Quest Service Coverage.

This module provides targeted unit tests for quest_db.py to achieve 90% coverage.
"""

import pytest
import uuid
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from app.db.quest_db import (
    _get_dynamodb_table,
    create_quest,
    get_quest,
    update_quest,
    change_quest_status,
    delete_quest,
    list_user_quests,
    QuestDBError,
    QuestNotFoundError,
    QuestVersionConflictError,
    QuestPermissionError
)
from app.models.quest import QuestCreatePayload, QuestUpdatePayload, QuestStatus


class TestQuestDatabaseBasicCoverage:
    """Test basic quest database functions for coverage."""
    
    @pytest.fixture
    def mock_table(self):
        """Mock DynamoDB table."""
        table = Mock()
        table.table_name = "gg_core_test"
        return table
    
    @pytest.fixture
    def mock_dynamodb(self, mock_table):
        """Mock DynamoDB resource."""
        with patch('app.db.quest_db._get_dynamodb_table', return_value=mock_table):
            yield mock_table
    
    @pytest.fixture
    def sample_quest_payload(self):
        """Sample quest creation payload."""
        return QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium",
            description="Test quest description",
            rewardXp=100,
            tags=["test", "health"],
            privacy="private"
        )
    
    def test_get_dynamodb_table_success(self):
        """Test successful DynamoDB table retrieval."""
        with patch('boto3.resource') as mock_resource:
            mock_dynamodb = Mock()
            mock_table = Mock()
            mock_table.table_name = "gg_core_test"
            mock_dynamodb.Table.return_value = mock_table
            mock_resource.return_value = mock_dynamodb
            
            result = _get_dynamodb_table()
            
            assert result == mock_table
            mock_resource.assert_called_once()
    
    def test_get_dynamodb_table_error(self):
        """Test DynamoDB table retrieval error."""
        with patch('boto3.resource', side_effect=Exception("Connection error")):
            with pytest.raises(QuestDBError) as exc_info:
                _get_dynamodb_table()
            
            assert "Failed to get DynamoDB table" in str(exc_info.value)
    
    def test_create_quest_success(self, mock_dynamodb, sample_quest_payload):
        """Test successful quest creation."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock successful put_item
        mock_dynamodb.put_item.return_value = {}
        
        with patch('uuid.uuid4', return_value=quest_id):
            with patch('datetime.datetime') as mock_datetime:
                mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
                mock_datetime.now.return_value = mock_now
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                result = create_quest(user_id, sample_quest_payload)
                
                assert result['quest_id'] == quest_id
                assert result['user_id'] == user_id
                assert result['title'] == sample_quest_payload.title
                assert result['status'] == 'draft'
                
                # Verify put_item was called with correct parameters
                mock_dynamodb.put_item.assert_called_once()
                call_args = mock_dynamodb.put_item.call_args
                assert call_args[1]['Item']['PK'] == f"USER#{user_id}"
                assert call_args[1]['Item']['SK'] == f"QUEST#{quest_id}"
                assert call_args[1]['Item']['Title'] == sample_quest_payload.title
    
    def test_create_quest_conditional_check_failed(self, mock_dynamodb, sample_quest_payload):
        """Test quest creation with conditional check failed."""
        user_id = "test_user_123"
        
        # Mock conditional check failed error
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'PutItem'
        )
        mock_dynamodb.put_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            create_quest(user_id, sample_quest_payload)
        
        assert "Quest already exists" in str(exc_info.value)
    
    def test_create_quest_client_error(self, mock_dynamodb, sample_quest_payload):
        """Test quest creation with client error."""
        user_id = "test_user_123"
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Invalid input'}},
            'PutItem'
        )
        mock_dynamodb.put_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            create_quest(user_id, sample_quest_payload)
        
        assert "Failed to create quest" in str(exc_info.value)
    
    def test_create_quest_general_error(self, mock_dynamodb, sample_quest_payload):
        """Test quest creation with general error."""
        user_id = "test_user_123"
        
        # Mock general error
        mock_dynamodb.put_item.side_effect = Exception("Unexpected error")
        
        with pytest.raises(QuestDBError) as exc_info:
            create_quest(user_id, sample_quest_payload)
        
        assert "Failed to create quest" in str(exc_info.value)
    
    def test_get_quest_success(self, mock_dynamodb):
        """Test successful quest retrieval."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock successful get_item
        mock_item = {
            'PK': f"USER#{user_id}",
            'SK': f"QUEST#{quest_id}",
            'QuestId': quest_id,
            'UserId': user_id,
            'Title': 'Test Quest',
            'Status': 'draft'
        }
        mock_dynamodb.get_item.return_value = {'Item': mock_item}
        
        result = get_quest(user_id, quest_id)
        
        assert result['quest_id'] == quest_id
        assert result['user_id'] == user_id
        assert result['title'] == 'Test Quest'
        
        # Verify get_item was called with correct parameters
        mock_dynamodb.get_item.assert_called_once_with(
            Key={
                'PK': f"USER#{user_id}",
                'SK': f"QUEST#{quest_id}"
            }
        )
    
    def test_get_quest_not_found(self, mock_dynamodb):
        """Test quest retrieval when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock quest not found
        mock_dynamodb.get_item.return_value = {}
        
        with pytest.raises(QuestNotFoundError) as exc_info:
            get_quest(user_id, quest_id)
        
        assert f"Quest {quest_id} not found" in str(exc_info.value)
    
    def test_get_quest_client_error(self, mock_dynamodb):
        """Test quest retrieval with client error."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'GetItem'
        )
        mock_dynamodb.get_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            get_quest(user_id, quest_id)
        
        assert "Failed to get quest" in str(exc_info.value)
    
    def test_update_quest_success(self, mock_dynamodb):
        """Test successful quest update."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        update_payload = QuestUpdatePayload(
            title="Updated Quest",
            description="Updated description",
            rewardXp=150
        )
        
        # Mock successful update_item
        updated_item = {
            'PK': f"USER#{user_id}",
            'SK': f"QUEST#{quest_id}",
            'QuestId': quest_id,
            'UserId': user_id,
            'Title': 'Updated Quest',
            'Description': 'Updated description',
            'RewardXp': 150
        }
        mock_dynamodb.update_item.return_value = {'Attributes': updated_item}
        
        with patch('datetime.datetime') as mock_datetime:
            mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = update_quest(user_id, quest_id, update_payload)
            
            assert result['quest_id'] == quest_id
            assert result['title'] == 'Updated Quest'
            assert result['description'] == 'Updated description'
            assert result['rewardXp'] == 150
    
    def test_update_quest_not_found(self, mock_dynamodb):
        """Test quest update when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        update_payload = QuestUpdatePayload(title="Updated Quest")
        
        # Mock conditional check failed (quest not found)
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        
        with pytest.raises(QuestNotFoundError) as exc_info:
            update_quest(user_id, quest_id, update_payload)
        
        assert f"Quest {quest_id} not found" in str(exc_info.value)
    
    def test_update_quest_client_error(self, mock_dynamodb):
        """Test quest update with client error."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        update_payload = QuestUpdatePayload(title="Updated Quest")
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            update_quest(user_id, quest_id, update_payload)
        
        assert "Failed to update quest" in str(exc_info.value)
    
    def test_change_quest_status_success(self, mock_dynamodb):
        """Test successful quest status change."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        
        # Mock successful update_item
        updated_item = {
            'PK': f"USER#{user_id}",
            'SK': f"QUEST#{quest_id}",
            'QuestId': quest_id,
            'UserId': user_id,
            'Status': new_status
        }
        mock_dynamodb.update_item.return_value = {'Attributes': updated_item}
        
        with patch('datetime.datetime') as mock_datetime:
            mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = change_quest_status(user_id, quest_id, new_status)
            
            assert result['quest_id'] == quest_id
            assert result['status'] == new_status
    
    def test_change_quest_status_not_found(self, mock_dynamodb):
        """Test quest status change when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        
        # Mock conditional check failed (quest not found)
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        
        with pytest.raises(QuestNotFoundError) as exc_info:
            change_quest_status(user_id, quest_id, new_status)
        
        assert f"Quest {quest_id} not found" in str(exc_info.value)
    
    def test_change_quest_status_client_error(self, mock_dynamodb):
        """Test quest status change with client error."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            change_quest_status(user_id, quest_id, new_status)
        
        assert "Failed to change quest status" in str(exc_info.value)
    
    def test_delete_quest_success(self, mock_dynamodb):
        """Test successful quest deletion."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock successful delete_item
        deleted_item = {
            'PK': f"USER#{user_id}",
            'SK': f"QUEST#{quest_id}",
            'QuestId': quest_id,
            'UserId': user_id
        }
        mock_dynamodb.delete_item.return_value = {'Attributes': deleted_item}
        
        result = delete_quest(user_id, quest_id)
        
        assert result['quest_id'] == quest_id
        assert result['deleted'] is True
    
    def test_delete_quest_not_found(self, mock_dynamodb):
        """Test quest deletion when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock conditional check failed (quest not found)
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'DeleteItem'
        )
        mock_dynamodb.delete_item.side_effect = error
        
        with pytest.raises(QuestNotFoundError) as exc_info:
            delete_quest(user_id, quest_id)
        
        assert f"Quest {quest_id} not found" in str(exc_info.value)
    
    def test_delete_quest_client_error(self, mock_dynamodb):
        """Test quest deletion with client error."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'DeleteItem'
        )
        mock_dynamodb.delete_item.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            delete_quest(user_id, quest_id)
        
        assert "Failed to delete quest" in str(exc_info.value)
    
    def test_list_user_quests_success(self, mock_dynamodb):
        """Test successful quest listing."""
        user_id = "test_user_123"
        
        # Mock successful query
        mock_items = [
            {
                'PK': f"USER#{user_id}",
                'SK': f"QUEST#{str(uuid.uuid4())}",
                'QuestId': str(uuid.uuid4()),
                'UserId': user_id,
                'Title': 'Quest 1',
                'Status': 'draft'
            },
            {
                'PK': f"USER#{user_id}",
                'SK': f"QUEST#{str(uuid.uuid4())}",
                'QuestId': str(uuid.uuid4()),
                'UserId': user_id,
                'Title': 'Quest 2',
                'Status': 'active'
            }
        ]
        mock_dynamodb.query.return_value = {
            'Items': mock_items,
            'Count': 2
        }
        
        result = list_user_quests(user_id)
        
        assert len(result['quests']) == 2
        assert result['count'] == 2
        assert result['quests'][0]['title'] == 'Quest 1'
        assert result['quests'][1]['title'] == 'Quest 2'
    
    def test_list_user_quests_empty(self, mock_dynamodb):
        """Test quest listing when no quests found."""
        user_id = "test_user_123"
        
        # Mock empty query result
        mock_dynamodb.query.return_value = {
            'Items': [],
            'Count': 0
        }
        
        result = list_user_quests(user_id)
        
        assert len(result['quests']) == 0
        assert result['count'] == 0
    
    def test_list_user_quests_client_error(self, mock_dynamodb):
        """Test quest listing with client error."""
        user_id = "test_user_123"
        
        # Mock client error
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'Query'
        )
        mock_dynamodb.query.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            list_user_quests(user_id)
        
        assert "Failed to list user quests" in str(exc_info.value)
    
    def test_list_user_quests_general_error(self, mock_dynamodb):
        """Test quest listing with general error."""
        user_id = "test_user_123"
        
        # Mock general error
        mock_dynamodb.query.side_effect = Exception("Unexpected error")
        
        with pytest.raises(QuestDBError) as exc_info:
            list_user_quests(user_id)
        
        assert "Failed to list user quests" in str(exc_info.value)


class TestQuestDatabaseExceptionsCoverage:
    """Test quest database exception classes for coverage."""
    
    def test_quest_db_error(self):
        """Test QuestDBError exception."""
        error = QuestDBError("Test error")
        assert str(error) == "Test error"
        assert isinstance(error, Exception)
    
    def test_quest_not_found_error(self):
        """Test QuestNotFoundError exception."""
        error = QuestNotFoundError("Quest not found")
        assert str(error) == "Quest not found"
        assert isinstance(error, QuestDBError)
    
    def test_quest_version_conflict_error(self):
        """Test QuestVersionConflictError exception."""
        error = QuestVersionConflictError("Version conflict")
        assert str(error) == "Version conflict"
        assert isinstance(error, QuestDBError)
    
    def test_quest_permission_error(self):
        """Test QuestPermissionError exception."""
        error = QuestPermissionError("Permission denied")
        assert str(error) == "Permission denied"
        assert isinstance(error, QuestDBError)
