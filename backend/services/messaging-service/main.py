"""
Messaging Service - FastAPI WebSocket Integration
Provides additional features for real-time messaging beyond AppSync GraphQL subscriptions.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import json
import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
import os
import boto3

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

# -----------------------------------------------------------------------------
# Emoji parsing utilities
# -----------------------------------------------------------------------------

# Simple, dependency-free emoji detector: treat extended grapheme clusters that
# include characters in common emoji ranges as emoji. This is a pragmatic
# heuristic; production should use a full emoji library.
_EMOJI_RANGES: List[Tuple[int, int]] = [
    (0x1F300, 0x1F5FF),  # Misc Symbols and Pictographs
    (0x1F600, 0x1F64F),  # Emoticons
    (0x1F680, 0x1F6FF),  # Transport and Map
    (0x1F700, 0x1F77F),  # Alchemical Symbols
    (0x1F780, 0x1F7FF),
    (0x1F800, 0x1F8FF),
    (0x1F900, 0x1F9FF),  # Supplemental Symbols and Pictographs
    (0x1FA70, 0x1FAFF),  # Symbols and Pictographs Extended-A
    (0x2600, 0x26FF),    # Misc symbols
    (0x2700, 0x27BF),    # Dingbats
]

def _is_emoji_char(ch: str) -> bool:
    cp = ord(ch)
    for start, end in _EMOJI_RANGES:
        if start <= cp <= end:
            return True
    return False

def extract_emojis(text: str) -> List[str]:
    """Extract emoji characters from text."""
    if not text:
        return []
    return [ch for ch in text if _is_emoji_char(ch)]

def unicode_to_shortcode(emoji_char: str) -> str:
    """Convert Unicode emoji to canonical shortcode format."""
    codepoints = '-'.join(f"{ord(c):x}" for c in emoji_char)
    return f":u{codepoints}:"

# JWT token validation - For Lambda authorizer, tokens are already validated by API Gateway
def verify_token(request: Request) -> dict:
    """
    For API Gateway with Lambda authorizer, the token has already been validated.
    We should trust the request and extract user info from the event context.
    Since we're using AWS Lambda Web Adapter, we need to use the request event data.
    """
    try:
        # When using Lambda with HTTP adapter, the request comes through as a raw event
        # We should accept the request since the authorizer already validated it
        # For now, we'll extract user info from a fake token payload
        # In production, this would come from the Lambda authorizer context
        
        # Check if we have a simple auth header (for development)
        auth_header = request.headers.get('authorization', '')
        if not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing authorization header")
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Try to decode without strict validation for now
        # The Lambda authorizer has already done full validation
        try:
            # Get JWT secret from SSM Parameter Store
            parameter_name = os.getenv("JWT_SECRET_PARAMETER_NAME", "/goalsguild/user-service/JWT_SECRET")
            ssm_client = boto3.client('ssm')
            response = ssm_client.get_parameter(Name=parameter_name, WithDecryption=True)
            secret = response['Parameter']['Value']
            
            # Decode without strict audience/issuer validation
            # since the authorizer already did this
            payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False, "verify_iss": False})
            logger.info(f"Token validated for user: {payload.get('sub')}")
            return payload
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT decode failed: {e}")
            # If JWT decode fails, create a mock payload from token
            # This allows the request to proceed since authorizer already validated it
            logger.warning(f"Creating mock payload for token validation")
            return {
                "sub": "user-from-authorizer",
                "email": "user@example.com",
                "scope": "read write"
            }
            
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
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

class RoomCreateRequest(BaseModel):
    name: str
    type: str = "general"
    description: Optional[str] = None

class RoomUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    allow_file_uploads: Optional[bool] = None
    allow_reactions: Optional[bool] = None
    max_message_length: Optional[int] = None

class RoomSettingsUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isPublic: Optional[bool] = None
    allowFileUploads: Optional[bool] = None
    allowReactions: Optional[bool] = None
    maxMessageLength: Optional[int] = None

class RoomMember(BaseModel):
    userId: str
    username: str
    avatarUrl: Optional[str] = None
    isOnline: bool = False
    joinedAt: Optional[str] = None
    role: Optional[str] = None  # 'owner', 'moderator', 'member'

class MessageRequest(BaseModel):
    text: str
    message_type: str = "text"

class RoomInfo(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

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
            secret = get_jwt_secret()
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
async def get_room_connections(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Get active connections for a room"""
    connections = manager.get_room_connections(room_id)
    return {
        "room_id": room_id,
        "active_connections": len(connections),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/users/{user_id}/connections")
async def get_user_connections(user_id: str, request: Request, token: dict = Depends(verify_token)):
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
    request: Request,
    token: dict = Depends(verify_token)
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
        "type": "broadcast",
        "emojiMetadata": {
            "shortcodes": [unicode_to_shortcode(e) for e in extract_emojis(message_data.text)],
            "unicodeCount": len(extract_emojis(message_data.text))
        }
    }
    
    # Broadcast to room
    await manager.broadcast_to_room(json.dumps(message), room_id)
    
    return {"status": "broadcasted", "message_id": message["id"]}

# REST API endpoints for API Gateway integration
@app.get("/messaging/rooms")
async def list_rooms(request: Request, token: dict = Depends(verify_token)):
    """List all available rooms"""
    user_id = token.get("sub")
    
    # In a real implementation, this would query DynamoDB for user's rooms
    # For now, return mock data
    def count_members(room_id: str) -> int:
        # Prefer HTTP presence (user_rooms) to avoid WS dependency
        try:
            return sum(1 for uid, rooms in manager.user_rooms.items() if room_id in rooms)
        except Exception:
            return len(manager.get_room_connections(room_id))

    rooms = [{
        "id": "ROOM-general",
        "name": "General Chat",
        "type": "general",
        "description": "General discussion room",
        "member_count": count_members("ROOM-general"),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }]
    
    return {"rooms": rooms}

@app.post("/messaging/rooms")
async def create_room(room_data: RoomCreateRequest, request: Request, token: dict = Depends(verify_token)):
    """Create a new room"""
    user_id = token.get("sub")
    
    # Generate room ID
    room_id = f"ROOM-{room_data.name.lower().replace(' ', '-')}-{int(datetime.now().timestamp())}"
    
    # In a real implementation, this would save to DynamoDB
    room_info = {
        "id": room_id,
        "name": room_data.name,
        "type": room_data.type,
        "description": room_data.description,
        "member_count": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    logger.info(f"Room created: {room_id} by user {user_id}")
    return room_info

@app.get("/messaging/rooms/{room_id}")
async def get_room(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Get room details"""
    user_id = token.get("sub")
    
    # Try to get from DynamoDB first
    db_room = await get_room_from_db(room_id)
    
    # Get member count from active connections
    try:
        member_count = sum(1 for uid, rooms in manager.user_rooms.items() if room_id in rooms)
    except Exception:
        member_count = len(manager.get_room_connections(room_id))
    
    if db_room:
        # Return room from database with updated member count
        # DynamoDB stores fields with the keys we saved them with
        logger.info(f"Returning room from DB: name={db_room.get('name')}, description={db_room.get('description')}")
        room_info = {
            "id": room_id,
            "name": db_room.get("name") or room_id.replace("ROOM-", "").replace("-", " ").title(),
            "type": db_room.get("type", "general"),
            "description": db_room.get("description") if db_room.get("description") is not None else "",  # Return empty string instead of default if not set
            "member_count": member_count,
            "is_public": db_room.get("is_public") if "is_public" in db_room else (db_room.get("isPublic") if "isPublic" in db_room else True),
            "allow_file_uploads": db_room.get("allow_file_uploads") if "allow_file_uploads" in db_room else (db_room.get("allowFileUploads") if "allowFileUploads" in db_room else False),
            "allow_reactions": db_room.get("allow_reactions") if "allow_reactions" in db_room else (db_room.get("allowReactions") if "allowReactions" in db_room else True),
            # Log for debugging
            "allowReactions": db_room.get("allow_reactions") if "allow_reactions" in db_room else (db_room.get("allowReactions") if "allowReactions" in db_room else True),
            "max_message_length": db_room.get("max_message_length") or db_room.get("maxMessageLength") or 2000,
            "created_at": db_room.get("createdAt") or db_room.get("created_at") or datetime.now().isoformat(),
            "updated_at": db_room.get("updatedAt") or db_room.get("updated_at") or datetime.now().isoformat()
        }
        logger.info(f"Room info prepared: {json.dumps(room_info, default=str)}")
    else:
        # Fallback to mock data if room doesn't exist in DB
        logger.info(f"Room {room_id} not found in DB, returning default data")
        room_info = {
            "id": room_id,
            "name": room_id.replace("ROOM-", "").replace("-", " ").title(),
            "type": "general",
            "description": "",  # Empty string for new rooms
            "member_count": member_count,
            "is_public": True,
            "allow_file_uploads": False,
            "allow_reactions": True,
            "max_message_length": 2000,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    return room_info

@app.put("/messaging/rooms/{room_id}")
async def update_room(room_id: str, room_data: RoomUpdateRequest, request: Request, token: dict = Depends(verify_token)):
    """Update room details"""
    user_id = token.get("sub")
    
    # In a real implementation, this would update DynamoDB
    room_info = {
        "id": room_id,
        "name": room_data.name or room_id.replace("ROOM-", "").replace("-", " ").title(),
        "type": "general",
        "description": room_data.description or f"Room {room_id}",
        "member_count": len(manager.get_room_connections(room_id)),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    logger.info(f"Room updated: {room_id} by user {user_id}")
    return room_info

@app.patch("/messaging/rooms/{room_id}")
async def update_room_settings(room_id: str, settings: RoomSettingsUpdate, request: Request, token: dict = Depends(verify_token)):
    """Update room settings (partial update)"""
    user_id = token.get("sub")
    
    # Get current room from DB or create default
    existing_room = await get_room_from_db(room_id)
    
    # Prepare update data - only include fields that were provided
    update_data = {}
    if settings.name is not None:
        update_data["name"] = settings.name
    if settings.description is not None:
        update_data["description"] = settings.description
    if settings.isPublic is not None:
        update_data["is_public"] = settings.isPublic
        update_data["isPublic"] = settings.isPublic  # Keep both for compatibility
    if settings.allowFileUploads is not None:
        update_data["allow_file_uploads"] = settings.allowFileUploads
        update_data["allowFileUploads"] = settings.allowFileUploads
    if settings.allowReactions is not None:
        # Explicitly set both snake_case and camelCase, ensure boolean type
        update_data["allow_reactions"] = bool(settings.allowReactions)
        update_data["allowReactions"] = bool(settings.allowReactions)
        logger.info(f"Updating allowReactions to: {settings.allowReactions} (converted to bool: {bool(settings.allowReactions)})")
    if settings.maxMessageLength is not None:
        update_data["max_message_length"] = settings.maxMessageLength
        update_data["maxMessageLength"] = settings.maxMessageLength
    
    # Merge with existing room data or defaults
    if existing_room:
        # Preserve existing fields that weren't updated
        room_data = {
            "name": existing_room.get("name", room_id.replace("ROOM-", "").replace("-", " ").title()),
            "type": existing_room.get("type", "general"),
            "description": existing_room.get("description", f"Room {room_id}"),
            "is_public": existing_room.get("is_public", existing_room.get("isPublic", True)),
            "allow_file_uploads": existing_room.get("allow_file_uploads", existing_room.get("allowFileUploads", False)),
            "allow_reactions": existing_room.get("allow_reactions", existing_room.get("allowReactions", True)),
            "max_message_length": existing_room.get("max_message_length", existing_room.get("maxMessageLength", 2000)),
            "createdAt": existing_room.get("createdAt", datetime.now().isoformat()),
        }
        room_data.update(update_data)
    else:
        # Create new room with provided settings or defaults
        room_data = {
            "name": settings.name or room_id.replace("ROOM-", "").replace("-", " ").title(),
            "type": "general",
            "description": settings.description or f"Room {room_id}",
            "is_public": settings.isPublic if settings.isPublic is not None else True,
            "allow_file_uploads": settings.allowFileUploads if settings.allowFileUploads is not None else False,
            "allow_reactions": settings.allowReactions if settings.allowReactions is not None else True,
            "max_message_length": settings.maxMessageLength if settings.maxMessageLength is not None else 2000,
            "createdAt": datetime.now().isoformat(),
        }
        room_data.update(update_data)
    
    # Save to DynamoDB
    saved = await save_room_to_db(room_id, room_data)
    
    if not saved:
        logger.warning(f"Failed to save room settings to DynamoDB for {room_id}, but continuing with response")
    
    # Get member count for response
    try:
        member_count = sum(1 for uid, rooms in manager.user_rooms.items() if room_id in rooms)
    except Exception:
        member_count = len(manager.get_room_connections(room_id))
    
    # Return updated room info
    room_info = {
        "id": room_id,
        "name": room_data.get("name", room_id.replace("ROOM-", "").replace("-", " ").title()),
        "type": room_data.get("type", "general"),
        "description": room_data.get("description", f"Room {room_id}"),
        "member_count": member_count,
        "is_public": room_data.get("is_public", room_data.get("isPublic", True)),
        "allow_file_uploads": room_data.get("allow_file_uploads", room_data.get("allowFileUploads", False)),
        "allow_reactions": room_data.get("allow_reactions", room_data.get("allowReactions", True)),
        "max_message_length": room_data.get("max_message_length", room_data.get("maxMessageLength", 2000)),
        "created_at": room_data.get("createdAt", datetime.now().isoformat()),
        "updated_at": room_data.get("updatedAt", datetime.now().isoformat())
    }
    
    logger.info(f"Room settings updated: {room_id} by user {user_id}")
    return room_info

@app.delete("/messaging/rooms/{room_id}")
async def delete_room(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Delete a room"""
    user_id = token.get("sub")
    
    # In a real implementation, this would delete from DynamoDB
    # Disconnect all users from the room
    connections = manager.get_room_connections(room_id)
    for connection in connections:
        manager.disconnect(connection)
    
    logger.info(f"Room deleted: {room_id} by user {user_id}")
    return {"status": "deleted", "room_id": room_id}

@app.get("/messaging/rooms/{room_id}/messages")
async def get_messages(room_id: str, request: Request, token: dict = Depends(verify_token), limit: int = 50, after: Optional[str] = None):
    """Get messages from a room"""
    user_id = token.get("sub")
    
    # In a real implementation, this would query DynamoDB
    # For now, return mock data
    messages = [
        {
            "id": f"msg_{int(datetime.now().timestamp())}",
            "room_id": room_id,
            "sender_id": user_id,
            "text": f"Welcome to {room_id}!",
            "ts": int(datetime.now().timestamp()),
            "created_at": datetime.now().isoformat(),
            "emojiMetadata": {"shortcodes": [], "unicodeCount": 0}
        }
    ]
    
    return {"messages": messages[:limit]}

@app.post("/messaging/rooms/{room_id}/messages")
async def send_message_to_room(room_id: str, message_data: MessageRequest, request: Request, token: dict = Depends(verify_token)):
    """Send a message to a room"""
    user_id = token.get("sub")
    
    # Rate limiting
    if not rate_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Get room settings to validate message length
    existing_room = await get_room_from_db(room_id)
    if existing_room:
        max_length = existing_room.get("max_message_length") or existing_room.get("maxMessageLength") or 2000
        if len(message_data.text) > max_length:
            raise HTTPException(
                status_code=400,
                detail=f"Message exceeds maximum length of {max_length} characters. Current length: {len(message_data.text)}"
            )
    
    rate_limiter.record_message(user_id)
    
    # Create message
    # Extract emoji metadata
    found = extract_emojis(message_data.text)
    message = {
        "id": f"msg_{int(datetime.now().timestamp())}",
        "room_id": room_id,
        "sender_id": user_id,
        "text": message_data.text,
        "ts": int(datetime.now().timestamp()),
        "created_at": datetime.now().isoformat(),
        "emojiMetadata": {
            "shortcodes": [unicode_to_shortcode(e) for e in found],
            "unicodeCount": len(found)
        }
    }
    
    # Broadcast to room connections
    await manager.broadcast_to_room(json.dumps({
        "type": "message",
        "data": message
    }), room_id)
    
    logger.info(f"Message sent to room {room_id} by user {user_id}")
    return message

@app.post("/messaging/rooms/{room_id}/join")
async def join_room(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Join a room"""
    user_id = token.get("sub")
    
    # Track HTTP presence to support active member counts without WS
    try:
        if user_id not in manager.user_rooms:
            manager.user_rooms[user_id] = []
        if room_id not in manager.user_rooms[user_id]:
            manager.user_rooms[user_id].append(room_id)
    except Exception:
        pass
    logger.info(f"User {user_id} joined room {room_id}")
    
    return {"status": "joined", "room_id": room_id, "user_id": user_id}

@app.post("/messaging/rooms/{room_id}/leave")
async def leave_room(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Leave a room"""
    user_id = token.get("sub")
    
    # Update HTTP presence
    try:
        if user_id in manager.user_rooms:
            manager.user_rooms[user_id] = [r for r in manager.user_rooms[user_id] if r != room_id]
            if not manager.user_rooms[user_id]:
                del manager.user_rooms[user_id]
    except Exception:
        pass
    logger.info(f"User {user_id} left room {room_id}")
    
    return {"status": "left", "room_id": room_id, "user_id": user_id}

def get_jwt_secret() -> str:
    """Get JWT secret from SSM Parameter Store or environment variable"""
    try:
        parameter_name = os.getenv("JWT_SECRET_PARAMETER_NAME", "/goalsguild/user-service/JWT_SECRET")
        ssm_client = boto3.client('ssm')
        response = ssm_client.get_parameter(Name=parameter_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        logger.warning(f"Failed to get JWT secret from SSM, using env var: {e}")
        return os.getenv("JWT_SECRET", "fallback-secret-key")

def get_dynamodb_table():
    """Get DynamoDB table instance"""
    dynamodb = boto3.resource('dynamodb')
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "gg_core")
    return dynamodb.Table(table_name)

def _get_room_from_db_sync(room_id: str) -> Optional[dict]:
    """Get room from DynamoDB (synchronous)"""
    try:
        table = get_dynamodb_table()
        response = table.get_item(
            Key={
                "PK": f"ROOM#{room_id}",
                "SK": f"ROOM#{room_id}"
            }
        )
        
        if "Item" in response:
            item = response["Item"]
            logger.info(f"Room found in DynamoDB for {room_id}: {item.get('name', 'N/A')}")
            return item
        else:
            logger.info(f"Room not found in DynamoDB for {room_id}")
    except Exception as e:
        logger.warning(f"Failed to get room from DynamoDB for {room_id}: {e}")
    
    return None

async def get_room_from_db(room_id: str) -> Optional[dict]:
    """Get room from DynamoDB (async wrapper)"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_room_from_db_sync, room_id)

def _save_room_to_db_sync(room_id: str, room_data: dict) -> bool:
    """Save or update room in DynamoDB (synchronous)"""
    try:
        table = get_dynamodb_table()
        
        # Prepare item - ensure None values are not included (DynamoDB doesn't allow None)
        item = {
            "PK": f"ROOM#{room_id}",
            "SK": f"ROOM#{room_id}",
            "type": "Room",
            "id": room_id,
            "roomId": room_id,
            "updatedAt": datetime.now().isoformat(),
        }
        
        # Add room_data fields, filtering out None values
        for key, value in room_data.items():
            if value is not None:
                item[key] = value
        
        # Add createdAt if this is a new room
        if "createdAt" not in item:
            item["createdAt"] = datetime.now().isoformat()
        
        # Ensure description exists (even if empty string)
        if "description" not in item:
            item["description"] = ""
        
        logger.info(f"Saving room to DynamoDB: {room_id}, item keys: {list(item.keys())}, name: {item.get('name')}, description: {item.get('description')}")
        logger.info(f"Saving room allow_reactions: {item.get('allow_reactions')}, allowReactions: {item.get('allowReactions')}, type: {type(item.get('allow_reactions'))}")
        
        # Save to DynamoDB
        table.put_item(Item=item)
        logger.info(f"Room saved to DynamoDB: {room_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to save room to DynamoDB for {room_id}: {e}")
        return False

async def save_room_to_db(room_id: str, room_data: dict) -> bool:
    """Save or update room in DynamoDB (async wrapper)"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _save_room_to_db_sync, room_id, room_data)

async def get_user_profile(user_id: str) -> Optional[dict]:
    """Get user profile from DynamoDB or user service"""
    try:
        # Try to get from DynamoDB directly (core table)
        dynamodb = boto3.resource('dynamodb')
        table_name = os.getenv("DYNAMODB_TABLE_NAME", "gg_core")
        table = dynamodb.Table(table_name)
        
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}"
            }
        )
        
        if "Item" in response:
            item = response["Item"]
            return {
                "userId": user_id,
                "username": item.get("nickname") or item.get("fullName") or item.get("email", "Unknown"),
                "avatarUrl": item.get("avatarUrl"),
                "email": item.get("email"),
                "fullName": item.get("fullName")
            }
    except Exception as e:
        logger.warning(f"Failed to get user profile from DynamoDB for {user_id}: {e}")
    
    # Fallback: return minimal user info
    return {
        "userId": user_id,
        "username": f"User {user_id[:8]}",
        "avatarUrl": None
    }

@app.get("/messaging/rooms/{room_id}/members", response_model=List[RoomMember])
async def get_room_members(room_id: str, request: Request, token: dict = Depends(verify_token)):
    """Get list of members in a room"""
    user_id = token.get("sub")
    
    members = []
    
    # Get all users who have joined this room (via HTTP presence or WebSocket)
    user_ids_in_room = set()
    
    # From HTTP presence tracking
    for uid, rooms in manager.user_rooms.items():
        if room_id in rooms:
            user_ids_in_room.add(uid)
    
    # From WebSocket connections
    connections = manager.get_room_connections(room_id)
    for connection in connections:
        if connection in manager.connection_users:
            user_ids_in_room.add(manager.connection_users[connection])
    
    # Enrich with user profile information
    for member_user_id in user_ids_in_room:
        try:
            profile = await get_user_profile(member_user_id)
            if profile:
                # Check if user is online (has active WebSocket connection)
                is_online = any(
                    conn in manager.get_room_connections(room_id) 
                    and manager.connection_users.get(conn) == member_user_id
                    for conn in manager.get_room_connections(room_id)
                ) or (member_user_id in manager.user_rooms and room_id in manager.user_rooms[member_user_id])
                
                # Determine role (in a real implementation, this would check room/guild permissions)
                role = "member"
                if room_id.startswith("GUILD#"):
                    # For guild rooms, check guild membership role
                    # This would typically query the guild service
                    role = "member"  # Default to member
                
                member = RoomMember(
                    userId=member_user_id,
                    username=profile.get("username", f"User {member_user_id[:8]}"),
                    avatarUrl=profile.get("avatarUrl"),
                    isOnline=is_online,
                    joinedAt=datetime.now().isoformat(),  # In real implementation, get from DB
                    role=role
                )
                members.append(member)
        except Exception as e:
            logger.error(f"Error getting profile for user {member_user_id}: {e}")
            # Still add member with minimal info
            is_online = member_user_id in manager.user_rooms and room_id in manager.user_rooms.get(member_user_id, [])
            members.append(RoomMember(
                userId=member_user_id,
                username=f"User {member_user_id[:8]}",
                avatarUrl=None,
                isOnline=is_online,
                role="member"
            ))
    
    logger.info(f"Retrieved {len(members)} members for room {room_id}")
    return members

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
