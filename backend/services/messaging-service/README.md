# GoalsGuild Messaging Service

FastAPI-based messaging service that provides additional features for real-time messaging beyond AppSync GraphQL subscriptions.

## Features

- **WebSocket Connections**: Real-time messaging with WebSocket support
- **Rate Limiting**: Prevents spam with configurable message limits
- **Connection Management**: Tracks active connections per room and user
- **Guild Validation**: Validates guild membership for guild chat access
- **Health Monitoring**: Provides health check and connection statistics
- **JWT Authentication**: Secure WebSocket connections with JWT tokens

## Architecture

This service works alongside the existing AppSync GraphQL API:

- **AppSync**: Handles message persistence and GraphQL subscriptions
- **Messaging Service**: Provides additional WebSocket features, rate limiting, and monitoring
- **Dual-Table Support**: Works with both `gg_core` (general rooms) and `gg_guild` (guild rooms)

## API Endpoints

### WebSocket
- `GET /ws/rooms/{room_id}?token={jwt_token}` - Connect to a room via WebSocket

### REST API
- `GET /health` - Health check and statistics
- `GET /rooms/{room_id}/connections` - Get active connections for a room
- `GET /users/{user_id}/connections` - Get active connections for a user
- `POST /rooms/{room_id}/broadcast` - Broadcast message to room

## Environment Variables

```bash
JWT_SECRET=your-jwt-secret-key
```

## Usage

### WebSocket Connection

```javascript
const token = 'your-jwt-token';
const roomId = 'ROOM-123'; // or 'GUILD#guild-456' for guild rooms
const ws = new WebSocket(`ws://localhost:8000/ws/rooms/${roomId}?token=${token}`);

ws.onopen = () => {
    console.log('Connected to room');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};

// Send a message
ws.send(JSON.stringify({
    text: 'Hello world!'
}));
```

### REST API Usage

```bash
# Health check
curl http://localhost:8000/health

# Get room connections
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:8000/rooms/ROOM-123/connections

# Broadcast message
curl -X POST \
     -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello everyone!"}' \
     http://localhost:8000/rooms/ROOM-123/broadcast
```

## Rate Limiting

- **Default**: 30 messages per minute per user
- **Configurable**: Modify `max_messages_per_minute` in the code
- **Response**: Returns error message when limit exceeded

## Guild Room Support

For guild rooms (roomId starts with `GUILD#`):
- Validates user guild membership
- Uses `gg_guild` table for message persistence
- Requires proper guild permissions

## Development

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build image
docker build -t messaging-service .

# Run container
docker run -p 8000:8000 -e JWT_SECRET=your-secret messaging-service
```

## Monitoring

The service provides several monitoring endpoints:

- **Health Check**: `/health` - Basic service health and statistics
- **Connection Stats**: Real-time connection counts per room and user
- **Rate Limit Tracking**: Internal tracking of user message rates

## Security Considerations

- JWT token validation on all WebSocket connections
- Guild membership validation for guild rooms
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Input validation and sanitization

## Integration with AppSync

This service is designed to work alongside the existing AppSync GraphQL API:

1. **Message Persistence**: AppSync handles saving messages to DynamoDB
2. **Real-time Subscriptions**: AppSync handles GraphQL subscriptions
3. **Additional Features**: This service provides WebSocket connections, rate limiting, and monitoring

The services can be used together or independently depending on client needs.
