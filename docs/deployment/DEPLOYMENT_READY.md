# Newsletter Endpoint Deployment - Ready to Execute

## ✅ What's Been Prepared

1. **Backend Code Changes** ✅
   - Newsletter endpoint added to `backend/services/user-service/app/main.py`
   - Newsletter models added to `backend/services/user-service/app/models.py`
   - Tests created in `backend/services/user-service/tests/test_waitlist_newsletter.py`

2. **Deployment Scripts** ✅
   - Main script: `backend/infra/terraform2/scripts/deploy-user-service-with-build.sh`
   - Wrapper script: `backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh`
   - Both scripts are executable and ready to use

3. **Documentation** ✅
   - Deployment guide: `docs/deployment/DEPLOY_NEWSLETTER_ENDPOINT.md`
   - Backend deployment checklist: `docs/deployment/NEWSLETTER_BACKEND_DEPLOYMENT.md`

## 🚀 How to Deploy

### Option 1: Use the Wrapper Script (Recommended)

```bash
cd /Volumes/macdisk2/Projetos/GoalsGuild/questbound-forge
./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh
```

### Option 2: Use the Main Script Directly

```bash
cd /Volumes/macdisk2/Projetos/GoalsGuild/questbound-forge/backend/infra/terraform2/scripts
./deploy-user-service-with-build.sh -e dev -l ./terraform-logs/tf-user-service.log
```

### Option 3: Manual Step-by-Step

If you prefer manual control:

```bash
# 1. Navigate to backend directory
cd /Volumes/macdisk2/Projetos/GoalsGuild/questbound-forge/backend

# 2. Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-2")

# 3. Build Docker image
docker buildx build --platform linux/amd64 \
  -f services/user-service/Dockerfile \
  -t ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/goalsguild_user_service:latest \
  --provenance=false --sbom=false --load .

# 4. Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 5. Push image
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/goalsguild_user_service:latest

# 6. Deploy with Terraform
cd infra/terraform2/stacks/services/user-service
terraform init -upgrade
terraform apply -var-file=../../environments/dev.tfvars -auto-approve
```

## 📋 Prerequisites Checklist

Before running the deployment, ensure:

- [ ] **AWS CLI configured**: `aws sts get-caller-identity` works
- [ ] **Docker running**: `docker ps` works
- [ ] **Terraform installed**: `terraform version` works
- [ ] **ECR access**: Can access `goalsguild_user_service` repository
- [ ] **Lambda access**: Can update `goalsguild_user_service_dev` function
- [ ] **Region set**: AWS region is `us-east-2` (or matches your config)

## 🔍 What the Script Does

1. **Gets AWS credentials** and account info
2. **Reads current version** from `.version` file (or starts at v1)
3. **Increments version** (v1 → v2 → v3, etc.)
4. **Builds Docker image** with newsletter endpoint code
5. **Pushes to ECR** with new version tag
6. **Updates Terraform** with new image URI
7. **Deploys Lambda** function via Terraform
8. **Saves version** to `.version` file for next deployment

## ✅ Verification After Deployment

Once deployment completes (wait 1-2 minutes for Lambda propagation):

### Test Newsletter Endpoint

```bash
# Replace with your actual API Gateway URL and key
API_URL="https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1"
API_KEY="your-api-key-here"

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

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/goalsguild_user_service_dev --follow --region us-east-2
```

### Verify DynamoDB

```bash
aws dynamodb get-item \
  --table-name gg_core \
  --key '{"PK": {"S": "NEWSLETTER#test@example.com"}, "SK": {"S": "SUBSCRIPTION#NEWSLETTER"}}' \
  --region us-east-2
```

## 📝 Notes

- **No API Gateway changes needed**: The existing `/{proxy+}` route handles the new endpoint automatically
- **No infrastructure changes**: Uses existing DynamoDB table and GSI
- **Version tracking**: Version is stored in `backend/services/user-service/.version`
- **Rollback**: Can revert by deploying previous image version

## 🆘 Troubleshooting

If deployment fails:

1. **Check AWS credentials**: `aws sts get-caller-identity`
2. **Check Docker**: `docker ps`
3. **Check logs**: `cat terraform-logs/tf-user-service.log`
4. **Check Terraform state**: `cd backend/infra/terraform2/stacks/services/user-service && terraform state list`

For detailed troubleshooting, see: `docs/deployment/DEPLOY_NEWSLETTER_ENDPOINT.md`

## 📚 Related Documentation

- **Deployment Guide**: `docs/deployment/DEPLOY_NEWSLETTER_ENDPOINT.md`
- **Backend Checklist**: `docs/deployment/NEWSLETTER_BACKEND_DEPLOYMENT.md`
- **Test Documentation**: `docs/testing/NEW_FUNCTIONALITY_TESTS.md`

---

**Ready to deploy!** Run the script when AWS credentials are configured.
