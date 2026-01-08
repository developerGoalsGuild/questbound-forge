"""
Integration Tests for Quest API with Real Authentication.

This module demonstrates how to use the new authentication approach
for integration testing with real API calls.
"""

import pytest
import os
import requests
from test_helpers import AuthHelpers, TestDataHelpers, ValidationHelpers
from test_data_manager import test_data_manager


class TestQuestIntegrationWithAuth:
    """Integration tests using real authentication."""
    
    def test_create_quest_with_real_auth(self):
        """Test creating a quest with real authentication."""
        # This test will use the authentication set up by run_tests.py
        payload = TestDataHelpers.create_test_quest_payload(
            title="Integration Test Quest",
            category="Health",
            difficulty="medium",
            description="Testing with real authentication"
        )
        
        # Make authenticated request
        response = AuthHelpers.make_authenticated_request(
            "POST", 
            "/quests/createQuest", 
            json=payload
        )
        
        assert response.status_code == 201
        data = response.json()
        ValidationHelpers.assert_quest_response_structure(data)
        
        assert data["title"] == "Integration Test Quest"
        assert data["category"] == "Health"
        assert data["difficulty"] == "medium"
        assert data["status"] == "draft"
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", 
            data["id"], 
            data["userId"],
            f"USER#{data['userId']}",
            f"QUEST#{data['id']}"
        )
    
    def test_quest_lifecycle_with_real_auth(self):
        """Test complete quest lifecycle with real authentication."""
        # 1. Create quest
        create_payload = TestDataHelpers.create_test_quest_payload(
            title="Lifecycle Test Quest",
            category="Work",
            difficulty="hard"
        )
        
        create_response = AuthHelpers.make_authenticated_request(
            "POST",
            "/quests/createQuest",
            json=create_payload
        )
        
        assert create_response.status_code == 201
        quest_data = create_response.json()
        quest_id = quest_data["id"]
        user_id = quest_data["userId"]
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", quest_id, user_id,
            f"USER#{user_id}", f"QUEST#{quest_id}"
        )
        
        # 2. Start quest
        start_response = AuthHelpers.make_authenticated_request(
            "POST",
            f"/quests/quests/{quest_id}/start"
        )
        
        assert start_response.status_code == 200
        start_data = start_response.json()
        assert start_data["status"] == "active"
        
        # 3. Update quest (should fail - can't update active quest)
        update_payload = {"title": "Updated Title"}
        update_response = AuthHelpers.make_authenticated_request(
            "PUT",
            f"/quests/quests/{quest_id}",
            json=update_payload
        )
        
        assert update_response.status_code == 400
        
        # 4. Cancel quest
        cancel_payload = {"reason": "Integration test complete"}
        cancel_response = AuthHelpers.make_authenticated_request(
            "POST",
            f"/quests/quests/{quest_id}/cancel",
            json=cancel_payload
        )
        
        assert cancel_response.status_code == 200
        cancel_data = cancel_response.json()
        assert cancel_data["status"] == "cancelled"
    
    def test_authentication_required(self):
        """Test that authentication is required for protected endpoints."""
        payload = TestDataHelpers.create_test_quest_payload()
        
        # Make an unauthenticated request (no token)
        api_url = AuthHelpers.get_api_url()
        api_key = AuthHelpers.get_api_key()
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
            # Note: No Authorization header = unauthenticated
        }
        
        response = requests.post(
            f"{api_url}/v1/quests/createQuest",
            json=payload,
            headers=headers
        )
        
        # Should get 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}: {response.text}"
    
    def test_quantitative_quest_with_real_auth(self):
        """Test creating quantitative quest with real authentication."""
        payload = TestDataHelpers.create_test_quantitative_quest_payload(
            title="Quantitative Integration Test",
            category="Fitness",
            target_count=5
        )
        
        response = AuthHelpers.make_authenticated_request(
            "POST",
            "/quests/createQuest",
            json=payload
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["kind"] == "quantitative"
        assert data["targetCount"] == 5
        assert data["countScope"] == "any"
        assert data["startAt"] is not None
        assert data["periodSeconds"] == 86400
        
        # Track for cleanup
        test_data_manager.track_test_item(
            "quest", 
            data["id"], 
            data["userId"],
            f"USER#{data['userId']}",
            f"QUEST#{data['id']}"
        )
    
    def test_error_handling_with_real_auth(self):
        """Test error handling with real authentication."""
        # Test invalid payload
        invalid_payload = {
            "title": "",  # Empty title should fail
            "category": "Health"
        }
        
        response = AuthHelpers.make_authenticated_request(
            "POST",
            "/quests/createQuest",
            json=invalid_payload
        )
        
        assert response.status_code == 400
        data = response.json()
        ValidationHelpers.assert_error_response_structure(data)
    
    def test_quest_not_found_with_real_auth(self):
        """Test quest not found with real authentication."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        response = AuthHelpers.make_authenticated_request(
            "GET",
            f"/quests/quests/{fake_quest_id}"
        )
        
        # Quest service may return 403 (Forbidden) or 404 (Not Found) for non-existent quests
        # depending on authorization logic
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}: {response.text}"
        data = response.json()
        ValidationHelpers.assert_error_response_structure(data)


# Example of how to run these tests
if __name__ == "__main__":
    # This would be run by the test runner, not directly
    print("These tests should be run through run_tests.py to ensure proper authentication setup")
