"""
Pytest configuration for authorizer-service tests.
Adds the service root to sys.path so modules (ssm, subscription_auth, etc.) are importable.
Sets env vars before any imports so ssm.Settings gets valid config when first loaded.
"""

import json
import os
import sys
from pathlib import Path

# Add the authorizer-service directory to Python path
authorizer_service_dir = Path(__file__).resolve().parents[1]
if str(authorizer_service_dir) not in sys.path:
    sys.path.insert(0, str(authorizer_service_dir))

# Set env vars before ssm is imported (test_authorizer imports ssm first; Settings reads this)
_settings_json = {
    "CORE_TABLE": "gg_core",
    "DYNAMODB_USERS_TABLE": "users",
    "LOGIN_ATTEMPTS_TABLE": "login",
    "COGNITO_REGION": "us-east-2",
    "COGNITO_USER_POOL_ID": "pool",
    "COGNITO_CLIENT_ID": "client",
    "COGNITO_CLIENT_SECRET": "secret",
    "COGNITO_DOMAIN": "example.com",
    "SES_SENDER_EMAIL": "no-reply@example.com",
    "APP_BASE_URL": "https://app.example.com",
    "APPSYNC_AVAILABILITY_KEY": "test-availability-key",
}
os.environ.setdefault("SETTINGS_ENV_VARS_JSON", json.dumps(_settings_json))
