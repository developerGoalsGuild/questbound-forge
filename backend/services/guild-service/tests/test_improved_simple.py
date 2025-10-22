"""
Improved simple tests that work with the actual codebase.
Tests basic functionality without requiring AWS credentials or complex imports.
"""

import pytest
from unittest.mock import patch, MagicMock
import sys
import os
from datetime import datetime

# Add the parent directory to the path to import common module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Now import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.guild import GuildType, GuildSettings, GuildMemberRole
from app.db.guild_db import create_guild, get_guild, join_guild, leave_guild


class TestImprovedSimple:
    """Improved simple tests that work with the actual codebase."""
    
    def test_guild_type_enum(self):
        """Test GuildType enum values."""
        assert GuildType.PUBLIC == "public"
        assert GuildType.PRIVATE == "private"
        assert GuildType.APPROVAL == "approval"
    
    def test_guild_member_role_enum(self):
        """Test GuildMemberRole enum values."""
        assert GuildMemberRole.OWNER == "owner"
        assert GuildMemberRole.MODERATOR == "moderator"
        assert GuildMemberRole.MEMBER == "member"
    
    def test_guild_settings_default(self):
        """Test GuildSettings default values."""
        settings = GuildSettings()
        assert settings.allow_join_requests is True
        assert settings.require_approval is False
        assert settings.allow_comments is True
    
    def test_guild_settings_custom(self):
        """Test GuildSettings with custom values."""
        settings = GuildSettings(
            allow_join_requests=False,
            require_approval=True,
            allow_comments=False
        )
        assert settings.allow_join_requests is False
        assert settings.require_approval is True
        assert settings.allow_comments is False
    
    def test_create_guild_mock(self):
        """Test create_guild function with mocking."""
        with patch('app.db.guild_db.create_guild') as mock_create:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = 'Test Guild'
            mock_guild.description = 'Test description'
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.created_by = 'user_123'
            mock_guild.member_count = 1
            mock_guild.created_at = datetime.now()
            mock_create.return_value = mock_guild
            
            # Since create_guild is async, we need to await it or use asyncio.run
            import asyncio
            result = asyncio.run(create_guild(
                name='Test Guild',
                description='Test description',
                guild_type=GuildType.PUBLIC,
                created_by='user_123',
                tags=['test'],
                settings=GuildSettings()
            ))
            
            assert result.guild_id == 'guild_123'
            assert result.name == 'Test Guild'
            assert result.guild_type == GuildType.PUBLIC
            mock_create.assert_called_once()
    
    def test_get_guild_mock(self):
        """Test get_guild function with mocking."""
        with patch('app.db.guild_db.get_guild') as mock_get:
            mock_guild = MagicMock()
            mock_guild.guild_id = 'guild_123'
            mock_guild.name = 'Test Guild'
            mock_guild.description = 'Test description'
            mock_guild.guild_type = GuildType.PUBLIC
            mock_guild.created_by = 'user_123'
            mock_guild.member_count = 1
            mock_guild.created_at = datetime.now()
            mock_get.return_value = mock_guild
            
            import asyncio
            result = asyncio.run(get_guild('guild_123'))
            
            assert result.guild_id == 'guild_123'
            assert result.name == 'Test Guild'
            mock_get.assert_called_once_with('guild_123')
    
    def test_join_guild_mock(self):
        """Test join_guild function with mocking."""
        with patch('app.db.guild_db.join_guild') as mock_join:
            mock_join.return_value = True
            
            import asyncio
            result = asyncio.run(join_guild('guild_123', 'user_123'))
            
            assert result is True
            mock_join.assert_called_once_with('guild_123', 'user_123')
    
    def test_leave_guild_mock(self):
        """Test leave_guild function with mocking."""
        with patch('app.db.guild_db.leave_guild') as mock_leave:
            mock_leave.return_value = True
            
            import asyncio
            result = asyncio.run(leave_guild('guild_123', 'user_123'))
            
            assert result is True
            mock_leave.assert_called_once_with('guild_123', 'user_123')
    
    def test_guild_type_validation(self):
        """Test guild type validation."""
        # Test valid guild types
        valid_types = [GuildType.PUBLIC, GuildType.PRIVATE, GuildType.APPROVAL]
        for guild_type in valid_types:
            assert guild_type in ["public", "private", "approval"]
        
        # Test invalid guild type
        with pytest.raises(ValueError):
            GuildType("invalid_type")
    
    def test_guild_member_role_validation(self):
        """Test guild member role validation."""
        # Test valid roles
        valid_roles = [GuildMemberRole.OWNER, GuildMemberRole.MODERATOR, GuildMemberRole.MEMBER]
        for role in valid_roles:
            assert role in ["owner", "moderator", "member"]
        
        # Test invalid role
        with pytest.raises(ValueError):
            GuildMemberRole("invalid_role")
    
    def test_guild_settings_serialization(self):
        """Test GuildSettings serialization."""
        settings = GuildSettings(
            allow_join_requests=True,
            require_approval=False,
            allow_comments=True
        )
        
        # Test dict conversion
        settings_dict = settings.dict()
        assert settings_dict['allow_join_requests'] is True
        assert settings_dict['require_approval'] is False
        assert settings_dict['allow_comments'] is True
        
        # Test JSON serialization
        settings_json = settings.json()
        assert '"allow_join_requests":true' in settings_json
        assert '"require_approval":false' in settings_json
        assert '"allow_comments":true' in settings_json
    
    def test_guild_settings_deserialization(self):
        """Test GuildSettings deserialization."""
        settings_dict = {
            'allow_join_requests': False,
            'require_approval': True,
            'allow_comments': False
        }
        
        settings = GuildSettings(**settings_dict)
        assert settings.allow_join_requests is False
        assert settings.require_approval is True
        assert settings.allow_comments is False
    
    def test_guild_type_comparison(self):
        """Test GuildType comparison operations."""
        assert GuildType.PUBLIC == "public"
        assert GuildType.PRIVATE == "private"
        assert GuildType.APPROVAL == "approval"
        
        # Test value comparison
        assert GuildType.PUBLIC.value == "public"
        assert GuildType.PRIVATE.value == "private"
        assert GuildType.APPROVAL.value == "approval"
    
    def test_guild_member_role_comparison(self):
        """Test GuildMemberRole comparison operations."""
        assert GuildMemberRole.OWNER == "owner"
        assert GuildMemberRole.MODERATOR == "moderator"
        assert GuildMemberRole.MEMBER == "member"
        
        # Test value comparison
        assert GuildMemberRole.OWNER.value == "owner"
        assert GuildMemberRole.MODERATOR.value == "moderator"
        assert GuildMemberRole.MEMBER.value == "member"
    
    def test_guild_settings_equality(self):
        """Test GuildSettings equality comparison."""
        settings1 = GuildSettings()
        settings2 = GuildSettings()
        settings3 = GuildSettings(allow_join_requests=False)
        
        assert settings1 == settings2
        assert settings1 != settings3
    
    def test_guild_type_enum_membership(self):
        """Test GuildType enum membership."""
        assert "public" in [e.value for e in GuildType]
        assert "private" in [e.value for e in GuildType]
        assert "approval" in [e.value for e in GuildType]
        assert "invalid" not in [e.value for e in GuildType]
    
    def test_guild_member_role_enum_membership(self):
        """Test GuildMemberRole enum membership."""
        assert "owner" in [e.value for e in GuildMemberRole]
        assert "moderator" in [e.value for e in GuildMemberRole]
        assert "member" in [e.value for e in GuildMemberRole]
        assert "invalid" not in [e.value for e in GuildMemberRole]
    
    def test_guild_settings_field_validation(self):
        """Test GuildSettings field validation."""
        # Test valid boolean values
        settings = GuildSettings(
            allow_join_requests=True,
            require_approval=False,
            allow_comments=True
        )
        assert isinstance(settings.allow_join_requests, bool)
        assert isinstance(settings.require_approval, bool)
        assert isinstance(settings.allow_comments, bool)
    
    def test_guild_type_string_representation(self):
        """Test GuildType string representation."""
        assert "GuildType.PUBLIC" in repr(GuildType.PUBLIC)
        assert "GuildType.PRIVATE" in repr(GuildType.PRIVATE)
        assert "GuildType.APPROVAL" in repr(GuildType.APPROVAL)
    
    def test_guild_member_role_string_representation(self):
        """Test GuildMemberRole string representation."""
        assert "GuildMemberRole.OWNER" in repr(GuildMemberRole.OWNER)
        assert "GuildMemberRole.MODERATOR" in repr(GuildMemberRole.MODERATOR)
        assert "GuildMemberRole.MEMBER" in repr(GuildMemberRole.MEMBER)
    
    def test_guild_settings_string_representation(self):
        """Test GuildSettings string representation."""
        settings = GuildSettings()
        settings_str = str(settings)
        assert "allow_join_requests=True" in settings_str
        assert "require_approval=False" in settings_str
        assert "allow_comments=True" in settings_str


if __name__ == '__main__':
    pytest.main([__file__])
