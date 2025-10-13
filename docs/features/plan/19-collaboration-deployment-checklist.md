# Collaboration System Deployment Checklist

## 🚀 **Parts That Need to Be Deployed**

Based on the implementation completed, here are the components that require deployment:

## ✅ **1. Backend Collaboration Service (REQUIRED)**

### **What**: FastAPI Lambda Service
### **Location**: `backend/services/collaboration-service/`
### **Status**: ✅ **NEEDS DEPLOYMENT**

### **Deployment Steps**:
```bash
# 1. Build and push Docker image to ECR
cd backend/services/collaboration-service
docker build -t collaboration-service .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag collaboration-service:latest <account>.dkr.ecr.us-east-1.amazonaws.com/collaboration-service:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/collaboration-service:latest

# 2. Deploy via Terraform
cd backend/infra/terraform2
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### **What Gets Deployed**:
- ✅ FastAPI application with all endpoints
- ✅ DynamoDB operations (invite_db.py, collaborator_db.py, comment_db.py, reaction_db.py)
- ✅ Pydantic models and validation
- ✅ Cognito authentication integration
- ✅ CloudWatch logging and monitoring

## ✅ **2. API Gateway Updates (REQUIRED)**

### **What**: New REST API Endpoints
### **Location**: `backend/infra/terraform2/modules/apigateway/`
### **Status**: ✅ **NEEDS DEPLOYMENT**

### **Updated Files**:
- `api_gateway.tf` - Added 11 new methods for comments/reactions
- Method responses and CORS configuration
- Lambda permissions for collaboration service

### **New Endpoints Added**:
```
# Collaboration Management
POST   /collaborations/invites
GET    /collaborations/invites
POST   /collaborations/invites/{id}/accept
POST   /collaborations/invites/{id}/decline
GET    /collaborations/resources/{type}/{id}/collaborators
DELETE /collaborations/resources/{type}/{id}/collaborators/{userId}

# Comment System
POST   /collaborations/comments
GET    /collaborations/comments/{id}
GET    /collaborations/resources/{type}/{id}/comments
PUT    /collaborations/comments/{id}
DELETE /collaborations/comments/{id}

# Reaction System
POST   /collaborations/comments/{id}/reactions
GET    /collaborations/comments/{id}/reactions
```

## ✅ **3. Frontend Updates (REQUIRED)**

### **What**: React Components Integration
### **Location**: `frontend/src/`
### **Status**: ✅ **NEEDS DEPLOYMENT**

### **Updated Files**:
- `pages/goals/GoalDetails.tsx` - Added collaboration components
- `components/quests/QuestDetails.tsx` - Added collaboration components
- `lib/api/collaborations.ts` - Enhanced API client
- `components/collaborations/` - All existing components

### **Deployment Steps**:
```bash
# 1. Build the frontend
cd frontend
npm run build

# 2. Deploy to S3/CloudFront (depending on your setup)
aws s3 sync dist/ s3://your-bucket-name --delete
# Or use your existing deployment process
```

## ✅ **4. DynamoDB Table Updates (OPTIONAL)**

### **What**: Table Schema Extensions
### **Location**: `backend/infra/terraform2/stacks/database/`
### **Status**: ✅ **ALREADY DEPLOYED** (if existing table used)

### **Notes**:
- The `gg_core` table already exists with proper GSIs (GSI1, GSI2, GSI3)
- TTL is already enabled
- No schema changes required (single-table design)
- New entities use existing key patterns

## ✅ **5. Terraform State (REQUIRED)**

### **What**: Infrastructure State Updates
### **Status**: ✅ **NEEDS DEPLOYMENT**

### **Why Required**:
- New API Gateway methods and integrations
- Lambda function for collaboration service
- CloudWatch alarms and monitoring
- IAM permissions and roles

## 📋 **Complete Deployment Checklist**

### **Pre-Deployment Verification**
- [ ] AWS CLI configured with deployment permissions
- [ ] ECR repository exists for collaboration service
- [ ] DynamoDB table `gg_core` exists
- [ ] Cognito User Pool configured
- [ ] API Gateway exists
- [ ] S3 bucket for frontend deployment ready

### **Backend Deployment**
- [ ] Build Docker image for collaboration service
- [ ] Push image to ECR
- [ ] Run Terraform plan for infrastructure changes
- [ ] Apply Terraform changes
- [ ] Verify Lambda function deployed
- [ ] Check CloudWatch logs for successful startup

### **API Gateway Deployment**
- [ ] Verify new endpoints appear in API Gateway console
- [ ] Test endpoint accessibility
- [ ] Check CORS configuration
- [ ] Validate authorizer integration

### **Frontend Deployment**
- [ ] Build React application
- [ ] Upload to S3/CloudFront
- [ ] Verify component imports work
- [ ] Test page navigation

### **Post-Deployment Testing**
- [ ] Health check endpoint: `GET /collaborations/health`
- [ ] Basic invite creation: `POST /collaborations/invites`
- [ ] Frontend components load without errors
- [ ] API calls succeed from frontend

## 🔍 **Deployment Order**

### **Phase 1: Infrastructure (30 minutes)**
1. Deploy collaboration service Lambda
2. Update API Gateway configuration
3. Verify backend endpoints accessible

### **Phase 2: Frontend (15 minutes)**
1. Deploy updated React application
2. Test component integration
3. Verify API communication

### **Phase 3: Testing (2-4 hours)**
1. Execute test scenarios from integration document
2. Verify end-to-end functionality
3. Performance and accessibility testing

## ⚠️ **Critical Dependencies**

### **Must Be Deployed First**:
1. **DynamoDB Table**: `gg_core` with GSIs (already exists)
2. **Cognito User Pool**: For authentication (already exists)
3. **API Gateway**: Base infrastructure (already exists)

### **Can Be Deployed Independently**:
1. **Collaboration Service**: Backend logic
2. **Frontend**: UI components

## 🚨 **Rollback Plan**

### **If Issues Found**:
1. **API Gateway**: Remove new methods via Terraform
2. **Lambda**: Delete collaboration service function
3. **Frontend**: Revert to previous build
4. **Database**: No changes needed (additive only)

### **Safe Rollback**:
- All changes are additive (no breaking changes)
- New endpoints don't affect existing functionality
- Frontend gracefully handles missing backend features

## 📊 **Deployment Impact**

### **Risk Level**: 🟢 **LOW**
- No breaking changes to existing functionality
- Additive features only
- Graceful degradation if components fail

### **Downtime**: 🟢 **NONE**
- Backend deployed independently
- Frontend deployed independently
- No service interruptions

### **Testing Required**: 🟡 **MODERATE**
- 8 comprehensive test scenarios
- 2-4 hours of manual testing
- Accessibility and performance validation

## 🎯 **Success Criteria**

### **Backend Deployment Success**:
- Lambda function active and healthy
- All 11 new API endpoints responding
- CloudWatch logs showing successful initialization
- DynamoDB connectivity confirmed

### **Frontend Deployment Success**:
- React build completes without errors
- Collaboration components load on Goal/Quest pages
- API calls succeed from frontend
- No console errors in browser

### **End-to-End Success**:
- User can send collaboration invites
- Invites can be accepted/declined
- Comments and reactions work
- Mobile and accessibility features functional

---

## 📋 **Quick Deployment Commands**

```bash
# 1. Backend deployment
cd backend/infra/terraform2
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# 2. Frontend deployment
cd frontend
npm run build
# Deploy dist/ to your hosting solution

# 3. Health check
curl -H "Authorization: Bearer <token>" \
  https://api.goalsguild.com/collaborations/health
```

**Total Deployment Time**: ~45 minutes + testing  
**Risk Level**: Low  
**Rollback Available**: Yes  

**Status**: 🔄 **READY FOR DEPLOYMENT**
