# Messaging System Test Guide

## How to Test the Chat Functionality

### 1. **Access the Chat Page**

The chat functionality is now available at:
- **URL**: `http://localhost:3000/chat` (or your frontend URL)
- **Navigation**: User Menu → Chat (after logging in)

### 2. **Prerequisites for Testing**

Before testing the chat, ensure you have:

#### Backend Services Running:
- **AppSync GraphQL API** with messaging resolvers deployed
- **Messaging Service** (FastAPI) running on port 8000
- **DynamoDB tables** (`gg_core` and `gg_guild`) created

#### Environment Variables Set:
```bash
# In your .env file or environment
VITE_API_GATEWAY_URL=https://your-api-gateway-url
VITE_MESSAGING_SERVICE_URL=ws://localhost:8000
VITE_API_GATEWAY_KEY=your-api-key
```

### 3. **Test Scenarios**

#### **Basic Chat Test:**
1. Navigate to `/chat`
2. Select "Simple Chat Interface" tab
3. Try sending a message
4. Check browser console for any errors

#### **Advanced Interface Test:**
1. Select "Advanced Interface" tab
2. Test multiple room switching
3. Test real-time messaging between rooms

#### **Room Selection Test:**
1. Select "Room Selection" tab
2. Click on different rooms
3. Test both general and guild rooms

### 4. **Expected Behavior**

#### **When Backend is Running:**
- ✅ Messages should send and receive in real-time
- ✅ Connection status should show "Connected"
- ✅ Typing indicators should work
- ✅ Message history should load

#### **When Backend is NOT Running:**
- ⚠️ Connection status will show "Disconnected"
- ⚠️ Messages won't send (expected)
- ⚠️ Console will show connection errors (expected)

### 5. **Troubleshooting**

#### **Common Issues:**

1. **"Connection Failed" Error:**
   - Check if messaging service is running on port 8000
   - Verify WebSocket URL in environment variables

2. **"Authentication Failed" Error:**
   - Ensure you're logged in
   - Check if JWT token is valid

3. **"Rate Limit Exceeded" Error:**
   - Wait a few seconds before sending more messages
   - This is expected behavior for testing

4. **Messages Not Loading:**
   - Check if AppSync API is deployed
   - Verify API Gateway URL and key

### 6. **Testing Without Backend**

Even without the backend services running, you can test:
- ✅ UI components and layout
- ✅ Navigation and routing
- ✅ Form validation
- ✅ Error handling
- ✅ Responsive design

### 7. **Development Mode Testing**

For development testing, you can:

1. **Mock the API responses** in the browser console
2. **Test UI components** in isolation
3. **Verify accessibility** with screen readers
4. **Test keyboard navigation**

### 8. **Production Testing**

For full functionality testing:
1. Deploy the messaging service to AWS
2. Configure environment variables
3. Test with real WebSocket connections
4. Verify message persistence in DynamoDB

### 9. **Browser Console Commands**

You can test the messaging hooks directly in the browser console:

```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/rooms/ROOM-test?token=your-token');

// Test message sending
ws.send(JSON.stringify({
  type: 'message',
  text: 'Test message',
  roomId: 'ROOM-test'
}));
```

### 10. **Success Criteria**

The messaging system is working correctly when:
- ✅ Chat interface loads without errors
- ✅ Connection status shows appropriate state
- ✅ Messages can be typed and sent (if backend is running)
- ✅ Real-time updates work (if backend is running)
- ✅ Error handling works gracefully
- ✅ UI is responsive and accessible

## Next Steps

1. **Start the frontend**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/chat`
3. **Test the interface** with the scenarios above
4. **Check console** for any errors or warnings
5. **Report any issues** with specific error messages
