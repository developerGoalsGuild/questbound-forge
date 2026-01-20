# Setting Up Stripe Test Account for Development

This guide walks you through setting up a Stripe test account for development when users choose paid subscription plans.

## Prerequisites

- A Stripe account (sign up at https://stripe.com if you don't have one)
- Access to Stripe Dashboard
- Backend subscription service codebase
- Environment variable access (SSM Parameter Store or local `.env`)

---

## Step 1: Create Stripe Test Account

1. **Sign up for Stripe** (if you don't have an account):
   - Go to https://stripe.com
   - Click "Start now" or "Sign in"
   - Create a new account or sign in

2. **Access Test Mode**:
   - In Stripe Dashboard, toggle "Test mode" (top right)
   - You'll see "TEST MODE" indicator when enabled
   - All operations in test mode use test data and won't charge real cards

3. **Get Your API Keys**:
   - Navigate to **Developers** → **API keys**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`) - Safe to expose in frontend
     - **Secret key** (starts with `sk_test_...`) - Keep secure, backend only
   - Copy both keys (you'll need them later)

---

## Step 2: Create Products and Prices

You need to create products and prices for each subscription tier in Stripe.

### 2.1 Create Products

1. Go to **Products** → **Add product**

2. **Create INITIATE Product**:
   - **Name**: `GoalsGuild Initiate`
   - **Description**: `For new explorers joining the Guild - Build consistency and awaken purpose`
   - **Pricing model**: Recurring
   - **Price**: `$1.00 USD`
   - **Billing period**: Monthly
   - **Save product**
   - **Copy the Price ID** (starts with `price_...`)

3. **Create JOURNEYMAN Product**:
   - **Name**: `GoalsGuild Journeyman`
   - **Description**: `For active creators building discipline and momentum`
   - **Pricing model**: Recurring
   - **Price**: `$15.00 USD`
   - **Billing period**: Monthly
   - **Save product**
   - **Copy the Price ID**

4. **Create SAGE Product**:
   - **Name**: `GoalsGuild Radiant Sage`
   - **Description**: `For mentors, community builders, or those seeking mastery`
   - **Pricing model**: Recurring
   - **Price**: `$49.00 USD`
   - **Billing period**: Monthly
   - **Save product**
   - **Copy the Price ID**

5. **Create GUILDMASTER Product** (Optional - Custom Pricing):
   - **Name**: `GoalsGuild Guildmaster`
   - **Description**: `For teams, organizations, and accelerators`
   - **Pricing model**: Recurring
   - **Price**: Custom (you can set a placeholder like `$199.00 USD`)
   - **Billing period**: Monthly
   - **Save product**
   - **Copy the Price ID**

### 2.2 Create Founder Pass Products (One-time Payments)

1. **Create Founding Member Pass**:
   - **Name**: `GoalsGuild Founding Member Pass`
   - **Description**: `Lifetime Radiant Sage access + golden badge`
   - **Pricing model**: One-time
   - **Price**: `$99.00 USD`
   - **Save product**
   - **Copy the Price ID**

2. **Create Guild Builder Pass**:
   - **Name**: `GoalsGuild Guild Builder Pass`
   - **Description**: `Lifetime Guildmaster workspace + Discord access + beta tools`
   - **Pricing model**: One-time
   - **Price**: `$199.00 USD`
   - **Save product**
   - **Copy the Price ID**

### 2.3 Document Your Price IDs

Create a reference document with all your Price IDs:

```
INITIATE_PRICE_ID=price_xxxxx
JOURNEYMAN_PRICE_ID=price_xxxxx
SAGE_PRICE_ID=price_xxxxx
GUILDMASTER_PRICE_ID=price_xxxxx
FOUNDING_MEMBER_PRICE_ID=price_xxxxx
GUILD_BUILDER_PRICE_ID=price_xxxxx
```

---

## Step 3: Configure Environment Variables

### 3.1 For Local Development

Create or update your `.env` file or environment variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Price IDs (optional - can be set in code or environment)
STRIPE_PRICE_ID_INITIATE=price_xxxxx
STRIPE_PRICE_ID_JOURNEYMAN=price_xxxxx
STRIPE_PRICE_ID_SAGE=price_xxxxx
STRIPE_PRICE_ID_GUILDMASTER=price_xxxxx

# Environment
ENVIRONMENT=dev  # or staging
```

**Important**: Setting `STRIPE_SECRET_KEY` will disable mock mode and use real Stripe API.

### 3.2 For AWS (SSM Parameter Store)

If deploying to AWS, store keys in SSM Parameter Store:

```bash
# Using AWS CLI
aws ssm put-parameter \
  --name "/goalsguild/subscription-service/STRIPE_SECRET_KEY" \
  --value "sk_test_xxxxxxxxxxxxxxxxxxxxx" \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/goalsguild/subscription-service/STRIPE_PUBLISHABLE_KEY" \
  --value "pk_test_xxxxxxxxxxxxxxxxxxxxx" \
  --type "String" \
  --overwrite
```

### 3.3 Update Subscription Service Settings

The service automatically reads from:
1. SSM Parameter Store (if available)
2. Environment variables
3. Falls back to mock mode if not set

No code changes needed - just set the environment variables!

---

## Step 4: Set Up Webhooks (For Production-like Testing)

Webhooks allow Stripe to notify your service about subscription events (payment succeeded, subscription canceled, etc.).

### 4.1 Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: 
   - Local: Use a tool like [ngrok](https://ngrok.com) to expose your local server
   - Example: `https://your-ngrok-url.ngrok.io/subscriptions/webhooks/stripe`
   - AWS: Your API Gateway endpoint + `/subscriptions/webhooks/stripe`
4. **Description**: `GoalsGuild Subscription Webhooks (Test)`
5. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**

### 4.2 Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. Find **Signing secret** section
3. Click **Reveal** and copy the secret (starts with `whsec_...`)
4. Store it securely:
   ```bash
   # Local
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   
   # AWS SSM
   aws ssm put-parameter \
     --name "/goalsguild/subscription-service/STRIPE_WEBHOOK_SECRET" \
     --value "whsec_xxxxxxxxxxxxxxxxxxxxx" \
     --type "SecureString" \
     --overwrite
   ```

### 4.3 Test Webhooks Locally with ngrok

1. **Install ngrok**:
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your subscription service**:
   ```bash
   cd backend/services/subscription-service
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

3. **Expose with ngrok**:
   ```bash
   ngrok http 8001
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update Stripe webhook endpoint**:
   - URL: `https://abc123.ngrok.io/subscriptions/webhooks/stripe`
   - Save

6. **Test webhook**:
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click **Send test webhook**
   - Select event type (e.g., `checkout.session.completed`)
   - Click **Send test webhook**
   - Check your service logs for the webhook event

---

## Step 5: Update Code to Use Price IDs

### 5.1 Update Stripe Client Configuration

The price IDs can be configured in several ways:

**Option 1: Environment Variables** (Recommended)
```bash
STRIPE_PRICE_ID_INITIATE=price_xxxxx
STRIPE_PRICE_ID_JOURNEYMAN=price_xxxxx
STRIPE_PRICE_ID_SAGE=price_xxxxx
```

**Option 2: Update `stripe_client.py`** (if needed):
```python
TIER_TO_PRICE_ID = {
    "INITIATE": os.getenv("STRIPE_PRICE_ID_INITIATE", "price_xxxxx"),
    "JOURNEYMAN": os.getenv("STRIPE_PRICE_ID_JOURNEYMAN", "price_xxxxx"),
    "SAGE": os.getenv("STRIPE_PRICE_ID_SAGE", "price_xxxxx"),
    "GUILDMASTER": os.getenv("STRIPE_PRICE_ID_GUILDMASTER", "price_xxxxx"),
}
```

### 5.2 Update Subscription Service Endpoints

Make sure the subscription service endpoints are implemented to use the Stripe client. Check `backend/services/subscription-service/app/main.py` and ensure endpoints call the `StripeClient` methods.

---

## Step 6: Test the Flow

### 6.1 Test Cards

Stripe provides test card numbers for testing:

**Successful Payment**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment**:
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure)**:
- Card: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

### 6.2 Test Subscription Flow

1. **Start your services**:
   ```bash
   # Terminal 1: Subscription Service
   cd backend/services/subscription-service
   export STRIPE_SECRET_KEY=sk_test_xxxxx
   export ENVIRONMENT=dev
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   
   # Terminal 2: Frontend
   cd apps/frontend
   npm run dev
   ```

2. **Sign up with a paid plan**:
   - Navigate to signup page
   - Select a paid tier (e.g., Journeyman)
   - Fill in form and submit

3. **Complete checkout**:
   - You'll be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment

4. **Verify subscription**:
   - Check Stripe Dashboard → Customers (should see new customer)
   - Check Stripe Dashboard → Subscriptions (should see active subscription)
   - Check your database (DynamoDB) for subscription record

### 6.3 Verify Webhook Events

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Recent events** - you should see events like:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`

---

## Step 7: Frontend Configuration (Optional)

If you want to use Stripe Elements or show the publishable key in frontend:

1. **Add publishable key to frontend**:
   ```typescript
   // In your frontend config
   const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_xxxxx';
   ```

2. **Update environment variables**:
   ```bash
   # .env.local
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Troubleshooting

### Issue: "Stripe secret key is required" Error

**Solution**: Make sure `STRIPE_SECRET_KEY` is set:
```bash
export STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Issue: Webhook Signature Verification Fails

**Solution**: 
1. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
2. Verify the webhook secret matches the endpoint in Stripe Dashboard
3. Ensure the raw request body is used (not parsed JSON) for signature verification

### Issue: Price ID Not Found

**Solution**:
1. Verify price IDs are correct in Stripe Dashboard
2. Check environment variables are set
3. Ensure price IDs are for the correct Stripe account (test vs live mode)

### Issue: Checkout Session Creation Fails

**Solution**:
1. Check Stripe API key is valid (test mode key for test mode)
2. Verify price ID exists and is active
3. Check customer creation succeeds
4. Review Stripe Dashboard → Logs for API errors

### Issue: Subscription Not Created in Database

**Solution**:
1. Verify webhook endpoint is configured correctly
2. Check webhook events are being received (Stripe Dashboard → Webhooks)
3. Review subscription service logs for webhook processing errors
4. Ensure DynamoDB permissions are correct

---

## Security Best Practices

1. **Never commit API keys to git**:
   - Use `.gitignore` for `.env` files
   - Use SSM Parameter Store for AWS deployments
   - Use environment variables, not hardcoded values

2. **Use test keys for development**:
   - Always use `sk_test_...` keys in development
   - Never use live keys (`sk_live_...`) in test environments

3. **Rotate keys regularly**:
   - Rotate test keys if they're exposed
   - Use different keys for different environments

4. **Verify webhook signatures**:
   - Always verify webhook signatures in production
   - Use the webhook secret from Stripe Dashboard

---

## Next Steps

After setting up test mode:

1. **Test all subscription tiers**:
   - Test INITIATE ($1/month)
   - Test JOURNEYMAN ($15/month)
   - Test SAGE ($49/month)
   - Test founder passes (one-time payments)

2. **Test subscription management**:
   - Test subscription cancellation
   - Test subscription upgrades/downgrades
   - Test billing portal access

3. **Test webhook events**:
   - Test payment success
   - Test payment failure
   - Test subscription cancellation
   - Test subscription renewal

4. **Prepare for production**:
   - Set up live mode Stripe account
   - Create production products and prices
   - Configure production webhooks
   - Set up monitoring and alerts

---

## Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [ngrok Documentation](https://ngrok.com/docs)

---

## Quick Reference Checklist

- [ ] Created Stripe test account
- [ ] Toggled to Test Mode
- [ ] Created products for all subscription tiers
- [ ] Created prices for all products
- [ ] Documented all Price IDs
- [ ] Set `STRIPE_SECRET_KEY` environment variable
- [ ] Set `STRIPE_PUBLISHABLE_KEY` (if needed)
- [ ] Set Price ID environment variables
- [ ] Created webhook endpoint
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Tested checkout flow with test card
- [ ] Verified subscription creation in Stripe Dashboard
- [ ] Verified subscription record in database
- [ ] Tested webhook events
- [ ] Tested subscription cancellation
- [ ] Tested billing portal

---

*Last updated: 2025-01-XX*
