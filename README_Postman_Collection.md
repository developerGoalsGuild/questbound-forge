# GoalsGuild Messaging API - Postman Collection

This Postman collection provides a complete testing suite for the GoalsGuild messaging service API, including authentication flow and all available endpoints.

## 📁 Files Included

- `GoalsGuild_Messaging_API.postman_collection.json` - Complete API collection
- `GoalsGuild_Messaging_Environment.postman_environment.json` - Environment variables
- `README.md` - This documentation file

## 🚀 Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `GoalsGuild_Messaging_API.postman_collection.json`
   - `GoalsGuild_Messaging_Environment.postman_environment.json`

### 2. Configure Environment Variables

1. Select the **GoalsGuild Messaging - Development** environment
2. Update the following variables if needed:
   - `base_url`: `https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1`
   - `api_gateway_key`: Your API Gateway key (if required)
   - `test_email`: Email for test user
   - `test_password`: Password for test user

### 3. Run Authentication Flow

1. **User Signup** (if needed) - Creates a new user account
2. **User Login** - Gets access token for API calls
3. **Token Validation** - Verifies the token is working

## 📋 Collection Structure

### 🔐 Authentication
- **User Signup** - Register new user account
- **User Login** - Login and get access token
- **Token Renewal** - Refresh expired tokens

### 🏠 Messaging - Rooms
- **List Rooms** - Get all available chat rooms
- **Create Room** - Create a new chat room
- **Get Room Details** - Get specific room information
- **Update Room** - Modify room settings
- **Join Room** - Join a chat room
- **Leave Room** - Leave a chat room
- **Delete Room** - Delete a room (admin only)

### 💬 Messaging - Messages
- **Get Messages** - Retrieve messages from a room
- **Send Message** - Send a text message
- **Send Multiple Messages** - Send random test messages

### 🔌 WebSocket Testing
- **WebSocket Connect** - Connect to real-time messaging

### 📡 AppSync GraphQL
- **Get Messages (GraphQL)** - Retrieve messages using GraphQL query
- **Send Message (GraphQL)** - Send message using GraphQL mutation
- **Send Multiple Messages (GraphQL)** - Send random test messages via GraphQL
- **GraphQL Introspection** - Explore available GraphQL schema
- **Test GraphQL Authentication** - Verify GraphQL authentication

### 🏥 Health & Status
- **API Health Check** - Verify API Gateway is responding
- **Token Validation** - Check if token is still valid

## 🔧 Features

### ✨ Automatic Token Management
- Tokens are automatically extracted and stored after login
- All authenticated requests use the stored token
- Token validation helps identify expired tokens

### 🎯 Smart Variable Management
- Room IDs are automatically captured and reused
- Message IDs are stored for reference
- Timestamps are generated for unique content

### 📊 Comprehensive Testing
- Pre-request scripts for data preparation
- Post-response scripts for validation
- Console logging for debugging
- Error handling and status reporting

### 🔄 Workflow Automation
- Run entire authentication flow with one click
- Test complete messaging workflow
- Validate all endpoints systematically

## 🎮 Usage Examples

### Basic Authentication Flow
1. Run **User Login** to get access token
2. Run **Token Validation** to verify authentication
3. Start testing messaging endpoints

### Complete Messaging Test
1. **User Login** → Get token
2. **List Rooms** → See available rooms
3. **Create Room** → Create test room
4. **Join Room** → Join the room
5. **Send Message** → Send test message
6. **Get Messages** → Verify message was saved
7. **Leave Room** → Clean up

### WebSocket Testing
1. **User Login** → Get token
2. **WebSocket Connect** → Establish real-time connection
3. Send messages through WebSocket
4. Monitor real-time updates

### GraphQL Testing
1. **User Login** → Get token
2. **Test GraphQL Authentication** → Verify GraphQL auth
3. **Send Message (GraphQL)** → Send via GraphQL mutation
4. **Get Messages (GraphQL)** → Retrieve via GraphQL query
5. **GraphQL Introspection** → Explore schema

## 🔍 API Endpoints Covered

### Authentication Endpoints
- `POST /users/signup` - User registration
- `POST /users/login` - User authentication
- `POST /auth/renew` - Token renewal

### Messaging Endpoints
- `GET /messaging/rooms` - List rooms
- `POST /messaging/rooms` - Create room
- `GET /messaging/rooms/{room_id}` - Get room details
- `PUT /messaging/rooms/{room_id}` - Update room
- `DELETE /messaging/rooms/{room_id}` - Delete room
- `GET /messaging/rooms/{room_id}/messages` - Get messages
- `POST /messaging/rooms/{room_id}/messages` - Send message
- `POST /messaging/rooms/{room_id}/join` - Join room
- `POST /messaging/rooms/{room_id}/leave` - Leave room

### WebSocket Endpoints
- `GET /ws` - WebSocket connection

### AppSync GraphQL Endpoints
- `POST /graphql` - GraphQL endpoint for all operations
  - **Queries**: `messages(roomId: ID!, after: AWSTimestamp, limit: Int)`
  - **Mutations**: `sendMessage(roomId: ID!, text: String!)`
  - **Subscriptions**: `onMessage(roomId: ID!)` (real-time)

## 🛠️ Customization

### Environment Variables
You can customize the following variables:

```json
{
  "base_url": "https://your-api-gateway-url.com/v1",
  "api_gateway_key": "your-api-key",
  "appsync_endpoint": "https://your-appsync-url.amazonaws.com/graphql",
  "appsync_api_key": "your-appsync-api-key",
  "test_email": "your-test@email.com",
  "test_password": "YourPassword123!",
  "test_username": "yourusername"
}
```

### Adding New Tests
1. Create new request in appropriate folder
2. Use `{{variable_name}}` for dynamic values
3. Add pre-request and test scripts as needed
4. Use `pm.collectionVariables.set()` to store values

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
- Run **User Login** to get fresh token
- Check if token has expired
- Verify API Gateway key is correct

**500 Internal Server Error**
- Check API Gateway logs
- Verify Lambda function is deployed
- Check DynamoDB permissions

**CORS Errors**
- Ensure proper headers are set
- Check API Gateway CORS configuration

### Debug Tips
- Check Postman Console for detailed logs
- Use **Token Validation** to test authentication
- Run **API Health Check** to verify connectivity
- Review CloudWatch logs for backend issues

## 📚 API Documentation

### Request Headers
All authenticated requests require:
```
Authorization: Bearer {access_token}
x-api-key: {api_gateway_key}
Content-Type: application/json
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔗 Related Resources

- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Postman Documentation](https://learning.postman.com/)

## 📞 Support

For issues with this collection:
1. Check the troubleshooting section
2. Review CloudWatch logs
3. Verify environment variables
4. Test individual endpoints

---

**Happy Testing! 🚀**

This collection provides a comprehensive testing suite for the GoalsGuild messaging API. Use it to verify functionality, test new features, and ensure your API is working correctly.
