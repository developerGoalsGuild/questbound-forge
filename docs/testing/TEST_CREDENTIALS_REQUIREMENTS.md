# Test Credentials Requirements

## Issue: "Invalid credentials" Error

If you see the error `Login failed: Invalid credentials` when running the comprehensive frontend integration tests, it means the credentials in your `.env.test` file are incorrect or the test user doesn't exist.

## Solution

### Step 1: Verify Test User Exists

Ensure you have a valid test user account in your system. The user must:
- Exist in the user database
- Be active (not disabled or deleted)
- Have the correct email and password

### Step 2: Update `.env.test` File

Edit `apps/frontend/.env.test` with the correct credentials:

```bash
cd apps/frontend
nano .env.test
```

Update the credentials:
```env
TEST_USER_EMAIL=your-actual-test-user@example.com
TEST_USER_PASSWORD=your-actual-password
```

### Step 3: Verify Credentials Work Manually

Test the credentials manually by:
1. Starting the frontend server: `npm run dev`
2. Opening http://localhost:8080/login
3. Logging in with the credentials from `.env.test`
4. If login fails, the credentials are incorrect

### Step 4: Create Test User (If Needed)

If you don't have a test user, create one:

1. **Via Signup Page:**
   - Go to http://localhost:8080/signup/LocalSignUp
   - Create a new account with test credentials
   - Use these credentials in `.env.test`

2. **Via API (if available):**
   ```bash
   curl -X POST https://your-api-gateway-url/users/signup \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!",
       "name": "Test User"
     }'
   ```

3. **Via Database (if you have direct access):**
   - Create user record directly in DynamoDB or your user database

## Test Behavior

The comprehensive test suite will:
- ✅ **Pass** all public page tests (even without valid credentials)
- ❌ **Fail** authentication tests if credentials are invalid
- ⏭️ **Skip** authenticated page tests if authentication fails (graceful degradation)

## Troubleshooting

### Error: "Invalid credentials"
- **Cause**: Wrong email/password or user doesn't exist
- **Fix**: Update `.env.test` with correct credentials

### Error: "Login failed - still on login page"
- **Cause**: API endpoint not accessible or network issue
- **Fix**: 
  - Verify API Gateway is running
  - Check `VITE_API_GATEWAY_URL` in `.env.test`
  - Check network connectivity

### Error: "Dashboard requires authentication"
- **Cause**: Authentication failed, so protected pages redirect to login
- **Fix**: Fix authentication first (see above)

## Best Practices

1. **Use a Dedicated Test User**: Create a user specifically for testing
2. **Keep Credentials Secure**: Never commit `.env.test` to git (it's in `.gitignore`)
3. **Document Test User**: Note the test user details in your team's documentation
4. **Regular Updates**: Update credentials if the test user password changes

## Alternative: Skip Authentication Tests

If you want to test only public pages and skip authentication:

```bash
# Run only public page tests
npx mocha ../../tests/e2e/selenium/frontend/comprehensive-frontend-integration.test.cjs --grep "Public Pages"
```

Or modify the test file to skip authentication tests when credentials are invalid (already implemented with `this.skip()`).
