"""
Pytest configuration for authorizer-service tests.
Adds the service root to sys.path so modules (ssm, subscription_auth, etc.) are importable.
"""

import sys
from pathlib import Path

# Add the authorizer-service directory to Python path
authorizer_service_dir = Path(__file__).resolve().parents[1]
if str(authorizer_service_dir) not in sys.path:
    sys.path.insert(0, str(authorizer_service_dir))
