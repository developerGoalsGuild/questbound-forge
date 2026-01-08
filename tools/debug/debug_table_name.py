#!/usr/bin/env python3
"""
Debug script to check what table name the quest service is using.
"""

import os
import sys

# Add the quest service app directory to the path
sys.path.append('backend/services/quest-service/app')

try:
    from settings import _get_settings
    
    settings = _get_settings()
    print(f"Quest service table name: {settings.core_table_name}")
    print(f"AWS region: {settings.aws_region}")
    
except Exception as e:
    print(f"Error getting settings: {e}")
    print("Trying to check environment variables...")
    
    # Check common environment variable names
    env_vars = ['CORE_TABLE', 'TABLE_NAME', 'DYNAMODB_TABLE']
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            print(f"{var}: {value}")
        else:
            print(f"{var}: Not set")





