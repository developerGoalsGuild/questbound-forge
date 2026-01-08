# CORS Error Fix

## Problem
Getting CORS error: `Access to fetch at '...' from origin 'null' has been blocked by CORS policy`

## Root Cause
1. **Origin is 'null'**: This happens when opening HTML files directly (file:// protocol) instead of through a web server
2. **CORS headers missing**: The Lambda function needs to return CORS headers for AWS_PROXY integration

## Solution Applied

### 1. Updated FastAPI CORS Middleware
- Added support for `null` origin (file:// protocol)
- Added CloudFront domains to allowed origins
- Enhanced CORS header handling to ensure headers are always present

### 2. Allowed Origins Now Include:
- CloudFront domain: `https://d1of22l34nde2a.cloudfront.net`
- Custom domains: `https://www.goalsguild.com`, `https://goalsguild.com`
- Local development: `http://localhost:8080`
- Null origin: `null` (for file:// testing)

## Deployment Required

The fix is in the backend code but needs to be deployed:

```powershell
# Deploy the updated user-service
cd backend/services/user-service
# Follow your deployment process to update the Lambda function
```

## Testing

### Option 1: Use Web Server (Recommended)
Instead of opening the HTML file directly, use a local web server:

```powershell
# Using Python
cd LandingPage/src
python -m http.server 8080

# Then open: http://localhost:8080
```

### Option 2: Deploy to S3/CloudFront
Deploy the landing page to S3 and access via CloudFront URL:
- URL: `https://d1of22l34nde2a.cloudfront.net`
- This will have proper origin (not null)

### Option 3: Test with Deployed Version
After deploying the backend fix, test with the deployed CloudFront URL.

## Verification

After deploying the backend fix:

1. Open browser console (F12)
2. Submit the waitlist form
3. Check Network tab - should see:
   - OPTIONS request (preflight) returns 200 with CORS headers
   - POST request succeeds with CORS headers
4. No CORS errors in console

## Expected CORS Headers

The response should include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key
Access-Control-Allow-Credentials: true
```

## If Error Persists

1. **Check backend is deployed**: Verify the updated Lambda function is deployed
2. **Check API Gateway**: Verify CORS is configured in API Gateway
3. **Use proper origin**: Don't use file:// - use a web server or deployed URL
4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
5. **Check Network tab**: Look at the actual request/response headers















