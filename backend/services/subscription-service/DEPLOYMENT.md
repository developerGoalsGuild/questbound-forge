# Subscription Service Deployment Guide

This guide covers deploying the subscription service to AWS Lambda using Docker containers.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed and running
- Terraform installed (v1.x+)
- PowerShell (for Windows) or Bash (for Linux/Mac)

## Quick Start

### Option 1: Full Deployment (Recommended)

Deploy everything in one command:

```powershell
.\deploy.ps1 -Env dev
```

This will:
1. Build the Docker image
2. Push to ECR
3. Deploy via Terraform

### Option 2: Build Only

Build and push Docker image without Terraform:

```powershell
.\build.ps1 -ImageTag latest
```

### Option 3: Terraform Only

Deploy via Terraform only (skip Docker build):

```powershell
.\deploy.ps1 -Env dev -SkipBuild
```

## Environment-Specific Deployment

### Development

```powershell
.\deploy.ps1 -Env dev -ImageTag dev-latest
```

**Note**: In dev mode, the service automatically uses mock Stripe (no API keys needed).

### Staging

```powershell
.\deploy.ps1 -Env staging -ImageTag staging-latest
```

### Production

```powershell
.\deploy.ps1 -Env prod -ImageTag prod-latest
```

**Important**: Production requires Stripe API keys configured in SSM Parameter Store.

## Configuration

### Environment Variables

The service reads configuration from:
1. SSM Parameter Store (production)
2. Environment variables (development)
3. Default values (fallback)

### Required SSM Parameters

For production, configure these in SSM:
- `/goalsguild/subscription-service/STRIPE_SECRET_KEY`
- `/goalsguild/subscription-service/STRIPE_WEBHOOK_SECRET`
- `/goalsguild/subscription-service/STRIPE_PUBLISHABLE_KEY`
- `/goalsguild/cognito/user_pool_id`
- `/goalsguild/user-service/JWT_SECRET`

### Terraform Configuration

The service expects a Terraform module that:
1. Creates/uses ECR repository: `goalsguild_subscription_service`
2. Deploys Lambda function with container image
3. Configures API Gateway endpoints
4. Sets up IAM roles and permissions

Example Terraform module:

```hcl
module "subscription_service_lambda" {
  source = "../../modules/docker_lambda_image"
  
  service_name         = "subscription-service"
  ecr_repository_name  = "goalsguild_subscription_service"
  aws_region          = var.aws_region
  environment         = var.environment
  dockerfile_path     = "Dockerfile"
  context_path        = "${path.module}/../../../services/subscription-service"
  create_ecr          = true
}

resource "aws_lambda_function" "subscription_service" {
  function_name = "subscription-service-${var.environment}"
  role          = module.security.subscription_service_role_arn
  package_type  = "Image"
  image_uri     = module.subscription_service_lambda.image_uri
  timeout       = 30
  memory_size   = 512
  
  environment {
    variables = {
      ENVIRONMENT         = var.environment
      AWS_REGION         = var.aws_region
      CORE_TABLE         = var.dynamodb_table_name
      COGNITO_USER_POOL_ID = module.security.cognito_user_pool_id
    }
  }
}
```

## Docker Build Details

The Dockerfile uses:
- **Base Image**: `python:3.12-slim`
- **Lambda Web Adapter**: For seamless Lambda deployment
- **Port**: 8080 (Lambda Web Adapter requirement)
- **Health Check**: `/health` endpoint

Build context must be from workspace root to correctly copy:
- `services/subscription-service/` → `/app/`
- `services/common/` → `/app/common`

## API Gateway Configuration

After deployment, configure API Gateway endpoints:

1. **Subscription Endpoints**:
   - `GET /subscriptions/current`
   - `POST /subscriptions/create-checkout`
   - `POST /subscriptions/cancel`
   - `GET /subscriptions/portal`

2. **Credits Endpoints**:
   - `GET /credits/balance`
   - `POST /credits/topup`

3. **Webhook Endpoint**:
   - `POST /webhooks/stripe` (public, signature verification)

## Testing Deployment

### Health Check

```bash
curl https://api.goalsguild.com/subscriptions/health
```

### With Authentication

```bash
curl -H "Authorization: Bearer <token>" \
     -H "x-api-key: <api-key>" \
     https://api.goalsguild.com/subscriptions/current
```

### Lambda Logs

```bash
aws logs tail /aws/lambda/subscription-service-dev --follow
```

## Troubleshooting

### Docker Build Fails

- Ensure Docker is running
- Check AWS credentials: `aws sts get-caller-identity`
- Verify ECR repository exists: `aws ecr describe-repositories --repository-names goalsguild_subscription_service`

### Terraform Apply Fails

- Run `terraform init` first
- Check environment file exists: `infra/terraform2/environments/dev.tfvars`
- Verify Lambda execution role exists
- Check SSM parameters are configured

### Lambda Function Errors

- Check CloudWatch logs: `/aws/lambda/subscription-service-<env>`
- Verify environment variables are set
- Ensure DynamoDB table exists: `gg_core`
- Check IAM permissions for Lambda execution role

### Mock Stripe Not Working

- Verify `ENVIRONMENT=dev` is set
- Ensure `STRIPE_SECRET_KEY` is NOT set (in dev)
- Check service logs for "Using mock Stripe client" message

## Manual ECR Push

If you need to manually push to ECR:

```powershell
# Get login token
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-2.amazonaws.com

# Tag image
docker tag subscription-service:latest <account-id>.dkr.ecr.us-east-2.amazonaws.com/goalsguild_subscription_service:latest

# Push
docker push <account-id>.dkr.ecr.us-east-2.amazonaws.com/goalsguild_subscription_service:latest
```

## CI/CD Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Build and Deploy
  run: |
    cd backend/services/subscription-service
    ./deploy.ps1 -Env ${{ env.ENVIRONMENT }} -ImageTag ${{ github.sha }}
```

## Next Steps

After successful deployment:

1. **Configure Stripe Webhooks** (production only):
   - Add webhook endpoint in Stripe Dashboard
   - Point to: `https://api.goalsguild.com/subscriptions/webhooks/stripe`
   - Verify webhook secret matches SSM parameter

2. **Test Subscription Flow**:
   - Use mock mode in dev (automatic)
   - Test checkout session creation
   - Verify webhook event processing

3. **Monitor**:
   - Set up CloudWatch alarms
   - Monitor Lambda errors
   - Track subscription creation/cancellation

