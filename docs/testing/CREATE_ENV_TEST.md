# Create .env.test File

## Quick Setup

Run the setup script to create your `.env.test` file:

```bash
cd apps/frontend
./scripts/create-env-test.sh
```

Or manually create it:

```bash
cd apps/frontend
cat > .env.test << 'EOF'
# Test User Credentials
# This file is git-ignored and will not be committed to source control
# Fill in your test user credentials below

# Test User Email
TEST_USER_EMAIL=test@example.com

# Test User Password
TEST_USER_PASSWORD=your-test-password-here

# Optional: API Gateway Configuration (if different from default)
# VITE_API_GATEWAY_URL=https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com
# VITE_API_GATEWAY_KEY=your-api-key-here

# Optional: App URL (if different from default)
# VITE_APP_URL=http://localhost:8080
EOF
```

Then edit `.env.test` and replace:
- `test@example.com` with your actual test user email
- `your-test-password-here` with your actual test user password

## Verify It's Ignored

```bash
git check-ignore apps/frontend/.env.test
# Should output: apps/frontend/.env.test
```

## Security

- ✅ File is git-ignored (won't be committed)
- ✅ Contains sensitive credentials (keep it private)
- ✅ Only readable by you (chmod 600)
