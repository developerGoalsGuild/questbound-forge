"""
Simple test to verify the guild service is working.
"""

import pytest
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_import_guild_db():
    """Test that we can import the guild_db module."""
    try:
        from app.db.guild_db import create_guild, get_guild
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import guild_db: {e}")

def test_import_guild_models():
    """Test that we can import the guild models."""
    try:
        from app.models.guild import GuildResponse, GuildType
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import guild models: {e}")

def test_import_analytics_models():
    """Test that we can import the analytics models."""
    try:
        from app.models.analytics import GuildAnalyticsResponse
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import analytics models: {e}")

def test_guild_type_enum():
    """Test that GuildType enum works correctly."""
    from app.models.guild import GuildType
    
    assert GuildType.PUBLIC == "public"
    assert GuildType.PRIVATE == "private"
    assert GuildType.APPROVAL == "approval"

if __name__ == '__main__':
    pytest.main([__file__])


