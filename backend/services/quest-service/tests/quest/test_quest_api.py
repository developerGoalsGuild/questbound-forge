"""
Comprehensive API Endpoint Tests for Quest REST Endpoints.

This module tests all Quest REST API endpoints including:
- POST /quests/createQuest
- POST /quests/quests/{id}/start
- PUT /quests/quests/{id}
- POST /quests/quests/{id}/cancel
- POST /quests/quests/{id}/fail
- DELETE /quests/quests/{id}
"""

import pytest
import json
from unittest.mock import patch, Mock, MagicMock
from fastapi.testclient import TestClient

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from test_helpers import (
    TestDataHelpers,
    AuthHelpers,
    TestClientHelpers,
    DatabaseHelpers,
    ValidationHelpers,
    SecurityHelpers
)
from test_data_manager import test_data_manager

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestQuestCreateAPI:
    """Test POST /quests/createQuest endpoint."""
    
    def test_create_quest_success(self, test_user_id):
        """Test successful quest creation."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_quest_payload(
                title="Test Quest Creation",
                category="Health",
                difficulty="medium",
                description="Test quest description",
                rewardXp=75,
                tags=["test", "health"],
                privacy="private"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            
            assert response.status_code == 201
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["title"] == "Test Quest Creation"
            assert data["category"] == "Health"
            assert data["difficulty"] == "medium"
            assert data["description"] == "Test quest description"
            assert data["rewardXp"] == 75
            assert data["tags"] == ["test", "health"]
            assert data["privacy"] == "private"
            assert data["status"] == "draft"
            assert data["kind"] == "linked"
            assert data["userId"] == test_user_id
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", 
                data["id"], 
                test_user_id,
                f"USER#{test_user_id}",
                f"QUEST#{data['id']}"
            )
    
    def test_create_quantitative_quest_success(self, test_user_id):
        """Test successful quantitative quest creation."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_quantitative_quest_payload(
                title="Test Quantitative Quest",
                category="Work",
                target_count=10
            )
            
            response = client.post("/quests/createQuest", json=payload)
            
            assert response.status_code == 201
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["kind"] == "quantitative"
            assert data["targetCount"] == 10
            assert data["countScope"] == "any"
            assert data["startAt"] is not None
            assert data["periodSeconds"] == 86400
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", 
                data["id"], 
                test_user_id,
                f"USER#{test_user_id}",
                f"QUEST#{data['id']}"
            )
    
    def test_create_linked_quest_with_goals_and_tasks(self, test_user_id):
        """Test creating linked quest with goals and tasks."""
        # First create test goals and tasks
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Test Goal",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Test Task",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Test Linked Quest",
                category="Health",
                goal_ids=[goal_id],
                task_ids=[task_id]
            )
            
            response = client.post("/quests/createQuest", json=payload)
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["kind"] == "linked"
            assert data["linkedGoalIds"] == [goal_id]
            assert data["linkedTaskIds"] == [task_id]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", 
                data["id"], 
                test_user_id,
                f"USER#{test_user_id}",
                f"QUEST#{data['id']}"
            )
    
    def test_create_quest_validation_errors(self, test_user_id):
        """Test quest creation with validation errors."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test empty title
            payload = {
                "title": "",
                "category": "Health"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            ValidationHelpers.assert_error_response_structure(response.json())
            
            # Test title too short
            payload = {
                "title": "Hi",
                "category": "Health"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test title too long
            payload = {
                "title": "x" * 101,
                "category": "Health"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test invalid category
            payload = {
                "title": "Valid Title",
                "category": "InvalidCategory"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test invalid difficulty
            payload = {
                "title": "Valid Title",
                "category": "Health",
                "difficulty": "invalid"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test reward XP out of range
            payload = {
                "title": "Valid Title",
                "category": "Health",
                "rewardXp": 1001
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test description too long
            payload = {
                "title": "Valid Title",
                "category": "Health",
                "description": "x" * 501
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_create_quantitative_quest_validation_errors(self, test_user_id):
        """Test quantitative quest creation validation errors."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test missing targetCount
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "kind": "quantitative"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test missing countScope
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "kind": "quantitative",
                "targetCount": 5
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test missing startAt
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "kind": "quantitative",
                "targetCount": 5,
                "countScope": "any"
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test missing periodSeconds
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "kind": "quantitative",
                "targetCount": 5,
                "countScope": "any",
                "startAt": TestDataHelpers.generate_future_timestamp(1)
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test invalid targetCount
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "kind": "quantitative",
                "targetCount": 0,
                "countScope": "any",
                "startAt": TestDataHelpers.generate_future_timestamp(1),
                "periodSeconds": 86400
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_create_quest_authentication_required(self):
        """Test quest creation without authentication."""
        payload = TestDataHelpers.create_test_quest_payload()
        
        with TestClient(app) as client:
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 401
    
    def test_create_quest_deadline_validation(self, test_user_id):
        """Test quest deadline validation."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test past deadline
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "deadline": TestDataHelpers.generate_past_timestamp(1)
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Test deadline too soon (less than 1 hour)
            now = int(time.time() * 1000)
            soon_deadline = now + (30 * 60 * 1000)  # 30 minutes
            payload = {
                "title": "Test Quest",
                "category": "Health",
                "deadline": soon_deadline
            }
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400


class TestQuestStartAPI:
    """Test POST /quests/quests/{id}/start endpoint."""
    
    def test_start_quest_success(self, test_user_id):
        """Test successful quest start."""
        # Create a draft quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest to Start",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.post(f"/quests/quests/{quest_id}/start")
            
            assert response.status_code == 200
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["id"] == quest_id
            assert data["status"] == "active"
            assert data["version"] == 2  # Version should increment
    
    def test_start_quest_not_found(self, test_user_id):
        """Test starting a quest that doesn't exist."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.post(f"/quests/quests/{fake_quest_id}/start")
            
            assert response.status_code == 404
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_start_quest_invalid_status(self, test_user_id):
        """Test starting a quest with invalid status."""
        # Create an active quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Active Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        # Start it first to make it active
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Try to start it again
            response = client.post(f"/quests/quests/{quest_id}/start")
            
            assert response.status_code == 400
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_start_quest_authentication_required(self):
        """Test quest start without authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            response = client.post(f"/quests/quests/{fake_quest_id}/start")
            assert response.status_code == 401


class TestQuestUpdateAPI:
    """Test PUT /quests/quests/{id} endpoint."""
    
    def test_update_quest_success(self, test_user_id):
        """Test successful quest update."""
        # Create a draft quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Original Quest Title",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "title": "Updated Quest Title",
                "difficulty": "hard",
                "rewardXp": 100,
                "tags": ["updated", "test"]
            }
            
            response = client.put(f"/quests/quests/{quest_id}", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["title"] == "Updated Quest Title"
            assert data["difficulty"] == "hard"
            assert data["rewardXp"] == 100
            assert data["tags"] == ["updated", "test"]
            assert data["version"] == 2  # Version should increment
    
    def test_update_quest_not_found(self, test_user_id):
        """Test updating a quest that doesn't exist."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {"title": "Updated Title"}
            response = client.put(f"/quests/quests/{fake_quest_id}", json=payload)
            
            assert response.status_code == 404
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_update_quest_not_draft(self, test_user_id):
        """Test updating a quest that's not in draft status."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Try to update it
            payload = {"title": "Updated Title"}
            response = client.put(f"/quests/quests/{quest_id}", json=payload)
            
            assert response.status_code == 400
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_update_quest_authentication_required(self):
        """Test quest update without authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            payload = {"title": "Updated Title"}
            response = client.put(f"/quests/quests/{fake_quest_id}", json=payload)
            assert response.status_code == 401


class TestQuestCancelAPI:
    """Test POST /quests/quests/{id}/cancel endpoint."""
    
    def test_cancel_quest_success(self, test_user_id):
        """Test successful quest cancellation."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest to Cancel",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Cancel it
            payload = {"reason": "Changed my mind"}
            response = client.post(f"/quests/quests/{quest_id}/cancel", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["id"] == quest_id
            assert data["status"] == "cancelled"
    
    def test_cancel_quest_not_found(self, test_user_id):
        """Test cancelling a quest that doesn't exist."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {"reason": "Test reason"}
            response = client.post(f"/quests/quests/{fake_quest_id}/cancel", json=payload)
            
            assert response.status_code == 404
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_cancel_quest_invalid_status(self, test_user_id):
        """Test cancelling a quest with invalid status."""
        # Create a draft quest (can't cancel draft)
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Draft Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {"reason": "Test reason"}
            response = client.post(f"/quests/quests/{quest_id}/cancel", json=payload)
            
            assert response.status_code == 400
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_cancel_quest_authentication_required(self):
        """Test quest cancellation without authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            payload = {"reason": "Test reason"}
            response = client.post(f"/quests/quests/{fake_quest_id}/cancel", json=payload)
            assert response.status_code == 401


class TestQuestFailAPI:
    """Test POST /quests/quests/{id}/fail endpoint."""
    
    def test_fail_quest_success(self, test_user_id):
        """Test successful quest failure marking."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest to Fail",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Mark as failed
            response = client.post(f"/quests/quests/{quest_id}/fail")
            
            assert response.status_code == 200
            data = response.json()
            ValidationHelpers.assert_quest_response_structure(data)
            
            assert data["id"] == quest_id
            assert data["status"] == "failed"
    
    def test_fail_quest_not_found(self, test_user_id):
        """Test failing a quest that doesn't exist."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.post(f"/quests/quests/{fake_quest_id}/fail")
            
            assert response.status_code == 404
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_fail_quest_invalid_status(self, test_user_id):
        """Test failing a quest with invalid status."""
        # Create a draft quest (can't fail draft)
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Draft Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.post(f"/quests/quests/{quest_id}/fail")
            
            assert response.status_code == 400
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_fail_quest_authentication_required(self):
        """Test quest failure marking without authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            response = client.post(f"/quests/quests/{fake_quest_id}/fail")
            assert response.status_code == 401


class TestQuestDeleteAPI:
    """Test DELETE /quests/quests/{id} endpoint."""
    
    def test_delete_quest_draft_success(self, test_user_id):
        """Test successful deletion of draft quest."""
        # Create a draft quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest to Delete",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.delete(f"/quests/quests/{quest_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "deleted successfully" in data["message"]
    
    def test_delete_quest_active_with_admin(self, test_user_id):
        """Test deletion of active quest with admin privileges."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Active Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id, role="admin") as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Delete it as admin
            response = client.delete(f"/quests/quests/{quest_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "deleted successfully" in data["message"]
    
    def test_delete_quest_active_without_admin(self, test_user_id):
        """Test deletion of active quest without admin privileges."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Active Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Try to delete it without admin privileges
            response = client.delete(f"/quests/quests/{quest_id}")
            
            assert response.status_code == 403
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_delete_quest_not_found(self, test_user_id):
        """Test deletion of quest that doesn't exist."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.delete(f"/quests/quests/{fake_quest_id}")
            
            assert response.status_code == 404
            ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_delete_quest_authentication_required(self):
        """Test quest deletion without authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            response = client.delete(f"/quests/quests/{fake_quest_id}")
            assert response.status_code == 401


class TestQuestAPIIntegration:
    """Integration tests for Quest API workflows."""
    
    def test_complete_quest_lifecycle(self, test_user_id):
        """Test complete quest lifecycle: create -> start -> cancel."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # 1. Create quest
            create_payload = TestDataHelpers.create_test_quest_payload(
                title="Complete Lifecycle Quest",
                category="Health"
            )
            create_response = client.post("/quests/createQuest", json=create_payload)
            assert create_response.status_code == 201
            quest_data = create_response.json()
            quest_id = quest_data["id"]
            assert quest_data["status"] == "draft"
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # 2. Start quest
            start_response = client.post(f"/quests/quests/{quest_id}/start")
            assert start_response.status_code == 200
            start_data = start_response.json()
            assert start_data["status"] == "active"
            
            # 3. Cancel quest
            cancel_payload = {"reason": "Lifecycle test complete"}
            cancel_response = client.post(f"/quests/quests/{quest_id}/cancel", json=cancel_payload)
            assert cancel_response.status_code == 200
            cancel_data = cancel_response.json()
            assert cancel_data["status"] == "cancelled"
    
    def test_quest_version_conflict(self, test_user_id):
        """Test quest version conflict handling."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Version Conflict Test",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Simulate concurrent updates by mocking version conflict
            with patch('app.db.quest_db.update_quest') as mock_update:
                from app.db.quest_db import QuestVersionConflictError
                mock_update.side_effect = QuestVersionConflictError("Version conflict")
                
                payload = {"title": "Updated Title"}
                response = client.put(f"/quests/quests/{quest_id}", json=payload)
                
                assert response.status_code == 409
                ValidationHelpers.assert_error_response_structure(response.json())
    
    def test_quest_linking_validation(self, test_user_id):
        """Test quest linking validation."""
        # Create test goals and tasks
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Test Goal for Linking",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Test Task for Linking",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test linking with valid goals and tasks
            payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Linking Test Quest",
                category="Health",
                goal_ids=[goal_id],
                task_ids=[task_id]
            )
            
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            data = response.json()
            assert data["linkedGoalIds"] == [goal_id]
            assert data["linkedTaskIds"] == [task_id]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{data['id']}"
            )
