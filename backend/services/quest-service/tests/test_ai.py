import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_inspiration_image_requires_text():
    r = client.post("/ai/inspiration-image", json={"text": ""})
    assert r.status_code == 400

def test_inspiration_image_ok():
    r = client.post("/ai/inspiration-image", json={"text": "Run a marathon"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body.get("imageUrl"), str)

def test_suggest_improvements_ok():
    r = client.post("/ai/suggest-improvements", json={"text": "Get fit"})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body.get("suggestions"), list)
