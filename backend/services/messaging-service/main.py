"""
Messaging Service - FastAPI WebSocket Integration
Provides additional features for real-time messaging beyond AppSync GraphQL subscriptions.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GoalsGuild Messaging Service",
    description="WebSocket messaging service with rate limiting and monitoring",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Connection management
class ConnectionManager:
    def __init__(self):
        # room_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # user_id -> List[room_id]
        self.user_rooms: Dict[str, List[str]] = {}
        # WebSocket -> user_id
        self.connection_users: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.connection_users[websocket] = user_id
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = []
        if room_id not in self.user_rooms[user_id]:
            self.user_rooms[user_id].append(room_id)
        
        logger.info(f"User {user_id} connected to room {room_id}")
        return websocket

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connection_users:
            user_id = self.connection_users[websocket]
            del self.connection_users[websocket]
            
            # Remove from user_rooms
            for room_id in list(self.user_rooms.get(user_id, [])):
                if websocket in self.active_connections.get(room_id, []):
                    self.active_connections[room_id].remove(websocket)
                    if not self.active_connections[room_id]:
                        del self.active_connections[room_id]
                    self.user_rooms[user_id].remove(room_id)
            
            logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast_to_room(self, message: str, room_id: str, exclude_websocket: Optional[WebSocket] = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting to room {room_id}: {e}")

    def get_room_connections(self, room_id: str) -> List[WebSocket]:
        return self.active_connections.get(room_id, [])

    def get_user_connections(self, user_id: str) -> List[WebSocket]:
        connections = []
        for room_id in self.user_rooms.get(user_id, []):
            connections.extend(self.active_connections.get(room_id, []))
        return connections

manager = ConnectionManager()

# Rate limiting
class RateLimiter:
    def __init__(self):
        self.user_limits: Dict[str, List[datetime]] = {}
        self.max_messages_per_minute = 30
        self.cleanup_interval = 60  # seconds

    def is_allowed(self, user_id: str) -> bool:
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        if user_id not in self.user_limits:
            self.user_limits[user_id] = []
        
        # Clean old timestamps
        self.user_limits[user_id] = [
            ts for ts in self.user_limits[user_id] 
            if ts > minute_ago
        ]
        
        # Check if under limit
        return len(self.user_limits[user_id]) < self.max_messages_per_minute

    def record_message(self, user_id: str):
        if user_id not in self.user_limits:
            self.user_limits[user_id] = []
        self.user_limits[user_id].append(datetime.now())

rate_limiter = RateLimiter()

# JWT token validation
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        # In production, use proper JWT secret from environment
        secret = os.getenv("JWT_SECRET", "your-secret-key")
        payload = jwt.decode(credentials.credentials, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic models
class MessageData(BaseModel):
    room_id: str
    text: str
    message_type: str = "text"

class ConnectionInfo(BaseModel):
    room_id: str
    user_id: str
    connected_at: datetime

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GoalsGuild Messaging Service", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_connections": sum(len(connections) for connections in manager.active_connections.values()),
        "active_rooms": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

# Simple WebSocket test endpoint
@app.websocket("/ws")
async def websocket_test(websocket: WebSocket):
    """Simple WebSocket test endpoint"""
    logger.info("WebSocket test connection attempt")
    await websocket.accept()
    await websocket.send_text("WebSocket connection successful!")
    await websocket.close()

# WebSocket endpoint for room connections
@app.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = None):
    """
    WebSocket endpoint for real-time messaging.
    Clients should connect with JWT token as query parameter.
    """
    logger.info(f"WebSocket connection attempt: room_id={room_id}, token={'present' if token else 'missing'}")
    try:
        # Validate token
        if not token:
            logger.warning("WebSocket connection rejected: No token provided")
            await websocket.close(code=1008, reason="Token required")
            return
        
        # Decode JWT token
        try:
            secret = os.getenv("JWT_SECRET", "your-secret-key")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id:
                await websocket.close(code=1008, reason="Invalid token")
                return
        except jwt.ExpiredSignatureError:
            await websocket.close(code=1008, reason="Token expired")
            return
        except jwt.InvalidTokenError:
            await websocket.close(code=1008, reason="Invalid token")
            return

        # Validate room access (basic validation)
        if room_id.startswith("GUILD#") and not await validate_guild_membership(user_id, room_id):
            await websocket.close(code=1008, reason="Guild access denied")
            return

        # Connect to room
        await manager.connect(websocket, room_id, user_id)
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Rate limiting check
                if not rate_limiter.is_allowed(user_id):
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": "Rate limit exceeded. Please slow down."
                        }),
                        websocket
                    )
                    continue
                
                # Record message for rate limiting
                rate_limiter.record_message(user_id)
                
                # Process message (in a real implementation, this would call AppSync)
                await process_message(room_id, user_id, message_data, websocket)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            manager.disconnect(websocket)
            
    except Exception as e:
        logger.error(f"Connection error: {e}")
        try:
            await websocket.close()
        except:
            pass

async def validate_guild_membership(user_id: str, guild_room_id: str) -> bool:
    """
    Validate if user is a member of the guild.
    In a real implementation, this would query the guild service.
    """
    # For now, return True - implement proper guild membership validation
    logger.info(f"Validating guild membership for user {user_id} in guild {guild_room_id}")
    return True

async def process_message(room_id: str, user_id: str, message_data: dict, websocket: WebSocket):
    """
    Process incoming message and broadcast to room.
    In a real implementation, this would:
    1. Save message to DynamoDB via AppSync
    2. Broadcast to all room subscribers
    """
    try:
        # Create message object
        message = {
            "id": f"msg_{datetime.now().timestamp()}",
            "room_id": room_id,
            "sender_id": user_id,
            "text": message_data.get("text", ""),
            "timestamp": datetime.now().isoformat(),
            "type": "message"
        }
        
        # Broadcast to all room connections
        await manager.broadcast_to_room(
            json.dumps(message),
            room_id,
            exclude_websocket=websocket
        )
        
        logger.info(f"Message processed for room {room_id} by user {user_id}")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Failed to process message"
            }),
            websocket
        )

# API endpoints for additional features
@app.get("/rooms/{room_id}/connections")
async def get_room_connections(room_id: str, token: str = Depends(verify_token)):
    """Get active connections for a room"""
    connections = manager.get_room_connections(room_id)
    return {
        "room_id": room_id,
        "active_connections": len(connections),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/users/{user_id}/connections")
async def get_user_connections(user_id: str, token: str = Depends(verify_token)):
    """Get active connections for a user"""
    connections = manager.get_user_connections(user_id)
    return {
        "user_id": user_id,
        "active_connections": len(connections),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/rooms/{room_id}/broadcast")
async def broadcast_message(
    room_id: str, 
    message_data: MessageData,
    token: str = Depends(verify_token)
):
    """Broadcast a message to all room connections"""
    user_id = token.get("sub")
    
    # Rate limiting
    if not rate_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    rate_limiter.record_message(user_id)
    
    # Create message
    message = {
        "id": f"msg_{datetime.now().timestamp()}",
        "room_id": room_id,
        "sender_id": user_id,
        "text": message_data.text,
        "timestamp": datetime.now().isoformat(),
        "type": "broadcast"
    }
    
    # Broadcast to room
    await manager.broadcast_to_room(json.dumps(message), room_id)
    
    return {"status": "broadcasted", "message_id": message["id"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
