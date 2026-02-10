"""
Comprehensive tests for Quest DynamoDB operations.

This module tests all database operations including CRUD operations,
error handling, and edge cases to ensure robust functionality.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from botocore.exceptions import ClientError, BotoCoreError

# Mock settings before importing quest_db
with patch('app.settings.Settings') as mock_settings_global:
    # Ensure no SSM calls are attempted by returning minimal required attributes
    mock_settings_global.return_value.aws_region = 'us-east-1'
    mock_settings_global.return_value.core_table_name = 'test-table'
    
    # Also patch the symbol used inside quest_db to be safe regardless of import style
    with patch('app.db.quest_db.Settings') as mock_settings_local:
        mock_settings_local.return_value.aws_region = 'us-east-1'
        mock_settings_local.return_value.core_table_name = 'test-table'
        
        from app.db.quest_db import (
            create_quest,
            get_quest,
            update_quest,
            change_quest_status,
            list_user_quests,
            delete_quest,
            get_quest_by_id,
            QuestDBError,
            QuestNotFoundError,
            QuestVersionConflictError,
            QuestPermissionError,
            _build_quest_item,
            _quest_item_to_response
        )
        from app.models.quest import QuestCreatePayload, QuestUpdatePayload, QuestResponse


class TestQuestDBHelpers:
    """Test helper functions for quest database operations."""
    
    def test_build_quest_item_linked(self):
        """Test building DynamoDB item for linked quest."""
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium",
            description="Test description",
            rewardXp=75,
            tags=["test", "quest"],
            privacy="private",
            kind="linked",
            linkedGoalIds=["01234567-89ab-cdef-0123-456789abcdef", "01234567-89ab-cdef-0123-456789abcde0"],
            linkedTaskIds=["01234567-89ab-cdef-0123-456789abcde1"]
        )
        
        item = _build_quest_item(user_id, payload)
        
        assert item["PK"] == f"USER#{user_id}"
        assert item["SK"].startswith("QUEST#")
        assert item["type"] == "Quest"
        assert item["userId"] == user_id
        assert item["title"] == "Test Quest"
        assert item["difficulty"] == "medium"
        assert item["rewardXp"] == 75
        assert item["status"] == "draft"
        assert item["category"] == "Health"
        assert item["tags"] == ["test", "quest"]
        assert item["privacy"] == "private"
        assert item["kind"] == "linked"
        assert item["linkedGoalIds"] == ["01234567-89ab-cdef-0123-456789abcdef", "01234567-89ab-cdef-0123-456789abcde0"]
        assert item["linkedTaskIds"] == ["01234567-89ab-cdef-0123-456789abcde1"]
        assert item["version"] == 1
        assert "GSI1PK" in item
        assert "GSI1SK" in item
    
    def test_build_quest_item_quantitative(self):
        """Test building DynamoDB item for quantitative quest."""
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Quantitative Quest",
            category="Work",
            difficulty="hard",
            kind="quantitative",
            targetCount=10,
            countScope="completed_tasks",
            periodDays=1
        )
        
        item = _build_quest_item(user_id, payload)
        
        assert item["kind"] == "quantitative"
        assert item["targetCount"] == 10
        assert item["countScope"] == "completed_tasks"
        assert item["periodDays"] == 1
    
    def test_quest_item_to_response(self):
        """Test converting DynamoDB item to QuestResponse."""
        item = {
            "id": "quest-123",
            "userId": "user-456",
            "title": "Test Quest",
            "description": "Test description",
            "difficulty": "medium",
            "rewardXp": 50,
            "status": "draft",
            "category": "Health",
            "tags": ["test"],
            "privacy": "private",
            "deadline": 1234567890000,
            "createdAt": 1234567890000,
            "updatedAt": 1234567890000,
            "version": 1,
            "kind": "linked",
            "linkedGoalIds": ["goal-1"],
            "linkedTaskIds": ["task-1"],
            "dependsOnQuestIds": ["quest-2"],
            "targetCount": 5,
            "countScope": "completed_goals",
            "periodDays": 1,
            "auditTrail": []
        }
        
        response = _quest_item_to_response(item)
        
        assert isinstance(response, QuestResponse)
        assert response.id == "quest-123"
        assert response.userId == "user-456"
        assert response.title == "Test Quest"
        assert response.description == "Test description"
        assert response.difficulty == "medium"
        assert response.rewardXp == 50
        assert response.status == "draft"
        assert response.category == "Health"
        assert response.tags == ["test"]
        assert response.privacy == "private"
        assert response.deadline == 1234567890000
        assert response.createdAt == 1234567890000
        assert response.updatedAt == 1234567890000
        assert response.version == 1
        assert response.kind == "linked"
        assert response.linkedGoalIds == ["goal-1"]
        assert response.linkedTaskIds == ["task-1"]
        assert response.dependsOnQuestIds == ["quest-2"]
        assert response.targetCount == 5
        assert response.countScope == "completed_goals"
        assert response.periodDays == 1
        assert response.auditTrail == []

    def test_build_quest_item_with_deadline_and_description(self):
        """Covers optional fields deadline and description in item build."""
        user_id = "user-123"
        future_time = int((datetime.now() + timedelta(days=2)).timestamp() * 1000)
        payload = QuestCreatePayload(
            title="With Optional",
            category="Health",
            difficulty="easy",
            description="desc",
            deadline=future_time,
        )
        item = _build_quest_item(user_id, payload)
        assert item["description"] == "desc"
        assert item["deadline"] == future_time


class TestCreateQuest:
    """Test quest creation operations."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_success(self, mock_get_table):
        """Test successful quest creation."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        result = create_quest(user_id, payload)
        
        assert isinstance(result, QuestResponse)
        assert result.title == "Test Quest"
        assert result.category == "Health"
        assert result.difficulty == "medium"
        assert result.status == "draft"
        assert result.userId == user_id
        
        # Verify DynamoDB put_item was called
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        assert "Item" in call_args.kwargs
        assert "ConditionExpression" in call_args.kwargs
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_duplicate(self, mock_get_table):
        """Test quest creation with duplicate ID."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock ClientError for duplicate
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'PutItem'
        )
        
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        with pytest.raises(QuestDBError, match="Quest with this ID already exists"):
            create_quest(user_id, payload)
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_database_error(self, mock_get_table):
        """Test quest creation with database error."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock ClientError
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Invalid input'}},
            'PutItem'
        )
        
        user_id = "user-123"
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        with pytest.raises(QuestDBError, match="Failed to create quest"):
            create_quest(user_id, payload)

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_boto_error_on_table(self, mock_get_table):
        """Test create_quest when fetching table raises BotoCoreError."""
        mock_get_table.side_effect = BotoCoreError()
        with pytest.raises(QuestDBError, match="Failed to create quest"):
            create_quest("user-123", QuestCreatePayload(title="Test", category="Health"))

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_generic_error_on_table(self, mock_get_table):
        """Test create_quest when fetching table raises generic Exception."""
        mock_get_table.side_effect = Exception("boom")
        with pytest.raises(QuestDBError, match="Failed to create quest"):
            create_quest("user-123", QuestCreatePayload(title="Test", category="Health"))

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_create_quest_generic_error_on_put(self, mock_get_table):
        """Cover generic exception path during put_item."""
        mock_table = Mock()
        mock_table.put_item.side_effect = Exception("explode")
        mock_get_table.return_value = mock_table
        with pytest.raises(QuestDBError, match="Failed to create quest: explode"):
            create_quest("user-123", QuestCreatePayload(title="Test", category="Health"))


class TestGetQuest:
    """Test quest retrieval operations."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_success(self, mock_get_table):
        """Test successful quest retrieval."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock DynamoDB response
        mock_table.get_item.return_value = {
            "Item": {
                "id": "quest-123",
                "userId": "user-456",
                "title": "Test Quest",
                "difficulty": "medium",
                "rewardXp": 50,
                "status": "draft",
                "category": "Health",
                "tags": [],
                "privacy": "private",
                "createdAt": 1234567890000,
                "updatedAt": 1234567890000,
                "version": 1,
                "kind": "linked",
                "auditTrail": []
            }
        }
        
        result = get_quest("user-456", "quest-123")
        
        assert isinstance(result, QuestResponse)
        assert result.id == "quest-123"
        assert result.title == "Test Quest"
        
        # Verify DynamoDB get_item was called
        mock_table.get_item.assert_called_once_with(
            Key={
                "PK": "USER#user-456",
                "SK": "QUEST#quest-123"
            }
        )
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_not_found(self, mock_get_table):
        """Test quest retrieval when quest doesn't exist."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # No Item from get_item, then scan for owner returns empty
        mock_table.get_item.return_value = {}
        mock_table.scan.return_value = {"Items": []}
        
        with pytest.raises(QuestNotFoundError, match="Quest quest-123 not found"):
            get_quest("user-456", "quest-123")
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_database_error(self, mock_get_table):
        """Test quest retrieval with database error."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock ClientError
        mock_table.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'GetItem'
        )
        
        with pytest.raises(QuestDBError, match="Failed to get quest"):
            get_quest("user-456", "quest-123")


class TestUpdateQuest:
    """Test quest update operations."""
    
    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_success(self, mock_get_table, mock_get_quest):
        """Test successful quest update."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock current quest
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Original Title",
            difficulty="medium",
            rewardXp=50,
            status="draft",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        # Mock update response
        mock_table.update_item.return_value = {
            "Attributes": {
                "id": "quest-123",
                "userId": "user-456",
                "title": "Updated Title",
                "difficulty": "hard",
                "rewardXp": 75,
                "status": "draft",
                "category": "Health",
                "tags": ["updated"],
                "privacy": "private",
                "createdAt": 1234567890000,
                "updatedAt": 1234567890001,
                "version": 2,
                "kind": "linked",
                "auditTrail": []
            }
        }
        
        payload = QuestUpdatePayload(
            title="Updated Title",
            difficulty="hard",
            rewardXp=75,
            tags=["updated"]
        )
        
        result = update_quest("user-456", "quest-123", payload, 1)
        
        assert isinstance(result, QuestResponse)
        assert result.title == "Updated Title"
        assert result.difficulty == "hard"
        assert result.rewardXp == 75
        assert result.tags == ["updated"]
        assert result.version == 2
    
    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_update_quest_not_draft(self, mock_get_quest, mock_get_table):
        """Test quest update when quest is not in draft status."""
        # Mock current quest with active status
        mock_get_table.return_value = Mock()
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Active Quest",
            difficulty="medium",
            rewardXp=50,
            status="active",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        payload = QuestUpdatePayload(title="Updated Title")
        
        with pytest.raises(QuestPermissionError, match="Only draft quests can be updated"):
            update_quest("user-456", "quest-123", payload, 1)
    
    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_version_conflict(self, mock_get_table, mock_get_quest):
        """Test quest update with version conflict."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock current quest
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Original Title",
            difficulty="medium",
            rewardXp=50,
            status="draft",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        # Mock version conflict error
        mock_table.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'UpdateItem'
        )
        
        payload = QuestUpdatePayload(title="Updated Title")
        
        with pytest.raises(QuestVersionConflictError, match="Quest was modified by another operation"):
            update_quest("user-456", "quest-123", payload, 1)

    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_client_error_other(self, mock_get_table, mock_get_quest):
        """Test update_quest maps non-CCFE ClientError to QuestDBError."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        current_quest = QuestResponse(
            id="quest-123", userId="user-456", title="t", difficulty="medium", rewardXp=50,
            status="draft", category="Health", tags=[], privacy="private",
            createdAt=1, updatedAt=1, version=1, kind="linked", auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        mock_table.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ProvisionedThroughputExceededException', 'Message': 'throttled'}},
            'UpdateItem'
        )
        with pytest.raises(QuestDBError, match="Failed to update quest: throttled"):
            update_quest("user-456", "quest-123", QuestUpdatePayload(title="xxx"), 1)

    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_generic_exception(self, mock_get_table, mock_get_quest):
        """Test update_quest generic exception path."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        current_quest = QuestResponse(
            id="quest-123", userId="user-456", title="t", difficulty="medium", rewardXp=50,
            status="draft", category="Health", tags=[], privacy="private",
            createdAt=1, updatedAt=1, version=1, kind="linked", auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        mock_table.update_item.side_effect = Exception("db down")
        with pytest.raises(QuestDBError, match="Failed to update quest: db down"):
            update_quest("user-456", "quest-123", QuestUpdatePayload(title="xxx"), 1)

    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_update_quest_not_found_raises(self, mock_get_table, mock_get_quest):
        """Ensure QuestNotFoundError path is exercised."""
        mock_get_table.return_value = Mock()
        mock_get_quest.side_effect = QuestNotFoundError("missing")
        with pytest.raises(QuestNotFoundError):
            update_quest("user-456", "quest-123", QuestUpdatePayload(title="Updated"), 1)


class TestChangeQuestStatus:
    """Test quest status change operations."""
    
    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_change_status_draft_to_active(self, mock_get_table, mock_get_quest):
        """Test changing quest status from draft to active."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock current quest (linked quest needs linkedGoalIds and linkedTaskIds to start)
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Test Quest",
            difficulty="medium",
            rewardXp=50,
            status="draft",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            linkedGoalIds=["goal-1"],
            linkedTaskIds=["task-1"],
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        # Mock update response
        mock_table.update_item.return_value = {
            "Attributes": {
                "id": "quest-123",
                "userId": "user-456",
                "title": "Test Quest",
                "difficulty": "medium",
                "rewardXp": 50,
                "status": "active",
                "category": "Health",
                "tags": [],
                "privacy": "private",
                "createdAt": 1234567890000,
                "updatedAt": 1234567890001,
                "version": 2,
                "kind": "linked",
                "auditTrail": []
            }
        }
        
        result = change_quest_status("user-456", "quest-123", "active", "Starting quest")
        
        assert isinstance(result, QuestResponse)
        assert result.status == "active"
        assert result.version == 2
    
    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_change_status_invalid_transition(self, mock_get_quest, mock_get_table):
        """Test changing quest status with invalid transition."""
        # Mock current quest with completed status
        mock_get_table.return_value = Mock()
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Completed Quest",
            difficulty="medium",
            rewardXp=50,
            status="completed",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        with pytest.raises(QuestPermissionError, match="Cannot change status from completed to active"):
            change_quest_status("user-456", "quest-123", "active")

    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_change_status_not_found(self, mock_get_quest, mock_get_table):
        """Test change_quest_status when quest is not found."""
        mock_get_table.return_value = Mock()
        mock_get_quest.side_effect = QuestNotFoundError("nope")
        with pytest.raises(QuestNotFoundError):
            change_quest_status("user-456", "quest-123", "active")

    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_change_status_generic_exception(self, mock_get_quest, mock_get_table):
        """Test change_quest_status generic exception path."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        # Linked quest needs linkedGoalIds and linkedTaskIds to pass start validation
        current_quest = QuestResponse(
            id="quest-123", userId="user-456", title="t", difficulty="medium", rewardXp=50,
            status="draft", category="Health", tags=[], privacy="private",
            createdAt=1, updatedAt=1, version=1, kind="linked",
            linkedGoalIds=["goal-1"], linkedTaskIds=["task-1"], auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        mock_table.update_item.side_effect = Exception("boom")
        with pytest.raises(QuestDBError, match="Failed to change quest status: boom"):
            change_quest_status("user-456", "quest-123", "active")


class TestListUserQuests:
    """Test quest listing operations."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_success(self, mock_get_table):
        """Test successful quest listing."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock DynamoDB response
        mock_table.query.return_value = {
            "Items": [
                {
                    "id": "quest-1",
                    "userId": "user-456",
                    "title": "Quest 1",
                    "difficulty": "easy",
                    "rewardXp": 25,
                    "status": "draft",
                    "category": "Health",
                    "tags": [],
                    "privacy": "private",
                    "createdAt": 1234567890000,
                    "updatedAt": 1234567890000,
                    "version": 1,
                    "kind": "linked",
                    "auditTrail": []
                },
                {
                    "id": "quest-2",
                    "userId": "user-456",
                    "title": "Quest 2",
                    "difficulty": "hard",
                    "rewardXp": 100,
                    "status": "active",
                    "category": "Work",
                    "tags": ["work"],
                    "privacy": "private",
                    "createdAt": 1234567890001,
                    "updatedAt": 1234567890001,
                    "version": 1,
                    "kind": "linked",
                    "auditTrail": []
                }
            ]
        }
        
        result = list_user_quests("user-456")
        
        assert len(result) == 2
        assert all(isinstance(quest, QuestResponse) for quest in result)
        assert result[0].title == "Quest 2"  # Should be sorted by creation time (newest first)
        assert result[1].title == "Quest 1"
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_with_filters(self, mock_get_table):
        """Test quest listing with goal and status filters."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock DynamoDB response
        mock_table.query.return_value = {
            "Items": [
                {
                    "id": "quest-1",
                    "userId": "user-456",
                    "title": "Quest 1",
                    "difficulty": "easy",
                    "rewardXp": 25,
                    "status": "draft",
                    "category": "Health",
                    "tags": [],
                    "privacy": "private",
                    "createdAt": 1234567890000,
                    "updatedAt": 1234567890000,
                    "version": 1,
                    "kind": "linked",
                    "linkedGoalIds": ["goal-1"],
                    "auditTrail": []
                },
                {
                    "id": "quest-2",
                    "userId": "user-456",
                    "title": "Quest 2",
                    "difficulty": "hard",
                    "rewardXp": 100,
                    "status": "active",
                    "category": "Work",
                    "tags": ["work"],
                    "privacy": "private",
                    "createdAt": 1234567890001,
                    "updatedAt": 1234567890001,
                    "version": 1,
                    "kind": "linked",
                    "linkedGoalIds": ["goal-2"],
                    "auditTrail": []
                }
            ]
        }
        
        # Test with goal filter
        result = list_user_quests("user-456", goal_id="goal-1")
        assert len(result) == 1
        assert result[0].id == "quest-1"

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_status_mismatch_is_filtered(self, mock_get_table):
        """Exercise branch where status filter excludes items."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        mock_table.query.return_value = {"Items": [
            {"id": "q1", "userId": "user-456", "title": "A", "difficulty": "easy", "rewardXp": 10,
             "status": "active", "category": "Health", "privacy": "private", "createdAt": 2, "updatedAt": 2,
             "version": 1, "kind": "linked", "auditTrail": []}
        ]}
        result = list_user_quests("user-456", status="draft")
        assert result == []

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_list_user_quests_exception(self, mock_get_table):
        """Test list_user_quests exception path."""
        mock_table = Mock()
        mock_table.query.side_effect = Exception("query fail")
        mock_get_table.return_value = mock_table
        with pytest.raises(QuestDBError, match="Failed to list quests: query fail"):
            list_user_quests("user-456")

        # Now return normal data to continue flow
        mock_table.query.side_effect = None
        mock_table.query.return_value = {"Items": [
            {"id": "q1", "userId": "user-456", "title": "A", "difficulty": "easy", "rewardXp": 10,
             "status": "draft", "category": "Health", "privacy": "private", "createdAt": 2, "updatedAt": 2,
             "version": 1, "kind": "linked", "auditTrail": []}
        ]}
        result = list_user_quests("user-456", status="draft")
        assert len(result) == 1
        assert result[0].id == "q1"


class TestDeleteQuest:
    """Test quest deletion operations."""
    
    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_delete_quest_draft_success(self, mock_get_table, mock_get_quest):
        """Test successful deletion of draft quest."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock current quest
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Draft Quest",
            difficulty="medium",
            rewardXp=50,
            status="draft",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        result = delete_quest("user-456", "quest-123")
        
        assert result is True
        mock_table.delete_item.assert_called_once_with(
            Key={
                "PK": "USER#user-456",
                "SK": "QUEST#quest-123"
            }
        )
    
    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_delete_quest_not_draft_no_admin(self, mock_get_quest, mock_get_table):
        """Test deletion of non-draft quest without admin privileges."""
        mock_get_table.return_value = Mock()
        # Mock current quest with active status
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Active Quest",
            difficulty="medium",
            rewardXp=50,
            status="active",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        with pytest.raises(QuestPermissionError, match="Only draft quests can be deleted by non-admin users"):
            delete_quest("user-456", "quest-123", admin_user=False)
    
    @patch('app.db.quest_db.get_quest')
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_delete_quest_active_with_admin(self, mock_get_table, mock_get_quest):
        """Test deletion of active quest with admin privileges."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock current quest with active status
        current_quest = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Active Quest",
            difficulty="medium",
            rewardXp=50,
            status="active",
            category="Health",
            tags=[],
            privacy="private",
            createdAt=1234567890000,
            updatedAt=1234567890000,
            version=1,
            kind="linked",
            auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        
        result = delete_quest("user-456", "quest-123", admin_user=True)
        
        assert result is True
        mock_table.delete_item.assert_called_once()

    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_delete_quest_not_found_exception(self, mock_get_quest, mock_get_table):
        """Test delete_quest bubbles QuestNotFoundError."""
        mock_get_table.return_value = Mock()
        mock_get_quest.side_effect = QuestNotFoundError("missing")
        with pytest.raises(QuestNotFoundError):
            delete_quest("user-456", "quest-123")

    @patch('app.db.quest_db._get_dynamodb_table')
    @patch('app.db.quest_db.get_quest')
    def test_delete_quest_generic_exception(self, mock_get_quest, mock_get_table):
        """Test delete_quest generic exception path."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        current_quest = QuestResponse(
            id="quest-123", userId="user-456", title="t", difficulty="medium", rewardXp=50,
            status="draft", category="Health", tags=[], privacy="private",
            createdAt=1, updatedAt=1, version=1, kind="linked", auditTrail=[]
        )
        mock_get_quest.return_value = current_quest
        mock_table.delete_item.side_effect = Exception("delete fail")
        with pytest.raises(QuestDBError, match="Failed to delete quest: delete fail"):
            delete_quest("user-456", "quest-123")


class TestGetQuestById:
    """Test quest retrieval by ID (admin operations)."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_by_id_success(self, mock_get_table):
        """Test successful quest retrieval by ID."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock DynamoDB response
        mock_table.scan.return_value = {
            "Items": [
                {
                    "id": "quest-123",
                    "userId": "user-456",
                    "title": "Test Quest",
                    "difficulty": "medium",
                    "rewardXp": 50,
                    "status": "draft",
                    "category": "Health",
                    "tags": [],
                    "privacy": "private",
                    "createdAt": 1234567890000,
                    "updatedAt": 1234567890000,
                    "version": 1,
                    "kind": "linked",
                    "auditTrail": []
                }
            ]
        }
        
        result = get_quest_by_id("quest-123")
        
        assert isinstance(result, QuestResponse)
        assert result.id == "quest-123"
        assert result.title == "Test Quest"
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_by_id_not_found(self, mock_get_table):
        """Test quest retrieval by ID when quest doesn't exist."""
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock DynamoDB response with no items
        mock_table.scan.return_value = {"Items": []}
        
        result = get_quest_by_id("quest-123")
        
        assert result is None

    @patch('app.db.quest_db._get_dynamodb_table')
    def test_get_quest_by_id_exception(self, mock_get_table):
        """Test get_quest_by_id exception path."""
        mock_table = Mock()
        mock_table.scan.side_effect = Exception("scan boom")
        mock_get_table.return_value = mock_table
        with pytest.raises(QuestDBError, match="Failed to get quest by ID: scan boom"):
            get_quest_by_id("quest-123")


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    @patch('app.db.quest_db._get_dynamodb_table')
    def test_database_connection_error(self, mock_get_table):
        """Test handling of database connection errors."""
        mock_get_table.side_effect = BotoCoreError()
        
        with pytest.raises(QuestDBError):
            create_quest("user-123", QuestCreatePayload(title="Test", category="Health"))
    
    def test_invalid_payload(self):
        """Test handling of invalid payload."""
        with pytest.raises(Exception):  # Should raise validation error
            QuestCreatePayload(title="", category="Health")  # Empty title should fail validation
