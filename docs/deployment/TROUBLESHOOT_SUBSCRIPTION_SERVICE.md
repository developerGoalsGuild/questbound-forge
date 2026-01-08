# Troubleshooting Subscription Service 500 Error

## Common Causes

The 500 Internal Server Error is usually caused by:

1. **Missing JWT Secret** - Required for authentication
2. **Service not running** - Check if service is running on port 8001
3. **Missing environment variables** - Required for local development

## Check Local Service Logs

Since you're running locally (not on AWS), check the **terminal where you started the subscription service** for error messages.

### If Service is Running

Look for error messages in the terminal output. Common errors:

```
ERROR: JWT secret is required
ERROR: Authentication configuration missing
ERROR: Failed to create checkout session
```

### If Service is NOT Running

Start the service with proper logging:

```powershell
cd backend/services/subscription-service

# Set required environment variables
$env:ENVIRONMENT = "dev"
$env:JWT_SECRET = "your-jwt-secret-here"  # Must match user-service JWT secret
$env:JWT_AUDIENCE = "api://default"
$env:JWT_ISSUER = "https://auth.local"
$env:ALLOWED_ORIGINS = "http://localhost:8080"
$env:CORE_TABLE = "gg_core"

# Do NOT set STRIPE_SECRET_KEY (enables mock mode)

# Run with verbose logging
$env:LOG_LEVEL = "DEBUG"
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --log-level debug
```

## Get JWT Secret from User Service

The subscription service needs the **same JWT secret** as the user service. Check your user service configuration:

```powershell
# Check user service environment or config
# The JWT_SECRET should be the same value used by user-service
```

If you don't have it, you can use a temporary secret for local testing:

```powershell
$env:JWT_SECRET = "dev-secret-key-for-local-testing-only"
```

## Verify Service is Running

1. **Check health endpoint:**
   ```powershell
   curl http://localhost:8001/health
   ```
   Should return: `{"ok": true, "service": "subscription-service"}`

2. **Check if port is in use:**
   ```powershell
   netstat -ano | findstr :8001
   ```

## Test Authentication

Test if authentication works:

```powershell
# Get your auth token from browser localStorage
# Then test:
$token = "your-jwt-token-here"
curl -X GET http://localhost:8001/subscriptions/current `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
```

## Common Fixes

### Fix 1: Missing JWT Secret

```powershell
# Set JWT secret (must match user-service)
$env:JWT_SECRET = "your-secret-here"
```

### Fix 2: Service Not Running

```powershell
# Start the service
cd backend/services/subscription-service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Fix 3: Wrong Port

If port 8001 is in use, change it:
1. Update `frontend/vite.config.ts` - change `8001` to your port
2. Update service command - change `--port 8001` to your port

### Fix 4: CORS Issues

```powershell
$env:ALLOWED_ORIGINS = "http://localhost:8080"
```

## Full Startup Command

```powershell
cd backend/services/subscription-service

# Install dependencies if needed
pip install -r requirements.txt

# Set all required environment variables
$env:ENVIRONMENT = "dev"
$env:JWT_SECRET = "dev-secret-key-for-local-testing"
$env:JWT_AUDIENCE = "api://default"
$env:JWT_ISSUER = "https://auth.local"
$env:ALLOWED_ORIGINS = "http://localhost:8080"
$env:CORE_TABLE = "gg_core"
$env:COGNITO_REGION = "us-east-2"
# Do NOT set STRIPE_SECRET_KEY (enables mock mode)

# Run service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --log-level info
```

## Check Error Details

The service logs will show the exact error. Look for:

- `ERROR: Error creating checkout session: ...` - Shows the actual exception
- `WARNING: auth.jwt_verification_failed` - JWT authentication issue
- `ERROR: Mock Stripe error` - Mock client issue

## Next Steps

1. **Check the terminal** where you're running the subscription service
2. **Look for error messages** - They'll tell you exactly what's wrong
3. **Set missing environment variables** - Especially `JWT_SECRET`
4. **Restart the service** - After setting environment variables















