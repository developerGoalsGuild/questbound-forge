# Next Steps: Testing Stripe Integration

You've already set up the price IDs in your frontend `.env.development` file. Here are the next steps to get Stripe working in development.

## ✅ What You've Done

- Set up Stripe Price IDs in `apps/frontend/.env.development`

## 📋 Next Steps

### Step 1: Configure Backend Subscription Service

The backend subscription service needs:
1. **Stripe Secret Key** (to use real Stripe API instead of mock)
2. **Price IDs** (same as frontend, but in backend environment)
3. **Optional: Webhook Secret** (for webhook testing)

#### Option A: Create `.env` file in subscription service

Create `backend/services/subscription-service/.env`:

```bash
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # Optional

# Price IDs (same as frontend)
STRIPE_PRICE_ID_INITIATE=price_xxxxx
STRIPE_PRICE_ID_JOURNEYMAN=price_xxxxx
STRIPE_PRICE_ID_SAGE=price_1Sr3wCIRfAuGCDH6YFqvlVNB  # Your SAGE price ID
STRIPE_PRICE_ID_GUILDMASTER=price_xxxxx  # Optional

# Environment
ENVIRONMENT=dev

# Other required settings
CORE_TABLE=gg_core
JWT_SECRET=your-jwt-secret  # Or get from SSM
ALLOWED_ORIGINS=http://localhost:8080
```

**Note**: The backend looks for environment variables with pattern `stripe_price_id_{tier}` (lowercase), but you can also set them as `STRIPE_PRICE_ID_{TIER}` and the code will handle it.

#### Option B: Use SSM Parameters (if already set)

If you've already set SSM parameters, just make sure AWS credentials are configured:

```bash
aws configure
```

The service will automatically read from SSM.

### Step 2: Get Your Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy:
   - **Secret key** (starts with `sk_test_...`)
   - **Publishable key** (starts with `pk_test_...`) - for frontend if needed

### Step 3: Start the Services

#### Terminal 1: Start Subscription Service

```bash
cd backend/services/subscription-service

# If using .env file
export $(cat .env | xargs)  # Load .env variables
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or use the start script (PowerShell)
./start-local.ps1
```

**Verify it's running:**
```bash
curl http://localhost:8001/health
# Should return: {"ok": true, "service": "subscription-service"}
```

#### Terminal 2: Start Frontend

```bash
cd apps/frontend
npm run dev
```

**Verify it's running:**
- Open http://localhost:8080

### Step 4: Test the Subscription Flow

1. **Navigate to signup or subscription page**
   - Signup: http://localhost:8080/signup
   - Or subscription plans: http://localhost:8080/subscription

2. **Select a paid plan** (e.g., SAGE)

3. **Complete checkout**:
   - You'll be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Verify success**:
   - Should redirect to success page
   - Check Stripe Dashboard → Customers (should see new customer)
   - Check Stripe Dashboard → Subscriptions (should see active subscription)

### Step 5: Verify Configuration

#### Check Backend Logs

When you start the subscription service, you should see:

**If using real Stripe:**
```
Initialized StripeClient (not in mock mode)
```

**If still in mock mode:**
```
Using mock Stripe client for development
Initialized StripeClient in mock mode for development
```

**To use real Stripe**, make sure `STRIPE_SECRET_KEY` is set!

#### Check Frontend Console

Open browser DevTools → Console, and look for:
- Checkout session creation
- Redirect to Stripe
- Success/error messages

## 🔍 Troubleshooting

### Issue: Service still uses mock mode

**Solution**: Make sure `STRIPE_SECRET_KEY` is set:
```bash
# Check if it's set
echo $STRIPE_SECRET_KEY

# If not, set it
export STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Issue: Price ID not found error

**Solution**: 
1. Verify price IDs match between frontend and backend
2. Check price IDs exist in Stripe Dashboard
3. Make sure you're using test mode price IDs (not live mode)

### Issue: Checkout session creation fails

**Solution**:
1. Check backend logs for errors
2. Verify `STRIPE_SECRET_KEY` is valid
3. Check Stripe Dashboard → Logs for API errors
4. Verify price ID exists and is active

### Issue: Can't connect to subscription service

**Solution**:
1. Verify service is running on port 8001
2. Check frontend proxy configuration in `vite.config.ts`
3. Check CORS settings in subscription service

## 📝 Quick Checklist

- [ ] Stripe Secret Key set in backend (`.env` or SSM)
- [ ] Price IDs set in backend (same as frontend)
- [ ] Subscription service running on port 8001
- [ ] Frontend running on port 8080
- [ ] Tested checkout flow with test card
- [ ] Verified subscription created in Stripe Dashboard
- [ ] Checked backend logs (not in mock mode)

## 🎯 What to Test

1. **Signup with paid plan**:
   - Select SAGE plan during signup
   - Complete checkout
   - Verify subscription created

2. **Direct subscription purchase**:
   - Go to subscription page
   - Select a plan
   - Complete checkout

3. **Subscription management**:
   - Access billing portal
   - View current subscription
   - Test cancellation (if implemented)

## 📚 Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- Full setup guide: `docs/deployment/SETUP_STRIPE_TEST_ACCOUNT.md`

---

**You're all set!** Start the services and test the checkout flow. 🚀
