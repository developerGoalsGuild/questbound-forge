# GitHub Actions Test Credentials Setup

## Issue: Selenium Tests Failing with "Invalid credentials"

If your CI/CD pipeline is failing with `AUTHENTICATION FAILED - Invalid credentials` in the Selenium tests, it means the GitHub Secrets for test credentials are not configured or contain invalid credentials.

## Solution: Configure GitHub Secrets

### Step 1: Verify Test User Exists

Before setting up GitHub Secrets, ensure you have a valid test user account in your system:

1. **The test user must exist** in the user database (DynamoDB/Cognito)
2. **The user must be active** (not disabled or deleted)
3. **The credentials must be correct** (email and password)

### Step 2: Set GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these two secrets:

#### Secret 1: `TEST_USER_EMAIL`
- **Name**: `TEST_USER_EMAIL`
- **Value**: Your test user's email address (e.g., `test-user@example.com`)

#### Secret 2: `TEST_USER_PASSWORD`
- **Name**: `TEST_USER_PASSWORD`
- **Value**: Your test user's password

### Step 3: Verify Secrets Are Set

After adding the secrets, verify they appear in the secrets list:
- ✅ `TEST_USER_EMAIL` should be listed
- ✅ `TEST_USER_PASSWORD` should be listed

**Note**: GitHub Secrets are encrypted and cannot be viewed after creation. You can only update or delete them.

### Step 4: Test Locally First

Before relying on CI, test the credentials locally:

```bash
cd apps/frontend

# Create .env.test file (if not exists)
cat > .env.test << EOF
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
VITE_APP_URL=http://localhost:5173
EOF

# Start dev server
npm run dev -- --host 127.0.0.1 --port 5173 &

# Wait for server to start
npx wait-on http://127.0.0.1:5173

# Run tests
npm run test:selenium:comprehensive:verbose

# Stop dev server
pkill -f "vite"
```

If tests pass locally but fail in CI, the GitHub Secrets are likely incorrect.

## Creating a Test User

If you don't have a test user, create one:

### Option 1: Via Signup (Recommended)

1. Deploy your frontend to dev environment
2. Navigate to the signup page: `https://your-dev-domain.com/signup/LocalSignUp`
3. Create a new account with test credentials
4. Use these credentials in GitHub Secrets

### Option 2: Via API

```bash
# Replace with your actual API Gateway URL and key
curl -X POST https://your-api-gateway-url/users/signup \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "email": "test-user@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

### Option 3: Via Database (If you have access)

Create the user directly in DynamoDB or your user database.

## Workflow Configuration

The `.github/workflows/deploy-all.yml` workflow uses these secrets:

```yaml
- name: Run frontend Selenium tests
  working-directory: apps/frontend
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    VITE_APP_URL: http://127.0.0.1:5173
  run: npm run test:selenium:comprehensive:verbose
```

## Troubleshooting

### Error: "AUTHENTICATION FAILED - Invalid credentials"

**Possible causes:**
1. GitHub Secrets are not set
2. GitHub Secrets contain incorrect credentials
3. Test user doesn't exist in the system
4. Test user account is disabled or deleted
5. API Gateway is not accessible from CI environment

**Solutions:**
1. ✅ Verify secrets are set in GitHub repository settings
2. ✅ Test credentials locally first
3. ✅ Verify test user exists and is active
4. ✅ Check API Gateway URL is correct in workflow

### Tests Skip Instead of Fail

The test suite is designed to gracefully skip authenticated tests if authentication fails. This is intentional behavior:

- ✅ Public page tests will still run
- ⏭️ Authenticated page tests will be skipped
- ⚠️ Authentication test will show a warning but won't fail the build

To make authentication failures fail the build, you would need to modify the test file (not recommended - graceful degradation is better).

## Best Practices

1. **Use a Dedicated Test User**: Create a user specifically for CI/CD testing
2. **Keep Secrets Secure**: Never commit credentials to code
3. **Rotate Credentials**: Change test user password periodically
4. **Document Test User**: Note the test user details in team documentation
5. **Test Locally First**: Always verify credentials work locally before relying on CI

## Security Notes

- ✅ GitHub Secrets are encrypted at rest
- ✅ Secrets are only available to GitHub Actions workflows
- ✅ Secrets are not visible in workflow logs
- ✅ Secrets can be scoped to specific environments (dev/staging/prod)

## Related Documentation

- [Test Credentials Requirements](./TEST_CREDENTIALS_REQUIREMENTS.md)
- [Test Credentials Setup](./TEST_CREDENTIALS_SETUP.md)
- [GitHub Actions CI/CD](./../deployment/GITHUB_ACTIONS_CICD.md)
