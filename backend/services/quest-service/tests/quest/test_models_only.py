"""
Models-Only Tests for Quest Service Coverage.

This module tests only the quest models without any AWS dependencies.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import patch, Mock

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


class TestQuestModelsCoverage:
    """Test Quest models for coverage."""
    
    def test_quest_create_payload_basic(self):
        """Test basic quest creation payload."""
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        assert payload.title == "Test Quest"
        assert payload.category == "Health"
        assert payload.difficulty == "medium"
        assert payload.rewardXp is None  # Optional, no default
        assert payload.tags == []
        assert payload.privacy == "private"
        assert payload.kind == "linked"
    
    def test_quest_create_payload_with_optional_fields(self):
        """Test quest creation payload with optional fields."""
        # Use future timestamps for validation
        future_time = int((datetime.now().timestamp() + 86400) * 1000)  # 24 hours from now
        
        payload = QuestCreatePayload(
            title="Full Quest",
            category="Work",
            difficulty="hard",
            description="A comprehensive quest",
            rewardXp=100,
            tags=["work", "important"],
            privacy="public",
            kind="quantitative",
            targetCount=5,
            countScope="any",
            periodDays=7  # Required for quantitative quests
        )
        
        assert payload.title == "Full Quest"
        assert payload.description == "A comprehensive quest"
        assert payload.rewardXp == 100
        assert payload.tags == ["work", "important"]
        assert payload.privacy == "public"
        assert payload.kind == "quantitative"
        assert payload.targetCount == 5
        assert payload.countScope == "any"
    
    def test_quest_create_payload_serialization(self):
        """Test quest creation payload serialization."""
        payload = QuestCreatePayload(
            title="Serialization Test",
            category="Learning",
            difficulty="medium",
            rewardXp=75
        )
        
        # Test dict conversion
        payload_dict = payload.model_dump()
        assert payload_dict['title'] == "Serialization Test"
        assert payload_dict['category'] == "Learning"
        assert payload_dict['difficulty'] == "medium"
        assert payload_dict['rewardXp'] == 75
        
        # Test JSON serialization
        json_str = payload.model_dump_json()
        assert '"title":"Serialization Test"' in json_str
        assert '"category":"Learning"' in json_str
    
    def test_quest_update_payload_empty(self):
        """Test empty quest update payload."""
        payload = QuestUpdatePayload()
        
        assert payload.title is None
        assert payload.description is None
        assert payload.rewardXp is None
        assert payload.tags is None
        assert payload.privacy is None
    
    def test_quest_update_payload_with_fields(self):
        """Test quest update payload with fields."""
        payload = QuestUpdatePayload(
            title="Updated Quest",
            description="Updated description",
            rewardXp=200,
            tags=["updated", "test"],
            privacy="public"
        )
        
        assert payload.title == "Updated Quest"
        assert payload.description == "Updated description"
        assert payload.rewardXp == 200
        assert payload.tags == ["updated", "test"]
        assert payload.privacy == "public"
    
    def test_quest_update_payload_serialization(self):
        """Test quest update payload serialization."""
        payload = QuestUpdatePayload(
            title="Update Test",
            description="Test description",
            rewardXp=150
        )
        
        # Test dict conversion
        payload_dict = payload.model_dump()
        assert payload_dict['title'] == "Update Test"
        assert payload_dict['description'] == "Test description"
        assert payload_dict['rewardXp'] == 150
    
    def test_quest_cancel_payload_creation(self):
        """Test quest cancel payload creation."""
        payload = QuestCancelPayload(
            reason="User requested cancellation"
        )
        
        assert payload.reason == "User requested cancellation"
    
    def test_quest_cancel_payload_serialization(self):
        """Test quest cancel payload serialization."""
        payload = QuestCancelPayload(
            reason="Test cancellation"
        )
        
        payload_dict = payload.model_dump()
        assert payload_dict['reason'] == "Test cancellation"
    
    def test_quest_response_creation(self):
        """Test quest response creation."""
        # Use integer timestamps instead of strings
        timestamp = int(datetime.now().timestamp() * 1000)
        
        response = QuestResponse(
            id="test-quest-123",
            questId="test-quest-123",
            userId="user-123",
            title="Test Quest",
            category="Health",
            difficulty="medium",
            status="draft",
            rewardXp=50,
            privacy="private",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=1,
            kind="linked"
        )
        
        assert response.id == "test-quest-123"
        assert response.questId == "test-quest-123"
        assert response.userId == "user-123"
        assert response.title == "Test Quest"
        assert response.category == "Health"
        assert response.difficulty == "medium"
        assert response.status == "draft"
        assert response.rewardXp == 50
        assert response.privacy == "private"
        assert response.createdAt == timestamp
        assert response.updatedAt == timestamp
        assert response.version == 1
        assert response.kind == "linked"
    
    def test_quest_response_serialization(self):
        """Test quest response serialization."""
        timestamp = int(datetime.now().timestamp() * 1000)
        
        response = QuestResponse(
            id="response-quest-123",
            questId="response-quest-123",
            userId="user-456",
            title="Response Quest",
            category="Work",
            difficulty="hard",
            status="active",
            rewardXp=100,
            privacy="public",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=1,
            kind="quantitative"
        )
        
        response_dict = response.model_dump()
        assert response_dict['id'] == "response-quest-123"
        assert response_dict['questId'] == "response-quest-123"
        assert response_dict['userId'] == "user-456"
        assert response_dict['title'] == "Response Quest"
        assert response_dict['category'] == "Work"
        assert response_dict['difficulty'] == "hard"
        assert response_dict['status'] == "active"
        assert response_dict['rewardXp'] == 100
        assert response_dict['privacy'] == "public"
        assert response_dict['kind'] == "quantitative"
    
    def test_quest_status_enum(self):
        """Test QuestStatus literal values (draft, active, completed, cancelled, failed)."""
        assert "draft" in QuestStatus.__args__
        assert "active" in QuestStatus.__args__
        assert "completed" in QuestStatus.__args__
        assert "cancelled" in QuestStatus.__args__
        assert "failed" in QuestStatus.__args__
    
    def test_quest_constants(self):
        """Test quest constants."""
        assert QUEST_CATEGORIES == [
            "Health", "Work", "Personal", "Learning", "Fitness", "Creative",
            "Financial", "Social", "Spiritual", "Hobby", "Travel", "Other"
        ]
        assert MAX_TITLE_LENGTH == 100
        assert MIN_TITLE_LENGTH == 3
        assert MAX_DESCRIPTION_LENGTH == 500
        assert MAX_TAGS_COUNT == 10
        assert MAX_TAG_LENGTH == 20
        assert MAX_REWARD_XP == 1000
        assert MIN_REWARD_XP == 0
        assert DEFAULT_REWARD_XP == 50


class TestQuestValidationCoverage:
    """Test Quest validation methods for coverage."""
    
    def test_quest_create_payload_title_validation(self):
        """Test title validation in QuestCreatePayload."""
        # Test valid title
        payload = QuestCreatePayload(
            title="Valid Title",
            category="Health",
            difficulty="easy"
        )
        assert payload.title == "Valid Title"
        
        # Test title with extra whitespace (should be cleaned)
        payload = QuestCreatePayload(
            title="  Valid   Title  ",
            category="Health",
            difficulty="easy"
        )
        assert payload.title == "Valid Title"
    
    def test_quest_create_payload_category_validation(self):
        """Test category validation in QuestCreatePayload."""
        # Test valid category
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.category == "Health"
    
    def test_quest_create_payload_difficulty_validation(self):
        """Test difficulty validation in QuestCreatePayload."""
        # Test valid difficulties
        for difficulty in ["easy", "medium", "hard"]:
            payload = QuestCreatePayload(
                title="Test Quest",
                category="Health",
                difficulty=difficulty
            )
            assert payload.difficulty == difficulty
    
    def test_quest_create_payload_reward_xp_validation(self):
        """Test reward XP validation in QuestCreatePayload."""
        # Test valid reward XP
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            rewardXp=500
        )
        assert payload.rewardXp == 500
        
        # Test optional reward XP (no default)
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.rewardXp is None
    
    def test_quest_create_payload_tags_validation(self):
        """Test tags validation in QuestCreatePayload."""
        # Test valid tags
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            tags=["health", "fitness", "wellness"]
        )
        assert payload.tags == ["health", "fitness", "wellness"]
        
        # Test empty tags
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.tags == []
    
    def test_quest_create_payload_privacy_validation(self):
        """Test privacy validation in QuestCreatePayload."""
        # Test valid privacy settings
        for privacy in ["public", "followers", "private"]:
            payload = QuestCreatePayload(
                title="Test Quest",
                category="Health",
                difficulty="easy",
                privacy=privacy
            )
            assert payload.privacy == privacy
    
    def test_quest_create_payload_kind_validation(self):
        """Test kind validation in QuestCreatePayload."""
        # Test linked kind (no additional requirements)
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="linked"
        )
        assert payload.kind == "linked"
        
        # Test quantitative kind (requires targetCount, countScope, periodDays)
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="quantitative",
            targetCount=5,
            countScope="any",
            periodDays=7
        )
        assert payload.kind == "quantitative"
    
    def test_quest_create_payload_count_scope_validation(self):
        """Test count scope validation in QuestCreatePayload."""
        # Valid count scopes: completed_tasks, completed_goals, any (no 'linked')
        for scope in ["any", "completed_tasks", "completed_goals"]:
            payload = QuestCreatePayload(
                title="Test Quest",
                category="Health",
                difficulty="easy",
                countScope=scope
            )
            assert payload.countScope == scope
    
    def test_quest_create_payload_target_count_validation(self):
        """Test target count validation in QuestCreatePayload."""
        # Test valid target count
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            targetCount=10
        )
        assert payload.targetCount == 10
        
        # Test no target count
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.targetCount is None
    
    def test_quest_create_payload_deadline_validation(self):
        """Test deadline validation in QuestCreatePayload."""
        # Test valid deadline (must be in the future)
        future_deadline = int((datetime.now().timestamp() + 86400) * 1000)  # 24 hours from now
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            deadline=future_deadline
        )
        assert payload.deadline == future_deadline
        
        # Test no deadline
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.deadline is None
    
    def test_quest_create_payload_period_days_validation(self):
        """Test period days validation in QuestCreatePayload (quantitative)."""
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="quantitative",
            targetCount=5,
            countScope="any",
            periodDays=7
        )
        assert payload.periodDays == 7
        
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="linked"
        )
        assert payload.periodDays is None


class TestQuestModelEdgeCases:
    """Test Quest model edge cases for coverage."""
    
    def test_quest_create_payload_minimal_fields(self):
        """Test quest creation payload with minimal required fields."""
        payload = QuestCreatePayload(
            title="Minimal Quest",
            category="Health",
            difficulty="easy"
        )
        
        assert payload.title == "Minimal Quest"
        assert payload.category == "Health"
        assert payload.difficulty == "easy"
        assert payload.description is None
        assert payload.rewardXp is None  # Optional, no default
        assert payload.tags == []  # Default
        assert payload.privacy == "private"  # Default
        assert payload.kind == "linked"  # Default
        assert payload.targetCount is None
        assert payload.countScope is None
        assert payload.deadline is None
        assert payload.periodDays is None
    
    def test_quest_create_payload_maximal_fields(self):
        """Test quest creation payload with all fields (periodDays, countScope: any/completed_*)."""
        future_time = int((datetime.now().timestamp() + 86400) * 1000)  # 24 hours from now
        deadline = future_time
        
        payload = QuestCreatePayload(
            title="Maximal Quest",
            category="Work",
            difficulty="hard",
            description="A comprehensive quest with all fields",
            rewardXp=1000,
            tags=["work", "important", "urgent", "project"],
            privacy="public",
            kind="quantitative",
            targetCount=25,
            countScope="any",
            deadline=deadline,
            periodDays=7
        )
        
        assert payload.title == "Maximal Quest"
        assert payload.category == "Work"
        assert payload.difficulty == "hard"
        assert payload.description == "A comprehensive quest with all fields"
        assert payload.rewardXp == 1000
        assert payload.tags == ["work", "important", "urgent", "project"]
        assert payload.privacy == "public"
        assert payload.kind == "quantitative"
        assert payload.targetCount == 25
        assert payload.countScope == "any"
        assert payload.deadline == deadline
        assert payload.periodDays == 7
    
    def test_quest_update_payload_partial_update(self):
        """Test quest update payload with partial fields."""
        payload = QuestUpdatePayload(
            title="Updated Title Only"
        )
        
        assert payload.title == "Updated Title Only"
        assert payload.description is None
        assert payload.rewardXp is None
        assert payload.tags is None
        assert payload.privacy is None
        assert payload.targetCount is None
        assert payload.countScope is None
        assert payload.deadline is None
        assert payload.periodDays is None
    
    def test_quest_response_with_optional_fields(self):
        """Test quest response with optional fields."""
        # Use future timestamps for validation
        future_time = int((datetime.now().timestamp() + 86400) * 1000)
        future_deadline = int((datetime.now().timestamp() + 365 * 86400) * 1000)  # 1 year from now
        timestamp = int(datetime.now().timestamp() * 1000)
        
        response = QuestResponse(
            id="optional-quest-123",
            userId="user-789",
            title="Optional Fields Quest",
            category="Learning",
            difficulty="medium",
            status="active",
            rewardXp=75,
            privacy="followers",
            createdAt=timestamp,
            updatedAt=timestamp,
            version=2,
            kind="quantitative",
            description="A quest with optional fields",
            tags=["learning", "optional"],
            targetCount=5,
            countScope="any",
            deadline=future_deadline,
            startedAt=future_time,
            periodDays=7
        )
        
        assert response.id == "optional-quest-123"
        assert response.questId == "optional-quest-123"
        assert response.userId == "user-789"
        assert response.title == "Optional Fields Quest"
        assert response.category == "Learning"
        assert response.difficulty == "medium"
        assert response.status == "active"
        assert response.rewardXp == 75
        assert response.privacy == "followers"
        assert response.createdAt == timestamp
        assert response.updatedAt == timestamp
        assert response.version == 2
        assert response.kind == "quantitative"
        assert response.description == "A quest with optional fields"
        assert response.tags == ["learning", "optional"]
        assert response.targetCount == 5
        assert response.countScope == "any"
        assert response.deadline == future_deadline
        assert response.startedAt == future_time
        assert response.periodDays == 7
