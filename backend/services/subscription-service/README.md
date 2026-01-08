# Subscription Service

Subscription management service for GoalsGuild with Stripe integration.

## Features

- Subscription management (INITIATE, JOURNEYMAN, SAGE, GUILDMASTER tiers)
- Credit system for premium features
- Founder pass support (lifetime access)
- Stripe webhook processing
- Cognito group management (for Cognito users)
- Provider-agnostic (supports both local and Cognito users)

## Development Mode

In development environment, the service automatically uses a **mock Stripe client** when `STRIPE_SECRET_KEY` is not set. This allows development without requiring real Stripe API keys.

### Mock Mode Features

- Automatic checkout session creation (simulated)
- Auto-completed payments
- Mock webhook events (no signature verification required)
- Mock billing portal URLs
- All subscriptions succeed immediately in dev

### Using Mock Mode

1. Set `ENVIRONMENT=dev` (or leave unset, defaults to "dev")
2. Do NOT set `STRIPE_SECRET_KEY` environment variable
3. The service will automatically use mock Stripe

### Mock Webhook Testing

In dev mode, you can send mock webhook events to test subscription flows:

```bash
# Example: Checkout session completed
curl -X POST http://localhost:8000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "customer": "cus_test_123",
        "mode": "subscription",
        "metadata": {
          "user_id": "user-123",
          "plan_tier": "INITIATE"
        }
      }
    }
  }'
```

## Production Mode

For production:

1. Set `ENVIRONMENT=prod`
2. Set `STRIPE_SECRET_KEY` in SSM Parameter Store or environment
3. Set `STRIPE_WEBHOOK_SECRET` in SSM Parameter Store or environment
4. Configure Stripe webhook endpoint to point to your API Gateway URL

## Configuration

All configuration is loaded from:
1. SSM Parameter Store (production)
2. Environment variables (development/testing)
3. Default values (fallback)

Required SSM Parameters:
- `/goalsguild/subscription-service/STRIPE_SECRET_KEY`
- `/goalsguild/subscription-service/STRIPE_WEBHOOK_SECRET`
- `/goalsguild/subscription-service/STRIPE_PUBLISHABLE_KEY`
- `/goalsguild/cognito/user_pool_id`
- `/goalsguild/user-service/JWT_SECRET`

## API Endpoints

- `GET /health` - Health check
- `GET /subscriptions/current` - Get current subscription
- `POST /subscriptions/create-checkout` - Create checkout session
- `POST /subscriptions/cancel` - Cancel subscription
- `GET /subscriptions/portal` - Get billing portal URL
- `GET /credits/balance` - Get credit balance
- `POST /credits/topup` - Top up credits
- `POST /webhooks/stripe` - Stripe webhook handler

## Environment Variables

- `ENVIRONMENT` - Environment name (dev/staging/prod)
- `CORE_TABLE` - DynamoDB table name (default: "gg_core")
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_REGION` - AWS region for Cognito
- `STRIPE_SECRET_KEY` - Stripe secret key (optional in dev)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional in dev)
- `FRONTEND_BASE_URL` - Frontend URL for redirects
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

