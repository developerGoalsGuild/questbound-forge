import json
import os

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

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_inspiration_image_requires_text():
    response = client.post("/ai/inspiration-image", json={"text": ""})
    assert response.status_code == 400


def test_inspiration_image_ok():
    response = client.post("/ai/inspiration-image", json={"text": "Run a marathon"})
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body.get("imageUrl"), str)


def test_suggest_improvements_ok():
    response = client.post("/ai/suggest-improvements", json={"text": "Get fit"})
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body.get("suggestions"), list)
