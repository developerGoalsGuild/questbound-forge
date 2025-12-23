# Testing Mock Stripe Subscription Flow

This guide explains how to test the subscription checkout flow using the mocked Stripe implementation.

## Prerequisites

1. **Backend Services Running:**
   - User service (for signup)
   - Subscription service (for checkout)
   - Ensure `ENVIRONMENT=dev` and `STRIPE_SECRET_KEY` is NOT set (to use mock mode)

2. **Frontend Running:**
   - Development server on `http://localhost:8080` (or your configured port)

## Test Flow

### Step 1: Start Signup Process

1. Navigate to the signup page: `http://localhost:8080/signup`
2. Fill in the signup form:
   - Email: `test@example.com`
   - Full Name: `Test User`
   - Password: `Test123!@#`
   - Confirm Password: `Test123!@#`
   - Nickname: `testuser`
   - Birth Date: `1990-01-01`
   - Country: Select any country
   - Other fields as needed

### Step 2: Select Subscription Plan

1. Scroll down to the **"Choose a Subscription Plan"** section
2. You should see tabs: **Free**, **Initiate**, **Journeyman**, **Sage**, **Guildmaster**
3. Click on any paid plan tab (e.g., **Journeyman**)
4. The plan details should display in the tab content
5. You should see a "Selected Plan" badge

### Step 3: Submit Signup

1. Click the **"Create Account"** button
2. The form should submit and create the user account
3. If email confirmation is disabled, the user will be automatically logged in
4. **After login, you should be automatically redirected to the mock Stripe checkout**

### Step 4: Mock Checkout Redirect

1. The mock Stripe checkout will immediately redirect you to:
   ```
   /subscription/success?session_id=cs_mock_XXXXXXXX&mock=true
   ```
2. You should see the **CheckoutSuccess** page with:
   - Success message
   - Session ID displayed
   - Loading state while verifying subscription

### Step 5: Verify Subscription

1. The page should show:
   - ✅ "Payment Successful!" message
   - "Your subscription has been successfully activated!" alert
   - Buttons to "Manage Subscription" or "Go to Dashboard"

## Expected Behavior

### Mock Stripe Behavior

In development mode (when `ENVIRONMENT=dev` and `STRIPE_SECRET_KEY` is not set):

1. **No Real Payment Required** - The checkout is simulated
2. **Immediate Success** - No payment form, redirects directly to success page
3. **Auto-Created Subscription** - The mock automatically creates a subscription record
4. **Session ID Format** - Mock session IDs start with `cs_mock_`

### Console Logs

You should see logs like:
```
[INFO] Created mock checkout session cs_mock_... for customer cus_mock_...
[INFO] Mock checkout URL: http://localhost:8080/subscription/success?session_id=cs_mock_...&mock=true
[INFO] Auto-created mock subscription sub_mock_... for customer cus_mock_... (tier=JOURNEYMAN)
```

### Backend Logs

In the subscription service logs, you should see:
```
Using mock Stripe client for development
Initialized StripeClient in mock mode for development
Created checkout session cs_mock_... for user ...
```

## Troubleshooting

### Issue: Not Redirecting to Checkout

**Possible Causes:**
1. Email confirmation is enabled - checkout only happens when email confirmation is disabled
2. Checkout session creation failed - check browser console for errors
3. User not logged in - ensure auto-login succeeded

**Solution:**
- Check browser console for errors
- Verify `emailConfirmationEnabled` is `false` in frontend config
- Check network tab for failed API calls

### Issue: 403 Error on Checkout Endpoint

**Possible Causes:**
1. User not authenticated when calling checkout endpoint
2. Missing API key in request headers

**Solution:**
- Ensure user is logged in before checkout redirect
- Check that `getAuthHeaders()` includes the API key

### Issue: Subscription Not Created

**Possible Causes:**
1. Webhook handler not processing mock events
2. Database connection issues

**Solution:**
- Check subscription service logs
- Verify DynamoDB table is accessible
- Check that mock subscription creation is working

## Testing Different Scenarios

### Test 1: Free Tier Signup
1. Select **Free** tab during signup
2. Submit form
3. Should NOT redirect to checkout
4. Should go directly to dashboard

### Test 2: Paid Tier Signup
1. Select any paid tier (Initiate, Journeyman, Sage, Guildmaster)
2. Submit form
3. Should redirect to mock checkout
4. Should redirect to success page
5. Subscription should be active

### Test 3: Cancel Checkout
1. Select paid tier and submit
2. If cancel URL is reached, should redirect to dashboard
3. User should still be created but without subscription

## Verification Checklist

- [ ] Signup form displays subscription tabs
- [ ] Can select different subscription tiers
- [ ] Form submission works with selected tier
- [ ] Auto-login succeeds after signup
- [ ] Redirects to mock checkout URL
- [ ] Checkout success page displays correctly
- [ ] Subscription is created in database
- [ ] User can access subscription management page

## Next Steps

After successful testing:
1. Verify subscription appears in subscription management page
2. Test subscription cancellation flow
3. Test subscription upgrade/downgrade
4. Verify credits are granted based on tier














