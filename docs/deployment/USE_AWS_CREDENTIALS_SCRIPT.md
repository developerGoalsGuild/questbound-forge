# Using the AWS Credentials Helper Script

## Quick Start

The project includes a helper script to check and configure AWS credentials:

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh
```

## Common Usage

### Check Current Configuration

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh
```

This will:
- ✅ Check if AWS CLI is installed
- ✅ Check credentials file (`~/.aws/credentials`)
- ✅ Check environment variables
- ✅ Test if credentials are valid
- ✅ Auto-renew expired SSO tokens if detected

### Interactive Setup

To configure AWS credentials interactively:

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --configure
```

This runs `aws configure` interactively and then tests your credentials.

### Test Credentials Only

To just test if credentials work:

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --test
```

### Renew SSO Token

If using AWS SSO and your token expired:

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --renew
```

### Show Setup Instructions

To see detailed setup instructions:

```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --setup
```

## Integration with Deployment

The deployment script (`deploy-user-service-newsletter.sh`) will automatically check for AWS credentials and suggest using this helper script if credentials are missing.

## What the Script Does

1. **Checks AWS CLI installation**
2. **Checks credentials file** (`~/.aws/credentials`)
3. **Checks environment variables** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
4. **Detects SSO configuration** and can auto-renew expired tokens
5. **Tests credentials** by calling `aws sts get-caller-identity`
6. **Shows helpful error messages** if credentials are missing or invalid

## Example Output

When credentials are configured:
```
==========================================
AWS Credentials Helper
==========================================

[✓] AWS CLI is installed: aws-cli/2.x.x

=== Checking AWS Credentials Files ===
[✓] Credentials file exists: /Users/you/.aws/credentials
  Profiles found: 1
  Available profiles:
    - default

=== Testing AWS Credentials ===
[✓] AWS credentials are valid!

  Account ID: 123456789012
  User ARN: arn:aws:iam::123456789012:user/your-username
  User ID: AIDA...
  Region: us-east-2

==========================================
[✓] AWS credentials are configured and valid!
```

When credentials are missing:
```
[✗] AWS credentials are invalid or not configured

=== AWS Credentials Setup Instructions ===

Option 1: Interactive Setup (Recommended)
  Run: aws configure
  ...
```

## Next Steps

After configuring credentials:

1. **Verify credentials work**:
   ```bash
   ./backend/infra/terraform2/scripts/get-aws-credentials.sh --test
   ```

2. **Deploy the newsletter endpoint**:
   ```bash
   ./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh
   ```

## Troubleshooting

### "AWS CLI is not installed"
```bash
brew install awscli
# or
pip3 install awscli
```

### "SSO token expired"
```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --renew
# or manually
aws sso login
```

### "Credentials file not found"
Run the interactive setup:
```bash
./backend/infra/terraform2/scripts/get-aws-credentials.sh --configure
```

## See Also

- `docs/deployment/AWS_CONFIGURATION.md` - Detailed AWS setup guide
- `QUICK_FIX_AWS_CONFIG.md` - Quick troubleshooting guide
