# API Gateway Messaging Endpoints

## 🚀 **Overview**

This document outlines the messaging service endpoints that have been added to the API Gateway Terraform configuration.

## 📋 **Endpoints Added**

### **REST API Endpoints**

#### **Room Management**
- `GET /messaging/rooms` - List all rooms
- `POST /messaging/rooms` - Create a new room
- `GET /messaging/rooms/{room_id}` - Get room details
- `PUT /messaging/rooms/{room_id}` - Update room
- `PATCH /messaging/rooms/{room_id}` - Update room settings (partial update)
- `DELETE /messaging/rooms/{room_id}` - Delete room
- `GET /messaging/rooms/{room_id}/members` - Get room members

#### **Message Management**
- `GET /messaging/rooms/{room_id}/messages` - Get room messages
- `POST /messaging/rooms/{room_id}/messages` - Send a message

#### **Room Participation**
- `POST /messaging/rooms/{room_id}/join` - Join a room
- `POST /messaging/rooms/{room_id}/leave` - Leave a room

#### **WebSocket Endpoints**
- `GET /ws` - WebSocket connection
- `DELETE /ws` - WebSocket disconnection
- `POST /ws` - WebSocket message handling

## 🔧 **Configuration Details**

### **Authentication**
- All endpoints use `CUSTOM` authorization with Lambda authorizer
- OPTIONS methods use `NONE` authorization for CORS

### **Integration Type**
- All endpoints use `AWS_PROXY` integration
- Routes to `messaging_service_lambda_arn`
- Uses `POST` integration HTTP method

### **CORS Support**
- All endpoints include OPTIONS methods for CORS
- OPTIONS methods use `MOCK` integration with 200 status code

## 📊 **Resource Structure**

```
/messaging
├── /rooms
│   ├── GET (list rooms)
│   ├── POST (create room)
│   └── /{room_id}
│       ├── GET (get room)
│       ├── PUT (update room)
│       ├── PATCH (update room settings)
│       ├── DELETE (delete room)
│       ├── /members
│       │   └── GET (get room members)
│       ├── /messages
│       │   ├── GET (get messages)
│       │   └── POST (send message)
│       ├── /join
│       │   └── POST (join room)
│       └── /leave
│           └── POST (leave room)
└── /ws (WebSocket)
    ├── GET (connect)
    ├── DELETE (disconnect)
    └── POST (message handling)
```

## 🔐 **Security Features**

### **Authentication**
- All endpoints require JWT token authentication
- Uses existing Lambda authorizer
- WebSocket endpoints also require authentication

### **Authorization**
- Room access controlled by messaging service
- User permissions validated at service level
- Guild room access requires guild membership

## 🚀 **Deployment**

### **Terraform Configuration**
The messaging endpoints are automatically included when deploying the API Gateway stack:

```bash
# Deploy API Gateway with messaging endpoints
cd backend/infra/terraform2/stacks/apigateway
terraform plan -var-file ../../environments/dev.tfvars
terraform apply -var-file ../../environments/dev.tfvars
```

### **Dependencies**
- Messaging service Lambda function must be deployed first
- Lambda authorizer must be available
- DynamoDB tables (gg_core, gg_guild) must exist

## 📝 **Usage Examples**

### **List Rooms**
```bash
curl -X GET https://api.goalsguild.com/v1/messaging/rooms \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>"
```

### **Create Room**
```bash
curl -X POST https://api.goalsguild.com/v1/messaging/rooms \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "General Chat", "type": "general"}'
```

### **Send Message**
```bash
curl -X POST https://api.goalsguild.com/v1/messaging/rooms/room123/messages \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello everyone!", "type": "text"}'
```

### **Join Room**
```bash
curl -X POST https://api.goalsguild.com/v1/messaging/rooms/room123/join \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>"
```

## 🔍 **Testing**

### **Health Check**
```bash
# Test messaging service health
curl -X GET https://api.goalsguild.com/v1/messaging/rooms \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>"
```

### **WebSocket Connection**
```javascript
// WebSocket connection example
const ws = new WebSocket('wss://api.goalsguild.com/v1/ws', {
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'x-api-key': '<api_key>'
  }
});
```

## 📈 **Monitoring**

### **CloudWatch Metrics**
- API Gateway request count
- Lambda function invocations
- Error rates and latency
- WebSocket connection count

### **Logs**
- API Gateway access logs
- Lambda function logs
- WebSocket connection logs

## 🎯 **Next Steps**

1. **Deploy the messaging service Lambda function**
2. **Test the API Gateway endpoints**
3. **Configure frontend integration**
4. **Set up monitoring and alerting**
5. **Test WebSocket functionality**

## 📞 **Support**

For issues or questions:
- Check API Gateway logs in CloudWatch
- Verify Lambda function deployment
- Test authentication tokens
- Check CORS configuration
