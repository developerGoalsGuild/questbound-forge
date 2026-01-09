# Quick Fix: AWS Configuration Issue

## Problem

The deployment script stopped with:
```
[INFO] Getting AWS account ID and region...
```

This means **AWS credentials are not configured**.

## Solution

Configure AWS credentials using one of these methods:

### Method 1: Quick Setup (Recommended)

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Get from AWS Console (only shown once when created)
- **Default region**: `us-east-2`
- **Default output format**: `json`

### Method 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-2
```

### Method 3: AWS SSO (If Your Organization Uses It)

```bash
aws sso login
```

## Verify Configuration

After configuring, verify it works:

```bash
aws sts get-caller-identity
```

You should see output like:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

## Run Deployment Again

Once AWS is configured:

```bash
./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh
```

## Check Script (Optional)

For detailed diagnostics, run:

```bash
./backend/infra/terraform2/scripts/check-aws-config.sh
```

This will check:
- ✅ AWS CLI installation
- ✅ AWS credentials
- ✅ Docker installation and status
- ✅ Terraform installation
- ✅ ECR and Lambda access

## Need Help?

See detailed guide: `docs/deployment/AWS_CONFIGURATION.md`
