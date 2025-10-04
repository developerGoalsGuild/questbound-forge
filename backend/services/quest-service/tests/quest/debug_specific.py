#!/usr/bin/env python3
"""
Debug specific failing test case.
"""

import os
import json
import sys
from pathlib import Path
from unittest.mock import patch

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

def test_specific_case():
    """Test the specific failing case."""
    print("Testing specific failing case...")
    
    try:
        with patch.dict(os.environ, {'QUEST_SERVICE_ENV_VARS': '{"invalid": "json"}'}):
            from app.settings import Settings
            settings = Settings()
            print(f'SUCCESS: core_table_name = {repr(settings.core_table_name)}')
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {str(e)}')

if __name__ == "__main__":
    test_specific_case()
