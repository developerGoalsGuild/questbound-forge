# Deploy Newsletter Endpoint - Quick Guide

## Quick Deployment

Run the deployment script to deploy the user-service with the newsletter endpoint:

```bash
cd backend/infra/terraform2/scripts
./deploy-user-service-newsletter.sh
```

Or use the original script with custom options:

```bash
cd backend/infra/terraform2/scripts
./deploy-user-service-with-build.sh -e dev -l ./terraform-logs/tf-user-service.log
```

## What This Does

1. **Builds Docker image** with newsletter endpoint code
2. **Auto-increments version** (v1, v2, v3, etc.)
3. **Pushes to ECR** (Elastic Container Registry)
4. **Deploys Lambda function** using Terraform
5. **Updates API Gateway** integration (automatic via `/{proxy+}` route)

## Prerequisites

- AWS CLI configured with valid credentials
- Docker installed and running
- Terraform installed
- Access to ECR repository: `goalsguild_user_service`
- Access to Lambda function: `goalsguild_user_service_dev`

## Deployment Options

### Standard Deployment (Auto-approve)
```bash
./deploy-user-service-newsletter.sh
```

### Plan Only (Preview Changes)
```bash
./deploy-user-service-with-build.sh -e dev -p
```

### Manual Approval Required
```bash
./deploy-user-service-with-build.sh -e dev -n
```

### Production Deployment
```bash
./deploy-user-service-with-build.sh -e prod
```

## Script Parameters

- `-e, --env`: Environment (dev, prod) - Default: dev
- `-p, --plan`: Plan only mode (no deployment)
- `-n, --no-approve`: Require manual approval
- `-s, --skip-init`: Skip terraform init
- `-l, --log-path`: Custom log file path

## Changes Being Deployed

✅ Added `POST /newsletter/subscribe` endpoint
✅ Added `OPTIONS /newsletter/subscribe` endpoint (CORS)
✅ Newsletter subscription storage in DynamoDB
✅ Rate limiting (5 requests/minute per IP)
✅ API key authentication
✅ Duplicate email handling

## Verification

After deployment (wait 1-2 minutes for Lambda to update):

### 1. Test the Endpoint

```bash
# Get API Gateway URL and Key
API_URL="https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1"
API_KEY="your-api-key-here"

# Test newsletter subscription
curl -X POST "$API_URL/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"email": "test@example.com", "source": "footer"}'
```

Expected response:
```json
{
  "message": "Successfully subscribed to newsletter",
  "email": "test@example.com",
  "subscribed": true
}
```

### 2. Test CORS Preflight

```bash
curl -X OPTIONS "$API_URL/newsletter/subscribe" \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### 3. Verify DynamoDB Storage

```bash
# Check if email was stored
aws dynamodb get-item \
  --table-name gg_core \
  --key '{"PK": {"S": "NEWSLETTER#test@example.com"}, "SK": {"S": "SUBSCRIPTION#NEWSLETTER"}}' \
  --region us-east-2
```

### 4. Check Lambda Logs

```bash
# View recent logs
aws logs tail /aws/lambda/goalsguild_user_service_dev --follow --region us-east-2
```

## Troubleshooting

### Docker Build Fails
- Ensure Docker is running: `docker ps`
- Check Docker buildx: `docker buildx version`
- Verify Dockerfile exists: `ls backend/services/user-service/Dockerfile`

### ECR Login Fails
- Verify AWS credentials: `aws sts get-caller-identity`
- Check region: `aws configure get region`
- Ensure ECR repository exists

### Terraform Apply Fails
- Check Terraform state: `cd backend/infra/terraform2/stacks/services/user-service && terraform state list`
- Verify environment file: `ls backend/infra/terraform2/environments/dev.tfvars`
- Check logs: `cat terraform-logs/tf-user-service.log`

### Lambda Function Not Updating
- Wait 2-3 minutes for Lambda to propagate changes
- Check Lambda function version in AWS Console
- Verify image URI in Terraform output

### API Gateway Not Routing
- Verify `/{proxy+}` route exists in API Gateway
- Check API Gateway integration points to Lambda
- Ensure API Gateway stage is deployed

## Rollback

If deployment causes issues:

1. **Revert Lambda to previous version**:
   ```bash
   # Find previous version in ECR
   aws ecr describe-images --repository-name goalsguild_user_service --region us-east-2
   
   # Update Terraform with previous image URI
   cd backend/infra/terraform2/stacks/services/user-service
   # Edit main.tf to set existing_image_uri to previous version
   terraform apply -var-file ../../environments/dev.tfvars
   ```

2. **No data loss**: DynamoDB data remains intact

## Related Files

- Deployment Script: `backend/infra/terraform2/scripts/deploy-user-service-with-build.sh`
- Newsletter Wrapper: `backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh`
- Lambda Code: `backend/services/user-service/app/main.py`
- Models: `backend/services/user-service/app/models.py`
- Tests: `backend/services/user-service/tests/test_waitlist_newsletter.py`

## Next Steps

After successful deployment:

1. ✅ Newsletter endpoint is live
2. ✅ Frontend can call `/newsletter/subscribe`
3. ✅ Emails stored in DynamoDB `gg_core` table
4. ✅ Ready for production use
