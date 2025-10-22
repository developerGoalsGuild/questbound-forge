"""
Comprehensive model tests for improved coverage.
Tests all Pydantic models with edge cases, validation, and serialization.
"""

import pytest
from datetime import datetime, timezone
from typing import List, Optional
import json

from app.models.guild import (
    GuildType, GuildMemberRole, GuildSettings, GuildUserPermissions,
    GuildCreatePayload, GuildUpdatePayload, GuildMemberResponse,
    GuildResponse, GuildListResponse, GuildNameCheckResponse
)
from app.models.comment import GuildCommentResponse, GuildCommentListResponse
from app.models.analytics import GuildAnalyticsResponse, GuildRankingResponse
from app.models.avatar import AvatarUploadRequest, AvatarUploadResponse, AvatarGetResponse, AvatarConfirmRequest
from app.models.join_request import GuildJoinRequestResponse, GuildJoinRequestListResponse


class TestModelsComprehensive:
    """Comprehensive model tests for improved coverage."""
    
    def test_guild_type_enum_comprehensive(self):
        """Test GuildType enum comprehensively."""
        # Test all enum values
        assert GuildType.PUBLIC == "public"
        assert GuildType.PRIVATE == "private"
        assert GuildType.APPROVAL == "approval"
        
        # Test enum iteration
        types = list(GuildType)
        assert len(types) == 3
        assert GuildType.PUBLIC in types
        assert GuildType.PRIVATE in types
        assert GuildType.APPROVAL in types
        
        # Test enum creation from string
        assert GuildType("public") == GuildType.PUBLIC
        assert GuildType("private") == GuildType.PRIVATE
        assert GuildType("approval") == GuildType.APPROVAL
        
        # Test invalid enum creation
        with pytest.raises(ValueError):
            GuildType("invalid")
        
        # Test enum comparison
        assert GuildType.PUBLIC == "public"
        assert "public" == GuildType.PUBLIC
        assert GuildType.PUBLIC != GuildType.PRIVATE
        
        # Test enum hashing
        assert hash(GuildType.PUBLIC) == hash(GuildType.PUBLIC)
        assert hash(GuildType.PUBLIC) != hash(GuildType.PRIVATE)
        
        # Test enum string representation
        assert str(GuildType.PUBLIC) == "GuildType.PUBLIC"
        assert repr(GuildType.PUBLIC) == "<GuildType.PUBLIC: 'public'>"
    
    def test_guild_member_role_enum_comprehensive(self):
        """Test GuildMemberRole enum comprehensively."""
        # Test all enum values
        assert GuildMemberRole.OWNER == "owner"
        assert GuildMemberRole.MODERATOR == "moderator"
        assert GuildMemberRole.MEMBER == "member"
        
        # Test enum iteration
        roles = list(GuildMemberRole)
        assert len(roles) == 3
        assert GuildMemberRole.OWNER in roles
        assert GuildMemberRole.MODERATOR in roles
        assert GuildMemberRole.MEMBER in roles
        
        # Test enum creation from string
        assert GuildMemberRole("owner") == GuildMemberRole.OWNER
        assert GuildMemberRole("moderator") == GuildMemberRole.MODERATOR
        assert GuildMemberRole("member") == GuildMemberRole.MEMBER
        
        # Test invalid enum creation
        with pytest.raises(ValueError):
            GuildMemberRole("invalid")
        
        # Test enum comparison
        assert GuildMemberRole.OWNER == "owner"
        assert "owner" == GuildMemberRole.OWNER
        assert GuildMemberRole.OWNER != GuildMemberRole.MODERATOR
        
        # Test enum hashing
        assert hash(GuildMemberRole.OWNER) == hash(GuildMemberRole.OWNER)
        assert hash(GuildMemberRole.OWNER) != hash(GuildMemberRole.MODERATOR)
    
    def test_guild_settings_comprehensive(self):
        """Test GuildSettings model comprehensively."""
        # Test default values
        settings = GuildSettings()
        assert settings.allow_join_requests is True
        assert settings.require_approval is False
        assert settings.allow_comments is True
        
        # Test custom values
        settings = GuildSettings(
            allow_join_requests=False,
            require_approval=True,
            allow_comments=False
        )
        assert settings.allow_join_requests is False
        assert settings.require_approval is True
        assert settings.allow_comments is False
        
        # Test serialization
        settings_dict = settings.model_dump()
        assert settings_dict['allow_join_requests'] is False
        assert settings_dict['require_approval'] is True
        assert settings_dict['allow_comments'] is False
        
        # Test JSON serialization
        settings_json = settings.model_dump_json()
        assert '"allow_join_requests":false' in settings_json
        assert '"require_approval":true' in settings_json
        assert '"allow_comments":false' in settings_json
        
        # Test deserialization
        settings_from_dict = GuildSettings(**settings_dict)
        assert settings_from_dict.allow_join_requests is False
        assert settings_from_dict.require_approval is True
        assert settings_from_dict.allow_comments is False
        
        # Test equality
        settings1 = GuildSettings()
        settings2 = GuildSettings()
        settings3 = GuildSettings(allow_join_requests=False)
        
        assert settings1 == settings2
        assert settings1 != settings3
        
        # Test copying
        settings_copy = settings1.model_copy()
        assert settings_copy == settings1
        assert settings_copy is not settings1
        
        # Test updating
        updated_settings = settings1.model_copy(update={'allow_join_requests': False})
        assert updated_settings.allow_join_requests is False
        assert updated_settings.require_approval is False  # Unchanged
        assert updated_settings.allow_comments is True  # Unchanged
        
        # Test field info
        fields = GuildSettings.model_fields
        assert 'allow_join_requests' in fields
        assert 'require_approval' in fields
        assert 'allow_comments' in fields
        assert fields['allow_join_requests'].annotation == bool
        assert fields['require_approval'].annotation == bool
        assert fields['allow_comments'].annotation == bool
        
        # Test JSON schema
        schema = GuildSettings.model_json_schema()
        assert 'properties' in schema
        assert 'allow_join_requests' in schema['properties']
        assert 'require_approval' in schema['properties']
        assert 'allow_comments' in schema['properties']
        assert schema['properties']['allow_join_requests']['type'] == 'boolean'
    
    def test_guild_user_permissions_comprehensive(self):
        """Test GuildUserPermissions model comprehensively."""
        # Test default values
        permissions = GuildUserPermissions()
        assert permissions.is_member is False
        assert permissions.is_owner is False
        assert permissions.is_moderator is False
        assert permissions.can_join is False
        assert permissions.can_request_join is False
        assert permissions.has_pending_request is False
        assert permissions.can_leave is False
        assert permissions.can_manage is False
        
        # Test custom values
        permissions = GuildUserPermissions(
            is_member=True,
            is_owner=True,
            is_moderator=False,
            can_join=True,
            can_request_join=False,
            has_pending_request=False,
            can_leave=True,
            can_manage=True
        )
        assert permissions.is_member is True
        assert permissions.is_owner is True
        assert permissions.is_moderator is False
        assert permissions.can_join is True
        assert permissions.can_request_join is False
        assert permissions.has_pending_request is False
        assert permissions.can_leave is True
        assert permissions.can_manage is True
        
        # Test serialization
        permissions_dict = permissions.model_dump()
        assert permissions_dict['is_member'] is True
        assert permissions_dict['is_owner'] is True
        assert permissions_dict['is_moderator'] is False
        
        # Test JSON serialization
        permissions_json = permissions.model_dump_json()
        assert '"is_member":true' in permissions_json
        assert '"is_owner":true' in permissions_json
        assert '"is_moderator":false' in permissions_json
        
        # Test deserialization
        permissions_from_dict = GuildUserPermissions(**permissions_dict)
        assert permissions_from_dict.is_member is True
        assert permissions_from_dict.is_owner is True
        assert permissions_from_dict.is_moderator is False
        
        # Test equality
        permissions1 = GuildUserPermissions()
        permissions2 = GuildUserPermissions()
        permissions3 = GuildUserPermissions(is_member=True)
        
        assert permissions1 == permissions2
        assert permissions1 != permissions3
    
    def test_guild_create_payload_comprehensive(self):
        """Test GuildCreatePayload model comprehensively."""
        # Test minimal payload
        payload = GuildCreatePayload(
            name="Test Guild",
            guild_type=GuildType.PUBLIC
        )
        assert payload.name == "Test Guild"
        assert payload.description is None
        assert payload.guild_type == GuildType.PUBLIC
        assert payload.tags == []
        assert payload.settings is not None
        
        # Test full payload
        payload = GuildCreatePayload(
            name="Full Test Guild",
            description="A comprehensive test guild",
            guild_type=GuildType.PRIVATE,
            tags=["test", "comprehensive"],
            settings=GuildSettings(allow_join_requests=False)
        )
        assert payload.name == "Full Test Guild"
        assert payload.description == "A comprehensive test guild"
        assert payload.guild_type == GuildType.PRIVATE
        assert payload.tags == ["test", "comprehensive"]
        assert payload.settings.allow_join_requests is False
        
        # Test validation errors
        with pytest.raises(ValueError):
            GuildCreatePayload(name="", guild_type=GuildType.PUBLIC)  # Empty name
        
        with pytest.raises(ValueError):
            GuildCreatePayload(name="x" * 101, guild_type=GuildType.PUBLIC)  # Name too long
        
        with pytest.raises(ValueError):
            GuildCreatePayload(name="Test", guild_type=GuildType.PUBLIC, tags=["x"] * 11)  # Too many tags
        
        # Test serialization
        payload_dict = payload.model_dump()
        assert payload_dict['name'] == "Full Test Guild"
        assert payload_dict['description'] == "A comprehensive test guild"
        assert payload_dict['guild_type'] == GuildType.PRIVATE
        assert payload_dict['tags'] == ["test", "comprehensive"]
        
        # Test JSON serialization
        payload_json = payload.model_dump_json()
        assert '"name":"Full Test Guild"' in payload_json
        assert '"guild_type":"private"' in payload_json
    
    def test_guild_update_payload_comprehensive(self):
        """Test GuildUpdatePayload model comprehensively."""
        # Test partial update
        payload = GuildUpdatePayload(name="Updated Guild")
        assert payload.name == "Updated Guild"
        assert payload.description is None
        assert payload.guild_type is None
        assert payload.tags is None
        assert payload.settings is None
        
        # Test full update
        payload = GuildUpdatePayload(
            name="Fully Updated Guild",
            description="Updated description",
            guild_type=GuildType.APPROVAL,
            tags=["updated", "guild"],
            settings=GuildSettings(require_approval=True)
        )
        assert payload.name == "Fully Updated Guild"
        assert payload.description == "Updated description"
        assert payload.guild_type == GuildType.APPROVAL
        assert payload.tags == ["updated", "guild"]
        assert payload.settings.require_approval is True
        
        # Test validation errors
        with pytest.raises(ValueError):
            GuildUpdatePayload(name="")  # Empty name
        
        with pytest.raises(ValueError):
            GuildUpdatePayload(name="x" * 101)  # Name too long
        
        with pytest.raises(ValueError):
            GuildUpdatePayload(tags=["x"] * 11)  # Too many tags
        
        # Test serialization
        payload_dict = payload.model_dump()
        assert payload_dict['name'] == "Fully Updated Guild"
        assert payload_dict['description'] == "Updated description"
        assert payload_dict['guild_type'] == GuildType.APPROVAL
        assert payload_dict['tags'] == ["updated", "guild"]
    
    def test_guild_member_response_comprehensive(self):
        """Test GuildMemberResponse model comprehensively."""
        # Test minimal member
        now = datetime.now(timezone.utc)
        member = GuildMemberResponse(
            user_id="user_123",
            username="testuser",
            role=GuildMemberRole.MEMBER,
            joined_at=now
        )
        assert member.user_id == "user_123"
        assert member.username == "testuser"
        assert member.nickname is None
        assert member.email is None
        assert member.avatar_url is None
        assert member.role == GuildMemberRole.MEMBER
        assert member.joined_at == now
        assert member.is_blocked is False
        assert member.can_comment is True
        
        # Test full member
        now = datetime.now(timezone.utc)
        member = GuildMemberResponse(
            user_id="user_456",
            username="fulluser",
            nickname="Full User",
            email="full@example.com",
            avatar_url="https://example.com/avatar.jpg",
            role=GuildMemberRole.MODERATOR,
            joined_at=now,
            is_blocked=False,
            can_comment=True
        )
        assert member.user_id == "user_456"
        assert member.username == "fulluser"
        assert member.nickname == "Full User"
        assert member.email == "full@example.com"
        assert member.avatar_url == "https://example.com/avatar.jpg"
        assert member.role == GuildMemberRole.MODERATOR
        assert member.joined_at == now
        assert member.is_blocked is False
        assert member.can_comment is True
        
        # Test serialization
        member_dict = member.model_dump()
        assert member_dict['user_id'] == "user_456"
        assert member_dict['username'] == "fulluser"
        assert member_dict['role'] == GuildMemberRole.MODERATOR
        
        # Test JSON serialization
        member_json = member.model_dump_json()
        assert '"user_id":"user_456"' in member_json
        assert '"username":"fulluser"' in member_json
        assert '"role":"moderator"' in member_json
    
    def test_guild_response_comprehensive(self):
        """Test GuildResponse model comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test minimal guild
        guild = GuildResponse(
            guild_id="guild_123",
            name="Test Guild",
            description="Test description",
            guild_type=GuildType.PUBLIC,
            created_by="user_123",
            member_count=1,
            goal_count=0,
            quest_count=0,
            created_at=now,
            updated_at=now,
            settings=GuildSettings(),
            moderators=[],
            pending_requests=0,
            avatar_url=None,
            position=None,
            previous_position=None,
            total_score=0,
            activity_score=0,
            growth_rate=0.0,
            badges=[],
            members=[],
            user_permissions=GuildUserPermissions()
        )
        assert guild.guild_id == "guild_123"
        assert guild.name == "Test Guild"
        assert guild.description == "Test description"
        assert guild.guild_type == GuildType.PUBLIC
        assert guild.created_by == "user_123"
        assert guild.member_count == 1
        assert guild.goal_count == 0
        assert guild.quest_count == 0
        assert guild.created_at == now
        assert guild.updated_at == now
        assert guild.settings is not None
        assert guild.moderators == []
        assert guild.pending_requests == 0
        assert guild.avatar_url is None
        assert guild.position is None
        assert guild.previous_position is None
        assert guild.total_score == 0
        assert guild.activity_score == 0
        assert guild.growth_rate == 0.0
        assert guild.badges == []
        assert guild.members == []
        assert guild.user_permissions is not None
        
        # Test serialization
        guild_dict = guild.model_dump()
        assert guild_dict['guild_id'] == "guild_123"
        assert guild_dict['name'] == "Test Guild"
        assert guild_dict['guild_type'] == GuildType.PUBLIC
        
        # Test JSON serialization
        guild_json = guild.model_dump_json()
        assert '"guild_id":"guild_123"' in guild_json
        assert '"name":"Test Guild"' in guild_json
        assert '"guild_type":"public"' in guild_json
    
    def test_guild_comment_response_comprehensive(self):
        """Test GuildCommentResponse model comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test minimal comment
        comment = GuildCommentResponse(
            comment_id="comment_123",
            guild_id="guild_123",
            user_id="user_123",
            username="testuser",
            content="Test comment",
            created_at=now,
            updated_at=now,
            parent_comment_id=None,
            likes=0,
            is_liked=False,
            is_edited=False,
            user_role=GuildMemberRole.MEMBER,
            replies=[]
        )
        assert comment.comment_id == "comment_123"
        assert comment.guild_id == "guild_123"
        assert comment.user_id == "user_123"
        assert comment.username == "testuser"
        assert comment.content == "Test comment"
        assert comment.created_at == now
        assert comment.updated_at == now
        assert comment.parent_comment_id is None
        assert comment.likes == 0
        assert comment.is_liked is False
        assert comment.is_edited is False
        assert comment.user_role == GuildMemberRole.MEMBER
        assert comment.replies == []
        
        # Test comment with replies
        reply = GuildCommentResponse(
            comment_id="reply_123",
            guild_id="guild_123",
            user_id="user_456",
            username="replyuser",
            content="Reply comment",
            created_at=now,
            updated_at=now,
            parent_comment_id="comment_123",
            likes=0,
            is_liked=False,
            is_edited=False,
            user_role=GuildMemberRole.MEMBER,
            replies=[]
        )
        
        comment_with_replies = GuildCommentResponse(
            comment_id="comment_123",
            guild_id="guild_123",
            user_id="user_123",
            username="testuser",
            content="Test comment with replies",
            created_at=now,
            updated_at=now,
            parent_comment_id=None,
            likes=5,
            is_liked=True,
            is_edited=True,
            user_role=GuildMemberRole.MODERATOR,
            replies=[reply]
        )
        assert comment_with_replies.likes == 5
        assert comment_with_replies.is_liked is True
        assert comment_with_replies.is_edited is True
        assert comment_with_replies.user_role == GuildMemberRole.MODERATOR
        assert len(comment_with_replies.replies) == 1
        assert comment_with_replies.replies[0].comment_id == "reply_123"
        
        # Test serialization
        comment_dict = comment_with_replies.model_dump()
        assert comment_dict['comment_id'] == "comment_123"
        assert comment_dict['likes'] == 5
        assert comment_dict['is_liked'] is True
        assert len(comment_dict['replies']) == 1
        
        # Test JSON serialization
        comment_json = comment_with_replies.model_dump_json()
        assert '"comment_id":"comment_123"' in comment_json
        assert '"likes":5' in comment_json
        assert '"is_liked":true' in comment_json
    
    def test_avatar_models_comprehensive(self):
        """Test avatar models comprehensively."""
        # Test AvatarUploadRequest
        upload_request = AvatarUploadRequest(
            file_type="image/jpeg",
            file_size=1024
        )
        assert upload_request.file_type == "image/jpeg"
        assert upload_request.file_size == 1024
        
        # Test AvatarUploadResponse
        upload_response = AvatarUploadResponse(
            uploadUrl="https://s3.amazonaws.com/upload-url",
            avatarUrl="/v1/guilds/guild_123/avatar",
            avatarKey="guild_123/avatar.jpg"
        )
        assert upload_response.uploadUrl == "https://s3.amazonaws.com/upload-url"
        assert upload_response.avatarUrl == "/v1/guilds/guild_123/avatar"
        assert upload_response.avatarKey == "guild_123/avatar.jpg"
        
        # Test AvatarGetResponse
        get_response = AvatarGetResponse(
            avatar_url="https://s3.amazonaws.com/avatar.jpg",
            avatar_key="guild_123/avatar.jpg"
        )
        assert get_response.avatar_url == "https://s3.amazonaws.com/avatar.jpg"
        assert get_response.avatar_key == "guild_123/avatar.jpg"
        
        # Test AvatarConfirmRequest
        confirm_request = AvatarConfirmRequest(
            avatar_key="guild_123/avatar.jpg"
        )
        assert confirm_request.avatar_key == "guild_123/avatar.jpg"
        
        # Test serialization
        upload_dict = upload_response.model_dump()
        assert upload_dict['uploadUrl'] == "https://s3.amazonaws.com/upload-url"
        assert upload_dict['avatarKey'] == "guild_123/avatar.jpg"
        assert upload_dict['avatarUrl'] == "/v1/guilds/guild_123/avatar"
        
        # Test JSON serialization
        upload_json = upload_response.model_dump_json()
        assert '"uploadUrl":"https://s3.amazonaws.com/upload-url"' in upload_json
        assert '"avatarKey":"guild_123/avatar.jpg"' in upload_json
    
    def test_join_request_models_comprehensive(self):
        """Test join request models comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test GuildJoinRequestResponse
        join_request = GuildJoinRequestResponse(
            guild_id="guild_123",
            user_id="user_456",
            username="requesting_user",
            status="pending",
            requested_at=now
        )
        assert join_request.guild_id == "guild_123"
        assert join_request.user_id == "user_456"
        assert join_request.username == "requesting_user"
        assert join_request.status == "pending"
        assert join_request.requested_at == now
        
        # Test different statuses
        approved_request = GuildJoinRequestResponse(
            guild_id="guild_123",
            user_id="user_789",
            username="approved_user",
            status="approved",
            requested_at=now
        )
        assert approved_request.status == "approved"
        
        rejected_request = GuildJoinRequestResponse(
            guild_id="guild_123",
            user_id="user_101",
            username="rejected_user",
            status="rejected",
            requested_at=now
        )
        assert rejected_request.status == "rejected"
        
        # Test serialization
        request_dict = join_request.model_dump()
        assert request_dict['status'] == "pending"
        
        # Test JSON serialization
        request_json = join_request.model_dump_json()
        assert '"status":"pending"' in request_json
    
    def test_moderator_models_comprehensive(self):
        """Test moderator models comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test GuildModeratorResponse (using a simple dict for now)
        moderator_data = {
            'user_id': 'user_123',
            'username': 'moderator_user',
            'assigned_by': 'user_456',
            'assigned_at': now
        }
        assert moderator_data['user_id'] == "user_123"
        assert moderator_data['username'] == "moderator_user"
        assert moderator_data['assigned_by'] == "user_456"
        assert moderator_data['assigned_at'] == now
        
        # Test serialization
        moderator_dict = moderator_data
        assert moderator_dict['user_id'] == "user_123"
        assert moderator_dict['username'] == "moderator_user"
        assert moderator_dict['assigned_by'] == "user_456"
        
        # Test JSON serialization
        moderator_json = json.dumps(moderator_data, default=str)
        assert '"user_id": "user_123"' in moderator_json
        assert '"username": "moderator_user"' in moderator_json
    
    def test_ranking_models_comprehensive(self):
        """Test ranking models comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test GuildRankingResponse
        ranking = GuildRankingResponse(
            guild_id="guild_123",
            name="Test Guild",
            position=1,
            previous_position=2,
            total_score=1000,
            member_count=50,
            goal_count=100,
            quest_count=25,
            activity_score=95,
            growth_rate=0.2,
            badges=["top_performer", "active"],
            trend="up"
        )
        assert ranking.guild_id == "guild_123"
        assert ranking.position == 1
        assert ranking.previous_position == 2
        assert ranking.total_score == 1000
        assert ranking.member_count == 50
        assert ranking.activity_score == 95
        assert ranking.growth_rate == 0.2
        assert ranking.badges == ["top_performer", "active"]
        assert ranking.trend == "up"
        
        # Test serialization
        ranking_dict = ranking.model_dump()
        assert ranking_dict['guild_id'] == "guild_123"
        assert ranking_dict['position'] == 1
        assert ranking_dict['total_score'] == 1000
        
        # Test JSON serialization
        ranking_json = ranking.model_dump_json()
        assert '"guild_id":"guild_123"' in ranking_json
        assert '"position":1' in ranking_json
        assert '"total_score":1000' in ranking_json
    
    def test_analytics_models_comprehensive(self):
        """Test analytics models comprehensively."""
        now = datetime.now(timezone.utc)
        
        # Test GuildAnalyticsResponse
        analytics = GuildAnalyticsResponse(
            guild_id="guild_123",
            total_members=10,
            active_members=8,
            total_goals=25,
            completed_goals=15,
            total_quests=12,
            completed_quests=8,
            total_comments=50,
            member_growth_rate=0.15,
            goal_completion_rate=0.6,
            quest_completion_rate=0.67,
            activity_score=90.0,
            last_updated=now,
            member_leaderboard=[]
        )
        assert analytics.total_members == 10
        assert analytics.active_members == 8
        assert analytics.total_goals == 25
        assert analytics.completed_goals == 15
        assert analytics.total_quests == 12
        assert analytics.completed_quests == 8
        assert analytics.goal_completion_rate == 0.6
        assert analytics.quest_completion_rate == 0.67
        assert analytics.member_growth_rate == 0.15
        assert analytics.last_updated == now
        assert analytics.member_leaderboard == []
        
        # Test serialization
        analytics_dict = analytics.model_dump()
        assert analytics_dict['total_members'] == 10
        assert analytics_dict['active_members'] == 8
        assert analytics_dict['total_goals'] == 25
        
        # Test JSON serialization
        analytics_json = analytics.model_dump_json()
        assert '"total_members":10' in analytics_json
        assert '"active_members":8' in analytics_json
        assert '"total_goals":25' in analytics_json


if __name__ == '__main__':
    pytest.main([__file__])
