# CORS Fix - Deployment Required

## Problem
CORS error when submitting waitlist form from CloudFront:
```
Access to fetch at '...' from origin 'https://d1of22l34nde2a.cloudfront.net' 
has been blocked by CORS policy: Response to preflight request doesn't pass 
access control check: No 'Access-Control-Allow-Origin' header is present
```

## Root Cause
1. **API Gateway OPTIONS** endpoint is configured but may not be returning proper CORS headers
2. **Backend Lambda** needs to handle OPTIONS requests for CORS preflight
3. **CloudFront domain** needs to be in allowed origins

## Fixes Applied

### 1. API Gateway Configuration
✅ Updated OPTIONS integration response to use `'*'` for CORS origin
✅ This allows all origins (since `frontend_allowed_origins = ["*"]`)

### 2. Backend Lambda Function
✅ Added explicit OPTIONS handler for `/waitlist/subscribe` endpoint
✅ Returns proper CORS headers for preflight requests
✅ Updated CORS middleware to include CloudFront domain

## Deployment Required

### Step 1: Deploy Backend (User Service)
The backend code has been updated but needs to be deployed:

```powershell
# Navigate to user-service directory
cd backend/services/user-service

# Build and deploy the Lambda function
# (Follow your normal deployment process)
```

**Changes in backend:**
- Added OPTIONS handler for `/waitlist/subscribe`
- Updated CORS middleware to include CloudFront domain
- Enhanced CORS header handling

### Step 2: Deploy API Gateway (Optional)
If you want to update the API Gateway Terraform:

```powershell
cd backend/infra/terraform2/stacks/apigateway
terraform plan
terraform apply
```

**Changes in API Gateway:**
- Updated OPTIONS integration response to use `'*'` for CORS

## Verification

After deploying the backend:

1. **Test OPTIONS request:**
   ```bash
   curl -X OPTIONS https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/waitlist/subscribe \
     -H "Origin: https://d1of22l34nde2a.cloudfront.net" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type,x-api-key" \
     -v
   ```

   Should return:
   - Status: 200
   - Headers: `Access-Control-Allow-Origin: *`
   - Headers: `Access-Control-Allow-Methods: POST, OPTIONS`

2. **Test the form:**
   - Open: `https://www.goalsguild.com`
   - Submit waitlist form
   - Check browser console - should see success, no CORS errors

## Current Status

- ✅ **Frontend**: Deployed and working
- ✅ **API Gateway**: Configured (may need redeploy)
- ⚠️ **Backend Lambda**: Code updated, **needs deployment**

## Quick Test (Before Full Deploy)

You can test if the backend OPTIONS handler works by checking the Lambda function directly, but the easiest way is to deploy and test the form.

## Expected Behavior After Deployment

1. Browser sends OPTIONS preflight request
2. API Gateway or Lambda returns CORS headers
3. Browser sends POST request
4. Lambda processes and returns response with CORS headers
5. Form submission succeeds ✅

The main fix is in the **backend Lambda function** - it needs to be deployed for CORS to work properly.















