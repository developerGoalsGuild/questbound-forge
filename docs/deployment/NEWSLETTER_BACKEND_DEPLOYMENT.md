# Newsletter Backend Deployment Checklist

## Overview
This document outlines what needs to be deployed to the backend for the newsletter subscription functionality.

## Backend Changes Summary

### 1. Code Changes

#### Files Modified:
- ✅ `backend/services/user-service/app/main.py`
  - Added `newsletter_subscribe` endpoint (`POST /newsletter/subscribe`)
  - Added `newsletter_subscribe_options` endpoint (`OPTIONS /newsletter/subscribe`) for CORS
  - Uses same rate limiting as waitlist (`_enforce_waitlist_rate_limit`)
  - Requires API key authentication (`x-api-key` header)
  - Stores subscriptions in DynamoDB `gg_core` table

- ✅ `backend/services/user-service/app/models.py`
  - Added `NewsletterSubscribe` model (email + optional source)
  - Added `NewsletterResponse` model (message, email, subscribed)

### 2. Endpoint Details

#### Newsletter Subscribe Endpoint
- **Path**: `/newsletter/subscribe`
- **Method**: `POST`
- **CORS**: `OPTIONS` endpoint included
- **Authentication**: API Key required (`x-api-key` header)
- **Rate Limiting**: 
  - API Gateway: 2 requests/second, burst of 5
  - Application: 5 requests per minute per IP address
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "source": "footer"  // Optional, defaults to "footer"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Successfully subscribed to newsletter",
    "email": "user@example.com",
    "subscribed": true
  }
  ```

### 3. DynamoDB Storage

#### Table: `gg_core`
- **Partition Key (PK)**: `NEWSLETTER#{email}`
- **Sort Key (SK)**: `SUBSCRIPTION#NEWSLETTER`
- **GSI1PK**: `NEWSLETTER#ALL` (for querying all subscribers)
- **GSI1SK**: `SUBSCRIPTION#{created_at_iso}` (sorted by creation date)

#### Item Structure:
```json
{
  "PK": "NEWSLETTER#user@example.com",
  "SK": "SUBSCRIPTION#NEWSLETTER",
  "type": "Newsletter",
  "email": "user@example.com",
  "status": "subscribed",
  "source": "footer",
  "ipAddress": "192.168.1.1",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "GSI1PK": "NEWSLETTER#ALL",
  "GSI1SK": "SUBSCRIPTION#2025-01-15T10:30:00Z"
}
```

## Deployment Steps

### Step 1: Deploy Lambda Function

The newsletter endpoint is part of the user-service Lambda function. Deploy the updated Lambda:

```bash
cd backend/services/user-service
# Follow your standard deployment process
# This typically involves:
# - Building Docker image
# - Pushing to ECR
# - Updating Lambda function
```

**Note**: Since API Gateway typically uses a catch-all route (`/{proxy+}`) to Lambda, the new `/newsletter/subscribe` endpoint should work automatically once the Lambda is deployed. No API Gateway route configuration changes are needed.

### Step 2: Verify API Gateway Configuration

The newsletter endpoint uses the same API Gateway setup as the waitlist endpoint. Verify:

1. **API Gateway Route**: Should already have `/{proxy+}` route configured
2. **API Key**: Uses the same API key as waitlist endpoint
3. **CORS**: CORS is handled by the `OPTIONS` endpoint in the Lambda
4. **Rate Limiting**: Uses same rate limits as waitlist (configured in API Gateway)

**No API Gateway changes required** - the endpoint will be available at:
```
https://{api-gateway-url}/v1/newsletter/subscribe
```

### Step 3: Test the Endpoint

After deploying the Lambda, test the endpoint:

```bash
# Test newsletter subscription
curl -X POST https://{api-gateway-url}/v1/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -H "x-api-key: {your-api-key}" \
  -d '{"email": "test@example.com", "source": "footer"}'

# Test CORS preflight
curl -X OPTIONS https://{api-gateway-url}/v1/newsletter/subscribe \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST"
```

### Step 4: Verify DynamoDB Storage

Check that subscriptions are being stored correctly:

```bash
# Using AWS CLI
aws dynamodb get-item \
  --table-name gg_core \
  --key '{"PK": {"S": "NEWSLETTER#test@example.com"}, "SK": {"S": "SUBSCRIPTION#NEWSLETTER"}}'

# Query all newsletter subscribers
aws dynamodb query \
  --table-name gg_core \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :pk" \
  --expression-attribute-values '{":pk": {"S": "NEWSLETTER#ALL"}}'
```

## What Does NOT Need Deployment

### ✅ No API Gateway Route Changes Needed
- The existing `/{proxy+}` route handles all paths
- Newsletter endpoint will be automatically available

### ✅ No Infrastructure Changes Needed
- Uses existing DynamoDB table (`gg_core`)
- Uses existing GSI (GSI1)
- Uses existing API Gateway and Lambda setup

### ✅ No New Dependencies
- Uses existing FastAPI, boto3, and other dependencies
- No new Python packages required

## Verification Checklist

After deployment, verify:

- [ ] Lambda function deployed successfully
- [ ] Newsletter endpoint responds to POST requests
- [ ] Newsletter endpoint responds to OPTIONS (CORS) requests
- [ ] API key authentication works
- [ ] Rate limiting works (test with multiple rapid requests)
- [ ] Duplicate email handling works (returns success but indicates already subscribed)
- [ ] DynamoDB items are created correctly
- [ ] GSI1 allows querying all newsletter subscribers
- [ ] Error handling works (invalid email, missing API key, etc.)

## Rollback Plan

If issues occur:

1. **Revert Lambda deployment** to previous version
2. **No API Gateway changes** to revert (none were made)
3. **DynamoDB data** remains intact (no data loss)

## Related Documentation

- [Waitlist Deployment Summary](./WAITLIST_DEPLOYMENT_SUMMARY.md)
- [Waitlist DynamoDB Storage](../landing-page/WAITLIST_DYNAMODB_STORAGE.md)
- [Backend Test File](../../backend/services/user-service/tests/test_waitlist_newsletter.py)
