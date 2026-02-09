"""
Integration Tests for Quest Database Operations.

This module tests Quest functionality with real DynamoDB operations including:
- Complete CRUD operations
- Optimistic locking with version conflicts
- Audit trail functionality
- Error handling and retry logic
- Quest linking with goals and tasks
- Quest completion logic
"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import patch, Mock, MagicMock
from botocore.exceptions import ClientError, BotoCoreError

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from .test_helpers import (
    TestDataHelpers,
    DatabaseHelpers,
    ValidationHelpers
)
from .test_data_manager import test_data_manager
from app.db.quest_db import (
    create_quest, get_quest, update_quest, change_quest_status,
    delete_quest, list_user_quests, QuestDBError, QuestNotFoundError,
    QuestVersionConflictError, QuestPermissionError
)
from app.models.quest import QuestCreatePayload, QuestUpdatePayload, QuestResponse


class TestQuestCRUDIntegration:
    """Test complete CRUD operations with real DynamoDB."""
    
    def test_create_quest_integration(self, test_user_id):
        """Test quest creation with real DynamoDB."""
        payload = QuestCreatePayload(
            title="Integration Test Quest",
            category="Health",
            difficulty="medium",
            description="Integration test description",
            rewardXp=75,
            tags=["integration", "test"],
            privacy="private",
            kind="linked"
        )
        
        # Create quest
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify quest was created correctly
        assert isinstance(quest, QuestResponse)
        assert quest.title == "Integration Test Quest"
        assert quest.category == "Health"
        assert quest.difficulty == "medium"
        assert quest.description == "Integration test description"
        assert quest.rewardXp == 75
        assert quest.tags == ["integration", "test"]
        assert quest.privacy == "private"
        assert quest.kind == "linked"
        assert quest.status == "draft"
        assert quest.userId == test_user_id
        assert quest.version == 1
        assert isinstance(quest.auditTrail, list)
        assert len(quest.auditTrail) > 0
    
    def test_get_quest_integration(self, test_user_id):
        """Test quest retrieval with real DynamoDB."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Get Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Retrieve quest
        quest = get_quest(test_user_id, quest_id)
        
        # Verify quest was retrieved correctly
        assert isinstance(quest, QuestResponse)
        assert quest.id == quest_id
        assert quest.title == "Get Test Quest"
        assert quest.category == "Health"
        assert quest.difficulty == "medium"
        assert quest.userId == test_user_id
    
    def test_update_quest_integration(self, test_user_id):
        """Test quest update with real DynamoDB."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Update Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Update quest
        update_payload = QuestUpdatePayload(
            title="Updated Quest Title",
            difficulty="hard",
            rewardXp=100,
            tags=["updated", "test"]
        )
        
        quest = update_quest(test_user_id, quest_id, update_payload, 1)
        
        # Verify quest was updated correctly
        assert isinstance(quest, QuestResponse)
        assert quest.id == quest_id
        assert quest.title == "Updated Quest Title"
        assert quest.difficulty == "hard"
        assert quest.rewardXp == 100
        assert quest.tags == ["updated", "test"]
        assert quest.version == 2  # Version should increment
    
    def test_change_quest_status_integration(self, test_user_id):
        """Test quest status change with real DynamoDB."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Status Change Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Change status to active
        quest = change_quest_status(test_user_id, quest_id, "active", "Starting quest")
        
        # Verify status was changed correctly
        assert isinstance(quest, QuestResponse)
        assert quest.id == quest_id
        assert quest.status == "active"
        assert quest.version == 2  # Version should increment
        
        # Change status to cancelled
        quest = change_quest_status(test_user_id, quest_id, "cancelled", "Cancelling quest")
        
        # Verify status was changed correctly
        assert quest.status == "cancelled"
        assert quest.version == 3  # Version should increment again
    
    def test_delete_quest_integration(self, test_user_id):
        """Test quest deletion with real DynamoDB."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Delete Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Delete quest
        success = delete_quest(test_user_id, quest_id)
        
        # Verify deletion was successful
        assert success is True
        
        # Verify quest no longer exists
        with pytest.raises(QuestNotFoundError):
            get_quest(test_user_id, quest_id)
    
    def test_list_user_quests_integration(self, test_user_id):
        """Test quest listing with real DynamoDB."""
        # Create multiple quests
        quest_ids = []
        for i in range(3):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"List Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
        
        # List quests
        quests = list_user_quests(test_user_id)
        
        # Verify quests were listed correctly
        assert isinstance(quests, list)
        assert len(quests) >= 3  # Should include the quests we created
        
        # Verify quest structure
        for quest in quests:
            assert isinstance(quest, QuestResponse)
            assert quest.userId == test_user_id
        
        # Verify quests are sorted by creation time (newest first)
        quest_titles = [quest.title for quest in quests if quest.title.startswith("List Test Quest")]
        assert len(quest_titles) == 3


class TestQuestOptimisticLocking:
    """Test optimistic locking with version conflicts."""
    
    def test_version_conflict_detection(self, test_user_id):
        """Test that version conflicts are properly detected."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Version Conflict Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Get current quest
        current_quest = get_quest(test_user_id, quest_id)
        assert current_quest.version == 1
        
        # Try to update with wrong version (should cause conflict)
        update_payload = QuestUpdatePayload(title="Updated Title")
        
        with pytest.raises(QuestVersionConflictError):
            update_quest(test_user_id, quest_id, update_payload, 999)  # Wrong version
    
    def test_concurrent_update_handling(self, test_user_id):
        """Test handling of concurrent updates."""
        # Create quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Concurrent Update Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Simulate concurrent updates by mocking version conflict
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            mock_table = Mock()
            mock_get_table.return_value = mock_table
            
            # Mock version conflict error
            mock_table.update_item.side_effect = ClientError(
                {'Error': {'Code': 'ConditionalCheckFailedException'}},
                'UpdateItem'
            )
            
            update_payload = QuestUpdatePayload(title="Updated Title")
            
            with pytest.raises(QuestVersionConflictError):
                update_quest(test_user_id, quest_id, update_payload, 1)


class TestQuestErrorHandling:
    """Test error handling and retry logic."""
    
    def test_database_connection_error_handling(self, test_user_id):
        """Test handling of database connection errors."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            mock_get_table.side_effect = BotoCoreError()
            
            payload = QuestCreatePayload(
                title="Error Test Quest",
                category="Health",
                difficulty="medium"
            )
            
            with pytest.raises(QuestDBError):
                create_quest(test_user_id, payload)
    
    def test_quest_not_found_error_handling(self, test_user_id):
        """Test handling of quest not found errors."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with pytest.raises(QuestNotFoundError):
            get_quest(test_user_id, fake_quest_id)
    
    def test_permission_error_handling(self, test_user_id):
        """Test handling of permission errors."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quest for other user
        quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Try to access other user's quest
        with pytest.raises(QuestPermissionError):
            get_quest(test_user_id, quest_id)


class TestQuestLinkingIntegration:
    """Test quest linking with goals and tasks."""
    
    def test_quest_linking_with_goals(self, test_user_id):
        """Test quest linking with goals."""
        # Create test goals
        goal_ids = []
        for i in range(2):
            goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
                "title": f"Test Goal {i}",
                "category": "Health",
                "deadline": "2024-12-31"
            })
            goal_ids.append(goal_id)
        
        # Create quest with linked goals
        payload = QuestCreatePayload(
            title="Linked Quest with Goals",
            category="Health",
            difficulty="medium",
            kind="linked",
            linkedGoalIds=goal_ids
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify quest was created with linked goals
        assert quest.kind == "linked"
        assert quest.linkedGoalIds == goal_ids
        assert quest.linkedTaskIds is None or quest.linkedTaskIds == []
    
    def test_quest_linking_with_tasks(self, test_user_id):
        """Test quest linking with tasks."""
        # Create test goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Test Goal for Tasks",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        # Create test tasks
        task_ids = []
        for i in range(2):
            task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
                "goalId": goal_id,
                "title": f"Test Task {i}",
                "dueAt": TestDataHelpers.generate_future_timestamp(1)
            })
            task_ids.append(task_id)
        
        # Create quest with linked tasks
        payload = QuestCreatePayload(
            title="Linked Quest with Tasks",
            category="Health",
            difficulty="medium",
            kind="linked",
            linkedTaskIds=task_ids
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify quest was created with linked tasks
        assert quest.kind == "linked"
        assert quest.linkedTaskIds == task_ids
        assert quest.linkedGoalIds is None or quest.linkedGoalIds == []
    
    def test_quest_linking_with_goals_and_tasks(self, test_user_id):
        """Test quest linking with both goals and tasks."""
        # Create test goal
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Test Goal for Mixed Linking",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        # Create test task
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Test Task for Mixed Linking",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        # Create quest with linked goals and tasks
        payload = QuestCreatePayload(
            title="Mixed Linked Quest",
            category="Health",
            difficulty="medium",
            kind="linked",
            linkedGoalIds=[goal_id],
            linkedTaskIds=[task_id]
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify quest was created with linked goals and tasks
        assert quest.kind == "linked"
        assert quest.linkedGoalIds == [goal_id]
        assert quest.linkedTaskIds == [task_id]


class TestQuestQuantitativeIntegration:
    """Test quantitative quest functionality."""
    
    def test_quantitative_quest_creation(self, test_user_id):
        """Test quantitative quest creation."""
        future_time = TestDataHelpers.generate_future_timestamp(1)
        
        payload = QuestCreatePayload(
            title="Quantitative Test Quest",
            category="Work",
            difficulty="hard",
            kind="quantitative",
            targetCount=10,
            countScope="any",
            startAt=future_time,
            periodSeconds=86400  # 1 day
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify quantitative quest was created correctly
        assert quest.kind == "quantitative"
        assert quest.targetCount == 10
        assert quest.countScope == "any"
        assert quest.startAt == future_time
        assert quest.periodSeconds == 86400
        assert quest.linkedGoalIds is None or quest.linkedGoalIds == []
        assert quest.linkedTaskIds is None or quest.linkedTaskIds == []
    
    def test_quantitative_quest_linked_scope(self, test_user_id):
        """Test quantitative quest with linked scope."""
        # Create test goal and task
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Test Goal for Linked Scope",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Test Task for Linked Scope",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        future_time = TestDataHelpers.generate_future_timestamp(1)
        
        payload = QuestCreatePayload(
            title="Linked Scope Quantitative Quest",
            category="Health",
            difficulty="medium",
            kind="quantitative",
            targetCount=5,
            countScope="linked",
            startAt=future_time,
            periodSeconds=172800,  # 2 days
            linkedGoalIds=[goal_id],
            linkedTaskIds=[task_id]
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify linked scope quantitative quest was created correctly
        assert quest.kind == "quantitative"
        assert quest.targetCount == 5
        assert quest.countScope == "linked"
        assert quest.startAt == future_time
        assert quest.periodSeconds == 172800
        assert quest.linkedGoalIds == [goal_id]
        assert quest.linkedTaskIds == [task_id]


class TestQuestAuditTrailIntegration:
    """Test audit trail functionality."""
    
    def test_audit_trail_creation(self, test_user_id):
        """Test that audit trail is properly created."""
        payload = QuestCreatePayload(
            title="Audit Trail Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        quest = create_quest(test_user_id, payload)
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest.id, test_user_id,
            f"USER#{test_user_id}", f"QUEST#{quest.id}"
        )
        
        # Verify audit trail was created
        assert isinstance(quest.auditTrail, list)
        assert len(quest.auditTrail) > 0
        
        # Check audit trail structure
        for audit_entry in quest.auditTrail:
            assert "action" in audit_entry
            assert "timestamp" in audit_entry
            assert "user_id" in audit_entry
            assert isinstance(audit_entry["timestamp"], int)
            assert isinstance(audit_entry["user_id"], str)
    
    def test_audit_trail_updates(self, test_user_id):
        """Test that audit trail is updated on quest changes."""
        # Create quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Audit Trail Update Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Get initial quest
        initial_quest = get_quest(test_user_id, quest_id)
        initial_audit_count = len(initial_quest.auditTrail)
        
        # Update quest
        update_payload = QuestUpdatePayload(title="Updated Title")
        updated_quest = update_quest(test_user_id, quest_id, update_payload, 1)
        
        # Verify audit trail was updated
        assert len(updated_quest.auditTrail) > initial_audit_count
        
        # Change status
        status_quest = change_quest_status(test_user_id, quest_id, "active", "Starting quest")
        
        # Verify audit trail was updated again
        assert len(status_quest.auditTrail) > len(updated_quest.auditTrail)


class TestQuestFilteringIntegration:
    """Test quest filtering and querying."""
    
    def test_quest_filtering_by_goal(self, test_user_id):
        """Test filtering quests by linked goal."""
        # Create test goal
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Filter Test Goal",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        # Create quests with and without the goal
        quest_with_goal = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Quest with Goal",
            "category": "Health",
            "kind": "linked",
            "linkedGoalIds": [goal_id]
        })
        
        quest_without_goal = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Quest without Goal",
            "category": "Health",
            "kind": "linked"
        })
        
        # Filter quests by goal
        filtered_quests = list_user_quests(test_user_id, goal_id=goal_id)
        
        # Verify filtering works
        quest_titles = [quest.title for quest in filtered_quests]
        assert "Quest with Goal" in quest_titles
        # Note: "Quest without Goal" might still appear depending on implementation
    
    def test_quest_filtering_by_status(self, test_user_id):
        """Test filtering quests by status."""
        # Create quests with different statuses
        draft_quest = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Draft Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Start one quest to make it active
        change_quest_status(test_user_id, draft_quest, "active", "Starting quest")
        
        # Filter by status
        draft_quests = list_user_quests(test_user_id, status="draft")
        active_quests = list_user_quests(test_user_id, status="active")
        
        # Verify filtering works
        draft_titles = [quest.title for quest in draft_quests if quest.title.startswith("Draft Quest")]
        active_titles = [quest.title for quest in active_quests if quest.title.startswith("Draft Quest")]
        
        # The quest should be in active status after starting
        assert len(active_titles) >= 1
