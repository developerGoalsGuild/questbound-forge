#!/usr/bin/env python3
"""
Debug script to test clear=True behavior.
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

def test_clear_behavior():
    """Test what happens with clear=True."""
    print('Current QUEST_SERVICE_ENV_VARS:', repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET')))

    # Test what happens with clear=True
    with patch.dict(os.environ, {'QUEST_SERVICE_ENV_VARS': '{"invalid": "json"}'}, clear=True):
        print('After patch.dict with clear=True:', repr(os.environ.get('QUEST_SERVICE_ENV_VARS', 'NOT SET')))
        
        try:
            from app.settings import Settings
            settings = Settings()
            print(f'SUCCESS: core_table_name = {repr(settings.core_table_name)}')
        except Exception as e:
            print(f'ERROR: {type(e).__name__}: {str(e)}')

if __name__ == "__main__":
    test_clear_behavior()
