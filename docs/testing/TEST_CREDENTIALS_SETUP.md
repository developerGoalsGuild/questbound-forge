# Test Credentials Setup Guide

## Best Practices for Storing Test Credentials

This guide explains the recommended way to store test user credentials securely outside of source control.

## ✅ Recommended Approach: `.env.test` File

The **best practice** is to use a `.env.test` file that is git-ignored.

### Step 1: Create `.env.test` File

```bash
cd apps/frontend
cp .env.test.example .env.test
```

### Step 2: Edit `.env.test` with Your Credentials

```bash
# Edit the file with your preferred editor
nano .env.test
# or
code .env.test
```

Add your test user credentials:

```env
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

### Step 3: Verify It's Ignored

The `.env.test` file is already in `.gitignore`, so it won't be committed:

```bash
git status
# Should NOT show .env.test
```

## 🔒 Security Features

### ✅ What's Protected

- `.env.test` is in `.gitignore` - **never committed to git**
- Credentials are loaded only when running tests
- File is local to your machine only

### ✅ Credential Loading Priority

The test script loads credentials in this order (safest first):

1. **`.env.test` file** (recommended) - Local file, git-ignored
2. **Environment variables** - `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
3. **Interactive prompt** - Asks you to type credentials

## 📝 File Structure

```
apps/frontend/
├── .env.test.example    # Template (committed to git)
├── .env.test            # Your credentials (git-ignored)
└── src/__tests__/
    └── selenium/
        ├── load-test-credentials.js  # Loads from .env.test
        └── full-frontend-integration.test.cjs
```

## 🚀 Usage

### Option 1: Using .env.test File (Recommended)

```bash
# 1. Create .env.test from template
cp .env.test.example .env.test

# 2. Edit .env.test with your credentials
nano .env.test

# 3. Run tests (credentials loaded automatically)
npm run test:selenium:full:verbose
```

### Option 2: Using Environment Variables

```bash
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpassword123
npm run test:selenium:full:verbose
```

### Option 3: Interactive Prompt

If neither `.env.test` nor environment variables are set, the script will prompt you:

```bash
npm run test:selenium:full:verbose
# Will ask for email and password
```

## 🔐 Additional Security Options

### Option A: Encrypted Credentials (Advanced)

For extra security, you can encrypt the credentials:

```bash
# Install encryption tool
npm install --save-dev dotenv-encrypted

# Create encrypted .env.test.encrypted
# (Requires encryption key management)
```

### Option B: OS Keychain (macOS/Linux)

Store credentials in system keychain:

```bash
# macOS
security add-generic-password -a "test-user" -s "goalsguild-tests" -w "password123"

# Then retrieve in script
security find-generic-password -a "test-user" -s "goalsguild-tests" -w
```

### Option C: AWS Secrets Manager (Cloud)

For cloud-based testing:

```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name goalsguild/test-credentials \
  --secret-string '{"email":"test@example.com","password":"..."}'

# Retrieve in CI/CD pipeline
```

## 📋 Template File

The `.env.test.example` file serves as a template:

```env
# Test User Credentials
# Copy this file to .env.test and fill in your test user credentials
# This file is git-ignored and will not be committed to source control

TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-password-here
```

## ✅ Verification

Check that your `.env.test` is properly ignored:

```bash
# Should return nothing (file is ignored)
git check-ignore apps/frontend/.env.test

# Should show .env.test is ignored
git status --ignored | grep .env.test
```

## 🚨 Security Reminders

1. **Never commit `.env.test`** - It's in `.gitignore`, but double-check
2. **Use a dedicated test account** - Don't use production credentials
3. **Rotate test passwords regularly** - Change test account password periodically
4. **Limit test account permissions** - Test account should have minimal permissions
5. **Don't share `.env.test`** - Each developer should have their own

## 🔄 Sharing Credentials with Team

If you need to share test credentials with your team:

1. **Use a shared password manager** (1Password, LastPass, etc.)
2. **Use AWS Secrets Manager** for cloud teams
3. **Use encrypted config files** with shared encryption key
4. **Never commit to git** - Even in private repos

## 📚 Related Files

- `.env.test.example` - Template file (safe to commit)
- `.env.test` - Your credentials (git-ignored)
- `load-test-credentials.js` - Credential loader
- `full-frontend-integration.test.cjs` - Test script

## 🆘 Troubleshooting

### "Credentials not found"

1. Check if `.env.test` exists:
   ```bash
   ls -la apps/frontend/.env.test
   ```

2. Check file format (should be `KEY=VALUE`):
   ```bash
   cat apps/frontend/.env.test
   ```

3. Verify credentials are set:
   ```bash
   node -e "const creds = require('./src/__tests__/selenium/load-test-credentials'); console.log(creds.hasCredentials())"
   ```

### "File not ignored"

Check `.gitignore`:
```bash
grep -n "\.env\.test" .gitignore
```

If not found, add it:
```bash
echo "apps/frontend/.env.test" >> .gitignore
```

## 📖 Best Practices Summary

1. ✅ **Use `.env.test` file** - Simple, secure, git-ignored
2. ✅ **Use dedicated test account** - Separate from production
3. ✅ **Never commit credentials** - Always in `.gitignore`
4. ✅ **Rotate passwords** - Change test passwords regularly
5. ✅ **Use environment variables for CI/CD** - Set in CI/CD pipeline
6. ✅ **Document the process** - So team knows how to set it up
