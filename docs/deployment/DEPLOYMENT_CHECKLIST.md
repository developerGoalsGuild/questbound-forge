# Deployment Checklist - Guild Features Enhancement

This document outlines everything you need to deploy the new guild features:
- Guild Quests (quantitative and percentual)
- Recent Activities Feed
- Updated Analytics (member activity rate, goals completed by members)
- Chat Integration (existing chat system integrated into guild details)

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality Verification ✅
```bash
# Frontend
cd frontend
npm run lint
npm run type-check
npm run build

# Backend (if you have tests)
cd backend/services/guild-service
# Run any existing tests
```

### 2. Verify Changed Files

**Backend Files:**
- ✅ `backend/services/guild-service/app/models/guild.py` - New Guild Quest models
- ✅ `backend/services/guild-service/app/db/guild_db.py` - New quest/activity DB functions
- ✅ `backend/services/guild-service/app/api/guild.py` - New API endpoints
- ✅ `backend/services/guild-service/app/models/analytics.py` - Updated analytics model

**Frontend Files:**
- ✅ `frontend/src/components/guilds/GuildQuestsTab.tsx` - New component
- ✅ `frontend/src/components/guilds/CreateGuildQuestForm.tsx` - New component
- ✅ `frontend/src/components/guilds/GuildRecentActivities.tsx` - New component
- ✅ `frontend/src/components/guilds/GuildDetails.tsx` - Updated (removed goals tab, added chat)
- ✅ `frontend/src/components/guilds/GuildAnalyticsCard.tsx` - Updated analytics
- ✅ `frontend/src/lib/api/guild.ts` - New API methods
- ✅ `frontend/src/i18n/guild.ts` - New translations

---

## 🚀 Deployment Steps

### Step 1: Backend Deployment (Guild Service)

The guild-service is deployed as a Docker container image to AWS Lambda via ECR.

#### 1.1 Build Docker Image
```bash
cd backend/services/guild-service

# Authenticate Docker to ECR (replace with your values)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build the image
docker build -t goalsguild-guild-service:latest -f Dockerfile ../../
# Note: Dockerfile expects to be built from project root with COPY services/guild-service

# Tag for ECR
docker tag goalsguild-guild-service:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-guild-service:latest

# Push to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-guild-service:latest
```

#### 1.2 Update Lambda Function
```bash
# If using Terraform, update the Lambda function to use the new image
cd backend/infra/terraform2/stacks/services/guild-service
terraform plan -var-file="../../../environments/dev.tfvars"
terraform apply -var-file="../../../environments/dev.tfvars"

# OR manually update Lambda function code
aws lambda update-function-code \
  --function-name goalsguild-guild-service-dev \
  --image-uri <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-guild-service:latest \
  --region us-east-1
```

#### 1.3 Verify Backend Deployment
```bash
# Test the health endpoint
curl https://<API_GATEWAY_URL>/guilds/health

# Test new quest endpoints (requires auth token)
curl -X GET https://<API_GATEWAY_URL>/guilds/{guild_id}/quests \
  -H "Authorization: Bearer <TOKEN>"

curl -X GET https://<API_GATEWAY_URL>/guilds/{guild_id}/activities \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 2: Database Verification

**No schema changes required!** ✅

The changes use the existing `gg_guild` DynamoDB table structure. The single-table design with flexible attributes supports:
- Guild quests stored with `PK: GUILD#{guildId}`, `SK: QUEST#{questId}`
- Activities stored with `PK: GUILD#{guildId}`, `SK: ACTIVITY#{timestamp}#{activityId}`
- Existing indexes will work for queries

**Optional: Verify table structure**
```bash
aws dynamodb describe-table --table-name gg_guild --region us-east-1
```

### Step 3: Frontend Deployment

#### 3.1 Build Frontend
```bash
cd frontend

# Ensure environment variables are set
# Check .env.production or your deployment configuration
# VITE_API_GATEWAY_URL=<your-api-gateway-url>
# VITE_API_GATEWAY_KEY=<your-api-key>

# Build for production
npm run build

# Verify build output
ls -la dist/
```

#### 3.2 Deploy to S3/CloudFront
```bash
# Sync to S3 (replace with your bucket name)
aws s3 sync dist/ s3://<YOUR_FRONTEND_BUCKET> --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <YOUR_CLOUDFRONT_DISTRIBUTION_ID> \
  --paths "/*"
```

**OR if using deployment scripts:**
```bash
# Check if you have a deployment script
ls frontend/scripts/
# Follow your existing deployment process
```

### Step 4: API Gateway Configuration

**⚠️ REQUIRED: Add new API Gateway routes!** 

You need to add Terraform resources for the new endpoints. The API Gateway routes must be explicitly defined.

#### 4.1 Add Terraform Resources

Add the following resources to `backend/infra/terraform2/modules/apigateway/api_gateway.tf`:

**Resources to add** (after line ~498, near other guild resources):
```hcl
# /guilds/{guild_id}/quests
resource "aws_api_gateway_resource" "guilds_id_quests" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.guilds_id.id
  path_part   = "quests"
}

# /guilds/{guild_id}/quests/{quest_id}
resource "aws_api_gateway_resource" "guilds_id_quests_quest_id" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id = aws_api_gateway_resource.guilds_id_quests.id
  path_part = "{quest_id}"
}

# /guilds/{guild_id}/quests/{quest_id}/complete
resource "aws_api_gateway_resource" "guilds_id_quests_quest_id_complete" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  path_part   = "complete"
}

# /guilds/{guild_id}/quests/{quest_id}/completions
resource "aws_api_gateway_resource" "guilds_id_quests_quest_id_completions" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  path_part   = "completions"
}

# /guilds/{guild_id}/quests/{quest_id}/progress
resource "aws_api_gateway_resource" "guilds_id_quests_quest_id_progress" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  path_part   = "progress"
}

# /guilds/{guild_id}/activities
resource "aws_api_gateway_resource" "guilds_id_activities" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.guilds_id.id
  path_part   = "activities"
}
```

**Methods and Integrations to add** (after the guild comments methods, around line ~3160):

```hcl
# Guild Quests Methods
# POST /guilds/{guild_id}/quests
resource "aws_api_gateway_method" "guilds_id_quests_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests.id
  http_method             = aws_api_gateway_method.guilds_id_quests_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# GET /guilds/{guild_id}/quests
resource "aws_api_gateway_method" "guilds_id_quests_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
  request_parameters = {
    "method.request.querystring.status" = false
    "method.request.querystring.limit"  = false
    "method.request.querystring.offset" = false
  }
}

resource "aws_api_gateway_integration" "guilds_id_quests_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests.id
  http_method             = aws_api_gateway_method.guilds_id_quests_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# GET /guilds/{guild_id}/quests/{quest_id}
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# PUT /guilds/{guild_id}/quests/{quest_id}
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# DELETE /guilds/{guild_id}/quests/{quest_id}
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# POST /guilds/{guild_id}/quests/{quest_id}/complete
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_complete_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id_complete.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_complete_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id_complete.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_complete_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# GET /guilds/{guild_id}/quests/{quest_id}/completions
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_completions_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id_completions.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_completions_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id_completions.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_completions_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# GET /guilds/{guild_id}/quests/{quest_id}/progress
resource "aws_api_gateway_method" "guilds_id_quests_quest_id_progress_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_quests_quest_id_progress.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "guilds_id_quests_quest_id_progress_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_quests_quest_id_progress.id
  http_method             = aws_api_gateway_method.guilds_id_quests_quest_id_progress_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}

# Guild Activities Methods
# GET /guilds/{guild_id}/activities
resource "aws_api_gateway_method" "guilds_id_activities_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.guilds_id_activities.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
  request_parameters = {
    "method.request.querystring.limit" = false
  }
}

resource "aws_api_gateway_integration" "guilds_id_activities_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.guilds_id_activities.id
  http_method             = aws_api_gateway_method.guilds_id_activities_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.guild_service_lambda_arn}/invocations"
}
```

#### 4.2 Deploy API Gateway Changes
```bash
cd backend/infra/terraform2/stacks/apigateway
terraform plan -var-file="../../environments/dev.tfvars"
terraform apply -var-file="../../environments/dev.tfvars"
```

**Note**: You may also need to add CORS OPTIONS methods for these new routes if your frontend requires CORS.

### Step 4.3: Messaging Service Update (Optional but Recommended)

**⚠️ Security Enhancement: Update Guild Membership Validation**

The messaging-service already supports `GUILD#` room IDs, but the `validate_guild_membership` function currently always returns `True` (bypasses security). For production, you should implement proper validation.

**Current State**: ✅ Works but insecure (allows anyone to connect to any guild room)

**Recommended**: Deploy messaging-service with proper guild membership validation (already updated in the codebase).

#### Update Environment Variables
Ensure the messaging-service Lambda has:
```bash
GUILD_TABLE_NAME=gg_guild  # Default is already "gg_guild"
```

#### Build and Deploy Messaging Service
```bash
cd backend/services/messaging-service

# Build Docker image
docker build -t goalsguild-messaging-service:latest -f Dockerfile ../../
docker tag goalsguild-messaging-service:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-messaging-service:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-messaging-service:latest

# Update Lambda (if using Terraform)
cd backend/infra/terraform2/stacks/services/messaging-service
terraform apply -var-file="../../../environments/dev.tfvars"

# OR manually update Lambda
aws lambda update-function-code \
  --function-name goalsguild-messaging-service-dev \
  --image-uri <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/goalsguild-messaging-service:latest \
  --region us-east-1
```

**Note**: If you skip this step, guild chat will work but won't validate membership (security risk).

### Step 5: Verify Deployment

#### 5.1 Test Guild Quests
1. Navigate to a guild details page
2. Click on the "Quests" tab
3. Try creating a quantitative quest
4. Try creating a percentual quest
5. Test completing a quest as a member

#### 5.2 Test Recent Activities
1. Navigate to a guild details page
2. Check the "Recent Activities" section (likely in Overview tab)
3. Create a quest, join/leave guild, complete quest
4. Verify activities appear in the feed

#### 5.3 Test Updated Analytics
1. Navigate to guild Analytics tab
2. Verify new metrics appear:
   - Member Activity Rate (weighted score)
   - Goals Completed by Members (personal goals completed after joining)
   - Updated quest completion rates

#### 5.4 Test Chat Integration
1. Navigate to a guild details page
2. Click on the "Chat" tab
3. Verify chat interface loads
4. Send a test message

---

## 🔍 Post-Deployment Monitoring

### Check Lambda Logs
```bash
# View recent logs
aws logs tail /aws/lambda/goalsguild-guild-service-dev --follow --region us-east-1

# Check for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/goalsguild-guild-service-dev \
  --filter-pattern "ERROR" \
  --region us-east-1
```

### Check API Gateway Metrics
```bash
# View API Gateway metrics in AWS Console
# Or use CloudWatch:
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=<your-api-name> \
  --start-time <timestamp> \
  --end-time <timestamp> \
  --period 3600 \
  --statistics Sum
```

### Monitor DynamoDB
- Check `gg_guild` table metrics for:
  - Read/Write capacity usage
  - Throttling events
  - Query performance

---

## ⚠️ Important Notes

1. **No Database Migration Needed**: The changes use existing DynamoDB table structure
2. **Backward Compatible**: Existing guild features continue to work
3. **API Endpoints**: New endpoints follow RESTful conventions
4. **Translations**: All UI text is localized (English, Spanish, French)
5. **Chat**: Uses existing messaging infrastructure (WebSocket/real-time)

---

## 🐛 Troubleshooting

### Backend Issues
- **Lambda timeout**: Increase timeout if quest progress calculation is slow
- **Permission errors**: Verify Lambda execution role has DynamoDB permissions
- **Import errors**: Check Python dependencies in `requirements.txt`

### Frontend Issues
- **API calls failing**: Verify `VITE_API_GATEWAY_URL` and `VITE_API_GATEWAY_KEY` in build
- **Missing translations**: Ensure `guild.ts` translations are included in build
- **Chat not loading**: Verify WebSocket endpoint configuration

### Database Issues
- **Query errors**: Verify GSI indexes exist and have correct structure
- **Throttling**: Monitor DynamoDB capacity, consider on-demand pricing

---

## 📝 Environment Variables

### Backend (Lambda)
- `GUILD_TABLE_NAME` (default: `gg_guild`)
- `CORE_TABLE_NAME` (default: `gg_core`) - For querying user goals/tasks
- `AWS_REGION`
- `S3_BUCKET_NAME` (for avatars)

### Frontend
- `VITE_API_GATEWAY_URL`
- `VITE_API_GATEWAY_KEY`
- `VITE_WS_ENDPOINT` (for chat, if separate)

---

## ✅ Deployment Complete Checklist

- [ ] Backend Docker image built and pushed to ECR
- [ ] Lambda function updated with new image
- [ ] Frontend built successfully
- [ ] Frontend deployed to S3/CloudFront
- [ ] CloudFront cache invalidated
- [ ] API Gateway routes accessible
- [ ] Guild quests functionality tested
- [ ] Recent activities feed working
- [ ] Analytics displaying correctly
- [ ] Chat integration working
- [ ] No errors in Lambda logs
- [ ] Translations displaying correctly

---

**Last Updated**: Based on implementation completed in this session
**Deployment Target**: AWS Lambda (backend) + S3/CloudFront (frontend)

