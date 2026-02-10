"""
Comprehensive Quest Models Tests for Maximum Coverage.

This module provides extensive tests for Quest models to achieve high coverage.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import patch, Mock
from pydantic import ValidationError

# Mock all AWS dependencies before importing anything
with patch('app.settings.Settings') as mock_settings_class:
    mock_settings_instance = Mock()
    mock_settings_instance.aws_region = "us-east-2"
    mock_settings_instance.core_table = "gg_core_test"
    mock_settings_instance.jwt_secret = "test-secret"
    mock_settings_instance.allowed_origins = ["http://localhost:3000"]
    mock_settings_instance.cors_allow_credentials = True
    mock_settings_instance.cors_allow_headers = ["*"]
    mock_settings_instance.cors_allow_methods = ["*"]
    mock_settings_instance.cors_max_age = 600
    mock_settings_class.return_value = mock_settings_instance
    
    # Add the quest-service directory to Python path
    import sys
    from pathlib import Path
    quest_service_dir = Path(__file__).resolve().parents[2]
    if str(quest_service_dir) not in sys.path:
        sys.path.insert(0, str(quest_service_dir))
    
    from app.models.quest import (
        QuestCreatePayload, 
        QuestUpdatePayload, 
        QuestCancelPayload, 
        QuestResponse,
        QuestStatus,
        QUEST_CATEGORIES,
        MAX_TITLE_LENGTH,
        MIN_TITLE_LENGTH,
        MAX_DESCRIPTION_LENGTH,
        MAX_TAGS_COUNT,
        MAX_TAG_LENGTH,
        MAX_REWARD_XP,
        MIN_REWARD_XP,
        DEFAULT_REWARD_XP
    )


class TestQuestCreatePayloadComprehensive:
    """Comprehensive tests for QuestCreatePayload model."""
    
    def test_quest_create_payload_validation_rules(self):
        """Test all validation rules for QuestCreatePayload."""
        # Test title validation
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="", category="Health", difficulty="easy")
        assert "String should have at least 3 characters" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="a" * 101, category="Health", difficulty="easy")
        assert "String should have at most 100 characters" in str(exc_info.value)
        
        # Test description validation
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                description="a" * 501
            )
        assert "String should have at most 500 characters" in str(exc_info.value)
        
        # Test rewardXp validation
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                rewardXp=-1
            )
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                rewardXp=1001
            )
        assert "Input should be less than or equal to 1000" in str(exc_info.value)
        
        # Test tags validation
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                tags=["a" * 21]  # Tag too long
            )
        assert "Each tag must be no more than 20 characters" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                tags=["tag"] * 11  # Too many tags
            )
        assert "List should have at most 10 items" in str(exc_info.value)
        
        # Test targetCount validation
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid",
                category="Health",
                difficulty="easy",
                targetCount=-1
            )
        assert "Input should be greater than 0" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid",
                category="Health",
                difficulty="easy",
                targetCount=10001
            )
        assert "Target count must be no more than 10,000" in str(exc_info.value)
    
    def test_quest_create_payload_quantitative_validation(self):
        """Test quantitative quest validation rules."""
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        
        # Test quantitative quest without required fields
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Quantitative Quest",
                category="Health",
                difficulty="easy",
                kind="quantitative"
            )
        assert "targetCount is required for quantitative quests" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Quantitative Quest",
                category="Health",
                difficulty="easy",
                kind="quantitative",
                targetCount=5
            )
        assert "countScope is required for quantitative quests" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Quantitative Quest",
                category="Health",
                difficulty="easy",
                kind="quantitative",
                targetCount=5,
                startAt=future_time
            )
        assert "countScope is required for quantitative quests" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Quantitative Quest",
                category="Health",
                difficulty="easy",
                kind="quantitative",
                targetCount=5,
                countScope="completed_tasks"
            )
        assert "periodDays is required for quantitative quests" in str(exc_info.value)
        
        # Test valid quantitative quest
        payload = QuestCreatePayload(
            title="Quantitative Quest",
            category="Health",
            difficulty="easy",
            kind="quantitative",
            targetCount=5,
            countScope="completed_tasks",
            periodDays=1
        )
        assert payload.kind == "quantitative"
        assert payload.targetCount == 5
        assert payload.countScope == "completed_tasks"
        assert payload.periodDays == 1
    
    def test_quest_create_payload_deadline_validation(self):
        """Test deadline validation rules."""
        past_time = int((datetime.now().timestamp() - 86400) * 1000)  # 24 hours ago
        future_time = int((datetime.now().timestamp() + 86400) * 1000)  # 24 hours from now
        
        # Test past deadline (should fail)
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Quest with Past Deadline",
                category="Health",
                difficulty="easy",
                deadline=past_time
            )
        assert "Deadline must be in the future" in str(exc_info.value)
        
        # Test future deadline (should pass)
        payload = QuestCreatePayload(
            title="Quest with Future Deadline",
            category="Health",
            difficulty="easy",
            deadline=future_time
        )
        assert payload.deadline == future_time
    
    def test_quest_create_payload_serialization_methods(self):
        """Test serialization methods for QuestCreatePayload."""
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        
        payload = QuestCreatePayload(
            title="Serialization Test",
            category="Learning",
            difficulty="medium",
            description="Test description",
            rewardXp=75,
            tags=["test", "serialization"],
            privacy="public",
            kind="quantitative",
            targetCount=10,
            countScope="completed_goals",
            periodDays=1
        )
        
        # Test model_dump()
        data = payload.model_dump()
        assert data["title"] == "Serialization Test"
        assert data["category"] == "Learning"
        assert data["difficulty"] == "medium"
        assert data["description"] == "Test description"
        assert data["rewardXp"] == 75
        assert data["tags"] == ["test", "serialization"]
        assert data["privacy"] == "public"
        assert data["kind"] == "quantitative"
        assert data["targetCount"] == 10
        assert data["countScope"] == "completed_goals"
        assert data["periodDays"] == 1
        
        # Test model_dump_json()
        json_str = payload.model_dump_json()
        assert '"title":"Serialization Test"' in json_str
        assert '"category":"Learning"' in json_str
        assert '"kind":"quantitative"' in json_str
        
        # Test model_dump(exclude_none=True)
        data_excluded = payload.model_dump(exclude_none=True)
        assert "deadline" not in data_excluded  # None fields should be excluded
        
        # Test model_dump(exclude_unset=True)
        minimal_payload = QuestCreatePayload(
            title="Minimal",
            category="Health",
            difficulty="easy"
        )
        data_unset = minimal_payload.model_dump(exclude_unset=True)
        assert "description" not in data_unset  # Unset fields should be excluded


class TestQuestUpdatePayloadComprehensive:
    """Comprehensive tests for QuestUpdatePayload model."""
    
    def test_quest_update_payload_validation_rules(self):
        """Test validation rules for QuestUpdatePayload."""
        # Test title validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(title="")
        assert "String should have at least 3 characters" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(title="a" * 101)
        assert "String should have at most 100 characters" in str(exc_info.value)
        
        # Test description validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(description="a" * 501)
        assert "String should have at most 500 characters" in str(exc_info.value)
        
        # Test rewardXp validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(rewardXp=-1)
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(rewardXp=1001)
        assert "Input should be less than or equal to 1000" in str(exc_info.value)
        
        # Test tags validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(tags=["a" * 21])
        assert "Each tag must be no more than 20 characters" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(tags=["tag"] * 11)
        assert "List should have at most 10 items" in str(exc_info.value)
        
        # Test targetCount validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(targetCount=-1)
        assert "Input should be greater than 0" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(targetCount=10001)
        assert "Target count must be no more than 10,000" in str(exc_info.value)
    
    def test_quest_update_payload_serialization_methods(self):
        """Test serialization methods for QuestUpdatePayload."""
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        
        payload = QuestUpdatePayload(
            title="Updated Quest",
            description="Updated description",
            rewardXp=150,
            tags=["updated", "test"],
            privacy="public",
            targetCount=20,
            countScope="completed_tasks",
            deadline=future_time,
            periodDays=1
        )
        
        # Test model_dump()
        data = payload.model_dump()
        assert data["title"] == "Updated Quest"
        assert data["description"] == "Updated description"
        assert data["rewardXp"] == 150
        assert data["tags"] == ["updated", "test"]
        assert data["privacy"] == "public"
        assert data["targetCount"] == 20
        assert data["countScope"] == "completed_tasks"
        assert data["deadline"] == future_time
        assert data["periodDays"] == 1
        
        # Test model_dump_json()
        json_str = payload.model_dump_json()
        assert '"title":"Updated Quest"' in json_str
        assert '"rewardXp":150' in json_str
        
        # Test model_dump(exclude_none=True)
        data_excluded = payload.model_dump(exclude_none=True)
        # Some fields are None, so they should be excluded
        assert len(data_excluded) < len(data)
        assert "category" not in data_excluded  # None field should be excluded
        
        # Test with None values
        empty_payload = QuestUpdatePayload()
        data_empty = empty_payload.model_dump(exclude_none=True)
        assert len(data_empty) == 0  # All fields are None


class TestQuestCancelPayloadComprehensive:
    """Comprehensive tests for QuestCancelPayload model."""
    
    def test_quest_cancel_payload_validation_rules(self):
        """Test validation rules for QuestCancelPayload."""
        # Test reason validation - empty string should be sanitized to None
        payload = QuestCancelPayload(reason="")
        assert payload.reason is None
        
        # Test reason validation - too long
        with pytest.raises(ValidationError) as exc_info:
            QuestCancelPayload(reason="a" * 201)
        assert "String should have at most 200 characters" in str(exc_info.value)
        
        # Test valid reason
        payload = QuestCancelPayload(reason="Valid reason")
        assert payload.reason == "Valid reason"
    
    def test_quest_cancel_payload_serialization_methods(self):
        """Test serialization methods for QuestCancelPayload."""
        payload = QuestCancelPayload(reason="User requested cancellation")
        
        # Test model_dump()
        data = payload.model_dump()
        assert data["reason"] == "User requested cancellation"
        
        # Test model_dump_json()
        json_str = payload.model_dump_json()
        assert '"reason":"User requested cancellation"' in json_str


class TestQuestResponseComprehensive:
    """Comprehensive tests for QuestResponse model."""
    
    def test_quest_response_creation_with_all_fields(self):
        """Test QuestResponse creation with all possible fields."""
        timestamp = int(datetime.now().timestamp() * 1000)
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        future_deadline = int((datetime.now().timestamp() + 365 * 86400) * 1000)
        
        response = QuestResponse(
            id="comprehensive-quest-123",
            userId="user-123",
            title="Comprehensive Quest",
            description="A quest with all fields",
            category="Learning",
            difficulty="hard",
            status="active",
            rewardXp=200,
            privacy="public",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=3,
            kind="quantitative",
            tags=["learning", "comprehensive", "test"],
            targetCount=50,
            countScope="completed_goals",
            deadline=future_deadline,
            startedAt=future_time,
            periodDays=7,
            linkedGoalIds=["goal-1", "goal-2"],
            linkedTaskIds=["task-1", "task-2"],
            dependsOnQuestIds=["quest-1", "quest-2"],
            auditTrail=[
                {"action": "created", "timestamp": timestamp, "userId": "user-123"},
                {"action": "updated", "timestamp": timestamp + 1000, "userId": "user-123"}
            ]
        )
        
        assert response.id == "comprehensive-quest-123"
        assert response.userId == "user-123"
        assert response.title == "Comprehensive Quest"
        assert response.description == "A quest with all fields"
        assert response.category == "Learning"
        assert response.difficulty == "hard"
        assert response.status == "active"
        assert response.rewardXp == 200
        assert response.privacy == "public"
        assert response.createdAt == timestamp
        assert response.updatedAt == timestamp
        assert response.version == 3
        assert response.kind == "quantitative"
        assert response.tags == ["learning", "comprehensive", "test"]
        assert response.targetCount == 50
        assert response.countScope == "completed_goals"
        assert response.deadline == future_deadline
        assert response.startedAt == future_time
        assert response.periodDays == 7
        assert response.linkedGoalIds == ["goal-1", "goal-2"]
        assert response.linkedTaskIds == ["task-1", "task-2"]
        assert response.dependsOnQuestIds == ["quest-1", "quest-2"]
        assert len(response.auditTrail) == 2
    
    def test_quest_response_serialization_methods(self):
        """Test serialization methods for QuestResponse."""
        timestamp = int(datetime.now().timestamp() * 1000)
        
        response = QuestResponse(
            id="serialization-quest-123",
            userId="user-456",
            title="Serialization Quest",
            category="Work",
            difficulty="medium",
            status="draft",
            rewardXp=100,
            privacy="private",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=1,
            kind="linked"
        )
        
        # Test model_dump()
        data = response.model_dump()
        assert data["id"] == "serialization-quest-123"
        assert data["userId"] == "user-456"
        assert data["title"] == "Serialization Quest"
        assert data["category"] == "Work"
        assert data["difficulty"] == "medium"
        assert data["status"] == "draft"
        assert data["rewardXp"] == 100
        assert data["privacy"] == "private"
        assert data["createdAt"] == timestamp
        assert data["updatedAt"] == timestamp
        assert data["version"] == 1
        assert data["kind"] == "linked"
        
        # Test model_dump_json()
        json_str = response.model_dump_json()
        assert '"id":"serialization-quest-123"' in json_str
        assert '"title":"Serialization Quest"' in json_str
        assert '"status":"draft"' in json_str
        
        # Test model_dump(exclude_none=True)
        data_excluded = response.model_dump(exclude_none=True)
        assert "description" not in data_excluded  # None fields should be excluded


class TestQuestConstantsComprehensive:
    """Comprehensive tests for Quest constants and enums."""
    
    def test_quest_categories_constant(self):
        """Test QUEST_CATEGORIES constant."""
        expected_categories = [
            "Health", "Work", "Personal", "Learning", "Fitness", "Creative",
            "Financial", "Social", "Spiritual", "Hobby", "Travel", "Other"
        ]
        assert QUEST_CATEGORIES == expected_categories
        assert len(QUEST_CATEGORIES) == 12
    
    def test_quest_length_constants(self):
        """Test length-related constants."""
        assert MAX_TITLE_LENGTH == 100
        assert MIN_TITLE_LENGTH == 3
        assert MAX_DESCRIPTION_LENGTH == 500
        assert MAX_TAG_LENGTH == 20
        assert MAX_TAGS_COUNT == 10
    
    def test_quest_reward_constants(self):
        """Test reward-related constants."""
        assert MAX_REWARD_XP == 1000
        assert MIN_REWARD_XP == 0
        assert DEFAULT_REWARD_XP == 50
    
    def test_quest_status_literal_values(self):
        """Test QuestStatus literal values."""
        valid_statuses = ["draft", "active", "completed", "cancelled", "failed"]
        assert QuestStatus.__args__ == tuple(valid_statuses)
        
        # Test that all expected statuses are present
        for status in valid_statuses:
            assert status in QuestStatus.__args__


class TestQuestModelEdgeCasesComprehensive:
    """Comprehensive edge case tests for Quest models."""
    
    def test_quest_create_payload_boundary_values(self):
        """Test boundary values for QuestCreatePayload."""
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        
        # Test minimum valid values
        payload_min = QuestCreatePayload(
            title="a" * 3,  # Minimum title length
            category="Health",
            difficulty="easy",
            description="",  # Empty description
            rewardXp=0,  # Minimum reward
            tags=[],  # Empty tags
            privacy="private",
            kind="linked"
        )
        assert payload_min.title == "a" * 3
        assert payload_min.description is None
        assert payload_min.rewardXp == 0
        assert payload_min.tags == []
        
        # Test maximum valid values
        payload_max = QuestCreatePayload(
            title="a" * 100,  # Maximum title length
            category="Other",
            difficulty="hard",
            description="a" * 500,  # Maximum description length
            rewardXp=1000,  # Maximum reward
            tags=["a" * 20] * 10,  # Maximum tags
            privacy="public",
            kind="quantitative",
            targetCount=10000,  # Maximum target count
            countScope="completed_tasks",
            periodDays=7
        )
        assert payload_max.title == "a" * 100
        assert payload_max.description == "a" * 500
        assert payload_max.rewardXp == 1000
        assert len(payload_max.tags) == 10
        assert payload_max.targetCount == 10000
    
    def test_quest_response_with_minimal_fields(self):
        """Test QuestResponse with minimal required fields."""
        timestamp = int(datetime.now().timestamp() * 1000)
        
        response = QuestResponse(
            id="minimal-quest-123",
            userId="user-123",
            title="Minimal Quest",
            category="Health",
            difficulty="easy",
            status="draft",
            rewardXp=50,
            privacy="private",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=1,
            kind="linked"
        )
        
        # All required fields should be present
        assert response.id == "minimal-quest-123"
        assert response.userId == "user-123"
        assert response.title == "Minimal Quest"
        assert response.category == "Health"
        assert response.difficulty == "easy"
        assert response.status == "draft"
        assert response.rewardXp == 50
        assert response.privacy == "private"
        assert response.createdAt == timestamp
        assert response.updatedAt == timestamp
        assert response.version == 1
        assert response.kind == "linked"
        
        # Optional fields should be None or default values
        assert response.description is None
        assert response.tags == []
        assert response.targetCount is None
        assert response.countScope is None
        assert response.deadline is None
        assert response.startedAt is None
        assert response.periodDays is None
        assert response.linkedGoalIds is None
        assert response.linkedTaskIds is None
        assert response.dependsOnQuestIds is None
        assert response.auditTrail == []
    
    def test_quest_model_validation_error_messages(self):
        """Test that validation error messages are informative."""
        # Test title validation error message
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="ab", category="Health", difficulty="easy")
        error_message = str(exc_info.value)
        assert "String should have at least 3 characters" in error_message
        
        # Test rewardXp validation error message
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                rewardXp=1001
            )
        error_message = str(exc_info.value)
        assert "Input should be less than or equal to 1000" in error_message
        
        # Test quantitative quest validation error message
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Valid", 
                category="Health", 
                difficulty="easy",
                kind="quantitative"
            )
        error_message = str(exc_info.value)
        assert "targetCount is required for quantitative quests" in error_message