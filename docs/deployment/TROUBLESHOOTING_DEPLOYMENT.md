# Troubleshooting Newsletter Deployment

## Common Issues and Solutions

### Issue 1: AWS Credentials Not Configured

**Error:**
```
Unable to locate credentials. You can configure credentials by running "aws login".
```

**Solution:**
```bash
# Option 1: Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, Region, and Output format

# Option 2: Use AWS SSO
aws sso login --profile your-profile

# Option 3: Set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-2
```

**Verify:**
```bash
aws sts get-caller-identity
```

### Issue 2: Docker Not Running or Not Accessible

**Error:**
```
permission denied while trying to connect to the docker API
```

**Solutions:**

**macOS:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start, then verify:
docker ps
```

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker

# Add user to docker group (if needed)
sudo usermod -aG docker $USER
# Log out and log back in
```

**Verify:**
```bash
docker ps
```

### Issue 3: Terraform Not Installed

**Error:**
```
command not found: terraform
```

**Solution:**

**macOS:**
```bash
brew install terraform
```

**Linux:**
```bash
# Download from https://www.terraform.io/downloads
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Verify:**
```bash
terraform version
```

### Issue 4: ECR Repository Not Found

**Error:**
```
RepositoryNotFoundException: The repository with name 'goalsguild_user_service' does not exist
```

**Solution:**
```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name goalsguild_user_service \
  --region us-east-2 \
  --image-scanning-configuration scanOnPush=true
```

### Issue 5: Lambda Function Not Found

**Error:**
```
ResourceNotFoundException: Function not found: goalsguild_user_service_dev
```

**Solution:**
The Lambda function should be created by Terraform. Check:
1. Terraform state: `cd backend/infra/terraform2/stacks/services/user-service && terraform state list`
2. If missing, run Terraform apply manually

### Issue 6: Docker Build Fails

**Error:**
```
Docker build failed for user-service
```

**Solutions:**

1. **Check Dockerfile exists:**
   ```bash
   ls -la backend/services/user-service/Dockerfile
   ```

2. **Check Docker buildx:**
   ```bash
   docker buildx version
   # If not installed:
   docker buildx install
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Build manually to see detailed errors:**
   ```bash
   cd backend
   docker buildx build --platform linux/amd64 \
     -f services/user-service/Dockerfile \
     -t test-image \
     --load .
   ```

### Issue 7: Terraform Apply Fails

**Error:**
```
Error applying plan: ...
```

**Solutions:**

1. **Check Terraform state:**
   ```bash
   cd backend/infra/terraform2/stacks/services/user-service
   terraform state list
   ```

2. **Check environment file:**
   ```bash
   ls -la backend/infra/terraform2/environments/dev.tfvars
   ```

3. **Run Terraform plan to see what will change:**
   ```bash
   terraform plan -var-file=../../environments/dev.tfvars
   ```

4. **Check logs:**
   ```bash
   cat terraform-logs/tf-user-service.log
   ```

### Issue 8: Image Push to ECR Fails

**Error:**
```
no basic auth credentials
```

**Solution:**
```bash
# Login to ECR
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-2")
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
```

### Issue 9: Lambda Function Not Updating

**Symptoms:**
- Deployment succeeds but endpoint doesn't work
- Old code still running

**Solutions:**

1. **Wait 2-3 minutes** for Lambda to propagate changes

2. **Check Lambda function version:**
   ```bash
   aws lambda get-function \
     --function-name goalsguild_user_service_dev \
     --region us-east-2 \
     --query 'Configuration.[FunctionName,Version,LastModified]'
   ```

3. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/goalsguild_user_service_dev \
     --follow \
     --region us-east-2
   ```

4. **Force update by changing a Terraform variable** and re-applying

### Issue 10: API Gateway Not Routing to New Endpoint

**Symptoms:**
- Lambda deployed but `/newsletter/subscribe` returns 404

**Solutions:**

1. **Verify API Gateway route exists:**
   ```bash
   # Get API Gateway ID from Terraform output
   cd backend/infra/terraform2/stacks/services/user-service
   terraform output
   ```

2. **Check API Gateway routes:**
   ```bash
   # Replace API_GATEWAY_ID with actual ID
   aws apigatewayv2 get-routes \
     --api-id API_GATEWAY_ID \
     --region us-east-2
   ```

3. **Verify `/{proxy+}` route exists** - this should handle all paths

## Getting Help

If deployment still fails:

1. **Check full logs:**
   ```bash
   cat terraform-logs/tf-user-service.log
   ```

2. **Run with verbose output:**
   ```bash
   ./deploy-user-service-newsletter.sh 2>&1 | tee deployment-output.log
   ```

3. **Check AWS CloudWatch Logs:**
   - Lambda logs: `/aws/lambda/goalsguild_user_service_dev`
   - API Gateway logs: Check API Gateway console

4. **Verify all prerequisites:**
   ```bash
   # Run prerequisite checks
   aws sts get-caller-identity
   docker ps
   terraform version
   ```

## Manual Deployment Steps

If automated script fails, deploy manually:

```bash
# 1. Build and push Docker image
cd backend
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-2")
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/goalsguild_user_service"

docker buildx build --platform linux/amd64 \
  -f services/user-service/Dockerfile \
  -t $ECR_URI:latest \
  --provenance=false --sbom=false --load .

aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

docker push $ECR_URI:latest

# 2. Deploy with Terraform
cd infra/terraform2/stacks/services/user-service
terraform init -upgrade
terraform apply -var-file=../../environments/dev.tfvars
```
