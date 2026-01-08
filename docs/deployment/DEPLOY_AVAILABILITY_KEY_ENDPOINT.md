# Deploy /appsync/availability-key Endpoint

## Status
✅ Terraform configuration has been added to `backend/infra/terraform2/modules/apigateway/api_gateway.tf`
❌ **Deployment required** - The endpoint is not yet deployed to AWS API Gateway

## Quick Deploy

### Option 1: Using the Deployment Script (Recommended)

```powershell
cd backend\infra\terraform2\scripts
.\deploy-apigateway.ps1 -Env dev
```

### Option 2: Manual Terraform Deployment

```powershell
# Navigate to API Gateway stack
cd backend\infra\terraform2\stacks\apigateway

# Initialize Terraform (if needed)
terraform init -upgrade

# Preview changes
terraform plan -var-file ..\environments\dev.tfvars

# Apply changes
terraform apply -var-file ..\environments\dev.tfvars
```

## What Will Be Deployed

- **Resource**: `/appsync/availability-key`
- **GET Method**: Public access (no authentication)
- **OPTIONS Method**: CORS preflight support
- **Integration**: AWS Lambda Proxy → user-service
- **CORS**: Properly configured headers

## Verify Deployment

After deployment, test the endpoint:

```powershell
# Test the endpoint (should return 200, not 403)
curl -X GET "https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/appsync/availability-key"
```

Or check in AWS Console:
1. Go to API Gateway → Your API
2. Navigate to `/appsync/availability-key`
3. Verify GET and OPTIONS methods exist

## Current Behavior

Until deployment:
- ✅ Frontend handles errors gracefully
- ✅ Users can still sign up (backend validates email uniqueness)
- ⚠️ Availability checks will fail silently (logged as DEBUG)
- ⚠️ No real-time email/nickname availability feedback

After deployment:
- ✅ Real-time availability checks will work
- ✅ Users get immediate feedback on email/nickname availability
- ✅ No more 403 errors in console

## Troubleshooting

If you still get 403 after deployment:
1. Verify the deployment completed successfully
2. Check API Gateway stage is deployed (not just saved)
3. Wait a few seconds for propagation
4. Clear browser cache and reload

