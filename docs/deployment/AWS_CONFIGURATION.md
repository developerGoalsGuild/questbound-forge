# AWS Configuration Guide for Deployment

## Quick Check

Before deploying, verify your AWS configuration:

```bash
./backend/infra/terraform2/scripts/check-aws-config.sh
```

## Configure AWS Credentials

The deployment script requires AWS credentials. Choose one of these methods:

### Option 1: AWS Configure (Recommended for First Time)

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-2` (or your preferred region)
- **Default output format**: `json` (recommended)

### Option 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-2
```

To make this permanent, add to `~/.zshrc` or `~/.bashrc`:
```bash
echo 'export AWS_ACCESS_KEY_ID=your-access-key-id' >> ~/.zshrc
echo 'export AWS_SECRET_ACCESS_KEY=your-secret-access-key' >> ~/.zshrc
echo 'export AWS_DEFAULT_REGION=us-east-2' >> ~/.zshrc
source ~/.zshrc
```

### Option 3: AWS SSO (If Your Organization Uses It)

```bash
aws sso login
```

Then set your profile:
```bash
export AWS_PROFILE=your-sso-profile-name
```

### Option 4: AWS Profiles

Create a named profile:
```bash
aws configure --profile goalsguild-dev
```

Then use it:
```bash
export AWS_PROFILE=goalsguild-dev
```

## Verify Configuration

After configuring, verify it works:

```bash
# Check your identity
aws sts get-caller-identity

# Should output something like:
# {
#     "UserId": "AIDA...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }

# Check region
aws configure get region
# Should output: us-east-2 (or your configured region)
```

## Common Issues

### "Unable to locate credentials"

**Solution**: Run `aws configure` or set environment variables

### "The security token included in the request is expired"

**Solution**: 
- If using SSO: `aws sso login`
- If using temporary credentials: Get new credentials

### "Access Denied" when accessing ECR or Lambda

**Solution**: Ensure your AWS user/role has permissions for:
- `ecr:*` (or at least `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:PutImage`)
- `lambda:*` (or at least `lambda:UpdateFunctionCode`, `lambda:GetFunction`)
- `iam:PassRole` (for Lambda execution role)

### Region Not Set

**Solution**: 
```bash
aws configure set region us-east-2
```

Or set environment variable:
```bash
export AWS_DEFAULT_REGION=us-east-2
```

## Required AWS Permissions

Your AWS user/role needs these permissions:

### ECR (Elastic Container Registry)
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:DescribeRepositories`

### Lambda
- `lambda:GetFunction`
- `lambda:UpdateFunctionCode`
- `lambda:UpdateFunctionConfiguration`
- `lambda:GetFunctionConfiguration`

### IAM (for Lambda execution role)
- `iam:PassRole` (on the Lambda execution role)

### CloudWatch Logs
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

### Terraform (if deploying infrastructure)
- Various permissions depending on what Terraform creates/updates

## Testing After Configuration

Run the check script:

```bash
./backend/infra/terraform2/scripts/check-aws-config.sh
```

This will verify:
- ✅ AWS CLI is installed
- ✅ AWS credentials are configured
- ✅ Docker is installed and running
- ✅ Terraform is installed (optional)
- ✅ ECR repository is accessible
- ✅ Lambda function is accessible

## Next Steps

Once AWS is configured:

```bash
./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh
```
