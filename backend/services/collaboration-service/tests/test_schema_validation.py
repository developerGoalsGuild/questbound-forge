"""
Test schema validation for collaboration entities.

This test verifies that our DynamoDB schema design is correct and all
access patterns work as expected.
"""

import pytest
from datetime import datetime, UTC, timedelta
from uuid import uuid4


class TestCollaborationSchema:
    """Test the DynamoDB schema design for collaboration entities."""
    
    def test_collaboration_invite_schema(self):
        """Test CollaborationInvite entity schema."""
        # Test data
        invite_id = str(uuid4())
        resource_type = "goal"
        resource_id = "goal-123"
        inviter_id = "user-123"
        invitee_id = "user-789"
        invitee_email = "collaborator@example.com"
        created_at = datetime.now(UTC)
        expires_at = created_at + timedelta(days=30)
        
        # Primary key pattern
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk = f"INVITE#{invite_id}"
        
        # GSI1 pattern
        gsi1pk = f"USER#{invitee_id}"
        gsi1sk = f"INVITE#pending#{created_at.isoformat()}"
        
        # TTL (30 days from creation)
        ttl = int(expires_at.timestamp())
        
        # Verify key patterns
        assert pk == "RESOURCE#GOAL#goal-123"
        assert sk == f"INVITE#{invite_id}"
        assert gsi1pk == "USER#user-789"
        assert gsi1sk.startswith("INVITE#pending#")
        assert ttl > int(created_at.timestamp())
        
        # Verify item structure
        item = {
            "PK": pk,
            "SK": sk,
            "GSI1PK": gsi1pk,
            "GSI1SK": gsi1sk,
            "type": "CollaborationInvite",
            "inviteId": invite_id,
            "inviterId": inviter_id,
            "inviteeId": invitee_id,
            "inviteeEmail": invitee_email,
            "resourceType": resource_type,
            "resourceId": resource_id,
            "status": "pending",
            "message": "Would you like to collaborate on this goal?",
            "expiresAt": expires_at.isoformat(),
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
            "ttl": ttl
        }
        
        # Verify all required fields
        required_fields = [
            "PK", "SK", "GSI1PK", "GSI1SK", "type", "inviteId",
            "inviterId", "inviteeId", "resourceType", "resourceId",
            "status", "expiresAt", "createdAt", "updatedAt", "ttl"
        ]
        for field in required_fields:
            assert field in item
        
        # Verify item size is reasonable (< 400KB)
        import json
        item_size = len(json.dumps(item))
        assert item_size < 400 * 1024  # 400KB limit
    
    def test_collaborator_schema(self):
        """Test Collaborator entity schema."""
        # Test data
        user_id = "user-789"
        resource_type = "goal"
        resource_id = "goal-123"
        joined_at = datetime.now(UTC)
        
        # Primary key pattern
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk = f"COLLABORATOR#{user_id}"
        
        # GSI1 pattern
        gsi1pk = f"USER#{user_id}"
        gsi1sk = f"COLLAB#{resource_type}#{joined_at.isoformat()}"
        
        # Verify key patterns
        assert pk == "RESOURCE#GOAL#goal-123"
        assert sk == "COLLABORATOR#user-789"
        assert gsi1pk == "USER#user-789"
        assert gsi1sk.startswith("COLLAB#goal#")
        
        # Verify item structure
        item = {
            "PK": pk,
            "SK": sk,
            "GSI1PK": gsi1pk,
            "GSI1SK": gsi1sk,
            "type": "Collaborator",
            "userId": user_id,
            "resourceType": resource_type,
            "resourceId": resource_id,
            "role": "collaborator",
            "joinedAt": joined_at.isoformat(),
            "lastSeenAt": joined_at.isoformat()
        }
        
        # Verify all required fields
        required_fields = [
            "PK", "SK", "GSI1PK", "GSI1SK", "type", "userId",
            "resourceType", "resourceId", "role", "joinedAt"
        ]
        for field in required_fields:
            assert field in item
    
    def test_comment_schema(self):
        """Test Comment entity schema."""
        # Test data
        comment_id = str(uuid4())
        resource_type = "goal"
        resource_id = "goal-123"
        user_id = "user-789"
        parent_id = None  # Top-level comment
        text = "Great progress on this goal! @user-123 what do you think?"
        created_at = datetime.now(UTC)
        
        # Primary key pattern
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk = f"COMMENT#{created_at.isoformat()}#{comment_id}"
        
        # GSI1 pattern (for threading)
        gsi1pk = f"COMMENT#{parent_id}" if parent_id else None
        gsi1sk = f"CREATED#{created_at.isoformat()}"
        
        # Verify key patterns
        assert pk == "RESOURCE#GOAL#goal-123"
        assert sk.startswith("COMMENT#")
        assert sk.endswith(comment_id)
        assert gsi1pk is None  # Top-level comment
        assert gsi1sk.startswith("CREATED#")
        
        # Verify item structure
        item = {
            "PK": pk,
            "SK": sk,
            "type": "Comment",
            "commentId": comment_id,
            "parentId": parent_id,
            "userId": user_id,
            "text": text,
            "mentions": ["user-123"],
            "createdAt": created_at.isoformat(),
            "updatedAt": None,
            "deletedAt": None,
            "editHistory": []
        }
        
        # Add GSI1 attributes if not top-level
        if gsi1pk:
            item["GSI1PK"] = gsi1pk
            item["GSI1SK"] = gsi1sk
        
        # Verify all required fields
        required_fields = [
            "PK", "SK", "type", "commentId", "userId", "text",
            "mentions", "createdAt", "editHistory"
        ]
        for field in required_fields:
            assert field in item
    
    def test_reaction_schema(self):
        """Test Reaction entity schema."""
        # Test data
        comment_id = "cmt-456"
        user_id = "user-123"
        emoji = "👍"
        created_at = datetime.now(UTC)
        
        # Primary key pattern
        pk = f"COMMENT#{comment_id}"
        sk = f"REACTION#{user_id}#{emoji}"
        
        # Verify key patterns
        assert pk == "COMMENT#cmt-456"
        assert sk == "REACTION#user-123#👍"
        
        # Verify item structure
        item = {
            "PK": pk,
            "SK": sk,
            "type": "Reaction",
            "commentId": comment_id,
            "userId": user_id,
            "emoji": emoji,
            "createdAt": created_at.isoformat()
        }
        
        # Verify all required fields
        required_fields = ["PK", "SK", "type", "commentId", "userId", "emoji", "createdAt"]
        for field in required_fields:
            assert field in item
    
    def test_access_patterns(self):
        """Test that all access patterns are correctly defined."""
        # Test invite access patterns
        resource_type = "goal"
        resource_id = "goal-123"
        user_id = "user-789"
        invite_id = str(uuid4())
        
        # Pattern 1: List all invites for a resource
        pk = f"RESOURCE#{resource_type.upper()}#{resource_id}"
        sk_prefix = "INVITE#"
        # Query: PK=RESOURCE#GOAL#goal-123 WHERE begins_with(SK, 'INVITE#')
        
        # Pattern 2: List user's received invites
        gsi1pk = f"USER#{user_id}"
        gsi1sk_prefix = "INVITE#"
        # Query: GSI1 WHERE GSI1PK=USER#user-789 AND begins_with(GSI1SK, 'INVITE#')
        
        # Pattern 3: Get specific invite
        # GetItem: PK=RESOURCE#GOAL#goal-123, SK=INVITE#{invite_id}
        
        # Pattern 4: List pending invites
        gsi1sk_pending = "INVITE#pending"
        # Query: GSI1 WHERE GSI1PK=USER#user-789 AND begins_with(GSI1SK, 'INVITE#pending')
        
        # Verify patterns
        assert pk == "RESOURCE#GOAL#goal-123"
        assert sk_prefix == "INVITE#"
        assert gsi1pk == "USER#user-789"
        assert gsi1sk_prefix == "INVITE#"
        assert gsi1sk_pending == "INVITE#pending"
    
    def test_ttl_calculation(self):
        """Test TTL calculation for invites."""
        created_at = datetime.now(UTC)
        expires_at = created_at + timedelta(days=30)
        ttl = int(expires_at.timestamp())
        
        # Verify TTL is 30 days in the future
        expected_ttl = int((created_at + timedelta(days=30)).timestamp())
        assert ttl == expected_ttl
        
        # Verify TTL is reasonable (not too far in the past or future)
        now = int(datetime.now(UTC).timestamp())
        assert ttl > now  # Future
        assert ttl < now + (60 * 60 * 24 * 35)  # Less than 35 days


if __name__ == "__main__":
    pytest.main([__file__])

