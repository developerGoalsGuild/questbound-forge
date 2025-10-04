"""
Debug test to see what's happening in the test environment.
"""

import pytest
import os
from unittest.mock import patch

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

class TestSettingsDebug:
    """Debug tests for Settings class."""
    
    def test_debug_environment(self):
        """Debug what environment variables are set."""
        print(f"QUEST_SERVICE_ENV_VARS: {repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET'))}")
        print(f"QUEST_SERVICE_CORE_TABLE: {repr(os.environ.get('QUEST_SERVICE_CORE_TABLE', 'NOT SET'))}")
        print(f"All QUEST_SERVICE_ vars: {[k for k in os.environ.keys() if k.startswith('QUEST_SERVICE_')]}")
        
        # Test what happens with clear=True
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"invalid": "json"}'}, clear=True):
            print(f"After patch - QUEST_SERVICE_ENV_VARS: {repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET'))}")
            print(f"After patch - QUEST_SERVICE_CORE_TABLE: {repr(os.environ.get('QUEST_SERVICE_CORE_TABLE', 'NOT SET'))}")
            
            from app.settings import Settings
            try:
                settings = Settings()
                print(f"SUCCESS: core_table_name = {repr(settings.core_table_name)}")
                print("ERROR: Expected KeyError but got success!")
            except Exception as e:
                print(f"Expected exception: {type(e).__name__}: {str(e)}")
                if isinstance(e, KeyError) and "Missing CORE_TABLE" in str(e):
                    print("SUCCESS: Got expected KeyError!")
                else:
                    print(f"ERROR: Got unexpected exception: {type(e).__name__}")
        
        # This should pass
        assert True
    
    def test_settings_initialization_with_invalid_json_debug(self):
        """Test Settings initialization with invalid JSON in env vars - debug version."""
        print("Starting test_settings_initialization_with_invalid_json_debug...")
        print(f"Before patch - QUEST_SERVICE_ENV_VARS: {repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET'))}")
        print(f"Before patch - QUEST_SERVICE_CORE_TABLE: {repr(os.environ.get('QUEST_SERVICE_CORE_TABLE', 'NOT SET'))}")
        
        with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"invalid": "json"}'}, clear=True):
            print(f"After patch - QUEST_SERVICE_ENV_VARS: {repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET'))}")
            print(f"After patch - QUEST_SERVICE_CORE_TABLE: {repr(os.environ.get('QUEST_SERVICE_CORE_TABLE', 'NOT SET'))}")
            
            from app.settings import Settings
            print("Settings imported successfully")
            
            try:
                settings = Settings()
                print(f"Settings created successfully: core_table_name = {repr(settings.core_table_name)}")
                print("ERROR: Expected KeyError but got success!")
                # This should fail
                assert False, "Expected KeyError but got success!"
            except Exception as e:
                print(f"Expected exception: {type(e).__name__}: {str(e)}")
                if isinstance(e, KeyError) and "Missing CORE_TABLE" in str(e):
                    print("SUCCESS: Got expected KeyError!")
                    # This should pass
                    assert True
                else:
                    print(f"ERROR: Got unexpected exception: {type(e).__name__}")
                    # This should fail
                    assert False, f"Got unexpected exception: {type(e).__name__}"