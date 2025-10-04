#!/usr/bin/env python3
"""
Debug script to test the exact same logic as the failing test.
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch
import pytest

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

def test_settings_initialization_with_invalid_json():
    """Test Settings initialization with invalid JSON in env vars."""
    print("Starting test...")
    print("Before patch:", repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET')))
    
    with patch.dict(os.environ, {"QUEST_SERVICE_ENV_VARS": '{"invalid": "json"}'}, clear=True):
        print("After patch:", repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET')))
        
        from app.settings import Settings
        print("Settings imported successfully")
        
        try:
            settings = Settings()
            print(f"Settings created successfully: core_table_name = {repr(settings.core_table_name)}")
            print("ERROR: Expected KeyError but got success!")
        except Exception as e:
            print(f"Expected exception: {type(e).__name__}: {str(e)}")
            if isinstance(e, KeyError) and "Missing CORE_TABLE" in str(e):
                print("SUCCESS: Got expected KeyError!")
            else:
                print(f"ERROR: Got unexpected exception: {type(e).__name__}")

if __name__ == "__main__":
    test_settings_initialization_with_invalid_json()
