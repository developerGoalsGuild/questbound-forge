"""
Pytest configuration for connect-service tests.
Sets env vars and mocks AWS before any app imports.
"""

import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add backend/services so common.logging is importable
services_dir = Path(__file__).resolve().parents[2]
if str(services_dir) not in sys.path:
    sys.path.insert(0, str(services_dir))

# Set config before any app import (settings reads CONNECT_SERVICE_ENV_VARS)
os.environ.setdefault(
    "CONNECT_SERVICE_ENV_VARS",
    json.dumps({
        "JWT_AUDIENCE": "api://default",
        "JWT_ISSUER": "https://example.com",
        "DYNAMODB_TABLE_NAME": "gg_core",
    }),
)
os.environ.setdefault("CONNECT_SERVICE_JWT_SECRET", "test-secret")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-2")

# Mock boto3 before settings/app are imported (both use boto3 at module level)
_mock_boto3 = MagicMock()
_mock_boto3.client.return_value = MagicMock()
patch("boto3.client", side_effect=_mock_boto3.client).start()
