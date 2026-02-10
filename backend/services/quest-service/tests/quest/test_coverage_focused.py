"""
Focused Unit Tests for Quest Service Coverage.

This module provides targeted unit tests to achieve 90% coverage.
"""

import pytest
import os
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timezone

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from app.models.quest import QuestCreatePayload, QuestUpdatePayload, QuestCancelPayload, QuestResponse


class TestQuestCreatePayloadCoverage:
    """Test QuestCreatePayload for coverage."""
    
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
        assert payload.rewardXp is None  # Optional; auto-calculated at create
        assert payload.tags == []
        assert payload.privacy == "private"
        assert payload.kind == "linked"
    
    def test_quest_create_payload_with_optional_fields(self):
        """Test quest creation payload with optional fields."""
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
            periodDays=7
        )
        
        assert payload.title == "Full Quest"
        assert payload.description == "A comprehensive quest"
        assert payload.rewardXp == 100
        assert payload.tags == ["work", "important"]
        assert payload.privacy == "public"
        assert payload.kind == "quantitative"
        assert payload.targetCount == 5
        assert payload.countScope == "any"
    
    def test_quest_create_payload_validation_methods(self):
        """Test that validation methods exist."""
        payload = QuestCreatePayload(
            title="Validation Test",
            category="Health",
            difficulty="easy"
        )
        
        # Test that field validators exist (Pydantic v2 uses field_validator)
        assert hasattr(QuestCreatePayload, 'validate_title')
        assert hasattr(QuestCreatePayload, 'validate_category')
        assert hasattr(QuestCreatePayload, 'validate_tags')
        assert hasattr(QuestCreatePayload, 'validate_deadline')
    
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
        assert payload.rewardXp == 75
        assert payload_dict.get('rewardXp') == 75
        
        # Test JSON serialization
        json_str = payload.model_dump_json()
        assert '"title": "Serialization Test"' in json_str
        assert '"category": "Learning"' in json_str


class TestQuestUpdatePayloadCoverage:
    """Test QuestUpdatePayload for coverage."""
    
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
    
    def test_quest_update_payload_validation_methods(self):
        """Test that validation methods exist."""
        payload = QuestUpdatePayload()
        
        # Test that field validators exist (Pydantic v2 uses field_validator)
        assert hasattr(QuestUpdatePayload, 'validate_title')
        assert hasattr(QuestUpdatePayload, 'validate_category')
        assert hasattr(QuestUpdatePayload, 'validate_tags')
        assert hasattr(QuestUpdatePayload, 'validate_deadline')
    
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


class TestQuestCancelPayloadCoverage:
    """Test QuestCancelPayload for coverage."""
    
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


class TestQuestResponseCoverage:
    """Test QuestResponse for coverage."""
    
    def test_quest_response_creation(self):
        """Test quest response creation."""
        ts_ms = 1672560000000  # 2023-01-01 12:00:00 UTC in epoch ms
        response = QuestResponse(
            id="test-quest-123",
            userId="user-123",
            title="Test Quest",
            category="Health",
            difficulty="medium",
            status="draft",
            rewardXp=50,
            privacy="private",
            createdAt=ts_ms,
            updatedAt=ts_ms,
            version=1,
            kind="linked"
        )
        
        assert response.id == "test-quest-123"
        assert response.questId == "test-quest-123"  # computed alias
        assert response.userId == "user-123"
        assert response.title == "Test Quest"
        assert response.category == "Health"
        assert response.difficulty == "medium"
        assert response.status == "draft"
        assert response.rewardXp == 50
        assert response.privacy == "private"
        assert response.createdAt == ts_ms
        assert response.updatedAt == ts_ms
        assert response.version == 1
        assert response.kind == "linked"
    
    def test_quest_response_serialization(self):
        """Test quest response serialization."""
        ts_ms = 1672560000000
        response = QuestResponse(
            id="response-quest-123",
            userId="user-456",
            title="Response Quest",
            category="Work",
            difficulty="hard",
            status="active",
            rewardXp=100,
            privacy="public",
            createdAt=ts_ms,
            updatedAt=ts_ms,
            version=1,
            kind="quantitative"
        )
        
        response_dict = response.model_dump()
        assert response_dict['id'] == "response-quest-123"
        assert response_dict['questId'] == "response-quest-123"  # computed
        assert response_dict['userId'] == "user-456"
        assert response_dict['title'] == "Response Quest"
        assert response_dict['category'] == "Work"
        assert response_dict['difficulty'] == "hard"
        assert response_dict['status'] == "active"
        assert response_dict['rewardXp'] == 100
        assert response_dict['privacy'] == "public"
        assert response_dict['kind'] == "quantitative"


class TestQuestConstantsCoverage:
    """Test Quest constants for coverage."""
    
    def test_quest_categories_constant(self):
        """Test quest categories constant."""
        from app.models.quest import QUEST_CATEGORIES
        
        assert isinstance(QUEST_CATEGORIES, list)
        assert len(QUEST_CATEGORIES) == 12
        assert "Health" in QUEST_CATEGORIES
        assert "Work" in QUEST_CATEGORIES
        assert "Personal" in QUEST_CATEGORIES
        assert "Learning" in QUEST_CATEGORIES
        assert "Fitness" in QUEST_CATEGORIES
        assert "Creative" in QUEST_CATEGORIES
        assert "Financial" in QUEST_CATEGORIES
        assert "Social" in QUEST_CATEGORIES
        assert "Spiritual" in QUEST_CATEGORIES
        assert "Hobby" in QUEST_CATEGORIES
        assert "Travel" in QUEST_CATEGORIES
        assert "Other" in QUEST_CATEGORIES
    
    def test_quest_validation_constants(self):
        """Test quest validation constants."""
        from app.models.quest import (
            MAX_TITLE_LENGTH, MIN_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
            MAX_TAGS_COUNT, MAX_TAG_LENGTH, MAX_REWARD_XP, MIN_REWARD_XP, DEFAULT_REWARD_XP
        )
        
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
        
        # Test optional reward XP (None when not provided)
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
        # Linked kind (no extra fields)
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="linked"
        )
        assert payload.kind == "linked"
        # Quantitative kind (requires targetCount, countScope, periodDays)
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
        # Test valid count scopes (completed_tasks, completed_goals, any)
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
        # Test valid deadline (must be at least 1 hour in the future)
        future_ms = int((datetime.now().timestamp() + 2 * 3600) * 1000)  # 2 hours from now
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            deadline=future_ms
        )
        assert payload.deadline == future_ms
        
        # Test no deadline
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy"
        )
        assert payload.deadline is None
    
    def test_quest_create_payload_period_days_validation(self):
        """Test period days validation in QuestCreatePayload (quantitative)."""
        # Test valid period days for quantitative quest
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
        
        # Test no period days for linked quest
        payload = QuestCreatePayload(
            title="Test Quest",
            category="Health",
            difficulty="easy",
            kind="linked"
        )
        assert payload.periodDays is None
