"""
Regression Tests for Quest Functionality.

This module ensures that existing functionality remains unbroken when new Quest features are added.
It tests the integration between Quest functionality and existing Goal/Task functionality.
"""

import pytest
import time
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
    TestClientHelpers,
    DatabaseHelpers,
    ValidationHelpers
)
from test_data_manager import test_data_manager

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestExistingGoalFunctionality:
    """Test that existing Goal functionality remains unbroken."""
    
    def test_goal_creation_still_works(self, test_user_id):
        """Test that goal creation still works after Quest implementation."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "title": "Regression Test Goal",
                "category": "Health",
                "deadline": "2024-12-31",
                "description": "Test goal for regression testing"
            }
            
            response = client.post("/goals/createGoal", json=payload)
            
            # Goal creation should still work
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Regression Test Goal"
            assert data["category"] == "Health"
            assert data["userId"] == test_user_id
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "goal", data["id"], test_user_id,
                f"USER#{test_user_id}", f"GOAL#{data['id']}"
            )
    
    def test_goal_retrieval_still_works(self, test_user_id):
        """Test that goal retrieval still works after Quest implementation."""
        # Create a goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Retrieval",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/goals/goals/{goal_id}")
            
            # Goal retrieval should still work
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == goal_id
            assert data["title"] == "Regression Test Goal for Retrieval"
    
    def test_goal_update_still_works(self, test_user_id):
        """Test that goal update still works after Quest implementation."""
        # Create a goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Update",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "title": "Updated Regression Test Goal",
                "description": "Updated description"
            }
            
            response = client.put(f"/goals/goals/{goal_id}", json=payload)
            
            # Goal update should still work
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Updated Regression Test Goal"
            assert data["description"] == "Updated description"
    
    def test_goal_deletion_still_works(self, test_user_id):
        """Test that goal deletion still works after Quest implementation."""
        # Create a goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Deletion",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.delete(f"/goals/goals/{goal_id}")
            
            # Goal deletion should still work
            assert response.status_code == 200
            data = response.json()
            assert "deleted successfully" in data["message"]
    
    def test_goal_listing_still_works(self, test_user_id):
        """Test that goal listing still works after Quest implementation."""
        # Create some goals
        for i in range(3):
            DatabaseHelpers.create_test_goal_in_db(test_user_id, {
                "title": f"Regression Test Goal {i}",
                "category": "Health",
                "deadline": "2024-12-31"
            })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get("/goals/goals")
            
            # Goal listing should still work
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 3  # Should include the goals we created
            
            # All goals should belong to the user
            for goal in data:
                assert goal["userId"] == test_user_id


class TestExistingTaskFunctionality:
    """Test that existing Task functionality remains unbroken."""
    
    def test_task_creation_still_works(self, test_user_id):
        """Test that task creation still works after Quest implementation."""
        # Create a goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Task",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "goalId": goal_id,
                "title": "Regression Test Task",
                "description": "Test task for regression testing",
                "dueAt": TestDataHelpers.generate_future_timestamp(1)
            }
            
            response = client.post("/goals/tasks", json=payload)
            
            # Task creation should still work
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Regression Test Task"
            assert data["goalId"] == goal_id
            assert data["userId"] == test_user_id
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "task", data["id"], test_user_id,
                f"USER#{test_user_id}", f"TASK#{data['id']}"
            )
    
    def test_task_retrieval_still_works(self, test_user_id):
        """Test that task retrieval still works after Quest implementation."""
        # Create a goal and task first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Task Retrieval",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Retrieval",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/goals/tasks/{task_id}")
            
            # Task retrieval should still work
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == task_id
            assert data["title"] == "Regression Test Task for Retrieval"
    
    def test_task_update_still_works(self, test_user_id):
        """Test that task update still works after Quest implementation."""
        # Create a goal and task first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Task Update",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Update",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "title": "Updated Regression Test Task",
                "description": "Updated task description"
            }
            
            response = client.put(f"/goals/tasks/{task_id}", json=payload)
            
            # Task update should still work
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Updated Regression Test Task"
            assert data["description"] == "Updated task description"
    
    def test_task_deletion_still_works(self, test_user_id):
        """Test that task deletion still works after Quest implementation."""
        # Create a goal and task first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Task Deletion",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Deletion",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.delete(f"/goals/tasks/{task_id}")
            
            # Task deletion should still work
            assert response.status_code == 200
            data = response.json()
            assert "deleted successfully" in data["message"]
    
    def test_task_listing_still_works(self, test_user_id):
        """Test that task listing still works after Quest implementation."""
        # Create a goal and some tasks
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Task Listing",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        for i in range(3):
            DatabaseHelpers.create_test_task_in_db(test_user_id, {
                "goalId": goal_id,
                "title": f"Regression Test Task {i}",
                "dueAt": TestDataHelpers.generate_future_timestamp(1)
            })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/goals/goals/{goal_id}/tasks")
            
            # Task listing should still work
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 3  # Should include the tasks we created
            
            # All tasks should belong to the goal
            for task in data:
                assert task["goalId"] == goal_id


class TestExistingProgressFunctionality:
    """Test that existing Progress functionality remains unbroken."""
    
    def test_progress_creation_still_works(self, test_user_id):
        """Test that progress creation still works after Quest implementation."""
        # Create a goal and task first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Progress",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Progress",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {
                "taskId": task_id,
                "progress": 50,
                "notes": "Regression test progress"
            }
            
            response = client.post("/goals/progress", json=payload)
            
            # Progress creation should still work
            assert response.status_code == 201
            data = response.json()
            assert data["taskId"] == task_id
            assert data["progress"] == 50
            assert data["notes"] == "Regression test progress"
    
    def test_progress_retrieval_still_works(self, test_user_id):
        """Test that progress retrieval still works after Quest implementation."""
        # Create a goal, task, and progress first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Progress Retrieval",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Progress Retrieval",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        # Create progress
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            progress_payload = {
                "taskId": task_id,
                "progress": 75,
                "notes": "Regression test progress"
            }
            
            progress_response = client.post("/goals/progress", json=progress_payload)
            assert progress_response.status_code == 201
            progress_data = progress_response.json()
            progress_id = progress_data["id"]
            
            # Retrieve progress
            response = client.get(f"/goals/progress/{progress_id}")
            
            # Progress retrieval should still work
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == progress_id
            assert data["taskId"] == task_id
            assert data["progress"] == 75
    
    def test_progress_update_still_works(self, test_user_id):
        """Test that progress update still works after Quest implementation."""
        # Create a goal, task, and progress first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Progress Update",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Progress Update",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        # Create progress
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            progress_payload = {
                "taskId": task_id,
                "progress": 25,
                "notes": "Initial progress"
            }
            
            progress_response = client.post("/goals/progress", json=progress_payload)
            assert progress_response.status_code == 201
            progress_data = progress_response.json()
            progress_id = progress_data["id"]
            
            # Update progress
            update_payload = {
                "progress": 75,
                "notes": "Updated progress"
            }
            
            response = client.put(f"/goals/progress/{progress_id}", json=update_payload)
            
            # Progress update should still work
            assert response.status_code == 200
            data = response.json()
            assert data["progress"] == 75
            assert data["notes"] == "Updated progress"
    
    def test_progress_listing_still_works(self, test_user_id):
        """Test that progress listing still works after Quest implementation."""
        # Create a goal and task first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Regression Test Goal for Progress Listing",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Regression Test Task for Progress Listing",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        # Create some progress entries
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for i in range(3):
                progress_payload = {
                    "taskId": task_id,
                    "progress": (i + 1) * 25,
                    "notes": f"Regression test progress {i}"
                }
                
                response = client.post("/goals/progress", json=progress_payload)
                assert response.status_code == 201
            
            # List progress
            response = client.get(f"/goals/tasks/{task_id}/progress")
            
            # Progress listing should still work
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 3  # Should include the progress entries we created
            
            # All progress should belong to the task
            for progress in data:
                assert progress["taskId"] == task_id


class TestQuestGoalIntegration:
    """Test integration between Quest and Goal functionality."""
    
    def test_quest_creation_with_goals_does_not_break_goals(self, test_user_id):
        """Test that creating quests with linked goals doesn't break goal functionality."""
        # Create some goals
        goal_ids = []
        for i in range(2):
            goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
                "title": f"Integration Test Goal {i}",
                "category": "Health",
                "deadline": "2024-12-31"
            })
            goal_ids.append(goal_id)
        
        # Create a quest linked to these goals
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Integration Test Quest",
                category="Health",
                goal_ids=goal_ids
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_data['id']}"
            )
            
            # Verify goals still work independently
            for goal_id in goal_ids:
                goal_response = client.get(f"/goals/goals/{goal_id}")
                assert goal_response.status_code == 200
                
                goal_data = goal_response.json()
                assert goal_data["id"] == goal_id
                assert goal_data["title"].startswith("Integration Test Goal")
    
    def test_goal_operations_with_linked_quests(self, test_user_id):
        """Test that goal operations work when goals are linked to quests."""
        # Create a goal
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Goal for Quest Integration",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        # Create a quest linked to this goal
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Quest with Goal Integration",
                category="Health",
                goal_ids=[goal_id]
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_data['id']}"
            )
            
            # Goal operations should still work
            goal_response = client.get(f"/goals/goals/{goal_id}")
            assert goal_response.status_code == 200
            
            # Update goal
            update_payload = {"title": "Updated Goal for Quest Integration"}
            update_response = client.put(f"/goals/goals/{goal_id}", json=update_payload)
            assert update_response.status_code == 200
            
            # Delete goal (should work even if linked to quest)
            delete_response = client.delete(f"/goals/goals/{goal_id}")
            assert delete_response.status_code == 200


class TestQuestTaskIntegration:
    """Test integration between Quest and Task functionality."""
    
    def test_quest_creation_with_tasks_does_not_break_tasks(self, test_user_id):
        """Test that creating quests with linked tasks doesn't break task functionality."""
        # Create a goal and tasks
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Integration Test Goal for Tasks",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_ids = []
        for i in range(2):
            task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
                "goalId": goal_id,
                "title": f"Integration Test Task {i}",
                "dueAt": TestDataHelpers.generate_future_timestamp(1)
            })
            task_ids.append(task_id)
        
        # Create a quest linked to these tasks
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Integration Test Quest with Tasks",
                category="Health",
                task_ids=task_ids
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_data['id']}"
            )
            
            # Verify tasks still work independently
            for task_id in task_ids:
                task_response = client.get(f"/goals/tasks/{task_id}")
                assert task_response.status_code == 200
                
                task_data = task_response.json()
                assert task_data["id"] == task_id
                assert task_data["title"].startswith("Integration Test Task")
    
    def test_task_operations_with_linked_quests(self, test_user_id):
        """Test that task operations work when tasks are linked to quests."""
        # Create a goal and task
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Goal for Task Integration",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Task for Quest Integration",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        # Create a quest linked to this task
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Quest with Task Integration",
                category="Health",
                task_ids=[task_id]
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_data['id']}"
            )
            
            # Task operations should still work
            task_response = client.get(f"/goals/tasks/{task_id}")
            assert task_response.status_code == 200
            
            # Update task
            update_payload = {"title": "Updated Task for Quest Integration"}
            update_response = client.put(f"/goals/tasks/{task_id}", json=update_payload)
            assert update_response.status_code == 200
            
            # Delete task (should work even if linked to quest)
            delete_response = client.delete(f"/goals/tasks/{task_id}")
            assert delete_response.status_code == 200


class TestDatabaseConsistency:
    """Test database consistency after Quest implementation."""
    
    def test_database_schema_consistency(self, test_user_id):
        """Test that database schema remains consistent."""
        # Create a quest with linked goals and tasks
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Schema Consistency Test Goal",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        task_id = DatabaseHelpers.create_test_task_in_db(test_user_id, {
            "goalId": goal_id,
            "title": "Schema Consistency Test Task",
            "dueAt": TestDataHelpers.generate_future_timestamp(1)
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_linked_quest_payload(
                title="Schema Consistency Test Quest",
                category="Health",
                goal_ids=[goal_id],
                task_ids=[task_id]
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_data['id']}"
            )
            
            # Verify all entities can be retrieved
            goal_response = client.get(f"/goals/goals/{goal_id}")
            assert goal_response.status_code == 200
            
            task_response = client.get(f"/goals/tasks/{task_id}")
            assert task_response.status_code == 200
            
            quest_get_response = client.get(f"/quests/quests/{quest_data['id']}")
            assert quest_get_response.status_code == 200
    
    def test_audit_trail_consistency(self, test_user_id):
        """Test that audit trails remain consistent."""
        # Create a quest
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            quest_payload = TestDataHelpers.create_test_quest_payload(
                title="Audit Trail Consistency Test Quest",
                category="Health"
            )
            
            quest_response = client.post("/quests/createQuest", json=quest_payload)
            assert quest_response.status_code == 201
            
            quest_data = quest_response.json()
            quest_id = quest_data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # Verify audit trail structure
            assert "auditTrail" in quest_data
            assert isinstance(quest_data["auditTrail"], list)
            assert len(quest_data["auditTrail"]) > 0
            
            # Start the quest and verify audit trail is updated
            start_response = client.post(f"/quests/quests/{quest_id}/start")
            assert start_response.status_code == 200
            
            start_data = start_response.json()
            assert len(start_data["auditTrail"]) > len(quest_data["auditTrail"])


class TestPerformanceRegression:
    """Test that performance hasn't regressed after Quest implementation."""
    
    def test_goal_operations_performance_unchanged(self, test_user_id):
        """Test that goal operations performance hasn't degraded."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test goal creation performance
            start_time = time.time()
            
            payload = {
                "title": "Performance Regression Test Goal",
                "category": "Health",
                "deadline": "2024-12-31"
            }
            
            response = client.post("/goals/createGoal", json=payload)
            end_time = time.time()
            
            assert response.status_code == 201
            creation_time = end_time - start_time
            
            # Goal creation should still be fast
            assert creation_time < 2.0  # Should complete within 2 seconds
            
            data = response.json()
            goal_id = data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "goal", goal_id, test_user_id,
                f"USER#{test_user_id}", f"GOAL#{goal_id}"
            )
    
    def test_task_operations_performance_unchanged(self, test_user_id):
        """Test that task operations performance hasn't degraded."""
        # Create a goal first
        goal_id = DatabaseHelpers.create_test_goal_in_db(test_user_id, {
            "title": "Performance Regression Test Goal for Task",
            "category": "Health",
            "deadline": "2024-12-31"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test task creation performance
            start_time = time.time()
            
            payload = {
                "goalId": goal_id,
                "title": "Performance Regression Test Task",
                "dueAt": TestDataHelpers.generate_future_timestamp(1)
            }
            
            response = client.post("/goals/tasks", json=payload)
            end_time = time.time()
            
            assert response.status_code == 201
            creation_time = end_time - start_time
            
            # Task creation should still be fast
            assert creation_time < 2.0  # Should complete within 2 seconds
            
            data = response.json()
            task_id = data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "task", task_id, test_user_id,
                f"USER#{test_user_id}", f"TASK#{task_id}"
            )
