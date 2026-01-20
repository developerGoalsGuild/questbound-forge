# SSM Parameters vs Environment Variables for Local Development

## Quick Answer

**No, you don't need to deploy the subscription-service to use SSM parameters.** The service can read from SSM Parameter Store when running locally, as long as you have AWS credentials configured.

## How Configuration Works

The subscription service reads configuration in this priority order:

1. **SSM Parameter Store** (if AWS credentials are configured)
2. **Environment Variables** (fallback)
3. **Defaults/Mock Mode** (if nothing is set)

## Option 1: Use SSM Parameters (No Deployment Needed)

### Prerequisites
- AWS credentials configured locally
- SSM parameters already set in AWS

### Steps

1. **Configure AWS credentials** (if not already done):
   ```bash
   aws configure
   # Enter:
   # - AWS Access Key ID
   # - AWS Secret Access Key  
   # - Default region (e.g., us-east-1)
   # - Default output format (json)
   ```

2. **Verify SSM parameters exist**:
   ```bash
   aws ssm get-parameter --name "/goalsguild/subscription-service/STRIPE_SECRET_KEY" --with-decryption
   ```

3. **Run the service locally**:
   ```bash
   cd backend/services/subscription-service
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

4. **The service will automatically**:
   - Read from SSM Parameter Store
   - Use real Stripe API (if `STRIPE_SECRET_KEY` is found)
   - Fall back to environment variables if SSM read fails

### Advantages
- ✅ No need to manage local environment variables
- ✅ Centralized configuration in AWS
- ✅ Same configuration as deployed service
- ✅ Easy to switch between environments

### Disadvantages
- ❌ Requires AWS credentials configured locally
- ❌ Requires network access to AWS
- ❌ Slightly slower (SSM API calls)

---

## Option 2: Use Environment Variables (Simpler for Local Dev)

### Steps

1. **Set environment variables**:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_xxxxx
   export STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   export STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   export ENVIRONMENT=dev
   export CORE_TABLE=gg_core
   ```

   Or use a `.env` file:
   ```bash
   # .env
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ENVIRONMENT=dev
   ```

2. **Run the service**:
   ```bash
   cd backend/services/subscription-service
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

3. **The service will**:
   - Try SSM first (will fail silently if no AWS creds)
   - Use environment variables as fallback
   - Use real Stripe API (if `STRIPE_SECRET_KEY` is set)

### Advantages
- ✅ No AWS credentials needed
- ✅ Works offline
- ✅ Faster (no API calls)
- ✅ Easy to test different configurations

### Disadvantages
- ❌ Need to manage environment variables
- ❌ Different from deployed configuration
- ❌ Risk of committing secrets to git

---

## Which Should You Use?

### Use SSM Parameters If:
- ✅ You already have AWS credentials configured
- ✅ You want to match production configuration
- ✅ You're testing with the same values as deployed service
- ✅ You want centralized configuration management

### Use Environment Variables If:
- ✅ You don't have AWS credentials set up
- ✅ You want faster local development
- ✅ You're testing different configurations
- ✅ You want to work offline

---

## Testing Both Approaches

### Test SSM Configuration
```bash
# 1. Set up AWS credentials
aws configure

# 2. Verify SSM parameter exists
aws ssm get-parameter --name "/goalsguild/subscription-service/STRIPE_SECRET_KEY" --with-decryption

# 3. Run service (no env vars needed)
cd backend/services/subscription-service
uvicorn app.main:app --host 0.0.0.0 --port 8001

# 4. Check logs - should show it's using SSM
# Look for: "Initialized StripeClient" (not mock mode)
```

### Test Environment Variables
```bash
# 1. Unset AWS credentials (optional)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY

# 2. Set environment variables
export STRIPE_SECRET_KEY=sk_test_xxxxx
export ENVIRONMENT=dev

# 3. Run service
cd backend/services/subscription-service
uvicorn app.main:app --host 0.0.0.0 --port 8001

# 4. Check logs - should show it's using env vars
```

---

## Troubleshooting

### Issue: Service uses mock mode even though SSM parameter is set

**Possible causes:**
1. AWS credentials not configured
2. Wrong AWS region
3. SSM parameter doesn't exist
4. No permission to read SSM

**Solution:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check SSM parameter exists
aws ssm get-parameter --name "/goalsguild/subscription-service/STRIPE_SECRET_KEY"

# Check service logs for SSM errors
# Look for: "ClientError" or "NoCredentialsError"
```

### Issue: Service can't read from SSM

**Solution:**
- Use environment variables instead (Option 2)
- Or fix AWS credentials:
  ```bash
  aws configure
  ```

### Issue: Want to override SSM with local values

**Solution:**
- Set environment variables (they take precedence in some cases)
- Or temporarily remove SSM parameters
- Or use a different parameter path for local dev

---

## Recommended Approach for Development

**For quick local testing:**
- Use environment variables (Option 2)
- Faster, simpler, no AWS setup needed

**For production-like testing:**
- Use SSM parameters (Option 1)
- Matches deployed configuration
- Tests the full configuration flow

---

## Summary

| Feature | SSM Parameters | Environment Variables |
|---------|---------------|----------------------|
| Requires AWS credentials | ✅ Yes | ❌ No |
| Requires network access | ✅ Yes | ❌ No |
| Matches production config | ✅ Yes | ❌ No |
| Easy to set up | ❌ No | ✅ Yes |
| Fast startup | ❌ No | ✅ Yes |
| Centralized config | ✅ Yes | ❌ No |

**Bottom line:** You can use either approach without deploying the service. Choose based on your needs and setup.
