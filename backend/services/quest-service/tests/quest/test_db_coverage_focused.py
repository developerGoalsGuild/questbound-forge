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
        quest_id = "e1cd4170-32d4-4e5f-a1b2-c3d4e5f67890"
        
        # Mock successful put_item
        mock_dynamodb.put_item.return_value = {}
        
        # Patch where uuid4 is used (app.db.quest_db) so result.id matches
        with patch('app.db.quest_db.uuid4', return_value=__import__('uuid').UUID(quest_id)):
            with patch('datetime.datetime') as mock_datetime:
                mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
                mock_datetime.now.return_value = mock_now
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                result = create_quest(user_id, sample_quest_payload)
                
                assert result.id == quest_id
                assert result.userId == user_id
                assert result.title == sample_quest_payload.title
                assert result.status == 'draft'
                
                # Verify put_item was called with correct parameters
                mock_dynamodb.put_item.assert_called_once()
                call_args = mock_dynamodb.put_item.call_args
                assert call_args[1]['Item']['PK'] == f"USER#{user_id}"
                assert call_args[1]['Item']['SK'] == f"QUEST#{quest_id}"
                assert call_args[1]['Item']['title'] == sample_quest_payload.title
    
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
        
        assert "Quest with this ID already exists" in str(exc_info.value)
    
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
        ts = 1234567890000
        # Mock successful get_item - use keys expected by _quest_item_to_response (camelCase)
        mock_item = {
            'PK': f"USER#{user_id}",
            'SK': f"QUEST#{quest_id}",
            'id': quest_id,
            'userId': user_id,
            'title': 'Test Quest',
            'description': None,
            'difficulty': 'medium',
            'rewardXp': 50,
            'status': 'draft',
            'category': 'Health',
            'tags': [],
            'privacy': 'private',
            'createdAt': ts,
            'updatedAt': ts,
            'version': 1,
            'kind': 'linked',
        }
        mock_dynamodb.get_item.return_value = {'Item': mock_item}
        
        result = get_quest(user_id, quest_id)
        
        assert result.id == quest_id
        assert result.userId == user_id
        assert result.title == 'Test Quest'
        
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
        
        # Mock quest not found: no Item, then scan returns no owner
        mock_dynamodb.get_item.return_value = {}
        mock_dynamodb.scan.return_value = {"Items": []}
        
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
    
    @patch('app.db.quest_db.get_quest')
    def test_update_quest_success(self, mock_get_quest, mock_dynamodb):
        """Test successful quest update."""
        from app.models.quest import QuestResponse
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        ts = 1234567890000
        current = QuestResponse(
            id=quest_id, userId=user_id, title="Original", difficulty="medium",
            rewardXp=50, status="draft", category="Health", tags=[],
            privacy="private", createdAt=ts, updatedAt=ts, version=1, kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current
        
        update_payload = QuestUpdatePayload(
            title="Updated Quest",
            description="Updated description",
            rewardXp=150
        )
        
        # Mock successful update_item - Attributes must match _quest_item_to_response keys
        updated_item = {
            'id': quest_id, 'userId': user_id, 'title': 'Updated Quest',
            'description': 'Updated description', 'difficulty': 'medium',
            'rewardXp': 150, 'status': 'draft', 'category': 'Health', 'tags': [],
            'privacy': 'private', 'createdAt': ts, 'updatedAt': ts, 'version': 2,
            'kind': 'linked', 'auditTrail': []
        }
        mock_dynamodb.update_item.return_value = {'Attributes': updated_item}
        
        with patch('datetime.datetime') as mock_datetime:
            mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = update_quest(user_id, quest_id, update_payload, current_version=1)
            
            assert result.id == quest_id
            assert result.title == 'Updated Quest'
            assert result.description == 'Updated description'
            assert result.rewardXp == 150
    
    @patch('app.db.quest_db.get_quest')
    def test_update_quest_not_found(self, mock_get_quest, mock_dynamodb):
        """Test quest update when quest not found."""
        from app.models.quest import QuestResponse
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        ts = 1234567890000
        current = QuestResponse(
            id=quest_id, userId=user_id, title="Original", difficulty="medium",
            rewardXp=50, status="draft", category="Health", tags=[],
            privacy="private", createdAt=ts, updatedAt=ts, version=1, kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current
        update_payload = QuestUpdatePayload(title="Updated Quest")
        error = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        with pytest.raises(QuestVersionConflictError):
            update_quest(user_id, quest_id, update_payload, current_version=1)
    
    @patch('app.db.quest_db.get_quest')
    def test_update_quest_client_error(self, mock_get_quest, mock_dynamodb):
        """Test quest update with client error."""
        from app.models.quest import QuestResponse
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        ts = 1234567890000
        current = QuestResponse(
            id=quest_id, userId=user_id, title="Original", difficulty="medium",
            rewardXp=50, status="draft", category="Health", tags=[],
            privacy="private", createdAt=ts, updatedAt=ts, version=1, kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current
        update_payload = QuestUpdatePayload(title="Updated Quest")
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'UpdateItem'
        )
        mock_dynamodb.update_item.side_effect = error
        with pytest.raises(QuestDBError) as exc_info:
            update_quest(user_id, quest_id, update_payload, current_version=1)
        assert "Failed to update quest" in str(exc_info.value)
    
    @patch('app.db.quest_db.get_quest')
    def test_change_quest_status_success(self, mock_get_quest, mock_dynamodb):
        """Test successful quest status change (draft -> active requires linked goals/tasks)."""
        from app.models.quest import QuestResponse
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        ts = 1234567890000
        # Draft quest with linked goals/tasks so _validate_quest_can_start passes
        current = QuestResponse(
            id=quest_id, userId=user_id, title="Quest", difficulty="medium",
            rewardXp=50, status="draft", category="Health", tags=[],
            privacy="private", createdAt=ts, updatedAt=ts, version=1, kind="linked",
            linkedGoalIds=["goal-1"], linkedTaskIds=["task-1"], auditTrail=[]
        )
        mock_get_quest.return_value = current
        updated_item = {
            'id': quest_id, 'userId': user_id, 'title': 'Quest', 'difficulty': 'medium',
            'rewardXp': 50, 'status': new_status, 'category': 'Health', 'tags': [],
            'privacy': 'private', 'createdAt': ts, 'updatedAt': ts, 'version': 2,
            'kind': 'linked', 'auditTrail': []
        }
        mock_dynamodb.update_item.return_value = {'Attributes': updated_item}
        with patch('datetime.datetime') as mock_datetime:
            mock_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            result = change_quest_status(user_id, quest_id, new_status)
            assert result.id == quest_id
            assert result.status == new_status
    
    def test_change_quest_status_not_found(self, mock_dynamodb):
        """Test quest status change when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        
        # get_quest is called first; return no item then empty scan so QuestNotFoundError
        mock_dynamodb.get_item.return_value = {}
        mock_dynamodb.scan.return_value = {"Items": []}
        
        with pytest.raises(QuestNotFoundError) as exc_info:
            change_quest_status(user_id, quest_id, new_status)
        
        assert f"Quest {quest_id} not found" in str(exc_info.value)
    
    @patch('app.db.quest_db.get_quest')
    def test_change_quest_status_client_error(self, mock_get_quest, mock_dynamodb):
        """Test quest status change with client error (update_item fails)."""
        from app.models.quest import QuestResponse
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        new_status = "active"
        ts = 1234567890000
        current = QuestResponse(
            id=quest_id, userId=user_id, title="Quest", difficulty="medium",
            rewardXp=50, status="draft", category="Health", tags=[],
            privacy="private", createdAt=ts, updatedAt=ts, version=1, kind="linked",
            linkedGoalIds=["goal-1"], linkedTaskIds=["task-1"], auditTrail=[]
        )
        mock_get_quest.return_value = current
        mock_dynamodb.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Validation failed'}},
            'UpdateItem'
        )
        with pytest.raises(QuestDBError) as exc_info:
            change_quest_status(user_id, quest_id, new_status)
        assert "Failed to change quest status" in str(exc_info.value)
    
    def test_delete_quest_success(self, mock_dynamodb):
        """Test successful quest deletion (delete_quest calls get_quest first)."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        ts = 1234567890000
        # get_quest must return a valid quest (draft so non-admin can delete)
        mock_dynamodb.get_item.return_value = {
            'Item': {
                'id': quest_id, 'userId': user_id, 'title': 'Quest', 'difficulty': 'medium',
                'rewardXp': 50, 'status': 'draft', 'category': 'Health', 'tags': [],
                'privacy': 'private', 'createdAt': ts, 'updatedAt': ts, 'version': 1,
                'kind': 'linked', 'auditTrail': []
            }
        }
        mock_dynamodb.delete_item.return_value = {}
        
        result = delete_quest(user_id, quest_id)
        
        assert result is True
    
    def test_delete_quest_not_found(self, mock_dynamodb):
        """Test quest deletion when quest not found."""
        user_id = "test_user_123"
        quest_id = str(uuid.uuid4())
        
        # get_quest is called first; no item then empty scan -> QuestNotFoundError
        mock_dynamodb.get_item.return_value = {}
        mock_dynamodb.scan.return_value = {"Items": []}
        
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
        """Test successful quest listing (returns List[QuestResponse])."""
        user_id = "test_user_123"
        ts = 1234567890000
        q1_id, q2_id = str(uuid.uuid4()), str(uuid.uuid4())
        mock_items = [
            {
                'id': q1_id, 'userId': user_id, 'title': 'Quest 1', 'difficulty': 'medium',
                'rewardXp': 50, 'status': 'draft', 'category': 'Health', 'tags': [],
                'privacy': 'private', 'createdAt': ts, 'updatedAt': ts, 'version': 1,
                'kind': 'linked', 'auditTrail': []
            },
            {
                'id': q2_id, 'userId': user_id, 'title': 'Quest 2', 'difficulty': 'easy',
                'rewardXp': 25, 'status': 'active', 'category': 'Work', 'tags': [],
                'privacy': 'private', 'createdAt': ts + 1, 'updatedAt': ts + 1, 'version': 1,
                'kind': 'linked', 'auditTrail': []
            }
        ]
        mock_dynamodb.query.return_value = {'Items': mock_items, 'Count': 2}
        
        result = list_user_quests(user_id)
        
        assert len(result) == 2
        assert result[0].title == 'Quest 1'
        assert result[1].title == 'Quest 2'
    
    def test_list_user_quests_empty(self, mock_dynamodb):
        """Test quest listing when no quests found."""
        user_id = "test_user_123"
        mock_dynamodb.query.return_value = {'Items': [], 'Count': 0}
        
        result = list_user_quests(user_id)
        
        assert len(result) == 0
    
    def test_list_user_quests_client_error(self, mock_dynamodb):
        """Test quest listing with client error."""
        user_id = "test_user_123"
        error = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'Query'
        )
        mock_dynamodb.query.side_effect = error
        
        with pytest.raises(QuestDBError) as exc_info:
            list_user_quests(user_id)
        
        assert "Failed to list quests" in str(exc_info.value)
    
    def test_list_user_quests_general_error(self, mock_dynamodb):
        """Test quest listing with general error."""
        user_id = "test_user_123"
        mock_dynamodb.query.side_effect = Exception("Unexpected error")
        
        with pytest.raises(QuestDBError) as exc_info:
            list_user_quests(user_id)
        
        assert "Failed to list quests" in str(exc_info.value)


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
