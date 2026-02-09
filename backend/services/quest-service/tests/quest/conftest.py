"""
Quest Test Configuration and Fixtures.

This module provides test configuration, fixtures, and setup for Quest testing.
"""

import pytest
import os
import sys
from pathlib import Path
from unittest.mock import patch, Mock, MagicMock

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from .test_data_manager import test_data_manager, TestDataManager
from .test_helpers import (
    TestDataHelpers,
    AuthHelpers,
    TestClientHelpers,
    DatabaseHelpers,
    ValidationHelpers,
    SecurityHelpers
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment for all tests."""
    # Override environment variables for testing
    test_env = {
        "CORE_TABLE": "gg_core_test",
        "JWT_AUDIENCE": "api://test",
        "JWT_ISSUER": "https://auth.test",
        "COGNITO_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "test-pool",
        "COGNITO_CLIENT_ID": "test-client",
        "ALLOWED_ORIGINS": "http://localhost:3000",
        "QUEST_SERVICE_JWT_SECRET": "test-secret-key"
    }
    
    with patch.dict(os.environ, test_env):
        yield


@pytest.fixture(scope="function", autouse=True)
def cleanup_test_data():
    """Clean up test data after each test."""
    yield
    # Cleanup is handled by the test_data_manager fixture


@pytest.fixture(scope="session", autouse=True)
def final_cleanup():
    """Final cleanup at the end of all tests."""
    yield
    print("Performing final cleanup of all test data...")
    try:
        test_data_manager.cleanup_all_quest_test_data()
        test_data_manager.cleanup_all_goal_test_data()
        test_data_manager.cleanup_all_task_test_data()

        # Verify cleanup
        if test_data_manager.verify_cleanup():
            print("All test data successfully cleaned up")
        else:
            print("Some test data may still remain in database")
    except Exception as e:
        print(f"Cleanup failed due to AWS credential issues: {e}")
        print("Skipping cleanup - this is expected in test environment")


@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB operations."""
    with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        yield mock_table


@pytest.fixture
def mock_jwt_verification():
    """Mock JWT token verification."""
    with patch('app.auth.TokenVerifier.verify') as mock_verify:
        mock_verify.return_value = (
            {"sub": "test-user-123", "role": "user"}, 
            "cognito"
        )
        yield mock_verify


@pytest.fixture
def mock_logging():
    """Mock logging to prevent log pollution."""
    with patch('app.main.logger') as mock_logger:
        yield mock_logger


@pytest.fixture
def test_user_id():
    """Provide a test user ID for tests."""
    return TestDataHelpers.generate_test_user_id()


@pytest.fixture
def test_quest_id():
    """Provide a test quest ID for tests."""
    return TestDataHelpers.generate_test_quest_id()


@pytest.fixture
def test_goal_id():
    """Provide a test goal ID for tests."""
    return TestDataHelpers.generate_test_goal_id()


@pytest.fixture
def test_task_id():
    """Provide a test task ID for tests."""
    return TestDataHelpers.generate_test_task_id()


@pytest.fixture
def future_timestamp():
    """Provide a future timestamp for tests."""
    return TestDataHelpers.generate_future_timestamp(7)


@pytest.fixture
def mock_auth_context(test_user_id):
    """Provide a mock authentication context for tests."""
    return AuthHelpers.create_mock_auth_context(test_user_id)


@pytest.fixture
def mock_admin_auth_context(test_user_id):
    """Provide a mock admin authentication context for tests."""
    return AuthHelpers.create_admin_auth_context(test_user_id)


@pytest.fixture
def authenticated_client(test_user_id):
    """Provide an authenticated test client."""
    from app.main import app
    return TestClientHelpers.create_authenticated_client(app, test_user_id)


@pytest.fixture
def admin_client(test_user_id):
    """Provide an admin authenticated test client."""
    from app.main import app
    return TestClientHelpers.create_authenticated_client(app, test_user_id, role="admin")


@pytest.fixture
def quest_test_data(test_user_id):
    """Provide test quest data."""
    return {
        "title": "Test Quest",
        "category": "Health",
        "difficulty": "medium",
        "description": "Test quest description",
        "rewardXp": 75,
        "tags": ["test", "health"],
        "privacy": "private",
        "kind": "linked"
    }


@pytest.fixture
def quantitative_quest_test_data(test_user_id):
    """Provide test quantitative quest data."""
    future_time = TestDataHelpers.generate_future_timestamp(1)
    return {
        "title": "Test Quantitative Quest",
        "category": "Work",
        "difficulty": "hard",
        "kind": "quantitative",
        "targetCount": 10,
        "countScope": "completed_tasks",
        "startAt": future_time,
        "periodDays": 1
    }


@pytest.fixture
def linked_quest_test_data(test_user_id):
    """Provide test linked quest data."""
    return {
        "title": "Test Linked Quest",
        "category": "Health",
        "difficulty": "medium",
        "kind": "linked",
        "linkedGoalIds": [],
        "linkedTaskIds": []
    }


@pytest.fixture
def test_quest_created(test_user_id, quest_test_data):
    """Create a test quest and return its ID."""
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quest_test_data)
    yield quest_id
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_quest_with_goals(test_user_id):
    """Create a test quest with linked goals."""
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
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
        "title": "Test Quest with Goals",
        "category": "Health",
        "difficulty": "medium",
        "kind": "linked",
        "linkedGoalIds": goal_ids
    })
    
    yield quest_id, goal_ids
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_quest_with_tasks(test_user_id):
    """Create a test quest with linked tasks."""
    # Create test goal
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
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
        "title": "Test Quest with Tasks",
        "category": "Health",
        "difficulty": "medium",
        "kind": "linked",
        "linkedTaskIds": task_ids
    })
    
    yield quest_id, task_ids
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_quantitative_quest(test_user_id, quantitative_quest_test_data):
    """Create a test quantitative quest and return its ID."""
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quantitative_quest_test_data)
    yield quest_id
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_active_quest(test_user_id, quest_test_data):
    """Create and start a test quest."""
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quest_test_data)
    
    # Start the quest
    from app.db.quest_db import change_quest_status
    change_quest_status(test_user_id, quest_id, "active", "Starting quest for testing")
    
    yield quest_id
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_cancelled_quest(test_user_id, quest_test_data):
    """Create, start, and cancel a test quest."""
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quest_test_data)
    
    # Start and then cancel the quest
    from app.db.quest_db import change_quest_status
    change_quest_status(test_user_id, quest_id, "active", "Starting quest for testing")
    change_quest_status(test_user_id, quest_id, "cancelled", "Cancelling quest for testing")
    
    yield quest_id
    # Cleanup is handled by test_data_manager


@pytest.fixture
def test_failed_quest(test_user_id, quest_test_data):
    """Create, start, and fail a test quest."""
    quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quest_test_data)
    
    # Start and then fail the quest
    from app.db.quest_db import change_quest_status
    change_quest_status(test_user_id, quest_id, "active", "Starting quest for testing")
    change_quest_status(test_user_id, quest_id, "failed", "Failing quest for testing")
    
    yield quest_id
    # Cleanup is handled by test_data_manager


@pytest.fixture
def mock_database_errors():
    """Mock database errors for testing."""
    with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Configure mock to raise errors
        mock_table.put_item.side_effect = Exception("Database error")
        mock_table.get_item.side_effect = Exception("Database error")
        mock_table.update_item.side_effect = Exception("Database error")
        mock_table.delete_item.side_effect = Exception("Database error")
        mock_table.query.side_effect = Exception("Database error")
        mock_table.scan.side_effect = Exception("Database error")
        
        yield mock_table


@pytest.fixture
def mock_network_errors():
    """Mock network errors for testing."""
    with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
        from botocore.exceptions import BotoCoreError
        mock_get_table.side_effect = BotoCoreError("Network error")
        yield mock_get_table


@pytest.fixture
def mock_authentication_errors():
    """Mock authentication errors for testing."""
    with patch('app.auth.TokenVerifier.verify') as mock_verify:
        mock_verify.side_effect = Exception("Authentication error")
        yield mock_verify


@pytest.fixture
def mock_authorization_errors():
    """Mock authorization errors for testing."""
    with patch('app.db.quest_db.get_quest') as mock_get_quest:
        from app.db.quest_db import QuestPermissionError
        mock_get_quest.side_effect = QuestPermissionError("Permission denied")
        yield mock_get_quest


@pytest.fixture
def performance_monitor():
    """Monitor performance during tests."""
    import psutil
    import time
    
    class PerformanceMonitor:
        def __init__(self):
            self.start_time = None
            self.start_memory = None
            self.end_time = None
            self.end_memory = None
        
        def start(self):
            self.start_time = time.time()
            self.start_memory = psutil.Process().memory_info().rss
        
        def stop(self):
            self.end_time = time.time()
            self.end_memory = psutil.Process().memory_info().rss
        
        @property
        def execution_time(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
        
        @property
        def memory_usage(self):
            if self.start_memory and self.end_memory:
                return self.end_memory - self.start_memory
            return None
    
    monitor = PerformanceMonitor()
    monitor.start()
    yield monitor
    monitor.stop()


# Pytest configuration
def pytest_configure(config):
    """Configure pytest for Quest testing."""
    # Add custom markers
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "performance: marks tests as performance tests")
    config.addinivalue_line("markers", "security: marks tests as security tests")
    config.addinivalue_line("markers", "auth: marks tests as authentication tests")


def pytest_collection_modifyitems(config, items):
    """Modify test collection for Quest testing."""
    # Add markers based on test names
    for item in items:
        if "performance" in item.name:
            item.add_marker(pytest.mark.performance)
        if "integration" in item.name:
            item.add_marker(pytest.mark.integration)
        if "security" in item.name:
            item.add_marker(pytest.mark.security)
        if "auth" in item.name:
            item.add_marker(pytest.mark.auth)
        if "slow" in item.name or "concurrent" in item.name:
            item.add_marker(pytest.mark.slow)


# Test data cleanup configuration
@pytest.fixture(scope="session", autouse=True)
def configure_test_cleanup():
    """Configure test data cleanup."""
    # Set up cleanup configuration
    test_data_manager.test_user_prefix = "test_user_"
    test_data_manager.test_quest_prefix = "test_quest_"
    test_data_manager.test_goal_prefix = "test_goal_"
    test_data_manager.test_task_prefix = "test_task_"
    
    yield
    
    # Final cleanup
    print("Performing final test data cleanup...")
    test_data_manager.cleanup_all_test_data()
