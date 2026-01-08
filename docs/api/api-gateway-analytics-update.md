# API Gateway Analytics Endpoint Update

## Overview
This document outlines the changes made to the API Gateway configuration to support the new Quest Analytics endpoint.

## Changes Made

### 1. New Resource Added
- **Resource Path**: `/quests/analytics`
- **Resource Name**: `quests_analytics`
- **Parent Resource**: `quests`

### 2. HTTP Methods Added

#### GET /quests/analytics
- **Authorization**: CUSTOM (Lambda Authorizer)
- **API Key Required**: Yes
- **Integration**: AWS_PROXY to Quest Service Lambda
- **Purpose**: Retrieve quest analytics data for authenticated users

#### OPTIONS /quests/analytics
- **Authorization**: NONE
- **Purpose**: CORS preflight requests
- **Response**: Proper CORS headers for GET requests

### 3. Integration Details

#### Lambda Integration
- **Type**: AWS_PROXY
- **Integration HTTP Method**: POST
- **Lambda ARN**: Quest Service Lambda function
- **Purpose**: Forward requests to quest service for analytics processing

#### CORS Configuration
- **Allowed Headers**: `accept,content-type,authorization,x-api-key,origin,referer,x-amz-date,x-amz-security-token`
- **Allowed Methods**: `OPTIONS,GET`
- **Allowed Origin**: Configurable via `frontend_allowed_origins` variable

### 4. Deployment Triggers
The analytics endpoint methods have been added to the deployment triggers to ensure the API Gateway is redeployed when these resources change:
- `aws_api_gateway_method.quests_analytics_get`
- `aws_api_gateway_method.quests_analytics_options`

## API Endpoint Details

### Request Format
```
GET /quests/analytics?period=weekly&force_refresh=false
```

**Query Parameters:**
- `period` (optional): Time period for analytics (`daily`, `weekly`, `monthly`, `allTime`)
- `force_refresh` (optional): Force refresh of cached data (`true`, `false`)

**Headers:**
- `Authorization`: Bearer token for authentication
- `x-api-key`: API Gateway key
- `Content-Type`: application/json

### Response Format
```json
{
  "userId": "user123",
  "period": "weekly",
  "totalQuests": 25,
  "completedQuests": 18,
  "successRate": 0.72,
  "averageCompletionTime": 3600,
  "bestStreak": 7,
  "currentStreak": 3,
  "xpEarned": 4500,
  "trends": {
    "completionRate": [
      {"date": "2024-01-01", "value": 0.8},
      {"date": "2024-01-02", "value": 0.75}
    ],
    "xpEarned": [
      {"date": "2024-01-01", "value": 500},
      {"date": "2024-01-02", "value": 450}
    ],
    "questsCreated": [
      {"date": "2024-01-01", "value": 3},
      {"date": "2024-01-02", "value": 2}
    ]
  },
  "categoryPerformance": [
    {
      "category": "Health",
      "totalQuests": 10,
      "completedQuests": 8,
      "successRate": 0.8,
      "averageCompletionTime": 1800,
      "xpEarned": 2000
    }
  ],
  "productivityByHour": [
    {
      "hour": 9,
      "questsCompleted": 5,
      "xpEarned": 750,
      "averageCompletionTime": 1200
    }
  ],
  "calculatedAt": 1704067200000,
  "ttl": 3600
}
```

## Security Considerations

### Authentication
- **Required**: Bearer token authentication via Lambda Authorizer
- **API Key**: Required for all requests
- **User Context**: Analytics data is filtered by authenticated user ID

### Authorization
- Users can only access their own analytics data
- No cross-user data access is permitted
- Analytics data is calculated server-side for security

### Rate Limiting
- Subject to API Gateway usage plan limits
- Analytics calculations are cached to reduce load
- TTL-based cache expiration prevents stale data

## Deployment Instructions

### 1. Apply Terraform Changes
```bash
cd backend/infra/terraform2
terraform plan
terraform apply
```

### 2. Verify Deployment
```bash
# Test the endpoint
curl -X GET "https://your-api-gateway-url/quests/analytics?period=weekly" \
  -H "Authorization: Bearer your-token" \
  -H "x-api-key: your-api-key"
```

### 3. Update Frontend Configuration
Ensure the frontend `API_BASE_URL` environment variable points to the updated API Gateway URL.

## Monitoring and Logging

### CloudWatch Logs
- API Gateway access logs include analytics endpoint requests
- Lambda function logs show analytics calculation details
- Error logs capture any calculation failures

### Metrics
- Request count and latency for analytics endpoint
- Error rates and 4xx/5xx responses
- Cache hit/miss ratios for analytics data

## Testing

### Unit Tests
- Backend analytics calculation logic
- API Gateway integration tests
- CORS configuration validation

### Integration Tests
- End-to-end analytics data flow
- Authentication and authorization
- Caching behavior verification

### Load Testing
- Analytics calculation performance
- Concurrent user analytics requests
- Cache effectiveness under load

## Rollback Plan

If issues arise with the analytics endpoint:

1. **Immediate**: Disable the endpoint by removing it from the deployment triggers
2. **Short-term**: Revert to previous API Gateway configuration
3. **Long-term**: Fix issues and redeploy

## Future Enhancements

### Planned Features
- Real-time analytics updates
- Advanced filtering options
- Export functionality
- Custom date ranges

### Performance Optimizations
- Redis caching layer
- Pre-calculated analytics
- Background processing
- Data aggregation pipelines

## Support

For issues with the analytics endpoint:
1. Check CloudWatch logs for errors
2. Verify Lambda function permissions
3. Test authentication and authorization
4. Validate query parameters
5. Check cache configuration

## Related Documentation
- [Quest Analytics Backend Implementation](./quest-analytics-backend.md)
- [Quest Analytics Frontend Implementation](./quest-analytics-frontend.md)
- [API Gateway Configuration Guide](./api-gateway-config.md)
