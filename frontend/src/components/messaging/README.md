# Frontend Messaging System

A comprehensive real-time messaging system built with React, TypeScript, and WebSocket integration.

## Features

- **Real-time Messaging**: WebSocket-based real-time communication
- **Dual-Table Support**: Guild rooms and general rooms with proper data separation
- **Typing Indicators**: Real-time typing status for users
- **Rate Limiting**: Built-in rate limiting with user feedback
- **Connection Management**: Automatic reconnection and error handling
- **Message Grouping**: Smart message grouping for better UX
- **Internationalization**: Full i18n support (English, Spanish, French)
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **Mobile Responsive**: Optimized for all screen sizes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   WebSocket      │    │   AppSync       │
│   Components    │◄──►│   Service        │◄──►│   GraphQL API   │
│                 │    │   (FastAPI)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   DynamoDB       │
                       │   - gg_core      │
                       │   - gg_guild     │
                       └──────────────────┘
```

## Components

### Core Components

- **`ChatInterface`**: Main chat interface with message list and input
- **`MessageList`**: Displays messages with grouping and pagination
- **`MessageItem`**: Individual message component with actions
- **`MessageInput`**: Message composition with typing indicators
- **`ChatHeader`**: Room information and connection status
- **`ConnectionStatus`**: Connection state and error display
- **`TypingIndicator`**: Shows when users are typing

### Hooks

- **`useMessaging`**: Main messaging hook with state management
- **`useWebSocket`**: Low-level WebSocket connection management

## Usage

### Basic Implementation

```tsx
import { ChatInterface } from './components/messaging/ChatInterface';

function MyChatPage() {
  return (
    <ChatInterface
      roomId="ROOM-123"
      userId="user-123"
      roomName="General Chat"
      roomType="general"
      onMessageSent={(message) => console.log('Message sent:', message)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### Advanced Implementation

```tsx
import { MessagingExample } from './components/messaging/MessagingExample';

function AdvancedChat() {
  return (
    <MessagingExample 
      userId="user-123"
      className="h-screen"
    />
  );
}
```

### Custom Hook Usage

```tsx
import { useMessaging } from './hooks/useMessaging';

function CustomChatComponent() {
  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    loadMessages,
    connect,
    disconnect
  } = useMessaging({
    roomId: 'ROOM-123',
    userId: 'user-123',
    autoConnect: true,
    maxMessages: 100
  });

  // Your custom implementation
  return (
    <div>
      {/* Custom UI */}
    </div>
  );
}
```

## API Integration

### GraphQL Operations

The system uses AppSync GraphQL for message persistence:

```typescript
// Send a message
const message = await sendMessage('ROOM-123', 'Hello world!');

// Load messages
const { messages, pagination } = await fetchMessages('ROOM-123', {
  after: timestamp,
  limit: 50
});
```

### WebSocket Connection

Real-time updates via WebSocket:

```typescript
// Connect to room
const wsUrl = getWebSocketUrl('ROOM-123');
const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Configuration

### Environment Variables

```bash
# API Gateway URL
VITE_API_GATEWAY_URL=https://api.goalsguild.com

# Messaging Service URL
VITE_MESSAGING_SERVICE_URL=ws://localhost:8000

# API Gateway Key
VITE_API_GATEWAY_KEY=your-api-key
```

### Room Types

- **General Rooms**: Use `gg_core` table with `ROOM#` prefix
- **Guild Rooms**: Use `gg_guild` table with `GUILD#` prefix

## Internationalization

The system supports multiple languages:

```typescript
// English (default)
import en from './i18n/messages/en.json';

// Spanish
import es from './i18n/messages/es.json';

// French
import fr from './i18n/messages/fr.json';
```

### Translation Keys

```json
{
  "messaging": {
    "chat": {
      "title": "Chat",
      "noMessages": "No messages yet",
      "loadingMessages": "Loading messages..."
    },
    "input": {
      "placeholder": "Type a message...",
      "sendMessage": "Send message"
    },
    "status": {
      "connected": "Connected to chat",
      "disconnected": "Disconnected from chat"
    }
  }
}
```

## Styling

The components use Tailwind CSS with Shadcn UI:

```tsx
// Custom styling
<ChatInterface 
  className="h-full bg-white dark:bg-gray-900"
  roomId="ROOM-123"
  userId="user-123"
/>
```

## Testing

### Unit Tests

```bash
# Run messaging component tests
npm test -- messaging

# Run specific component tests
npm test -- ChatInterface.test.tsx
```

### Integration Tests

```bash
# Run WebSocket integration tests
npm test -- integration -- --grep "messaging"
```

## Accessibility

The system includes comprehensive accessibility features:

- **ARIA Live Regions**: For dynamic message updates
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper labeling and announcements
- **Focus Management**: Logical focus flow
- **Color Contrast**: WCAG AA compliant colors

## Performance

### Optimization Features

- **Message Pagination**: Load messages in chunks
- **Message Grouping**: Reduce DOM nodes
- **Debounced Typing**: Reduce API calls
- **Connection Pooling**: Efficient WebSocket management
- **Memoization**: Prevent unnecessary re-renders

### Best Practices

```tsx
// Use React.memo for expensive components
const MessageItem = React.memo(({ message }) => {
  // Component implementation
});

// Use useCallback for event handlers
const handleSendMessage = useCallback((text: string) => {
  // Handler implementation
}, [dependencies]);
```

## Error Handling

The system provides comprehensive error handling:

```tsx
// Connection errors
if (!isConnected) {
  return <ConnectionError onRetry={retryConnection} />;
}

// Rate limiting
if (rateLimitInfo?.isLimited) {
  return <RateLimitWarning resetTime={rateLimitInfo.resetTime} />;
}

// Network errors
if (hasError) {
  return <NetworkError onRetry={retryConnection} />;
}
```

## Security

### Authentication

All WebSocket connections require JWT tokens:

```typescript
const token = localStorage.getItem('authToken');
const wsUrl = `${messagingServiceUrl}/ws/rooms/${roomId}?token=${token}`;
```

### Authorization

Guild rooms require membership validation:

```typescript
// Validate guild membership
const isGuildMember = await validateGuildMembership(userId, guildId);
if (!isGuildMember) {
  throw new Error('Guild access denied');
}
```

## Deployment

### Build Configuration

```json
{
  "scripts": {
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

### Environment Setup

```bash
# Development
npm run dev

# Production build
npm run build

# Run tests
npm test
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check JWT token validity
   - Verify messaging service URL
   - Check network connectivity

2. **Messages Not Loading**
   - Verify API Gateway configuration
   - Check authentication headers
   - Validate room permissions

3. **Rate Limiting**
   - Implement exponential backoff
   - Show user-friendly messages
   - Monitor rate limit headers

### Debug Mode

```typescript
// Enable debug logging
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('Messaging state:', { messages, isConnected, hasError });
}
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Code Style

- Use TypeScript for all components
- Follow React best practices
- Implement proper error boundaries
- Write comprehensive tests
- Document all public APIs

## License

This messaging system is part of the GoalsGuild project and follows the same licensing terms.
