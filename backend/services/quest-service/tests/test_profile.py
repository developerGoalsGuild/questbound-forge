import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Tuple

import jwt
from fastapi.testclient import TestClient

# Add the quest-service directory to Python path so we can import app.main
quest_service_dir = Path(__file__).resolve().parent.parent
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

os.environ.setdefault(
    "QUEST_SERVICE_ENV_VARS",
    json.dumps(
        {
            "CORE_TABLE": "gg_core",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-east-2",
            "COGNITO_USER_POOL_ID": "local-pool",
            "COGNITO_CLIENT_ID": "local-client",
            "ALLOWED_ORIGINS": ["http://localhost:8080"],
        }
    ),
)
os.environ.setdefault("QUEST_SERVICE_JWT_SECRET", "test-secret")

import app.main as main_module
app = main_module.app
get_goals_table = main_module.get_goals_table


class FakeTable:
    def __init__(self) -> None:
        self.items: Dict[Tuple[str, str], Dict] = {}

    def put_item(self, Item, ConditionExpression=None):  # noqa: N802 - boto interface
        key = (Item["PK"], Item["SK"])
        if ConditionExpression and key in self.items:
            from botocore.exceptions import ClientError

            raise ClientError(
                {
                    "Error": {
                        "Code": "ConditionalCheckFailedException",
                        "Message": "Conditional check failed",
                    }
                },
                "PutItem",
            )
        self.items[key] = Item

    def get_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        if key in self.items:
            return {"Item": self.items[key]}
        return {}

    def update_item(self, Key, UpdateExpression=None, ExpressionAttributeValues=None, ExpressionAttributeNames=None):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        if key not in self.items:
            from botocore.exceptions import ClientError
            raise ClientError(
                {
                    "Error": {
                        "Code": "ValidationException",
                        "Message": "Item does not exist",
                    }
                },
                "UpdateItem",
            )

        item = self.items[key].copy()

        # Simple update expression parsing for SET operations
        if UpdateExpression and UpdateExpression.startswith("SET "):
            set_part = UpdateExpression[4:]  # Remove "SET "
            assignments = [part.strip() for part in set_part.split(",")]

            for assignment in assignments:
                if "=" in assignment:
                    attr_part, value_key = assignment.split("=", 1)
                    attr_part = attr_part.strip()
                    value_key = value_key.strip()

                    # Handle expression attribute names
                    if attr_part.startswith("#") and ExpressionAttributeNames:
                        attr_name = ExpressionAttributeNames.get(attr_part)
                        if attr_name:
                            attr_part = attr_name

                    # Get the value
                    if value_key.startswith(":"):
                        value = ExpressionAttributeValues.get(value_key)
                        if value is not None:
                            item[attr_part] = value

        self.items[key] = item

    def query(self, **kwargs):  # noqa: N802 - boto interface
        # Return all stored items for simplicity; the handler filters by PK/SK when building.
        return {"Items": list(self.items.values())}


client = TestClient(app)


def _issue_token(sub: str = "user-123") -> str:
    now = int(time.time())
    payload = {
        "sub": sub,
        "iat": now,
        "exp": now + 3600,
        "aud": "api://default",
        "iss": "https://auth.local",
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


# Note: GET profile tests removed - profile reads are handled by AppSync directly


def test_update_profile_success():
    table = FakeTable()
    # Pre-populate with a profile
    profile_item = {
        "PK": "USER#user-123",
        "SK": "PROFILE#user-123",
        "type": "Profile",
        "id": "user-123",
        "email": "test@example.com",
        "role": "user",
        "fullName": "Original Name",
        "nickname": "original",
        "birthDate": "1990-01-01",
        "status": "ACTIVE",
        "country": "US",
        "language": "en",
        "gender": "other",
        "pronouns": "they/them",
        "bio": "Original bio",
        "tags": ["developer"],
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#user-123", "PROFILE#user-123")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "fullName": "Updated Name",
            "nickname": "updated",
            "bio": "Updated bio",
            "tags": ["developer", "updated"],
            "country": "CA"
        }
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["fullName"] == "Updated Name"
        assert updated_profile["nickname"] == "updated"
        assert updated_profile["bio"] == "Updated bio"
        assert updated_profile["tags"] == ["developer", "updated"]
        assert updated_profile["country"] == "CA"
        assert updated_profile["updatedAt"] > updated_profile["createdAt"]
    finally:
        app.dependency_overrides.clear()


def test_update_profile_partial_update():
    table = FakeTable()
    # Pre-populate with a profile
    profile_item = {
        "PK": "USER#user-123",
        "SK": "PROFILE#user-123",
        "type": "Profile",
        "id": "user-123",
        "email": "test@example.com",
        "role": "user",
        "fullName": "Original Name",
        "nickname": "original",
        "birthDate": "1990-01-01",
        "status": "ACTIVE",
        "country": "US",
        "language": "en",
        "gender": "other",
        "pronouns": "they/them",
        "bio": "Original bio",
        "tags": ["developer"],
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#user-123", "PROFILE#user-123")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "fullName": "Partially Updated Name"
            # Only updating fullName, other fields should remain unchanged
        }
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["fullName"] == "Partially Updated Name"
        assert updated_profile["nickname"] == "original"  # Unchanged
        assert updated_profile["bio"] == "Original bio"  # Unchanged
        assert updated_profile["country"] == "US"  # Unchanged
    finally:
        app.dependency_overrides.clear()


def test_update_profile_creates_if_not_exists():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {"fullName": "New Profile Name"}
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        profile = response.json()
        assert profile["fullName"] == "New Profile Name"
        assert profile["id"] == "user-123"
        assert profile["role"] == "user"  # Default value
        assert profile["status"] == "ACTIVE"  # Default value
    finally:
        app.dependency_overrides.clear()


def test_update_profile_ignores_immutable_fields():
    table = FakeTable()
    # Pre-populate with a profile
    profile_item = {
        "PK": "USER#user-123",
        "SK": "PROFILE#user-123",
        "type": "Profile",
        "id": "user-123",
        "email": "test@example.com",
        "role": "user",
        "fullName": "Test User",
        "status": "ACTIVE",
        "language": "en",
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#user-123", "PROFILE#user-123")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "fullName": "Updated Name",
            "role": "admin",  # This should be ignored as it's not in the allowed fields
            "email": "hacked@example.com"  # This should be ignored as it's not in the allowed fields
        }
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["fullName"] == "Updated Name"
        assert updated_profile["role"] == "user"  # Unchanged - not in allowed fields
        assert updated_profile["email"] == "test@example.com"  # Unchanged - not in allowed fields
    finally:
        app.dependency_overrides.clear()


def test_update_profile_requires_auth():
    table = FakeTable()
    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        update_payload = {"fullName": "Updated Name"}
        response = client.put("/profile", json=update_payload)
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_update_profile_creates_separate_profiles():
    table = FakeTable()
    # Pre-populate with a profile belonging to a different user
    profile_item = {
        "PK": "USER#other-user",
        "SK": "PROFILE#other-user",
        "type": "Profile",
        "id": "other-user",
        "email": "other@example.com",
        "role": "user",
        "fullName": "Other User",
        "status": "ACTIVE",
        "language": "en",
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#other-user", "PROFILE#other-user")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token("user-123")  # Different user
        update_payload = {"fullName": "New User Profile"}
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200  # Should create a new profile for this user
        profile = response.json()
        assert profile["fullName"] == "New User Profile"
        assert profile["id"] == "user-123"  # Different user ID
        
        # Verify the other user's profile is unchanged
        other_profile = table.items[("USER#other-user", "PROFILE#other-user")]
        assert other_profile["fullName"] == "Other User"
    finally:
        app.dependency_overrides.clear()


def test_update_profile_empty_payload():
    table = FakeTable()
    # Pre-populate with a profile
    profile_item = {
        "PK": "USER#user-123",
        "SK": "PROFILE#user-123",
        "type": "Profile",
        "id": "user-123",
        "email": "test@example.com",
        "role": "user",
        "fullName": "Test User",
        "status": "ACTIVE",
        "language": "en",
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#user-123", "PROFILE#user-123")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {}  # Empty payload
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        # Should return the profile unchanged
        profile = response.json()
        assert profile["fullName"] == "Test User"
    finally:
        app.dependency_overrides.clear()


def test_update_profile_with_none_values():
    table = FakeTable()
    # Pre-populate with a profile
    profile_item = {
        "PK": "USER#user-123",
        "SK": "PROFILE#user-123",
        "type": "Profile",
        "id": "user-123",
        "email": "test@example.com",
        "role": "user",
        "fullName": "Test User",
        "nickname": "testuser",
        "bio": "Test bio",
        "tags": ["developer"],
        "status": "ACTIVE",
        "language": "en",
        "tier": "free",
        "provider": "local",
        "email_confirmed": True,
        "createdAt": 1609459200,
        "updatedAt": 1609459200,
    }
    table.items[("USER#user-123", "PROFILE#user-123")] = profile_item

    app.dependency_overrides[get_goals_table] = lambda: table
    try:
        token = _issue_token()
        update_payload = {
            "nickname": None,  # Setting to None should clear the field
            "bio": None,
            "tags": None
        }
        response = client.put("/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["nickname"] is None
        assert updated_profile["bio"] is None
        assert updated_profile["tags"] == []  # tags field has default_factory=list
    finally:
        app.dependency_overrides.clear()
