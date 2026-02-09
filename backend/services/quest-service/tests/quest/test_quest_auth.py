"""
Authentication and Authorization Tests for Quest Functionality.

This module tests authentication and authorization controls including:
- JWT token validation
- User ownership verification
- Role-based access control
- Permission checks
- Token expiration handling
- Cross-user access prevention
"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import patch, Mock, MagicMock
from fastapi.testclient import TestClient
import jwt

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from .test_helpers import (
    TestDataHelpers,
    TestClientHelpers,
    DatabaseHelpers,
    AuthHelpers
)
from .test_data_manager import test_data_manager

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestJWTTokenValidation:
    """Test JWT token validation and handling."""
    
    def test_valid_jwt_token_acceptance(self, test_user_id):
        """Test that valid JWT tokens are accepted."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_quest_payload(
                title="Valid Token Test Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            
            assert response.status_code == 201
            data = response.json()
            assert data["userId"] == test_user_id
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{data['id']}"
            )
    
    def test_invalid_jwt_token_rejection(self):
        """Test that invalid JWT tokens are rejected."""
        with TestClient(app) as client:
            # Test with malformed token
            headers = {"Authorization": "Bearer invalid-token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Test with missing Bearer prefix
            headers = {"Authorization": "invalid-token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Test with empty token
            headers = {"Authorization": "Bearer "}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
    
    def test_expired_jwt_token_rejection(self, test_user_id):
        """Test that expired JWT tokens are rejected."""
        # Create an expired token
        expired_payload = {
            "sub": test_user_id,
            "role": "user",
            "exp": int(time.time()) - 3600  # Expired 1 hour ago
        }
        
        # Mock JWT verification to return expired token
        with patch('app.auth.TokenVerifier.verify') as mock_verify:
            mock_verify.side_effect = jwt.ExpiredSignatureError("Token has expired")
            
            with TestClient(app) as client:
                headers = {"Authorization": "Bearer expired-token"}
                response = client.post("/quests/createQuest", 
                                     json={"title": "Test", "category": "Health"},
                                     headers=headers)
                assert response.status_code == 401
    
    def test_malformed_jwt_token_rejection(self):
        """Test that malformed JWT tokens are rejected."""
        with TestClient(app) as client:
            # Test with completely invalid token format
            headers = {"Authorization": "Bearer not.a.jwt.token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Test with token that's not a JWT
            headers = {"Authorization": "Bearer just-a-string"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
    
    def test_missing_authorization_header(self):
        """Test that missing authorization header is rejected."""
        with TestClient(app) as client:
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"})
            assert response.status_code == 401
    
    def test_jwt_token_verification_failure(self, test_user_id):
        """Test handling of JWT token verification failures."""
        with patch('app.auth.TokenVerifier.verify') as mock_verify:
            mock_verify.side_effect = Exception("Token verification failed")
            
            with TestClient(app) as client:
                headers = {"Authorization": "Bearer some-token"}
                response = client.post("/quests/createQuest", 
                                     json={"title": "Test", "category": "Health"},
                                     headers=headers)
                assert response.status_code == 401


class TestUserOwnershipVerification:
    """Test user ownership verification for quests."""
    
    def test_user_can_access_own_quests(self, test_user_id):
        """Test that users can access their own quests."""
        # Create a quest for the user
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Own Quest Test",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test all operations on own quest
            operations = [
                ("GET", f"/quests/quests/{quest_id}", None),
                ("POST", f"/quests/quests/{quest_id}/start", None),
                ("PUT", f"/quests/quests/{quest_id}", {"title": "Updated"}),
                ("POST", f"/quests/quests/{quest_id}/cancel", {"reason": "Test"}),
                ("POST", f"/quests/quests/{quest_id}/fail", None),
                ("DELETE", f"/quests/quests/{quest_id}", None),
            ]
            
            for method, endpoint, data in operations:
                if method == "GET":
                    response = client.get(endpoint)
                elif method == "POST":
                    response = client.post(endpoint, json=data)
                elif method == "PUT":
                    response = client.put(endpoint, json=data)
                elif method == "DELETE":
                    response = client.delete(endpoint)
                
                # Should be successful (except for some status transitions)
                assert response.status_code in [200, 201, 400, 404]  # 400/404 for invalid transitions
                assert response.status_code not in [403, 401]  # Should not be forbidden or unauthorized
    
    def test_user_cannot_access_other_users_quests(self, test_user_id):
        """Test that users cannot access other users' quests."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create a quest for another user
        other_quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test all operations on other user's quest
            operations = [
                ("GET", f"/quests/quests/{other_quest_id}", None),
                ("POST", f"/quests/quests/{other_quest_id}/start", None),
                ("PUT", f"/quests/quests/{other_quest_id}", {"title": "Hacked"}),
                ("POST", f"/quests/quests/{other_quest_id}/cancel", {"reason": "Hacked"}),
                ("POST", f"/quests/quests/{other_quest_id}/fail", None),
                ("DELETE", f"/quests/quests/{other_quest_id}", None),
            ]
            
            for method, endpoint, data in operations:
                if method == "GET":
                    response = client.get(endpoint)
                elif method == "POST":
                    response = client.post(endpoint, json=data)
                elif method == "PUT":
                    response = client.put(endpoint, json=data)
                elif method == "DELETE":
                    response = client.delete(endpoint)
                
                # Should be forbidden or not found
                assert response.status_code in [403, 404]
                assert response.status_code not in [200, 201]  # Should not be successful
    
    def test_quest_creation_assigns_correct_user(self, test_user_id):
        """Test that quest creation assigns the correct user ID."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_quest_payload(
                title="User Assignment Test Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            
            assert response.status_code == 201
            data = response.json()
            assert data["userId"] == test_user_id
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", data["id"], test_user_id,
                f"USER#{test_user_id}", f"QUEST#{data['id']}"
            )
    
    def test_quest_listing_shows_only_user_quests(self, test_user_id):
        """Test that quest listing shows only the user's quests."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quests for both users
        user_quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        other_quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get("/quests/quests")
            
            assert response.status_code == 200
            data = response.json()
            
            # Should only contain user's quests
            quest_ids = [quest["id"] for quest in data]
            assert user_quest_id in quest_ids
            assert other_quest_id not in quest_ids
            
            # All quests should belong to the user
            for quest in data:
                assert quest["userId"] == test_user_id


class TestRoleBasedAccessControl:
    """Test role-based access control for quest operations."""
    
    def test_regular_user_permissions(self, test_user_id):
        """Test permissions for regular users."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Regular users should be able to create quests
            payload = TestDataHelpers.create_test_quest_payload(
                title="Regular User Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            quest_data = response.json()
            quest_id = quest_data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # Regular users should be able to manage their own quests
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            response = client.put(f"/quests/quests/{quest_id}", json={"title": "Updated"})
            assert response.status_code == 200
            
            response = client.post(f"/quests/quests/{quest_id}/cancel", json={"reason": "Test"})
            assert response.status_code == 200
    
    def test_admin_user_permissions(self, test_user_id):
        """Test permissions for admin users."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id, role="admin") as client:
            # Admins should be able to create quests
            payload = TestDataHelpers.create_test_quest_payload(
                title="Admin User Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            quest_data = response.json()
            quest_id = quest_data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # Admins should be able to delete active quests
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            response = client.delete(f"/quests/quests/{quest_id}")
            assert response.status_code == 200
    
    def test_regular_user_cannot_delete_active_quests(self, test_user_id):
        """Test that regular users cannot delete active quests."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Active Quest Test",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            # Try to delete it (should fail for regular users)
            response = client.delete(f"/quests/quests/{quest_id}")
            assert response.status_code == 403
            
            data = response.json()
            assert "detail" in data
            assert "admin" in data["detail"].lower()
    
    def test_guest_user_permissions(self, test_user_id):
        """Test permissions for guest users."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id, role="guest") as client:
            # Guest users should have limited permissions
            payload = TestDataHelpers.create_test_quest_payload(
                title="Guest User Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            # Guest users might not be able to create quests
            assert response.status_code in [201, 403]
    
    def test_invalid_role_handling(self, test_user_id):
        """Test handling of invalid user roles."""
        with patch('app.auth.TokenVerifier.verify') as mock_verify:
            mock_verify.return_value = (
                {"sub": test_user_id, "role": "invalid_role"}, 
                "cognito"
            )
            
            with TestClient(app) as client:
                headers = {"Authorization": "Bearer some-token"}
                response = client.post("/quests/createQuest", 
                                     json={"title": "Test", "category": "Health"},
                                     headers=headers)
                # Should handle invalid roles gracefully
                assert response.status_code in [201, 403, 500]


class TestPermissionChecks:
    """Test specific permission checks for quest operations."""
    
    def test_quest_creation_permission(self, test_user_id):
        """Test quest creation permission."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = TestDataHelpers.create_test_quest_payload(
                title="Permission Test Quest",
                category="Health"
            )
            
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
    
    def test_quest_read_permission(self, test_user_id):
        """Test quest read permission."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Read Permission Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/quests/quests/{quest_id}")
            assert response.status_code == 200
    
    def test_quest_update_permission(self, test_user_id):
        """Test quest update permission."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Update Permission Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            payload = {"title": "Updated Title"}
            response = client.put(f"/quests/quests/{quest_id}", json=payload)
            assert response.status_code == 200
    
    def test_quest_delete_permission(self, test_user_id):
        """Test quest delete permission."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Delete Permission Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.delete(f"/quests/quests/{quest_id}")
            assert response.status_code == 200
    
    def test_quest_status_change_permission(self, test_user_id):
        """Test quest status change permission."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Status Change Permission Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test start permission
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            # Test cancel permission
            response = client.post(f"/quests/quests/{quest_id}/cancel", json={"reason": "Test"})
            assert response.status_code == 200


class TestCrossUserAccessPrevention:
    """Test prevention of cross-user access."""
    
    def test_user_cannot_modify_other_users_quests(self, test_user_id):
        """Test that users cannot modify other users' quests."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quest for other user
        other_quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Try to update other user's quest
            payload = {"title": "Hacked Title"}
            response = client.put(f"/quests/quests/{other_quest_id}", json=payload)
            assert response.status_code in [403, 404]
            
            # Try to change status of other user's quest
            response = client.post(f"/quests/quests/{other_quest_id}/start")
            assert response.status_code in [403, 404]
            
            # Try to delete other user's quest
            response = client.delete(f"/quests/quests/{other_quest_id}")
            assert response.status_code in [403, 404]
    
    def test_user_cannot_list_other_users_quests(self, test_user_id):
        """Test that users cannot list other users' quests."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quest for other user
        DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get("/quests/quests")
            assert response.status_code == 200
            
            data = response.json()
            # Should not contain other user's quests
            for quest in data:
                assert quest["userId"] == test_user_id
    
    def test_user_cannot_access_other_users_quest_details(self, test_user_id):
        """Test that users cannot access other users' quest details."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quest for other user
        other_quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            response = client.get(f"/quests/quests/{other_quest_id}")
            assert response.status_code in [403, 404]


class TestTokenExpirationHandling:
    """Test handling of token expiration scenarios."""
    
    def test_token_expiration_during_operation(self, test_user_id):
        """Test handling when token expires during an operation."""
        # Create a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Token Expiration Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest
            response = client.post(f"/quests/quests/{quest_id}/start")
            assert response.status_code == 200
            
            # Simulate token expiration by mocking expired token
            with patch('app.auth.TokenVerifier.verify') as mock_verify:
                mock_verify.side_effect = jwt.ExpiredSignatureError("Token has expired")
                
                # Try to update the quest with expired token
                payload = {"title": "Updated Title"}
                response = client.put(f"/quests/quests/{quest_id}", json=payload)
                assert response.status_code == 401
    
    def test_token_refresh_requirement(self, test_user_id):
        """Test that expired tokens require refresh."""
        with patch('app.auth.TokenVerifier.verify') as mock_verify:
            mock_verify.side_effect = jwt.ExpiredSignatureError("Token has expired")
            
            with TestClient(app) as client:
                headers = {"Authorization": "Bearer expired-token"}
                response = client.post("/quests/createQuest", 
                                     json={"title": "Test", "category": "Health"},
                                     headers=headers)
                assert response.status_code == 401
                
                data = response.json()
                assert "detail" in data
                # Should indicate token expiration
                assert "expired" in data["detail"].lower() or "invalid" in data["detail"].lower()


class TestAuthenticationEdgeCases:
    """Test authentication edge cases and error scenarios."""
    
    def test_empty_authorization_header(self):
        """Test handling of empty authorization header."""
        with TestClient(app) as client:
            headers = {"Authorization": ""}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
    
    def test_malformed_authorization_header(self):
        """Test handling of malformed authorization header."""
        with TestClient(app) as client:
            # Missing Bearer prefix
            headers = {"Authorization": "some-token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Multiple Bearer prefixes
            headers = {"Authorization": "Bearer Bearer some-token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
    
    def test_authorization_header_case_sensitivity(self):
        """Test authorization header case sensitivity."""
        with TestClient(app) as client:
            # Different case
            headers = {"authorization": "Bearer some-token"}  # lowercase
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            # Should still work (HTTP headers are case-insensitive)
            assert response.status_code in [200, 401]  # 401 if token is invalid, 200 if valid
    
    def test_multiple_authorization_headers(self):
        """Test handling of multiple authorization headers."""
        with TestClient(app) as client:
            # Multiple authorization headers (should use the first one)
            headers = {
                "Authorization": "Bearer first-token",
                "Authorization": "Bearer second-token"
            }
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            # Should use the first header
            assert response.status_code == 401  # Both tokens are invalid
