# Waitlist Email Storage in DynamoDB

## ✅ Implementation Status

The landing page waitlist form **already stores emails in DynamoDB**. This document describes how it works.

## Architecture

### Data Flow

1. **User submits email** on landing page (`index.html`)
2. **Frontend JavaScript** (`main.js`) sends POST request to API Gateway
3. **API Gateway** routes to user-service Lambda function
4. **Lambda function** (`/waitlist/subscribe` endpoint) stores email in DynamoDB
5. **DynamoDB** stores the email in the `gg_core` table

### DynamoDB Storage Structure

**Table**: `gg_core`

**Primary Key**:
- **PK**: `WAITLIST#{email}` (e.g., `WAITLIST#user@example.com`)
- **SK**: `SUBSCRIPTION#WAITLIST`

**Global Secondary Index (GSI1)**:
- **GSI1PK**: `WAITLIST#ALL` (allows querying all subscribers)
- **GSI1SK**: `SUBSCRIPTION#{created_at_iso}` (sorted by creation date)

**Item Structure**:
```json
{
  "PK": "WAITLIST#user@example.com",
  "SK": "SUBSCRIPTION#WAITLIST",
  "type": "Waitlist",
  "email": "user@example.com",
  "status": "subscribed",
  "source": "landing_page",
  "ipAddress": "192.168.1.1",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "GSI1PK": "WAITLIST#ALL",
  "GSI1SK": "SUBSCRIPTION#2025-01-15T10:30:00Z"
}
```

## API Endpoint

### Endpoint Details

- **URL**: `POST /waitlist/subscribe`
- **Authentication**: API Key required (`x-api-key` header)
- **Rate Limit**: 5 requests per minute per IP address

### Request

```http
POST /waitlist/subscribe
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "email": "user@example.com"
}
```

### Response (Success)

```json
{
  "message": "Successfully subscribed to waitlist",
  "email": "user@example.com",
  "subscribed": true
}
```

### Response (Duplicate)

```json
{
  "message": "Email already subscribed to waitlist",
  "email": "user@example.com",
  "subscribed": true
}
```

## Querying Waitlist Emails

### Using AWS CLI

Query all waitlist subscribers:

```bash
aws dynamodb query \
  --table-name gg_core \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"WAITLIST#ALL"}}' \
  --region us-east-2
```

Get count of subscribers:

```bash
aws dynamodb query \
  --table-name gg_core \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :pk" \
  --select COUNT \
  --expression-attribute-values '{":pk":{"S":"WAITLIST#ALL"}}' \
  --region us-east-2
```

### Using Python Script

A helper script is available at `backend/services/user-service/scripts/query_waitlist.py`:

```bash
# Query all subscribers (JSON)
python backend/services/user-service/scripts/query_waitlist.py

# Export as CSV
python backend/services/user-service/scripts/query_waitlist.py --output csv > waitlist.csv

# Get count only
python backend/services/user-service/scripts/query_waitlist.py --count-only

# Limit results
python backend/services/user-service/scripts/query_waitlist.py --limit 100
```

### Using AWS Console

1. Go to DynamoDB Console
2. Select table: `gg_core`
3. Go to "Explore table items"
4. Select "Query" tab
5. Choose index: `GSI1`
6. Partition key: `GSI1PK` = `WAITLIST#ALL`
7. Click "Run"

## Features

### ✅ Implemented Features

- **Email Storage**: All emails stored in DynamoDB `gg_core` table
- **Duplicate Prevention**: Checks for existing subscriptions before creating new ones
- **Rate Limiting**: 5 requests per minute per IP address
- **API Key Authentication**: Required for all requests
- **IP Tracking**: Client IP address stored for analytics
- **Timestamp Tracking**: Created and updated timestamps
- **Source Tracking**: Tracks that emails come from "landing_page"
- **GSI Indexing**: GSI1 allows efficient querying of all subscribers

### Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `PK` | String | Primary key: `WAITLIST#{email}` |
| `SK` | String | Sort key: `SUBSCRIPTION#WAITLIST` |
| `type` | String | Entity type: `Waitlist` |
| `email` | String | Subscriber email address (lowercase) |
| `status` | String | Subscription status: `subscribed` |
| `source` | String | Source of subscription: `landing_page` |
| `ipAddress` | String | Client IP address |
| `createdAt` | String | ISO 8601 timestamp |
| `updatedAt` | String | ISO 8601 timestamp |
| `GSI1PK` | String | GSI partition key: `WAITLIST#ALL` |
| `GSI1SK` | String | GSI sort key: `SUBSCRIPTION#{timestamp}` |

## Code Locations

### Backend Implementation

- **Endpoint**: `backend/services/user-service/app/main.py` (line 417)
- **Model**: `backend/services/user-service/app/models.py` (`WaitlistSubscribe`, `WaitlistResponse`)
- **Table**: Uses `core` DynamoDB resource (points to `gg_core` table)

### Frontend Implementation

- **Form**: `LandingPage/src/index.html` (waitlist section)
- **JavaScript**: `LandingPage/src/js/main.js` (`initWaitlistForm` function)
- **API Config**: Set via `window.GOALSGUILD_CONFIG` or environment variables

## Testing

### Test Email Submission

```bash
curl -X POST https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/waitlist/subscribe \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"email":"test@example.com"}'
```

### Verify in DynamoDB

```bash
aws dynamodb get-item \
  --table-name gg_core \
  --key '{"PK":{"S":"WAITLIST#test@example.com"},"SK":{"S":"SUBSCRIPTION#WAITLIST"}}' \
  --region us-east-2
```

## Monitoring

### CloudWatch Logs

Check Lambda function logs for waitlist subscriptions:

```bash
aws logs tail /aws/lambda/goalsguild_user_service_dev --follow --region us-east-2
```

Look for log events:
- `waitlist.subscribe.success` - Successful subscription
- `waitlist.subscribe.duplicate` - Duplicate email attempt
- `waitlist.subscribe.ddb_error` - DynamoDB error
- `waitlist.subscribe.error` - General error

### Metrics

Monitor:
- API Gateway request count
- Lambda invocations
- DynamoDB read/write capacity
- Error rates

## Security

### Rate Limiting

- **API Gateway**: 2 requests/second, burst of 5
- **Application**: 5 requests per minute per IP address

### Authentication

- API Key required in `x-api-key` header
- Validated at both API Gateway and application level

### Data Privacy

- Email addresses stored in plain text (required for functionality)
- IP addresses stored for analytics and abuse prevention
- Consider GDPR compliance for EU users

## Next Steps

### Potential Enhancements

1. **Email Verification**: Send confirmation email before storing
2. **Unsubscribe**: Add unsubscribe functionality
3. **Export**: Create admin endpoint to export subscriber list
4. **Analytics**: Add dashboard for subscriber metrics
5. **Segmentation**: Add tags/categories for different waitlist types
6. **Notifications**: Alert when new subscribers join

### Maintenance

- Regularly query and export subscriber list
- Monitor for duplicate subscriptions
- Review rate limiting effectiveness
- Check DynamoDB costs and usage

## Troubleshooting

### Emails Not Being Stored

1. Check Lambda function logs in CloudWatch
2. Verify API Gateway is routing correctly
3. Check DynamoDB table permissions
4. Verify GSI1 index exists and is active

### Query Issues

1. Ensure GSI1 index is properly configured
2. Check table name matches (`gg_core`)
3. Verify region is correct (`us-east-2`)
4. Check IAM permissions for DynamoDB access

### Rate Limit Issues

1. Check API Gateway throttling settings
2. Verify application-level rate limiting
3. Check IP address tracking
4. Review rate limit window configuration















