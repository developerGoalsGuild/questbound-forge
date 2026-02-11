"""
Pytest configuration for messaging-service tests.
Adds the service root to Python path so `app` can be imported.
"""
import os
import sys
from pathlib import Path

# Add the messaging-service directory to Python path
_messaging_service_dir = Path(__file__).resolve().parents[1]
if str(_messaging_service_dir) not in sys.path:
    sys.path.insert(0, str(_messaging_service_dir))
