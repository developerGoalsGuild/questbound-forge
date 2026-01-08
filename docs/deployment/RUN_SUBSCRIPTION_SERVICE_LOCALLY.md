# Running Subscription Service Locally

## Quick Start

To test the subscription flow locally, you need to run the subscription service on port 8001.

### Option 1: Using Python directly (Recommended for quick testing)

1. **Navigate to the subscription service directory:**
   ```powershell
   cd backend/services/subscription-service
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```powershell
   $env:ENVIRONMENT = "dev"
   $env:CORE_TABLE = "gg_core"
   $env:COGNITO_USER_POOL_ID = "your-user-pool-id"  # Optional for local testing
   $env:COGNITO_REGION = "us-east-2"
   $env:ALLOWED_ORIGINS = "http://localhost:8080"
   # Do NOT set STRIPE_SECRET_KEY - this enables mock mode
   ```

4. **Run the service:**
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

### Option 2: Using Docker

1. **Build and run:**
   ```powershell
   docker build -t subscription-service:local -f backend/services/subscription-service/Dockerfile .
   docker run -p 8001:8080 `
     -e ENVIRONMENT=dev `
     -e CORE_TABLE=gg_core `
     -e ALLOWED_ORIGINS=http://localhost:8080 `
     subscription-service:local
   ```

## Verify Service is Running

Check the health endpoint:
```powershell
curl http://localhost:8001/health
```

Should return:
```json
{"ok": true, "service": "subscription-service"}
```

## Testing the Flow

1. **Start the subscription service** (port 8001)
2. **Start the frontend** (port 8080)
3. **Navigate to signup or profile edit**
4. **Select a subscription plan**
5. **The frontend will proxy requests to `http://localhost:8001`**

## Mock Stripe Mode

When `ENVIRONMENT=dev` and `STRIPE_SECRET_KEY` is NOT set, the service automatically uses mock Stripe:
- Checkout sessions are created instantly
- Payments are auto-completed
- No real Stripe API calls are made

## Troubleshooting

### Port Already in Use
If port 8001 is in use, change it:
1. Update `frontend/vite.config.ts` - change `8001` to your port
2. Update the service command - change `--port 8001` to your port

### CORS Errors
Make sure `ALLOWED_ORIGINS` includes `http://localhost:8080`

### Authentication Errors
The subscription service requires authentication. Make sure you're logged in before testing subscription features.















