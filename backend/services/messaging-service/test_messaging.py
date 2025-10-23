"""
Unit tests for the Messaging Service
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
import jwt
import os

# Import the main application
from main import app, ConnectionManager, RateLimiter, verify_token

class TestConnectionManager:
    def setup_method(self):
        self.manager = ConnectionManager()

    def test_initial_state(self):
        assert self.manager.active_connections == {}
        assert self.manager.user_rooms == {}
        assert self.manager.connection_users == {}

    @pytest.mark.asyncio
    async def test_connect_general_room(self):
        mock_websocket = AsyncMock()
        mock_websocket.accept = AsyncMock()
        
        await self.manager.connect(mock_websocket, "ROOM-123", "user-456")
        
        assert "ROOM-123" in self.manager.active_connections
        assert mock_websocket in self.manager.active_connections["ROOM-123"]
        assert self.manager.connection_users[mock_websocket] == "user-456"
        assert "ROOM-123" in self.manager.user_rooms["user-456"]

    @pytest.mark.asyncio
    async def test_connect_guild_room(self):
        mock_websocket = AsyncMock()
        mock_websocket.accept = AsyncMock()
        
        await self.manager.connect(mock_websocket, "GUILD#guild-789", "user-456")
        
        assert "GUILD#guild-789" in self.manager.active_connections
        assert mock_websocket in self.manager.active_connections["GUILD#guild-789"]
        assert self.manager.connection_users[mock_websocket] == "user-456"

    def test_disconnect(self):
        mock_websocket = AsyncMock()
        self.manager.connection_users[mock_websocket] = "user-456"
        self.manager.user_rooms["user-456"] = ["ROOM-123"]
        self.manager.active_connections["ROOM-123"] = [mock_websocket]
        
        self.manager.disconnect(mock_websocket)
        
        assert mock_websocket not in self.manager.connection_users
        assert "ROOM-123" not in self.manager.user_rooms["user-456"]
        assert mock_websocket not in self.manager.active_connections["ROOM-123"]

    @pytest.mark.asyncio
    async def test_broadcast_to_room(self):
        mock_websocket1 = AsyncMock()
        mock_websocket2 = AsyncMock()
        self.manager.active_connections["ROOM-123"] = [mock_websocket1, mock_websocket2]
        
        await self.manager.broadcast_to_room("test message", "ROOM-123")
        
        mock_websocket1.send_text.assert_called_once_with("test message")
        mock_websocket2.send_text.assert_called_once_with("test message")

    @pytest.mark.asyncio
    async def test_broadcast_exclude_websocket(self):
        mock_websocket1 = AsyncMock()
        mock_websocket2 = AsyncMock()
        self.manager.active_connections["ROOM-123"] = [mock_websocket1, mock_websocket2]
        
        await self.manager.broadcast_to_room("test message", "ROOM-123", exclude_websocket=mock_websocket1)
        
        mock_websocket1.send_text.assert_not_called()
        mock_websocket2.send_text.assert_called_once_with("test message")

class TestRateLimiter:
    def setup_method(self):
        self.rate_limiter = RateLimiter()

    def test_initial_state(self):
        assert self.rate_limiter.user_limits == {}
        assert self.rate_limiter.max_messages_per_minute == 30

    def test_is_allowed_new_user(self):
        assert self.rate_limiter.is_allowed("new-user") == True

    def test_is_allowed_under_limit(self):
        # Add some messages within the limit
        for i in range(10):
            self.rate_limiter.record_message("user-123")
        
        assert self.rate_limiter.is_allowed("user-123") == True

    def test_is_allowed_over_limit(self):
        # Add messages to exceed the limit
        for i in range(35):  # More than the 30 message limit
            self.rate_limiter.record_message("user-123")
        
        assert self.rate_limiter.is_allowed("user-123") == False

    def test_record_message(self):
        self.rate_limiter.record_message("user-123")
        assert "user-123" in self.rate_limiter.user_limits
        assert len(self.rate_limiter.user_limits["user-123"]) == 1

class TestJWTValidation:
    def setup_method(self):
        # Set a test JWT secret
        os.environ["JWT_SECRET"] = "test-secret-key"

    def test_verify_token_valid(self):
        # Create a valid JWT token
        payload = {"sub": "user-123", "exp": datetime.utcnow() + timedelta(hours=1)}
        token = jwt.encode(payload, "test-secret-key", algorithm="HS256")
        
        # Mock the HTTPAuthorizationCredentials
        credentials = Mock()
        credentials.credentials = token
        
        result = verify_token(credentials)
        assert result["sub"] == "user-123"

    def test_verify_token_expired(self):
        # Create an expired JWT token
        payload = {"sub": "user-123", "exp": datetime.utcnow() - timedelta(hours=1)}
        token = jwt.encode(payload, "test-secret-key", algorithm="HS256")
        
        credentials = Mock()
        credentials.credentials = token
        
        with pytest.raises(Exception):  # Should raise HTTPException
            verify_token(credentials)

    def test_verify_token_invalid(self):
        credentials = Mock()
        credentials.credentials = "invalid-token"
        
        with pytest.raises(Exception):  # Should raise HTTPException
            verify_token(credentials)

class TestAPIEndpoints:
    def setup_method(self):
        self.client = app.test_client()

    def test_health_endpoint(self):
        response = self.client.get("/health")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "status" in data
        assert data["status"] == "healthy"
        assert "active_connections" in data
        assert "active_rooms" in data

    @patch('main.manager')
    def test_get_room_connections(self, mock_manager):
        mock_manager.get_room_connections.return_value = []
        
        # Mock JWT verification
        with patch('main.verify_token') as mock_verify:
            mock_verify.return_value = {"sub": "user-123"}
            
            response = self.client.get("/rooms/ROOM-123/connections")
            assert response.status_code == 200
            
            data = json.loads(response.data)
            assert data["room_id"] == "ROOM-123"
            assert "active_connections" in data

    @patch('main.manager')
    def test_get_user_connections(self, mock_manager):
        mock_manager.get_user_connections.return_value = []
        
        with patch('main.verify_token') as mock_verify:
            mock_verify.return_value = {"sub": "user-123"}
            
            response = self.client.get("/users/user-123/connections")
            assert response.status_code == 200
            
            data = json.loads(response.data)
            assert data["user_id"] == "user-123"
            assert "active_connections" in data

    @patch('main.manager')
    @patch('main.rate_limiter')
    def test_broadcast_message(self, mock_rate_limiter, mock_manager):
        mock_rate_limiter.is_allowed.return_value = True
        mock_manager.broadcast_to_room = AsyncMock()
        
        with patch('main.verify_token') as mock_verify:
            mock_verify.return_value = {"sub": "user-123"}
            
            response = self.client.post(
                "/rooms/ROOM-123/broadcast",
                json={"text": "Hello world", "message_type": "text"}
            )
            assert response.status_code == 200
            
            data = json.loads(response.data)
            assert data["status"] == "broadcasted"
            assert "message_id" in data

    @patch('main.rate_limiter')
    def test_broadcast_message_rate_limited(self, mock_rate_limiter):
        mock_rate_limiter.is_allowed.return_value = False
        
        with patch('main.verify_token') as mock_verify:
            mock_verify.return_value = {"sub": "user-123"}
            
            response = self.client.post(
                "/rooms/ROOM-123/broadcast",
                json={"text": "Hello world", "message_type": "text"}
            )
            assert response.status_code == 429

if __name__ == "__main__":
    pytest.main([__file__])
