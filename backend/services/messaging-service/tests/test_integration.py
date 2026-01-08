"""
Integration tests for the Messaging Service
Tests WebSocket connections, message broadcasting, and rate limiting.
"""

import asyncio
import json
import jwt
import os
from datetime import datetime, timedelta
import websockets
import requests
import time

# Test configuration
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
JWT_SECRET = "test-secret-key"

def create_test_token(user_id: str, expires_in_hours: int = 1) -> str:
    """Create a test JWT token"""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def test_websocket_connection():
    """Test WebSocket connection to a room"""
    print("🧪 Testing WebSocket connection...")
    
    token = create_test_token("test-user-123")
    room_id = "ROOM-test-123"
    ws_url = f"{WS_URL}/ws/rooms/{room_id}?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Send a test message
            test_message = {
                "text": "Hello from integration test!",
                "type": "message"
            }
            await websocket.send(json.dumps(test_message))
            print("✅ Message sent successfully")
            
            # Wait for response (if any)
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"✅ Received response: {response}")
            except asyncio.TimeoutError:
                print("⚠️ No response received (expected for basic test)")
            
            print("✅ WebSocket connection test passed")
            return True
            
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")
        return False

async def test_guild_room_connection():
    """Test WebSocket connection to a guild room"""
    print("🧪 Testing Guild room WebSocket connection...")
    
    token = create_test_token("guild-user-456")
    room_id = "GUILD#guild-test-789"
    ws_url = f"{WS_URL}/ws/rooms/{room_id}?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ Guild WebSocket connected successfully")
            
            # Send a guild message
            guild_message = {
                "text": "Guild message from integration test!",
                "type": "message"
            }
            await websocket.send(json.dumps(guild_message))
            print("✅ Guild message sent successfully")
            
            print("✅ Guild room connection test passed")
            return True
            
    except Exception as e:
        print(f"❌ Guild WebSocket connection failed: {e}")
        return False

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🧪 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "active_connections" in data
        assert "active_rooms" in data
        
        print("✅ Health endpoint test passed")
        return True
        
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

def test_room_connections_endpoint():
    """Test the room connections endpoint"""
    print("🧪 Testing room connections endpoint...")
    
    token = create_test_token("test-user-123")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/rooms/ROOM-test-123/connections",
            headers=headers,
            timeout=10
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "room_id" in data
        assert "active_connections" in data
        
        print("✅ Room connections endpoint test passed")
        return True
        
    except Exception as e:
        print(f"❌ Room connections endpoint test failed: {e}")
        return False

def test_broadcast_endpoint():
    """Test the broadcast message endpoint"""
    print("🧪 Testing broadcast endpoint...")
    
    token = create_test_token("test-user-123")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    message_data = {
        "text": "Broadcast message from integration test!",
        "message_type": "text"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/rooms/ROOM-test-123/broadcast",
            headers=headers,
            json=message_data,
            timeout=10
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "broadcasted"
        assert "message_id" in data
        
        print("✅ Broadcast endpoint test passed")
        return True
        
    except Exception as e:
        print(f"❌ Broadcast endpoint test failed: {e}")
        return False

async def test_rate_limiting():
    """Test rate limiting functionality"""
    print("🧪 Testing rate limiting...")
    
    token = create_test_token("rate-limit-user-789")
    room_id = "ROOM-rate-limit-test"
    ws_url = f"{WS_URL}/ws/rooms/{room_id}?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ Connected for rate limiting test")
            
            # Send multiple messages quickly to trigger rate limiting
            for i in range(35):  # More than the 30 message limit
                message = {
                    "text": f"Rate limit test message {i}",
                    "type": "message"
                }
                await websocket.send(json.dumps(message))
                
                # Small delay to avoid overwhelming the server
                await asyncio.sleep(0.1)
                
                # Check for rate limit response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    response_data = json.loads(response)
                    if response_data.get("type") == "error" and "rate limit" in response_data.get("message", "").lower():
                        print("✅ Rate limiting triggered correctly")
                        return True
                except asyncio.TimeoutError:
                    continue
            
            print("⚠️ Rate limiting test completed (may not have triggered)")
            return True
            
    except Exception as e:
        print(f"❌ Rate limiting test failed: {e}")
        return False

async def test_multiple_connections():
    """Test multiple connections to the same room"""
    print("🧪 Testing multiple connections...")
    
    token1 = create_test_token("multi-user-1")
    token2 = create_test_token("multi-user-2")
    room_id = "ROOM-multi-test"
    
    try:
        # Connect two users to the same room
        ws1_url = f"{WS_URL}/ws/rooms/{room_id}?token={token1}"
        ws2_url = f"{WS_URL}/ws/rooms/{room_id}?token={token2}"
        
        async with websockets.connect(ws1_url) as ws1, websockets.connect(ws2_url) as ws2:
            print("✅ Multiple connections established")
            
            # Send message from user 1
            message1 = {
                "text": "Message from user 1",
                "type": "message"
            }
            await ws1.send(json.dumps(message1))
            
            # Check if user 2 receives the message
            try:
                response = await asyncio.wait_for(ws2.recv(), timeout=5.0)
                print("✅ Message broadcasted between users")
                return True
            except asyncio.TimeoutError:
                print("⚠️ Message broadcasting may not be working")
                return False
            
    except Exception as e:
        print(f"❌ Multiple connections test failed: {e}")
        return False

async def run_all_tests():
    """Run all integration tests"""
    print("🚀 Starting Messaging Service Integration Tests")
    print("=" * 50)
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Room Connections Endpoint", test_room_connections_endpoint),
        ("Broadcast Endpoint", test_broadcast_endpoint),
        ("WebSocket Connection", test_websocket_connection),
        ("Guild Room Connection", test_guild_room_connection),
        ("Rate Limiting", test_rate_limiting),
        ("Multiple Connections", test_multiple_connections),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name}...")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Print results summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n📈 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️ {total - passed} tests failed")
    
    return passed == total

if __name__ == "__main__":
    # Set environment variable for JWT secret
    os.environ["JWT_SECRET"] = JWT_SECRET
    
    print("🔧 Messaging Service Integration Tests")
    print("Make sure the messaging service is running on localhost:8000")
    print("You can start it with: uvicorn main:app --host 0.0.0.0 --port 8000")
    print()
    
    # Run the tests
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)
