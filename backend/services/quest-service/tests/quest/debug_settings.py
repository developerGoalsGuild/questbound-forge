#!/usr/bin/env python3
"""
Debug script to understand Settings class behavior for failing tests.
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

def test_specific_failing_cases():
    """Test the specific failing cases from the test suite."""
    print("Testing Settings behavior for specific failing tests...")
    
    # Test cases that are currently failing
    test_cases = [
        ('Invalid JSON - should raise KeyError', '{"invalid": "json"}'),
        ('Empty object - should raise KeyError', '{}'),
        ('null - should raise AttributeError', 'null'),
        ('Empty string - should succeed with default', ''),
        ('Whitespace - should raise ValueError', '   '),
        ('Falsy 0 - should raise AttributeError', '0'),
    ]
    
    for name, json_value in test_cases:
        print(f'\n--- Testing {name}: {repr(json_value)} ---')
        try:
            with patch.dict(os.environ, {'QUEST_SERVICE_ENV_VARS': json_value}):
                from app.settings import Settings
                settings = Settings()
                print(f'SUCCESS: core_table_name = {repr(settings.core_table_name)}')
        except Exception as e:
            print(f'ERROR: {type(e).__name__}: {str(e)}')

if __name__ == "__main__":
    test_specific_failing_cases()