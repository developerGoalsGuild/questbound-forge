import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Tuple
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

# Add the quest-service directory to Python path so we can import app.main
quest_service_dir = Path(__file__).resolve().parent.parent
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

os.environ.setdefault(
    "QUEST_SERVICE_ENV_VARS",
    json.dumps(
        {
            "CORE_TABLE": "gg_core",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-east-2",
            "COGNITO_USER_POOL_ID": "local-pool",
            "COGNITO_CLIENT_ID": "local-client",
            "ALLOWED_ORIGINS": ["http://localhost:8080"],
        }
    ),
)
os.environ.setdefault("QUEST_SERVICE_JWT_SECRET", "test-secret")

import app.main as main_module
from app.models import GoalProgressResponse, Milestone

app = main_module.app
get_goals_table = main_module.get_goals_table


def _issue_token(sub: str = "test-user-1") -> str:
    """Issue a test JWT token"""
    import jwt
    now = int(time.time())
    payload = {
        "sub": sub,
        "iat": now,
        "exp": now + 3600,
        "aud": "api://default",
        "iss": "https://auth.local",
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


class FakeTable:
    def __init__(self) -> None:
        self.items: Dict[Tuple[str, str], Dict] = {}

    def put_item(self, Item, ConditionExpression=None):  # noqa: N802 - boto interface
        key = (Item["PK"], Item["SK"])
        if ConditionExpression and key in self.items:
            from botocore.exceptions import ClientError

            raise ClientError(
                {
                    "Error": {
                        "Code": "ConditionalCheckFailedException",
                        "Message": "Conditional check failed",
                    }
                },
                "PutItem",
            )
        self.items[key] = Item

    def get_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        return {"Item": self.items.get(key)}

    def query(self, KeyConditionExpression, FilterExpression=None):  # noqa: N802 - boto interface
        # Simple mock implementation for testing
        results = []
        
        for (pk, sk), item in self.items.items():
            # For our test cases, we expect queries like:
            # 1. USER#test-user-1 with SK starting with TASK# and goalId filter
            # 2. USER#test-user-1 with SK starting with GOAL#
            
            if pk == "USER#test-user-1":  # Hardcoded for test simplicity
                if sk.startswith("TASK#") and FilterExpression:
                    # Apply goalId filter for tasks
                    if item.get("goalId") == "test-goal-1":  # Hardcoded for test
                        results.append(item)
                elif sk.startswith("GOAL#") and not FilterExpression:
                    # Return goals without filter
                    results.append(item)
        
        return {"Items": results}

    def delete_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        self.items.pop(key, None)


@pytest.fixture
def fake_table():
    return FakeTable()


@pytest.fixture
def client(fake_table):
    with patch("app.main.get_goals_table", return_value=fake_table):
        with TestClient(app) as test_client:
            yield test_client


@pytest.fixture
def sample_goal():
    """Create a sample goal for testing"""
    now = int(time.time() * 1000)
    deadline = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    
    return {
        "id": "test-goal-1",
        "userId": "test-user-1",
        "title": "Test Goal",
        "description": "A test goal",
        "category": "test",
        "tags": ["test", "progress"],
        "deadline": deadline,
        "status": "active",
        "createdAt": now,
        "updatedAt": now,
        "answers": []
    }


@pytest.fixture
def sample_tasks():
    """Create sample tasks for testing"""
    now = int(time.time() * 1000)
    
    return [
        {
            "id": "task-1",
            "goalId": "test-goal-1",
            "title": "Task 1",
            "dueAt": now + 86400,  # 1 day from now
            "status": "completed",
            "createdAt": now,
            "updatedAt": now,
            "tags": ["test"]
        },
        {
            "id": "task-2", 
            "goalId": "test-goal-1",
            "title": "Task 2",
            "dueAt": now + 172800,  # 2 days from now
            "status": "active",
            "createdAt": now,
            "updatedAt": now,
            "tags": ["test"]
        },
        {
            "id": "task-3",
            "goalId": "test-goal-1", 
            "title": "Task 3",
            "dueAt": now + 259200,  # 3 days from now
            "status": "completed",
            "createdAt": now,
            "updatedAt": now,
            "tags": ["test"]
        }
    ]


class TestProgressCalculation:
    """Test the progress calculation functions"""

    def test_calculate_time_progress_normal(self, sample_goal):
        """Test time progress calculation for a normal goal"""
        progress = main_module.calculate_time_progress(sample_goal)
        
        # Should be between 0 and 100
        assert 0 <= progress <= 100
        
        # For a goal created now with 30 days deadline, should be close to 0
        assert progress < 5  # Should be very low since just created

    def test_calculate_time_progress_no_deadline(self, sample_goal):
        """Test time progress calculation with no deadline"""
        sample_goal["deadline"] = None
        progress = main_module.calculate_time_progress(sample_goal)
        assert progress == 0.0

    def test_calculate_time_progress_overdue(self, sample_goal):
        """Test time progress calculation for overdue goal"""
        # Set deadline to yesterday
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = yesterday
        
        progress = main_module.calculate_time_progress(sample_goal)
        assert progress == 100.0

    def test_calculate_milestones_achieved(self):
        """Test milestone calculation for achieved progress"""
        milestones = main_module.calculate_milestones(75.0, "test-goal-1")
        
        assert len(milestones) == 4  # 25%, 50%, 75%, 100%
        
        # Check 25% milestone
        milestone_25 = milestones[0]
        assert milestone_25.percentage == 25.0
        assert milestone_25.achieved == True
        assert milestone_25.name == "First Quarter"
        
        # Check 50% milestone
        milestone_50 = milestones[1]
        assert milestone_50.percentage == 50.0
        assert milestone_50.achieved == True
        assert milestone_50.name == "Halfway Point"
        
        # Check 75% milestone
        milestone_75 = milestones[2]
        assert milestone_75.percentage == 75.0
        assert milestone_75.achieved == True
        assert milestone_75.name == "Three Quarters"
        
        # Check 100% milestone (not achieved)
        milestone_100 = milestones[3]
        assert milestone_100.percentage == 100.0
        assert milestone_100.achieved == False
        assert milestone_100.name == "Complete"

    def test_calculate_milestones_not_achieved(self):
        """Test milestone calculation for not achieved progress"""
        milestones = main_module.calculate_milestones(20.0, "test-goal-1")
        
        assert len(milestones) == 4
        
        # All milestones should be not achieved
        for milestone in milestones:
            assert milestone.achieved == False

    def test_is_goal_overdue_true(self, sample_goal):
        """Test overdue detection for overdue goal"""
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = yesterday
        
        assert main_module.is_goal_overdue(sample_goal) == True

    def test_is_goal_overdue_false(self, sample_goal):
        """Test overdue detection for non-overdue goal"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = tomorrow
        
        assert main_module.is_goal_overdue(sample_goal) == False

    def test_is_goal_urgent_true(self, sample_goal):
        """Test urgent detection for urgent goal"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = tomorrow
        
        assert main_module.is_goal_urgent(sample_goal) == True

    def test_is_goal_urgent_false(self, sample_goal):
        """Test urgent detection for non-urgent goal"""
        next_month = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = next_month
        
        assert main_module.is_goal_urgent(sample_goal) == False

    def test_compute_goal_progress_success(self, fake_table, sample_goal, sample_tasks):
        """Test successful progress calculation"""
        # Add goal and tasks to fake table
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": "GOAL#test-goal-1",
            **sample_goal
        })
        
        for task in sample_tasks:
            fake_table.put_item({
                "PK": "USER#test-user-1", 
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        progress = main_module.compute_goal_progress("test-goal-1", "test-user-1", fake_table)
        
        assert isinstance(progress, GoalProgressResponse)
        assert progress.goalId == "test-goal-1"
        assert progress.completedTasks == 2  # 2 completed tasks
        assert progress.totalTasks == 3  # 3 total tasks
        assert progress.taskProgress == 66.67  # 2/3 * 100
        assert 0 <= progress.timeProgress <= 100
        assert 0 <= progress.progressPercentage <= 100
        assert len(progress.milestones) == 4
        assert isinstance(progress.isOverdue, bool)
        assert isinstance(progress.isUrgent, bool)

    def test_compute_goal_progress_no_tasks(self, fake_table, sample_goal):
        """Test progress calculation with no tasks"""
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": "GOAL#test-goal-1", 
            **sample_goal
        })
        
        progress = main_module.compute_goal_progress("test-goal-1", "test-user-1", fake_table)
        
        assert progress.completedTasks == 0
        assert progress.totalTasks == 0
        assert progress.taskProgress == 0.0
        assert progress.progressPercentage == progress.timeProgress * 0.3  # Only time progress

    def test_compute_goal_progress_goal_not_found(self, fake_table):
        """Test progress calculation when goal is not found"""
        with pytest.raises(Exception):  # Should raise HTTPException
            main_module.compute_goal_progress("nonexistent-goal", "test-user-1", fake_table)

    def test_get_goal_tasks_success(self, fake_table, sample_tasks):
        """Test getting tasks for a goal"""
        for task in sample_tasks:
            fake_table.put_item({
                "PK": "USER#test-user-1",
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        tasks = main_module.get_goal_tasks("test-goal-1", "test-user-1", fake_table)
        
        assert len(tasks) == 3
        assert all(task["goalId"] == "test-goal-1" for task in tasks)

    def test_get_goal_tasks_empty(self, fake_table):
        """Test getting tasks when no tasks exist"""
        tasks = main_module.get_goal_tasks("test-goal-1", "test-user-1", fake_table)
        assert tasks == []


class TestProgressEndpoints:
    """Test the progress calculation endpoints"""

    def test_get_goal_progress_success(self, client, fake_table, sample_goal, sample_tasks):
        """Test successful goal progress endpoint"""
        # Add goal and tasks to fake table
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": "GOAL#test-goal-1",
            **sample_goal
        })
        
        for task in sample_tasks:
            fake_table.put_item({
                "PK": "USER#test-user-1",
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        # Generate proper JWT token
        token = _issue_token()
        
        response = client.get(
            f"/quests/test-goal-1/progress",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["goalId"] == "test-goal-1"
        assert "progressPercentage" in data
        assert "taskProgress" in data
        assert "timeProgress" in data
        assert "completedTasks" in data
        assert "totalTasks" in data
        assert "milestones" in data
        assert "isOverdue" in data
        assert "isUrgent" in data

    def test_get_goal_progress_not_found(self, fake_table):
        """Test goal progress endpoint when goal not found"""
        app.dependency_overrides[get_goals_table] = lambda: fake_table
        try:
            token = _issue_token()
            
            with TestClient(app) as client:
                response = client.get(
                    f"/quests/nonexistent-goal/progress",
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_get_all_goals_progress_success(self, fake_table, sample_goal, sample_tasks):
        """Test successful all goals progress endpoint"""
        app.dependency_overrides[get_goals_table] = lambda: fake_table
        try:
            # Add multiple goals
            goals = [
                {**sample_goal, "id": "goal-1"},
                {**sample_goal, "id": "goal-2", "title": "Goal 2"}
            ]
            
            for goal in goals:
                fake_table.put_item({
                    "PK": "USER#test-user-1",
                    "SK": f"GOAL#{goal['id']}",
                    **goal
                })
            
            # Add tasks for first goal
            for task in sample_tasks:
                fake_table.put_item({
                    "PK": "USER#test-user-1",
                    "SK": f"TASK#{task['id']}",
                    **task
                })
            
            token = _issue_token()
            
            with TestClient(app) as client:
                response = client.get(
                    "/quests/progress",
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2  # Two goals
        finally:
            app.dependency_overrides.clear()
        
        for goal_progress in data:
            assert "goalId" in goal_progress
            assert "progressPercentage" in goal_progress

    def test_get_all_goals_progress_empty(self, fake_table):
        """Test all goals progress endpoint when no goals exist"""
        app.dependency_overrides[get_goals_table] = lambda: fake_table
        try:
            token = _issue_token()
            
            with TestClient(app) as client:
                response = client.get(
                    "/quests/progress",
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data == []
        finally:
            app.dependency_overrides.clear()


class TestProgressIntegration:
    """Test progress calculation integration with existing operations"""

    def test_progress_calculation_after_task_completion(self, fake_table, sample_goal, sample_tasks):
        """Test that progress is recalculated after task completion"""
        # Add goal and tasks
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": "GOAL#test-goal-1",
            **sample_goal
        })
        
        for task in sample_tasks:
            fake_table.put_item({
                "PK": "USER#test-user-1",
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        # Calculate initial progress
        initial_progress = main_module.compute_goal_progress("test-goal-1", "test-user-1", fake_table)
        initial_completed = initial_progress.completedTasks
        
        # Complete another task
        task_to_complete = sample_tasks[1]  # Task 2 (currently active)
        task_to_complete["status"] = "completed"
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": f"TASK#{task_to_complete['id']}",
            **task_to_complete
        })
        
        # Calculate progress after completion
        updated_progress = main_module.compute_goal_progress("test-goal-1", "test-user-1", fake_table)
        
        assert updated_progress.completedTasks == initial_completed + 1
        assert updated_progress.taskProgress > initial_progress.taskProgress
        assert updated_progress.progressPercentage > initial_progress.progressPercentage

    def test_progress_calculation_hybrid_weights(self, fake_table, sample_goal):
        """Test that hybrid progress uses correct 70/30 weights"""
        # Create goal with specific time progress
        now = int(time.time() * 1000)
        # Set deadline to 10 days from creation for predictable time progress
        deadline = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        sample_goal["deadline"] = deadline
        sample_goal["createdAt"] = now
        
        fake_table.put_item({
            "PK": "USER#test-user-1",
            "SK": "GOAL#test-goal-1",
            **sample_goal
        })
        
        # Add tasks with 50% completion
        tasks = [
            {"id": "task-1", "goalId": "test-goal-1", "status": "completed"},
            {"id": "task-2", "goalId": "test-goal-1", "status": "active"}
        ]
        
        for task in tasks:
            fake_table.put_item({
                "PK": "USER#test-user-1",
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        progress = main_module.compute_goal_progress("test-goal-1", "test-user-1", fake_table)
        
        # Task progress should be 50% (1 completed out of 2)
        assert progress.taskProgress == 50.0
        
        # Time progress should be very low (just created)
        assert progress.timeProgress < 5
        
        # Hybrid progress should be: (50 * 0.7) + (time_progress * 0.3)
        expected_hybrid = (50.0 * 0.7) + (progress.timeProgress * 0.3)
        assert abs(progress.progressPercentage - expected_hybrid) < 0.01
