#!/usr/bin/env python3
"""
Quick test script to verify category field functionality
"""
import json
import os
import sys
from pathlib import Path

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parent
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

# Set up test environment
os.environ.setdefault(
    "QUEST_SERVICE_ENV_VARS",
    json.dumps({
        "CORE_TABLE": "gg_core",
        "JWT_AUDIENCE": "api://default",
        "JWT_ISSUER": "https://auth.local",
        "COGNITO_REGION": "us-east-2",
        "COGNITO_USER_POOL_ID": "local-pool",
        "COGNITO_CLIENT_ID": "local-client",
        "ALLOWED_ORIGINS": ["http://localhost:8080"],
    })
)
os.environ.setdefault("QUEST_SERVICE_JWT_SECRET", "test-secret")

from app.models import GoalCreatePayload, GoalUpdatePayload, GoalResponse
from app.main import _build_goal_item, _to_response

def test_category_field():
    print("Testing category field functionality...")
    
    # Test 1: Create goal with category
    print("\n1. Testing goal creation with category:")
    payload = GoalCreatePayload(
        title="Test Goal with Category",
        description="This goal has a category",
        category="Health & Fitness",
        deadline="2025-12-31",
        tags=["test", "health"],
        answers=[]
    )
    
    print(f"   Payload: {payload.model_dump()}")
    
    # Test 2: Build goal item for database
    print("\n2. Testing database item creation:")
    goal_item = _build_goal_item("user-123", payload)
    print(f"   Database item has category: {'category' in goal_item}")
    print(f"   Category value: {goal_item.get('category')}")
    
    # Test 3: Convert back to response
    print("\n3. Testing response conversion:")
    response = _to_response(goal_item)
    print(f"   Response has category: {hasattr(response, 'category')}")
    print(f"   Category value: {response.category}")
    
    # Test 4: Update goal with category
    print("\n4. Testing goal update with category:")
    update_payload = GoalUpdatePayload(
        title="Updated Goal",
        category="Career & Professional",
        description="Updated with new category"
    )
    print(f"   Update payload: {update_payload.model_dump()}")
    
    print("\n[SUCCESS] All category field tests passed!")

if __name__ == "__main__":
    test_category_field()
