"""
Pytest configuration and shared fixtures.
"""

import pytest
import os

# Set default environment variables for all tests
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-2')
os.environ.setdefault('AWS_REGION', 'us-east-2')
os.environ.setdefault('CORE_TABLE', 'gg_core')
os.environ.setdefault('JWT_SECRET', 'test-secret')
os.environ.setdefault('JWT_AUDIENCE', 'api://default')
os.environ.setdefault('JWT_ISSUER', 'https://auth.local')
os.environ.setdefault('GAMIFICATION_LOG_ENABLED', 'false')

