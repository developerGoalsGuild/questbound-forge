# Deploy User-Service CORS Fix

## Quick Deployment

Run the deployment script to deploy the user-service with CORS fixes:

```powershell
cd backend\infra\terraform2\scripts
.\deploy-user-service-with-build.ps1 -Env dev -AutoApprove
```

## What This Does

1. **Builds Docker image** with updated CORS code
2. **Pushes to ECR** (Elastic Container Registry)
3. **Deploys Lambda function** using Terraform
4. **Updates API Gateway** integration

## Changes Being Deployed

✅ Added OPTIONS handler for `/waitlist/subscribe` endpoint
✅ Updated CORS middleware to include CloudFront domain
✅ Enhanced CORS header handling for all origins

## Alternative: Manual Deployment

If the script doesn't work, you can deploy manually:

### Step 1: Build and Push Docker Image

```powershell
cd backend
docker buildx build --platform linux/amd64 -f services/user-service/Dockerfile -t goalsguild_user_service:latest --load .

# Login to ECR
$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = (aws configure get region)
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com

# Tag and push
docker tag goalsguild_user_service:latest $AccountId.dkr.ecr.$Region.amazonaws.com/goalsguild_user_service:latest
docker push $AccountId.dkr.ecr.$Region.amazonaws.com/goalsguild_user_service:latest
```

### Step 2: Deploy with Terraform

```powershell
cd backend/infra/terraform2/stacks/services/user-service
terraform init
terraform apply -var-file ../../environments/dev.tfvars -auto-approve
```

## Verification

After deployment:

1. **Wait 1-2 minutes** for Lambda to update
2. **Test the waitlist form** at `https://www.goalsguild.com`
3. **Check browser console** - should see success, no CORS errors

## Expected Result

- ✅ OPTIONS preflight request succeeds
- ✅ POST request succeeds
- ✅ Email stored in DynamoDB
- ✅ Success message displayed

## Troubleshooting

If deployment fails:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Check ECR repository exists
3. Check Terraform state is valid
4. Review logs in `D:\terraformlogs\tf-user-service.log`














