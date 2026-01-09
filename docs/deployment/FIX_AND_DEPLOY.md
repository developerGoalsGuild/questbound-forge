# Fix Deployment Issues and Deploy Newsletter Endpoint

## Current Issues

The deployment script failed because:
1. ❌ AWS credentials not configured
2. ❌ Docker not accessible

## Quick Fix Steps

### Step 1: Configure AWS Credentials

```bash
# Option A: Use AWS Configure (Recommended)
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region: us-east-2
# - Default output format: json

# Option B: Use AWS SSO
aws sso login --profile your-profile-name

# Verify credentials work:
aws sts get-caller-identity
```

### Step 2: Start Docker

**macOS:**
```bash
# Open Docker Desktop
open -a Docker

# Wait 30 seconds for Docker to start, then verify:
docker ps
```

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker

# Verify:
docker ps
```

### Step 3: Run Deployment

Once AWS and Docker are ready:

```bash
cd /Volumes/macdisk2/Projetos/GoalsGuild/questbound-forge
./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh
```

## What the Updated Script Does

The improved script now:
- ✅ Checks AWS credentials before starting
- ✅ Checks Docker is running
- ✅ Checks Terraform is installed
- ✅ Provides clear error messages
- ✅ Shows helpful instructions if prerequisites are missing
- ✅ Shows deployment summary on success
- ✅ Shows log location on failure

## Expected Output

When prerequisites are met, you'll see:

```
========================================
Deploying User-Service with Newsletter
========================================

[INFO] Checking prerequisites...
[SUCCESS] AWS credentials OK (Account: 123456789, Region: us-east-2)
[SUCCESS] Docker is running
[SUCCESS] Terraform is installed

[INFO] All prerequisites met. Starting deployment...
[INFO] Starting user-service build and deployment for environment: dev
...
```

## If You Still Have Issues

See detailed troubleshooting guide:
- `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md`

## Manual Deployment Alternative

If the script still doesn't work, you can deploy manually:

```bash
# 1. Build Docker image
cd /Volumes/macdisk2/Projetos/GoalsGuild/questbound-forge/backend
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-2")
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/goalsguild_user_service"

docker buildx build --platform linux/amd64 \
  -f services/user-service/Dockerfile \
  -t $ECR_URI:latest \
  --provenance=false --sbom=false --load .

# 2. Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# 3. Push image
docker push $ECR_URI:latest

# 4. Deploy with Terraform
cd infra/terraform2/stacks/services/user-service
terraform init -upgrade
terraform apply -var-file=../../environments/dev.tfvars -auto-approve
```

## Need Help?

Check these files:
- `docs/deployment/DEPLOY_NEWSLETTER_ENDPOINT.md` - Full deployment guide
- `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` - Troubleshooting guide
- `docs/deployment/DEPLOYMENT_READY.md` - Overview of what's ready
