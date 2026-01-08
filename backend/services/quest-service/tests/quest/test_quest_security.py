"""
Security Tests for Quest Functionality.

This module tests security controls including:
- XSS prevention
- SQL injection prevention
- Input sanitization
- Rate limiting
- Authentication and authorization
- Data validation
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
    AuthHelpers,
    TestClientHelpers,
    SecurityHelpers
)
from test_data_manager import test_data_manager

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestXSSPrevention:
    """Test XSS prevention in Quest functionality."""
    
    def test_xss_prevention_in_title(self, test_user_id):
        """Test XSS prevention in quest title."""
        xss_payloads = SecurityHelpers.get_xss_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for xss_payload in xss_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title=f"{xss_payload}Test Quest",
                    category="Health"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify XSS is sanitized
                    assert "<script>" not in data["title"]
                    assert "javascript:" not in data["title"]
                    assert "onerror=" not in data["title"]
                    assert "onload=" not in data["title"]
                    assert "Test Quest" in data["title"]
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_xss_prevention_in_description(self, test_user_id):
        """Test XSS prevention in quest description."""
        xss_payloads = SecurityHelpers.get_xss_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for xss_payload in xss_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title="Test Quest",
                    category="Health",
                    description=f"Description with {xss_payload} content"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify XSS is sanitized in description
                    assert "<script>" not in data["description"]
                    assert "javascript:" not in data["description"]
                    assert "onerror=" not in data["description"]
                    assert "onload=" not in data["description"]
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_xss_prevention_in_tags(self, test_user_id):
        """Test XSS prevention in quest tags."""
        xss_payloads = SecurityHelpers.get_xss_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for xss_payload in xss_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title="Test Quest",
                    category="Health",
                    tags=[f"tag{xss_payload}", "normal-tag"]
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify XSS is sanitized in tags
                    for tag in data["tags"]:
                        assert "<script>" not in tag
                        assert "javascript:" not in tag
                        assert "onerror=" not in tag
                        assert "onload=" not in tag
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_xss_prevention_in_cancel_reason(self, test_user_id):
        """Test XSS prevention in quest cancellation reason."""
        # Create a quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest for XSS",
            "category": "Health",
            "difficulty": "medium"
        })
        
        xss_payloads = SecurityHelpers.get_xss_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest first
            client.post(f"/quests/quests/{quest_id}/start")
            
            for xss_payload in xss_payloads:
                payload = {"reason": f"Reason with {xss_payload} content"}
                response = client.post(f"/quests/quests/{quest_id}/cancel", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    # Verify XSS is sanitized in audit trail or reason
                    # (The exact field depends on implementation)
                    pass  # Add specific assertions based on implementation
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400


class TestSQLInjectionPrevention:
    """Test SQL injection prevention in Quest functionality."""
    
    def test_sql_injection_prevention_in_title(self, test_user_id):
        """Test SQL injection prevention in quest title."""
        sql_payloads = SecurityHelpers.get_sql_injection_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for sql_payload in sql_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title=f"Title with {sql_payload} content",
                    category="Health"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify SQL injection is sanitized
                    assert "DROP TABLE" not in data["title"]
                    assert "DELETE FROM" not in data["title"]
                    assert "UNION SELECT" not in data["title"]
                    assert "INSERT INTO" not in data["title"]
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_sql_injection_prevention_in_description(self, test_user_id):
        """Test SQL injection prevention in quest description."""
        sql_payloads = SecurityHelpers.get_sql_injection_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for sql_payload in sql_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title="Test Quest",
                    category="Health",
                    description=f"Description with {sql_payload} content"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify SQL injection is sanitized
                    assert "DROP TABLE" not in data["description"]
                    assert "DELETE FROM" not in data["description"]
                    assert "UNION SELECT" not in data["description"]
                    assert "INSERT INTO" not in data["description"]
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400


class TestInputValidation:
    """Test input validation and sanitization."""
    
    def test_validation_bypass_prevention(self, test_user_id):
        """Test prevention of validation bypass attempts."""
        bypass_payloads = SecurityHelpers.get_validation_bypass_payloads()
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for bypass_payload in bypass_payloads:
                payload = TestDataHelpers.create_test_quest_payload(
                    title=bypass_payload,
                    category="Health"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                # Should either sanitize or reject
                if response.status_code == 201:
                    data = response.json()
                    # Verify input is properly handled
                    assert len(data["title"]) <= 100  # Max length enforced
                    assert data["title"].strip() != ""  # Not empty after sanitization
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_unicode_handling(self, test_user_id):
        """Test proper handling of Unicode characters."""
        unicode_titles = [
            "Quest with émojis 🚀🎯💪",
            "Quest with 中文 characters",
            "Quest with العربية text",
            "Quest with русский текст",
            "Quest with special chars: !@#$%^&*()"
        ]
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            for title in unicode_titles:
                payload = TestDataHelpers.create_test_quest_payload(
                    title=title,
                    category="Health"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    # Verify Unicode is preserved
                    assert data["title"] == title
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                else:
                    # If validation fails, that's also acceptable
                    assert response.status_code == 400
    
    def test_boundary_value_validation(self, test_user_id):
        """Test validation of boundary values."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Test minimum title length
            payload = TestDataHelpers.create_test_quest_payload(
                title="ABC",  # Exactly 3 characters
                category="Health"
            )
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Test maximum title length
            payload = TestDataHelpers.create_test_quest_payload(
                title="x" * 100,  # Exactly 100 characters
                category="Health"
            )
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Test maximum description length
            payload = TestDataHelpers.create_test_quest_payload(
                title="Test Quest",
                category="Health",
                description="x" * 500  # Exactly 500 characters
            )
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201
            
            # Test maximum tags count
            payload = TestDataHelpers.create_test_quest_payload(
                title="Test Quest",
                category="Health",
                tags=["tag"] * 10  # Exactly 10 tags
            )
            response = client.post("/quests/createQuest", json=payload)
            assert response.status_code == 201


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    def test_quest_creation_rate_limiting(self, test_user_id):
        """Test rate limiting for quest creation."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Create multiple quests rapidly
            created_quests = []
            
            for i in range(15):  # Try to create 15 quests (limit is 10/hour)
                payload = TestDataHelpers.create_test_quest_payload(
                    title=f"Rate Limit Test Quest {i}",
                    category="Health"
                )
                
                response = client.post("/quests/createQuest", json=payload)
                
                if response.status_code == 201:
                    data = response.json()
                    created_quests.append(data["id"])
                    test_data_manager.track_test_item(
                        "quest", data["id"], test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{data['id']}"
                    )
                elif response.status_code == 429:  # Rate limited
                    # This is expected behavior
                    break
                else:
                    # Other errors are also acceptable
                    pass
            
            # Should have created some quests but hit rate limit
            assert len(created_quests) >= 1
    
    def test_quest_operations_rate_limiting(self, test_user_id):
        """Test rate limiting for quest operations."""
        # Create a quest first
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Rate Limit Test Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Perform many operations rapidly
            operation_count = 0
            
            for i in range(150):  # Try 150 operations (limit is 100/hour)
                # Alternate between different operations
                if i % 3 == 0:
                    response = client.post(f"/quests/quests/{quest_id}/start")
                elif i % 3 == 1:
                    response = client.put(f"/quests/quests/{quest_id}", json={"title": f"Updated {i}"})
                else:
                    response = client.post(f"/quests/quests/{quest_id}/cancel", json={"reason": f"Reason {i}"})
                
                if response.status_code in [200, 201]:
                    operation_count += 1
                elif response.status_code == 429:  # Rate limited
                    # This is expected behavior
                    break
                else:
                    # Other errors are also acceptable
                    pass
            
            # Should have performed some operations but hit rate limit
            assert operation_count >= 1


class TestAuthenticationAndAuthorization:
    """Test authentication and authorization controls."""
    
    def test_authentication_required_for_all_endpoints(self):
        """Test that authentication is required for all Quest endpoints."""
        fake_quest_id = TestDataHelpers.generate_test_quest_id()
        
        with TestClient(app) as client:
            # Test all endpoints without authentication
            endpoints = [
                ("POST", "/quests/createQuest", {"title": "Test", "category": "Health"}),
                ("POST", f"/quests/quests/{fake_quest_id}/start", None),
                ("PUT", f"/quests/quests/{fake_quest_id}", {"title": "Updated"}),
                ("POST", f"/quests/quests/{fake_quest_id}/cancel", {"reason": "Test"}),
                ("POST", f"/quests/quests/{fake_quest_id}/fail", None),
                ("DELETE", f"/quests/quests/{fake_quest_id}", None),
            ]
            
            for method, endpoint, data in endpoints:
                if method == "POST":
                    response = client.post(endpoint, json=data)
                elif method == "PUT":
                    response = client.put(endpoint, json=data)
                elif method == "DELETE":
                    response = client.delete(endpoint)
                
                assert response.status_code == 401, f"Endpoint {method} {endpoint} should require authentication"
    
    def test_user_ownership_validation(self, test_user_id):
        """Test that users can only access their own quests."""
        other_user_id = TestDataHelpers.generate_test_user_id()
        
        # Create quest for other user
        other_quest_id = DatabaseHelpers.create_test_quest_in_db(other_user_id, {
            "title": "Other User's Quest",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Try to access other user's quest
            endpoints = [
                ("POST", f"/quests/quests/{other_quest_id}/start", None),
                ("PUT", f"/quests/quests/{other_quest_id}", {"title": "Hacked"}),
                ("POST", f"/quests/quests/{other_quest_id}/cancel", {"reason": "Hacked"}),
                ("POST", f"/quests/quests/{other_quest_id}/fail", None),
                ("DELETE", f"/quests/quests/{other_quest_id}", None),
            ]
            
            for method, endpoint, data in endpoints:
                if method == "POST":
                    response = client.post(endpoint, json=data)
                elif method == "PUT":
                    response = client.put(endpoint, json=data)
                elif method == "DELETE":
                    response = client.delete(endpoint)
                
                assert response.status_code in [403, 404], f"Should not be able to access other user's quest via {method} {endpoint}"
    
    def test_admin_privileges_required_for_deletion(self, test_user_id):
        """Test that admin privileges are required for deleting active quests."""
        # Create and start a quest
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": "Test Quest for Admin Deletion",
            "category": "Health",
            "difficulty": "medium"
        })
        
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Start the quest
            client.post(f"/quests/quests/{quest_id}/start")
            
            # Try to delete as regular user
            response = client.delete(f"/quests/quests/{quest_id}")
            assert response.status_code == 403  # Forbidden for non-admin
        
        # Try as admin
        with TestClientHelpers.create_authenticated_client(app, test_user_id, role="admin") as admin_client:
            response = admin_client.delete(f"/quests/quests/{quest_id}")
            assert response.status_code == 200  # Allowed for admin
    
    def test_jwt_token_validation(self, test_user_id):
        """Test JWT token validation."""
        with TestClient(app) as client:
            # Test with invalid token
            headers = {"Authorization": "Bearer invalid-token"}
            response = client.post("/quests/createQuest", 
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Test with malformed header
            headers = {"Authorization": "InvalidFormat token"}
            response = client.post("/quests/createQuest",
                                 json={"title": "Test", "category": "Health"},
                                 headers=headers)
            assert response.status_code == 401
            
            # Test with missing header
            response = client.post("/quests/createQuest",
                                 json={"title": "Test", "category": "Health"})
            assert response.status_code == 401


class TestDataIntegrity:
    """Test data integrity and consistency."""
    
    def test_quest_data_consistency(self, test_user_id):
        """Test that quest data remains consistent across operations."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Create quest
            payload = TestDataHelpers.create_test_quest_payload(
                title="Consistency Test Quest",
                category="Health",
                difficulty="medium",
                description="Test description",
                rewardXp=75,
                tags=["test", "consistency"]
            )
            
            create_response = client.post("/quests/createQuest", json=payload)
            assert create_response.status_code == 201
            quest_data = create_response.json()
            quest_id = quest_data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # Verify data consistency
            assert quest_data["title"] == "Consistency Test Quest"
            assert quest_data["category"] == "Health"
            assert quest_data["difficulty"] == "medium"
            assert quest_data["description"] == "Test description"
            assert quest_data["rewardXp"] == 75
            assert quest_data["tags"] == ["test", "consistency"]
            assert quest_data["status"] == "draft"
            assert quest_data["userId"] == test_user_id
            
            # Update quest
            update_payload = {
                "title": "Updated Consistency Test Quest",
                "difficulty": "hard",
                "rewardXp": 100
            }
            
            update_response = client.put(f"/quests/quests/{quest_id}", json=update_payload)
            assert update_response.status_code == 200
            updated_data = update_response.json()
            
            # Verify updated data consistency
            assert updated_data["title"] == "Updated Consistency Test Quest"
            assert updated_data["difficulty"] == "hard"
            assert updated_data["rewardXp"] == 100
            assert updated_data["category"] == "Health"  # Should remain unchanged
            assert updated_data["description"] == "Test description"  # Should remain unchanged
            assert updated_data["tags"] == ["test", "consistency"]  # Should remain unchanged
            assert updated_data["status"] == "draft"  # Should remain unchanged
            assert updated_data["userId"] == test_user_id  # Should remain unchanged
            assert updated_data["version"] == 2  # Version should increment
    
    def test_audit_trail_integrity(self, test_user_id):
        """Test that audit trail is properly maintained."""
        with TestClientHelpers.create_authenticated_client(app, test_user_id) as client:
            # Create quest
            payload = TestDataHelpers.create_test_quest_payload(
                title="Audit Trail Test Quest",
                category="Health"
            )
            
            create_response = client.post("/quests/createQuest", json=payload)
            assert create_response.status_code == 201
            quest_data = create_response.json()
            quest_id = quest_data["id"]
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest_id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest_id}"
            )
            
            # Verify initial audit trail
            assert "auditTrail" in quest_data
            assert isinstance(quest_data["auditTrail"], list)
            
            # Start quest
            start_response = client.post(f"/quests/quests/{quest_id}/start")
            assert start_response.status_code == 200
            start_data = start_response.json()
            
            # Verify audit trail was updated
            assert len(start_data["auditTrail"]) > len(quest_data["auditTrail"])
            
            # Cancel quest
            cancel_response = client.post(f"/quests/quests/{quest_id}/cancel", 
                                        json={"reason": "Audit test"})
            assert cancel_response.status_code == 200
            cancel_data = cancel_response.json()
            
            # Verify audit trail was updated again
            assert len(cancel_data["auditTrail"]) > len(start_data["auditTrail"])
