"""
Comprehensive tests for Quest models.

This module tests all Quest Pydantic models including validation,
edge cases, and error scenarios to ensure robust functionality.
"""

import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError
from app.models.quest import (
    QuestCreatePayload, QuestUpdatePayload, QuestCancelPayload, QuestResponse,
    QuestStatus, QuestDifficulty, QuestKind, QuestCountScope, QuestPrivacy,
    QUEST_CATEGORIES
)


class TestQuestCreatePayload:
    """Test QuestCreatePayload model validation and functionality."""
    
    def test_valid_linked_quest(self):
        """Test valid linked quest creation with all optional fields."""
        payload = QuestCreatePayload(
            title="Complete my fitness goals",
            category="Health",
            difficulty="medium",
            description="Work out 3 times this week",
            rewardXp=75,
            tags=["fitness", "health", "exercise"],
            deadline=int((datetime.now() + timedelta(days=7)).timestamp() * 1000),
            privacy="private",
            linkedGoalIds=["goal-123", "goal-456"],
            linkedTaskIds=["task-789"]
        )
        
        assert payload.title == "Complete my fitness goals"
        assert payload.category == "Health"
        assert payload.difficulty == "medium"
        assert payload.description == "Work out 3 times this week"
        assert payload.rewardXp == 75
        assert payload.tags == ["fitness", "health", "exercise"]
        assert payload.privacy == "private"
        assert payload.kind == "linked"
        assert payload.linkedGoalIds == ["goal-123", "goal-456"]
        assert payload.linkedTaskIds == ["task-789"]
    
    def test_valid_quantitative_quest(self):
        """Test valid quantitative quest creation."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        payload = QuestCreatePayload(
            title="Complete 5 tasks this week",
            category="Work",
            difficulty="easy",
            kind="quantitative",
            targetCount=5,
            countScope="any",
            startAt=future_time,
            periodSeconds=7 * 24 * 60 * 60  # 7 days
        )
        
        assert payload.kind == "quantitative"
        assert payload.targetCount == 5
        assert payload.countScope == "any"
        assert payload.startAt == future_time
        assert payload.periodSeconds == 7 * 24 * 60 * 60
    
    def test_minimal_valid_quest(self):
        """Test minimal valid quest creation with only required fields."""
        payload = QuestCreatePayload(
            title="Simple quest",
            category="Personal"
        )
        
        assert payload.title == "Simple quest"
        assert payload.category == "Personal"
        assert payload.difficulty == "medium"  # default
        assert payload.rewardXp == 50  # default
        assert payload.tags == []  # default
        assert payload.privacy == "private"  # default
        assert payload.kind == "linked"  # default
    
    def test_title_validation(self):
        """Test title validation with various edge cases."""
        # Too short
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="Hi", category="Health")
        assert "String should have at least 3 characters" in str(exc_info.value)
        
        # Too long
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="x" * 101, category="Health")
        assert "String should have at most 100 characters" in str(exc_info.value)
        
        # Empty
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="", category="Health")
        assert "String should have at least 3 characters" in str(exc_info.value)
        
        # Whitespace only
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="   ", category="Health")
        assert "Title cannot be empty" in str(exc_info.value)
        
        # Valid with extra whitespace (should be normalized)
        payload = QuestCreatePayload(title="  Valid   Title  ", category="Health")
        assert payload.title == "Valid Title"
    
    def test_category_validation(self):
        """Test category validation against predefined list."""
        # Invalid category
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="Test", category="InvalidCategory")
        assert "Category must be one of" in str(exc_info.value)
        
        # Empty category
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="Test", category="")
        assert "Category is required" in str(exc_info.value)
        
        # Valid categories
        for category in QUEST_CATEGORIES:
            payload = QuestCreatePayload(title="Test", category=category)
            assert payload.category == category
    
    def test_description_validation(self):
        """Test description validation and sanitization."""
        # Too long
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                description="x" * 501
            )
        assert "String should have at most 500 characters" in str(exc_info.value)
        
        # Valid with extra whitespace (should be normalized)
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            description="  Valid   description  "
        )
        assert payload.description == "Valid description"
        
        # None (should be allowed)
        payload = QuestCreatePayload(title="Test", category="Health", description=None)
        assert payload.description is None
    
    def test_tags_validation(self):
        """Test tags validation and sanitization."""
        # Too many tags
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                tags=["tag"] * 11
            )
        assert "List should have at most 10 items" in str(exc_info.value)
        
        # Tag too long
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                tags=["x" * 21]
            )
        assert "Each tag must be no more than 20 characters" in str(exc_info.value)
        
        # Invalid tag type
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                tags=[123]  # Not a string
            )
        assert "Input should be a valid string" in str(exc_info.value)
        
        # XSS protection
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test",
                category="Health",
                tags=["<script>alert('xss')</script>"]
            )
        assert "Each tag must be no more than 20 characters" in str(exc_info.value)
        
        # Valid tags with sanitization
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            tags=["  tag1  ", "tag2", ""]  # Empty tag should be filtered out
        )
        assert payload.tags == ["tag1", "tag2"]
    
    def test_deadline_validation(self):
        """Test deadline validation for future dates."""
        now = int(datetime.now().timestamp() * 1000)
        
        # Past deadline
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                deadline=now - 1000
            )
        assert "Deadline must be in the future" in str(exc_info.value)
        
        # Too soon (less than 1 hour)
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                deadline=now + 1000
            )
        assert "Deadline must be at least 1 hour in the future" in str(exc_info.value)
        
        # Valid deadline
        future_time = now + (2 * 60 * 60 * 1000)  # 2 hours
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            deadline=future_time
        )
        assert payload.deadline == future_time
        
        # None deadline (should be allowed)
        payload = QuestCreatePayload(title="Test", category="Health", deadline=None)
        assert payload.deadline is None
    
    def test_id_lists_validation(self):
        """Test validation of ID lists for linked items."""
        # Empty list (should be allowed for None)
        payload = QuestCreatePayload(title="Test", category="Health", linkedGoalIds=None)
        assert payload.linkedGoalIds is None
        
        # Empty list when provided (should fail)
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="Test", category="Health", linkedGoalIds=[])
        assert "ID list cannot be empty if provided" in str(exc_info.value)
        
        # Invalid ID format
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(title="Test", category="Health", linkedGoalIds=["invalid"])
        assert "ID at index 0 is not a valid format" in str(exc_info.value)
        
        # Valid IDs
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            linkedGoalIds=["goal-123", "goal-456"]
        )
        assert payload.linkedGoalIds == ["goal-123", "goal-456"]
    
    def test_quantitative_quest_validation(self):
        """Test quantitative quest validation requirements."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        
        # Missing targetCount
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative"
            )
        assert "targetCount is required for quantitative quests" in str(exc_info.value)
        
        # Missing countScope
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5
            )
        assert "countScope is required for quantitative quests" in str(exc_info.value)
        
        # Missing startAt
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5,
                countScope="any"
            )
        assert "startAt is required for quantitative quests" in str(exc_info.value)
        
        # Missing periodSeconds
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5,
                countScope="any",
                startAt=future_time
            )
        assert "periodSeconds is required for quantitative quests" in str(exc_info.value)
        
        # Valid quantitative quest
        payload = QuestCreatePayload(
            title="Test",
            category="Health", 
            kind="quantitative",
            targetCount=5,
            countScope="any",
            startAt=future_time,
            periodSeconds=86400
        )
        assert payload.kind == "quantitative"
        assert payload.targetCount == 5
        assert payload.countScope == "any"
        assert payload.startAt == future_time
        assert payload.periodSeconds == 86400
    
    def test_linked_quest_validation(self):
        """Test linked quest validation requirements."""
        # No linked items (should be allowed for creation, validation happens on start)
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="linked"
        )
        assert payload.kind == "linked"
        assert payload.linkedGoalIds is None
        assert payload.linkedTaskIds is None
        
        # Valid with goals only
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="linked",
            linkedGoalIds=["goal-123"]
        )
        assert payload.linkedGoalIds == ["goal-123"]
        
        # Valid with tasks only
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="linked",
            linkedTaskIds=["task-123"]
        )
        assert payload.linkedTaskIds == ["task-123"]
        
        # Valid with both goals and tasks
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="linked",
            linkedGoalIds=["goal-123"],
            linkedTaskIds=["task-123"]
        )
        assert payload.linkedGoalIds == ["goal-123"]
        assert payload.linkedTaskIds == ["task-123"]
    
    def test_target_count_validation(self):
        """Test target count validation for quantitative quests."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        
        # Zero or negative
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=0,
                countScope="any",
                startAt=future_time,
                periodSeconds=86400
            )
        assert "Input should be greater than 0" in str(exc_info.value)
        
        # Too high
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=10001,
                countScope="any",
                startAt=future_time,
                periodSeconds=86400
            )
        assert "Target count must be no more than 10,000" in str(exc_info.value)
        
        # Valid
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="quantitative",
            targetCount=100,
            countScope="any",
            startAt=future_time,
            periodSeconds=86400
        )
        assert payload.targetCount == 100
    
    def test_period_seconds_validation(self):
        """Test period seconds validation for quantitative quests."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        
        # Zero or negative
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5,
                countScope="any",
                startAt=future_time,
                periodSeconds=0
            )
        assert "Input should be greater than 0" in str(exc_info.value)
        
        # Too long (more than 1 year)
        with pytest.raises(ValidationError) as exc_info:
            QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5,
                countScope="any",
                startAt=future_time,
                periodSeconds=366 * 24 * 60 * 60  # More than 1 year
            )
        assert "Period cannot exceed 1 year" in str(exc_info.value)
        
        # Valid
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="quantitative",
            targetCount=5,
            countScope="any",
            startAt=future_time,
            periodSeconds=86400  # 1 day
        )
        assert payload.periodSeconds == 86400


class TestQuestUpdatePayload:
    """Test QuestUpdatePayload model validation and functionality."""
    
    def test_partial_update(self):
        """Test partial quest update with only some fields."""
        payload = QuestUpdatePayload(
            title="Updated title",
            difficulty="hard",
            rewardXp=100
        )
        
        assert payload.title == "Updated title"
        assert payload.difficulty == "hard"
        assert payload.rewardXp == 100
        assert payload.description is None
        assert payload.category is None
    
    def test_all_fields_update(self):
        """Test updating all possible fields."""
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        
        payload = QuestUpdatePayload(
            title="Updated quest",
            description="Updated description",
            category="Work",
            difficulty="easy",
            rewardXp=25,
            tags=["updated", "tags"],
            deadline=future_time,
            privacy="public",
            linkedGoalIds=["goal-789"],
            linkedTaskIds=["task-789"],
            dependsOnQuestIds=["quest-123"],
            targetCount=10,
            countScope="linked",
            startAt=future_time,
            periodSeconds=172800  # 2 days
        )
        
        assert payload.title == "Updated quest"
        assert payload.description == "Updated description"
        assert payload.category == "Work"
        assert payload.difficulty == "easy"
        assert payload.rewardXp == 25
        assert payload.tags == ["updated", "tags"]
        assert payload.deadline == future_time
        assert payload.privacy == "public"
        assert payload.linkedGoalIds == ["goal-789"]
        assert payload.linkedTaskIds == ["task-789"]
        assert payload.dependsOnQuestIds == ["quest-123"]
        assert payload.targetCount == 10
        assert payload.countScope == "linked"
        assert payload.startAt == future_time
        assert payload.periodSeconds == 172800
    
    def test_validation_reuse(self):
        """Test that validation logic is properly reused from QuestCreatePayload."""
        # Test title validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(title="Hi")  # Too short
        assert "String should have at least 3 characters" in str(exc_info.value)
        
        # Test category validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(category="InvalidCategory")
        assert "Category must be one of" in str(exc_info.value)
        
        # Test tags validation
        with pytest.raises(ValidationError) as exc_info:
            QuestUpdatePayload(tags=["x" * 21])  # Too long
        assert "Each tag must be no more than 20 characters" in str(exc_info.value)


class TestQuestCancelPayload:
    """Test QuestCancelPayload model validation and functionality."""
    
    def test_cancel_with_reason(self):
        """Test quest cancellation with reason."""
        payload = QuestCancelPayload(reason="Changed my mind")
        assert payload.reason == "Changed my mind"
    
    def test_cancel_without_reason(self):
        """Test quest cancellation without reason."""
        payload = QuestCancelPayload()
        assert payload.reason is None
    
    def test_reason_validation(self):
        """Test reason validation and sanitization."""
        # Too long
        with pytest.raises(ValidationError) as exc_info:
            QuestCancelPayload(reason="x" * 201)
        assert "String should have at most 200 characters" in str(exc_info.value)
        
        # Valid with extra whitespace (should be normalized)
        payload = QuestCancelPayload(reason="  Valid   reason  ")
        assert payload.reason == "Valid reason"
        
        # Empty string (should become None)
        payload = QuestCancelPayload(reason="")
        assert payload.reason is None


class TestQuestResponse:
    """Test QuestResponse model functionality."""
    
    def test_valid_response(self):
        """Test valid quest response creation."""
        response = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Test Quest",
            description="Test description",
            difficulty="medium",
            rewardXp=75,
            status="active",
            category="Health",
            tags=["test", "quest"],
            privacy="private",
            deadline=int((datetime.now() + timedelta(days=7)).timestamp() * 1000),
            createdAt=int(datetime.now().timestamp() * 1000),
            updatedAt=int(datetime.now().timestamp() * 1000),
            version=1,
            kind="linked",
            linkedGoalIds=["goal-123"],
            linkedTaskIds=["task-123"],
            dependsOnQuestIds=["quest-456"],
            auditTrail=[{"action": "created", "timestamp": int(datetime.now().timestamp() * 1000)}]
        )
        
        assert response.id == "quest-123"
        assert response.userId == "user-456"
        assert response.title == "Test Quest"
        assert response.status == "active"
        assert response.kind == "linked"
        assert response.linkedGoalIds == ["goal-123"]
        assert len(response.auditTrail) == 1
    
    def test_minimal_response(self):
        """Test minimal quest response with only required fields."""
        response = QuestResponse(
            id="quest-123",
            userId="user-456",
            title="Test Quest",
            difficulty="easy",
            rewardXp=50,
            status="draft",
            category="Personal",
            tags=[],
            privacy="private",
            createdAt=int(datetime.now().timestamp() * 1000),
            updatedAt=int(datetime.now().timestamp() * 1000),
            version=1,
            kind="quantitative",
            targetCount=5,
            countScope="any",
            startAt=int((datetime.now() + timedelta(days=1)).timestamp() * 1000),
            periodSeconds=86400
        )
        
        assert response.id == "quest-123"
        assert response.kind == "quantitative"
        assert response.targetCount == 5
        assert response.description is None
        assert response.deadline is None


class TestQuestEnums:
    """Test Quest enum types and constants."""
    
    def test_quest_status_values(self):
        """Test QuestStatus enum values."""
        valid_statuses = ["draft", "active", "completed", "cancelled", "failed"]
        for status in valid_statuses:
            # Should not raise ValidationError
            QuestResponse(
                id="quest-123",
                userId="user-456",
                title="Test",
                difficulty="easy",
                rewardXp=50,
                status=status,
                category="Personal",
                tags=[],
                privacy="private",
                createdAt=int(datetime.now().timestamp() * 1000),
                updatedAt=int(datetime.now().timestamp() * 1000),
                version=1,
                kind="linked"
            )
    
    def test_quest_difficulty_values(self):
        """Test QuestDifficulty enum values."""
        valid_difficulties = ["easy", "medium", "hard"]
        for difficulty in valid_difficulties:
            payload = QuestCreatePayload(title="Test", category="Health", difficulty=difficulty)
            assert payload.difficulty == difficulty
    
    def test_quest_kind_values(self):
        """Test QuestKind enum values."""
        # Test linked kind
        payload = QuestCreatePayload(title="Test", category="Health", kind="linked")
        assert payload.kind == "linked"
        
        # Test quantitative kind (requires additional fields)
        future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            kind="quantitative",
            targetCount=5,
            countScope="any",
            startAt=future_time,
            periodSeconds=86400
        )
        assert payload.kind == "quantitative"
    
    def test_quest_count_scope_values(self):
        """Test QuestCountScope enum values."""
        valid_scopes = ["any", "linked"]
        for scope in valid_scopes:
            future_time = int((datetime.now() + timedelta(days=1)).timestamp() * 1000)
            payload = QuestCreatePayload(
                title="Test", 
                category="Health", 
                kind="quantitative",
                targetCount=5,
                countScope=scope,
                startAt=future_time,
                periodSeconds=86400
            )
            assert payload.countScope == scope
    
    def test_quest_privacy_values(self):
        """Test QuestPrivacy enum values."""
        valid_privacies = ["public", "followers", "private"]
        for privacy in valid_privacies:
            payload = QuestCreatePayload(title="Test", category="Health", privacy=privacy)
            assert payload.privacy == privacy
    
    def test_quest_categories_constant(self):
        """Test QUEST_CATEGORIES constant."""
        assert isinstance(QUEST_CATEGORIES, list)
        assert len(QUEST_CATEGORIES) > 0
        assert "Health" in QUEST_CATEGORIES
        assert "Work" in QUEST_CATEGORIES
        assert "Personal" in QUEST_CATEGORIES


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_boundary_values(self):
        """Test boundary values for various fields."""
        # Minimum title length
        payload = QuestCreatePayload(title="ABC", category="Health")
        assert payload.title == "ABC"
        
        # Maximum title length
        payload = QuestCreatePayload(title="x" * 100, category="Health")
        assert len(payload.title) == 100
        
        # Maximum description length
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            description="x" * 500
        )
        assert len(payload.description) == 500
        
        # Maximum tags count
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            tags=["tag"] * 10
        )
        assert len(payload.tags) == 10
        
        # Maximum reward XP
        payload = QuestCreatePayload(title="Test", category="Health", rewardXp=1000)
        assert payload.rewardXp == 1000
        
        # Minimum reward XP
        payload = QuestCreatePayload(title="Test", category="Health", rewardXp=0)
        assert payload.rewardXp == 0
    
    def test_whitespace_handling(self):
        """Test proper whitespace handling in text fields."""
        # Title with various whitespace
        payload = QuestCreatePayload(title="  \t\n  Valid Title  \t\n  ", category="Health")
        assert payload.title == "Valid Title"
        
        # Description with various whitespace
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            description="  \t\n  Valid description  \t\n  "
        )
        assert payload.description == "Valid description"
        
        # Tags with whitespace
        payload = QuestCreatePayload(
            title="Test", 
            category="Health", 
            tags=["  tag1  ", "  tag2  ", "  "]
        )
        assert payload.tags == ["tag1", "tag2"]  # Empty tag filtered out
    
    def test_none_handling(self):
        """Test proper None value handling."""
        payload = QuestCreatePayload(
            title="Test", 
            category="Health",
            description=None,
            deadline=None,
            linkedGoalIds=None,
            linkedTaskIds=None,
            dependsOnQuestIds=None,
            targetCount=None,
            countScope=None,
            startAt=None,
            periodSeconds=None
        )
        
        assert payload.description is None
        assert payload.deadline is None
        assert payload.linkedGoalIds is None
        assert payload.linkedTaskIds is None
        assert payload.dependsOnQuestIds is None
        assert payload.targetCount is None
        assert payload.countScope is None
        assert payload.startAt is None
        assert payload.periodSeconds is None
