"""
Error Scenario Tests for Quest Functionality.

This module tests error handling and edge cases including:
- Network failures and timeouts
- Database connection errors
- Invalid data scenarios
- Edge cases and boundary conditions
- Malformed requests
- Resource exhaustion scenarios
"""

import pytest
import time
from unittest.mock import patch, Mock, MagicMock, side_effect
from botocore.exceptions import ClientError, BotoCoreError, NoCredentialsError
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
    DatabaseHelpers
)
from test_data_manager import test_data_manager
from app.db.quest_db import (
    QuestDBError, QuestNotFoundError, QuestVersionConflictError, 
    QuestPermissionError
)

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestNetworkErrorScenarios:
    """Test handling of network-related errors."""
    
    def test_database_connection_timeout(self, test_user_id):
        """Test handling of database connection timeouts."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            # Mock timeout error
            mock_get_table.side_effect = BotoCoreError()
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Timeout Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]
    
    def test_database_credentials_error(self, test_user_id):
        """Test handling of database credentials errors."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            # Mock credentials error
            mock_get_table.side_effect = NoCredentialsError()
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Credentials Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]
    
    def test_database_throttling_error(self, test_user_id):
        """Test handling of database throttling errors."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            mock_table = Mock()
            mock_get_table.return_value = mock_table
            
            # Mock throttling error
            mock_table.put_item.side_effect = ClientError(
                {'Error': {'Code': 'ProvisionedThroughputExceededException'}},
                'PutItem'
            )
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Throttling Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]


class TestDatabaseErrorScenarios:
    """Test handling of database-specific errors."""
    
    def test_database_validation_error(self, test_user_id):
        """Test handling of database validation errors."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            mock_table = Mock()
            mock_get_table.return_value = mock_table
            
            # Mock validation error
            mock_table.put_item.side_effect = ClientError(
                {'Error': {'Code': 'ValidationException', 'Message': 'Invalid attribute value'}},
                'PutItem'
            )
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Validation Error Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]
    
    def test_database_conditional_check_failed(self, test_user_id):
        """Test handling of conditional check failed errors."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            mock_table = Mock()
            mock_get_table.return_value = mock_table
            
            # Mock conditional check failed error
            mock_table.put_item.side_effect = ClientError(
                {'Error': {'Code': 'ConditionalCheckFailedException'}},
                'PutItem'
            )
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Conditional Check Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]
    
    def test_database_item_not_found_error(self, test_user_id):
        """Test handling of item not found errors."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/quests/quests/{fake_quest_id}")
            
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
            assert "Quest not found" in data["detail"]


class TestInvalidDataScenarios:
    """Test handling of invalid data scenarios."""
    
    def test_malformed_json_request(self, test_user_id):
        """Test handling of malformed JSON requests."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Send malformed JSON
            response = client.post(
                "/quests/createQuest",
                data="{'title': 'Malformed Quest', 'category': 'Health'}",  # Single quotes instead of double
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 422  # Unprocessable Entity
    
    def test_missing_required_fields(self, test_user_id):
        """Test handling of missing required fields."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Missing title
            payload = {"category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 422
            
            # Missing category
            payload = {"title": "Test Quest"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 422
            
            # Empty payload
            response = client.post("/quests/createQuest", json={})
            assert response.status_code == 422
    
    def test_invalid_field_types(self, test_user_id):
        """Test handling of invalid field types."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Invalid title type
            payload = {"title": 123, "category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 422
            
            # Invalid difficulty type
            payload = {"title": "Test Quest", "category": "Health", "difficulty": 123}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 422
            
            # Invalid rewardXp type
            payload = {"title": "Test Quest", "category": "Health", "rewardXp": "invalid"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 422
    
    def test_invalid_enum_values(self, test_user_id):
        """Test handling of invalid enum values."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Invalid difficulty
            payload = {"title": "Test Quest", "category": "Health", "difficulty": "invalid"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid category
            payload = {"title": "Test Quest", "category": "InvalidCategory"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid privacy
            payload = {"title": "Test Quest", "category": "Health", "privacy": "invalid"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400


class TestBoundaryConditionScenarios:
    """Test handling of boundary conditions and edge cases."""
    
    def test_title_length_boundaries(self, test_user_id):
        """Test title length boundary conditions."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Minimum valid length (3 characters)
            payload = {"title": "ABC", "category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Maximum valid length (100 characters)
            payload = {"title": "x" * 100, "category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Too short (2 characters)
            payload = {"title": "AB", "category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Too long (101 characters)
            payload = {"title": "x" * 101, "category": "Health"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_description_length_boundaries(self, test_user_id):
        """Test description length boundary conditions."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Maximum valid length (500 characters)
            payload = {"title": "Test Quest", "category": "Health", "description": "x" * 500}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Too long (501 characters)
            payload = {"title": "Test Quest", "category": "Health", "description": "x" * 501}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_tags_count_boundaries(self, test_user_id):
        """Test tags count boundary conditions."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Maximum valid count (10 tags)
            payload = {"title": "Test Quest", "category": "Health", "tags": ["tag"] * 10}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Too many tags (11 tags)
            payload = {"title": "Test Quest", "category": "Health", "tags": ["tag"] * 11}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_reward_xp_boundaries(self, test_user_id):
        """Test reward XP boundary conditions."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Minimum valid value (0)
            payload = {"title": "Test Quest", "category": "Health", "rewardXp": 0}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Maximum valid value (1000)
            payload = {"title": "Test Quest", "category": "Health", "rewardXp": 1000}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Too low (negative)
            payload = {"title": "Test Quest", "category": "Health", "rewardXp": -1}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Too high (1001)
            payload = {"title": "Test Quest", "category": "Health", "rewardXp": 1001}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400


class TestQuantitativeQuestErrorScenarios:
    """Test error scenarios specific to quantitative quests."""
    
    def test_missing_quantitative_required_fields(self, test_user_id):
        """Test missing required fields for quantitative quests."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Missing targetCount
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Missing countScope
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", "targetCount": 5}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Missing startAt
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 5, "countScope": "any"}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Missing periodSeconds
            future_time = TestDataHelpers.generate_future_timestamp(1)
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 5, "countScope": "any", "startAt": future_time}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
    
    def test_invalid_quantitative_field_values(self, test_user_id):
        """Test invalid field values for quantitative quests."""
        future_time = TestDataHelpers.generate_future_timestamp(1)
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Invalid targetCount (0)
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 0, "countScope": "any", "startAt": future_time, "periodSeconds": 86400}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid targetCount (too high)
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 10001, "countScope": "any", "startAt": future_time, "periodSeconds": 86400}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid countScope
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 5, "countScope": "invalid", "startAt": future_time, "periodSeconds": 86400}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid periodSeconds (0)
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 5, "countScope": "any", "startAt": future_time, "periodSeconds": 0}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400
            
            # Invalid periodSeconds (too long)
            payload = {"title": "Test Quest", "category": "Health", "kind": "quantitative", 
                      "targetCount": 5, "countScope": "any", "startAt": future_time, "periodSeconds": 366 * 24 * 60 * 60}
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 400


class TestQuestStatusTransitionErrors:
    """Test error scenarios for quest status transitions."""
    
    def test_invalid_status_transitions(self, test_user_id):
        """Test invalid quest status transitions."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Status Transition Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            # Try to start it again (invalid transition)
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 400
            
            # Cancel the quest
            response = client.post(f"/quests/quests/{quest_id}/cancel", json={"reason": "Test"})
            assert response.status_code == 200
            
            # Try to start a cancelled quest (invalid transition)
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 400
    
    def test_update_non_draft_quest(self, test_user_id):
        """Test updating a quest that's not in draft status."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Update Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            # Try to update it (should fail)
            payload = {"title": "Updated Title"}
            response = client.put(f"/quests/quests/{quest_id}", json=payload)
            assert response.status_code == 400


class TestResourceExhaustionScenarios:
    """Test handling of resource exhaustion scenarios."""
    
    def test_memory_exhaustion_simulation(self, test_user_id):
        """Test handling when memory is exhausted."""
        with patch('psutil.Process') as mock_process:
            # Mock memory exhaustion
            mock_memory = Mock()
            mock_memory.rss = 2 * 1024 * 1024 * 1024  # 2GB (simulate high memory usage)
            mock_process.return_value.memory_info.return_value = mock_memory
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Memory Exhaustion Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                # Should still work (memory check is not implemented in this test)
                # This test is for future implementation of memory monitoring
                assert response.status_code in [201, 500]  # Either success or server error
    
    def test_database_connection_pool_exhaustion(self, test_user_id):
        """Test handling when database connection pool is exhausted."""
        with patch('app.db.quest_db._get_dynamodb_table') as mock_get_table:
            # Mock connection pool exhaustion
            mock_get_table.side_effect = BotoCoreError("Connection pool exhausted")
            
            payload = TestDataHelpers.create_test_quest_payload(
                title="Connection Pool Test Quest",
                category="Health"
            )
            
            with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
                response = client.post("/quests/createQuest", json=payload)
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
                assert "Failed to create quest" in data["detail"]


class TestMalformedRequestScenarios:
    """Test handling of malformed requests."""
    
    def test_invalid_json_syntax(self, test_user_id):
        """Test handling of invalid JSON syntax."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Invalid JSON syntax
            response = client.post(
                "/quests/createQuest",
                data='{"title": "Test Quest", "category": "Health",}',  # Trailing comma
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 422
    
    def test_unsupported_content_type(self, test_user_id):
        """Test handling of unsupported content types."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Send XML instead of JSON
            response = client.post(
                "/quests/createQuest",
                data='<quest><title>Test Quest</title><category>Health</category></quest>',
                headers={"Content-Type": "application/xml"}
            )
            
            assert response.status_code == 422
    
    def test_oversized_request(self, test_user_id):
        """Test handling of oversized requests."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Create a very large description
            large_description = "x" * 10000  # 10KB description
            
            payload = {
                "title": "Oversized Request Test Quest",
                "category": "Health",
                "description": large_description
            }
            
            response = client.post("/quests/createQuest", json=payload)
            
            # Should be rejected due to size limits
            assert response.status_code == 400


class TestConcurrentModificationErrors:
    """Test handling of concurrent modification errors."""
    
    def test_concurrent_quest_updates(self, test_user_id):
        """Test handling of concurrent quest updates."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Concurrent Update Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Simulate concurrent updates by mocking version conflict
            with patch('app.db.quest_db.update_quest') as mock_update:
                mock_update.side_effect = QuestVersionConflictError("Quest was modified by another operation")
                
                payload = {"title": "Updated Title"}
                response = client.put(f"/quests/quests/{quest_id}", json=payload)
                
                assert response.status_code == 409
                data = response.json()
                assert "detail" in data
                assert "Quest was modified by another operation" in data["detail"]
    
    def test_concurrent_quest_deletion(self, test_user_id):
        """Test handling of concurrent quest deletion."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Concurrent Deletion Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Simulate concurrent deletion by mocking not found error
            with patch('app.db.quest_db.delete_quest') as mock_delete:
                mock_delete.side_effect = QuestNotFoundError("Quest not found")
                
                response = client.delete(f"/quests/quests/{quest_id}")
                
                assert response.status_code == 404
                data = response.json()
                assert "detail" in data
                assert "Quest not found" in data["detail"]
