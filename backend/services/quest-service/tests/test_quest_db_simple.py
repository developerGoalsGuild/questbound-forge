"""
Simple tests for Quest DynamoDB operations.

This module tests the core functionality without complex AWS mocking.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

# Mock the settings and logging before importing
with patch('app.db.quest_db.Settings') as mock_settings_class:
    mock_settings = Mock()
    mock_settings.aws_region = 'us-east-1'
    mock_settings.core_table_name = 'test-table'
    mock_settings_class.return_value = mock_settings
    
    with patch('app.db.quest_db.get_structured_logger') as mock_logger:
        mock_logger.return_value = Mock()
        
        from app.db.quest_db import (
            _build_quest_item,
            _quest_item_to_response,
            QuestDBError,
            QuestNotFoundError,
            QuestVersionConflictError,
            QuestPermissionError
        )
        from app.models.quest import QuestCreatePayload, QuestResponse


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
            countScope="any",
            periodDays=1
        )
        
        item = _build_quest_item(user_id, payload)
        
        assert item["kind"] == "quantitative"
        assert item["targetCount"] == 10
        assert item["countScope"] == "any"
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
            "countScope": "any",
            "startedAt": 1234567890000,
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
        assert response.countScope == "any"
        assert response.startedAt == 1234567890000
        assert response.periodDays == 1
        assert response.auditTrail == []


class TestQuestDBExceptions:
    """Test custom exception classes."""
    
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


class TestQuestCreatePayload:
    """Test QuestCreatePayload validation."""
    
    def test_valid_linked_quest(self):
        """Test valid linked quest creation."""
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
        
        assert payload.title == "Test Quest"
        assert payload.category == "Health"
        assert payload.difficulty == "medium"
        assert payload.description == "Test description"
        assert payload.rewardXp == 75
        assert payload.tags == ["test", "quest"]
        assert payload.privacy == "private"
        assert payload.kind == "linked"
        assert payload.linkedGoalIds == ["01234567-89ab-cdef-0123-456789abcdef", "01234567-89ab-cdef-0123-456789abcde0"]
        assert payload.linkedTaskIds == ["01234567-89ab-cdef-0123-456789abcde1"]
    
    def test_valid_quantitative_quest(self):
        """Test valid quantitative quest creation."""
        payload = QuestCreatePayload(
            title="Quantitative Quest",
            category="Work",
            difficulty="hard",
            kind="quantitative",
            targetCount=10,
            countScope="any",
            periodDays=1
        )
        
        assert payload.title == "Quantitative Quest"
        assert payload.category == "Work"
        assert payload.difficulty == "hard"
        assert payload.kind == "quantitative"
        assert payload.targetCount == 10
        assert payload.countScope == "any"
        assert payload.periodDays == 1
    
    def test_minimal_quest(self):
        """Test minimal quest creation with defaults."""
        payload = QuestCreatePayload(
            title="Minimal Quest",
            category="Personal"
        )
        
        assert payload.title == "Minimal Quest"
        assert payload.category == "Personal"
        assert payload.difficulty == "medium"  # default
        assert payload.rewardXp is None  # optional; auto-calculated at create
        assert payload.tags == []  # default
        assert payload.privacy == "private"  # default
        assert payload.kind == "linked"  # default
        assert payload.description is None
        assert payload.deadline is None
        assert payload.linkedGoalIds is None
        assert payload.linkedTaskIds is None
        assert payload.dependsOnQuestIds is None
        assert payload.targetCount is None
        assert payload.countScope is None
        assert payload.periodDays is None
