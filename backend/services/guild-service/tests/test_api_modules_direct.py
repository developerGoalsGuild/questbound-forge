"""
Test API modules directly without importing the main app.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

class TestAPIModulesDirect:
    """Test API modules directly without main app dependencies."""
    
    def test_guild_module_imports(self):
        """Test guild module imports."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            assert hasattr(guild, 'create_guild')
            assert hasattr(guild, 'get_guild')
            assert hasattr(guild, 'update_guild')
            assert hasattr(guild, 'delete_guild')
            assert hasattr(guild, 'list_guilds')
            assert hasattr(guild, 'join_guild')
            assert hasattr(guild, 'leave_guild')
            assert hasattr(guild, 'remove_user_from_guild')
    
    def test_comments_module_imports(self):
        """Test comments module imports."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            assert hasattr(comments, 'create_comment')
            assert hasattr(comments, 'get_comments')
            assert hasattr(comments, 'delete_comment')
            assert hasattr(comments, 'like_comment')
    
    def test_analytics_module_imports(self):
        """Test analytics module imports."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            assert hasattr(analytics, 'get_guild_analytics')
            assert hasattr(analytics, 'get_guild_rankings')
    
    def test_moderation_module_imports(self):
        """Test moderation module imports."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            assert hasattr(moderation, 'get_join_requests')
            assert hasattr(moderation, 'approve_join_request')
            assert hasattr(moderation, 'reject_join_request')
            assert hasattr(moderation, 'assign_moderator')
            assert hasattr(moderation, 'remove_moderator')
            assert hasattr(moderation, 'perform_moderation_action')
    
    def test_avatar_module_imports(self):
        """Test avatar module imports."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            assert hasattr(avatar, 'generate_avatar_upload_url')
            assert hasattr(avatar, 'get_guild_avatar')
            assert hasattr(avatar, 'confirm_avatar_upload')
            assert hasattr(avatar, 'delete_guild_avatar')
    
    def test_guild_router_configuration(self):
        """Test guild router configuration."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            assert guild.router.prefix == "/guilds"
            assert "guilds" in guild.router.tags
            assert len(guild.router.routes) >= 8  # Should have multiple routes
    
    def test_comments_router_configuration(self):
        """Test comments router configuration."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            assert comments.router.prefix == "/guilds"
            assert "guild-comments" in comments.router.tags
            assert len(comments.router.routes) >= 4  # Should have multiple routes
    
    def test_analytics_router_configuration(self):
        """Test analytics router configuration."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            assert analytics.router.prefix == "/guilds"
            assert "guild-analytics" in analytics.router.tags
            assert len(analytics.router.routes) >= 3  # Should have multiple routes
    
    def test_moderation_router_configuration(self):
        """Test moderation router configuration."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            assert moderation.router.prefix == "/guilds"
            assert "guild-moderation" in moderation.router.tags
            assert len(moderation.router.routes) >= 6  # Should have multiple routes
    
    def test_avatar_router_configuration(self):
        """Test avatar router configuration."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            assert avatar.router.prefix == "/guilds"
            assert "guild-avatars" in avatar.router.tags
            assert len(avatar.router.routes) >= 3  # Should have multiple routes
    
    def test_guild_router_routes(self):
        """Test guild router specific routes."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            routes = [route.path for route in guild.router.routes]
            assert "/guilds/" in routes  # Create guild
            assert "/guilds/{guild_id}" in routes  # Get/Update/Delete guild
            assert "/guilds/{guild_id}/join" in routes  # Join guild
            assert "/guilds/{guild_id}/leave" in routes  # Leave guild
            assert "/guilds/user/{user_id}" in routes  # List user guilds
            assert "/guilds/{guild_id}/members/{user_id}" in routes  # Remove user
    
    def test_comments_router_routes(self):
        """Test comments router specific routes."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            routes = [route.path for route in comments.router.routes]
            assert "/guilds/{guild_id}/comments" in routes  # Create/Get comments
            assert "/guilds/{guild_id}/comments/{comment_id}" in routes  # Delete comment
            assert "/guilds/{guild_id}/comments/{comment_id}/like" in routes  # Like comment
    
    def test_analytics_router_routes(self):
        """Test analytics router specific routes."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            routes = [route.path for route in analytics.router.routes]
            assert "/guilds/{guild_id}/analytics" in routes  # Get guild analytics
            assert "/guilds/{guild_id}/analytics/leaderboard" in routes  # Get leaderboard
            assert "/guilds/rankings" in routes  # Get guild rankings
    
    def test_moderation_router_routes(self):
        """Test moderation router specific routes."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            routes = [route.path for route in moderation.router.routes]
            assert "/guilds/{guild_id}/join-requests" in routes  # Get join requests
            assert "/guilds/{guild_id}/join-requests/{user_id}/approve" in routes  # Approve request
            assert "/guilds/{guild_id}/join-requests/{user_id}/reject" in routes  # Reject request
            assert "/guilds/{guild_id}/moderators/assign" in routes  # Assign moderator
            assert "/guilds/{guild_id}/moderators/{user_id}" in routes  # Remove moderator
            assert "/guilds/{guild_id}/moderation/action" in routes  # Perform moderation action
    
    def test_avatar_router_routes(self):
        """Test avatar router specific routes."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            routes = [route.path for route in avatar.router.routes]
            assert "/guilds/{guild_id}/avatar" in routes  # Get avatar
            assert "/guilds/{guild_id}/avatar/upload-url" in routes  # Get upload URL
            assert "/guilds/{guild_id}/avatar/confirm" in routes  # Confirm upload
    
    def test_guild_endpoint_functions_exist(self):
        """Test that guild endpoint functions exist and are callable."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            assert callable(guild.create_guild)
            assert callable(guild.get_guild)
            assert callable(guild.update_guild)
            assert callable(guild.delete_guild)
            assert callable(guild.list_guilds)
            assert callable(guild.join_guild)
            assert callable(guild.leave_guild)
            assert callable(guild.remove_user_from_guild)
    
    def test_comments_endpoint_functions_exist(self):
        """Test that comments endpoint functions exist and are callable."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            assert callable(comments.create_comment)
            assert callable(comments.get_comments)
            assert callable(comments.delete_comment)
            assert callable(comments.like_comment)
    
    def test_analytics_endpoint_functions_exist(self):
        """Test that analytics endpoint functions exist and are callable."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            assert callable(analytics.get_guild_analytics)
            assert callable(analytics.get_guild_rankings)
    
    def test_moderation_endpoint_functions_exist(self):
        """Test that moderation endpoint functions exist and are callable."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            assert callable(moderation.get_join_requests)
            assert callable(moderation.approve_join_request)
            assert callable(moderation.reject_join_request)
            assert callable(moderation.assign_moderator)
            assert callable(moderation.remove_moderator)
            assert callable(moderation.perform_moderation_action)
    
    def test_avatar_endpoint_functions_exist(self):
        """Test that avatar endpoint functions exist and are callable."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            assert callable(avatar.generate_avatar_upload_url)
            assert callable(avatar.get_guild_avatar)
            assert callable(avatar.confirm_avatar_upload)
            assert callable(avatar.delete_guild_avatar)
    
    def test_guild_router_http_methods(self):
        """Test guild router HTTP methods."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            methods = []
            for route in guild.router.routes:
                if hasattr(route, 'methods'):
                    methods.extend(route.methods)
            assert 'POST' in methods  # Create guild
            assert 'GET' in methods   # Get guild, list guilds
            assert 'PUT' in methods   # Update guild
            assert 'DELETE' in methods # Delete guild
    
    def test_comments_router_http_methods(self):
        """Test comments router HTTP methods."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            methods = []
            for route in comments.router.routes:
                if hasattr(route, 'methods'):
                    methods.extend(route.methods)
            assert 'POST' in methods  # Create comment, like comment
            assert 'GET' in methods   # Get comments
            assert 'DELETE' in methods # Delete comment
    
    def test_analytics_router_http_methods(self):
        """Test analytics router HTTP methods."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            methods = []
            for route in analytics.router.routes:
                if hasattr(route, 'methods'):
                    methods.extend(route.methods)
            assert 'GET' in methods   # Get analytics, get rankings
    
    def test_moderation_router_http_methods(self):
        """Test moderation router HTTP methods."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            methods = []
            for route in moderation.router.routes:
                if hasattr(route, 'methods'):
                    methods.extend(route.methods)
            assert 'POST' in methods  # Approve/reject requests, assign/remove moderators
            assert 'GET' in methods   # Get join requests, get moderators
            assert 'DELETE' in methods # Remove moderator
    
    def test_avatar_router_http_methods(self):
        """Test avatar router HTTP methods."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            methods = []
            for route in avatar.router.routes:
                if hasattr(route, 'methods'):
                    methods.extend(route.methods)
            assert 'POST' in methods  # Get upload URL, confirm upload
            assert 'GET' in methods   # Get avatar
            assert 'DELETE' in methods # Delete avatar
    
    def test_guild_router_dependencies(self):
        """Test guild router dependencies."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            # Check that dependencies are properly imported
            assert hasattr(guild, 'authenticate')
            assert hasattr(guild, 'rate_limit')
            assert hasattr(guild, 'create_guild')
            assert hasattr(guild, 'get_guild')
            assert hasattr(guild, 'update_guild')
            assert hasattr(guild, 'delete_guild')
            assert hasattr(guild, 'list_guilds')
            assert hasattr(guild, 'join_guild')
            assert hasattr(guild, 'leave_guild')
            assert hasattr(guild, 'remove_user_from_guild')
    
    def test_comments_router_dependencies(self):
        """Test comments router dependencies."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            # Check that dependencies are properly imported
            assert hasattr(comments, 'authenticate')
            assert hasattr(comments, 'rate_limit')
            assert hasattr(comments, 'create_comment')
            assert hasattr(comments, 'get_comments')
            assert hasattr(comments, 'delete_comment')
            assert hasattr(comments, 'like_comment')
    
    def test_analytics_router_dependencies(self):
        """Test analytics router dependencies."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            # Check that dependencies are properly imported
            assert hasattr(analytics, 'authenticate')
            assert hasattr(analytics, 'rate_limit')
            assert hasattr(analytics, 'get_guild_analytics_endpoint')
            assert hasattr(analytics, 'get_guild_leaderboard')
            assert hasattr(analytics, 'get_guild_rankings_endpoint')
    
    def test_moderation_router_dependencies(self):
        """Test moderation router dependencies."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            # Check that dependencies are properly imported
            assert hasattr(moderation, 'authenticate')
            assert hasattr(moderation, 'rate_limit')
            assert hasattr(moderation, 'get_join_requests')
            assert hasattr(moderation, 'approve_join_request')
            assert hasattr(moderation, 'reject_join_request')
            assert hasattr(moderation, 'assign_moderator')
            assert hasattr(moderation, 'remove_moderator')
            assert hasattr(moderation, 'perform_moderation_action')
    
    def test_avatar_router_dependencies(self):
        """Test avatar router dependencies."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            # Check that dependencies are properly imported
            assert hasattr(avatar, 'authenticate')
            assert hasattr(avatar, 'rate_limit')
            assert hasattr(avatar, 'generate_avatar_upload_url')
            assert hasattr(avatar, 'get_guild_avatar')
            assert hasattr(avatar, 'confirm_avatar_upload')
            assert hasattr(avatar, 'delete_guild_avatar')
    
    def test_guild_router_route_count(self):
        """Test guild router route count."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import guild
            assert len(guild.router.routes) >= 8  # Should have at least 8 routes
    
    def test_comments_router_route_count(self):
        """Test comments router route count."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import comments
            assert len(comments.router.routes) >= 4  # Should have at least 4 routes
    
    def test_analytics_router_route_count(self):
        """Test analytics router route count."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import analytics
            assert len(analytics.router.routes) >= 2  # Should have at least 2 routes
    
    def test_moderation_router_route_count(self):
        """Test moderation router route count."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import moderation
            assert len(moderation.router.routes) >= 6  # Should have at least 6 routes
    
    def test_avatar_router_route_count(self):
        """Test avatar router route count."""
        with patch('common.logging.log_event'), \
             patch('common.logging.get_structured_logger'):
            from app.api import avatar
            assert len(avatar.router.routes) >= 3  # Should have at least 3 routes
