# ECR Repository Creation Guide

## 🚀 **Quick Start**

### **Option 1: PowerShell (Windows)**

```powershell
# Create ECR repository for dev environment
.\scripts\create-messaging-service-ecr.ps1 -Env dev

# Create ECR repository for staging environment
.\scripts\create-messaging-service-ecr.ps1 -Env staging

# Create ECR repository for production environment
.\scripts\create-messaging-service-ecr.ps1 -Env prod
```

### **Option 2: Bash (Linux/macOS)**

```bash
# Create ECR repository for dev environment
./scripts/create-messaging-service-ecr.sh --env dev

# Create ECR repository for staging environment
./scripts/create-messaging-service-ecr.sh --env staging

# Create ECR repository for production environment
./scripts/create-messaging-service-ecr.sh --env prod
```

### **Option 3: Manual Terraform**

```bash
# Navigate to messaging service stack
cd backend/infra/terraform2/stacks/services/messaging-service

# Initialize Terraform
terraform init

# Plan the ECR repository creation
terraform plan -var-file ../../environments/dev.tfvars -target=aws_ecr_repository.messaging_service

# Apply the ECR repository creation
terraform apply -var-file ../../environments/dev.tfvars -target=aws_ecr_repository.messaging_service
```

## 📋 **Prerequisites**

### **Required Tools**
- ✅ AWS CLI configured with appropriate permissions
- ✅ Terraform installed
- ✅ PowerShell (for Windows) or Bash (for Linux/macOS)

### **Required Permissions**
- ✅ ECR repository creation permissions
- ✅ Terraform state bucket access
- ✅ IAM role creation permissions (if needed)

## 🔧 **Configuration**

### **Environment Variables**
The scripts will use the environment files in `backend/infra/terraform2/environments/`:
- `dev.tfvars` - Development environment
- `staging.tfvars` - Staging environment  
- `prod.tfvars` - Production environment

### **Required Variables**
```hcl
environment = "dev"
aws_region  = "us-east-1"
jwt_secret = "your-jwt-secret-here"
```

## 🧪 **Testing**

### **Verify ECR Repository Creation**
```bash
# List ECR repositories
aws ecr describe-repositories --repository-names goalsguild_messaging_service

# Check repository details
aws ecr describe-repositories --repository-names goalsguild_messaging_service --query 'repositories[0]'
```

### **Test Docker Login**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Test push (after building image)
docker tag messaging-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
```

## 📊 **Expected Results**

After successful creation, you'll have:

### **ECR Repository**
- **Name**: `goalsguild_messaging_service`
- **URI**: `123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service`
- **Image Scanning**: Enabled
- **Tag Mutability**: Mutable

### **Terraform Outputs**
- Repository URL
- Repository ARN
- Registry ID

## 🔍 **Troubleshooting**

### **Common Issues**

1. **AWS CLI Not Configured**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and region
   ```

2. **Insufficient Permissions**
   ```bash
   # Check your AWS permissions
   aws sts get-caller-identity
   ```

3. **Terraform State Issues**
   ```bash
   # Check Terraform state
   terraform -chdir=stacks/services/messaging-service state list
   ```

4. **Environment File Missing**
   ```bash
   # Create environment file
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your values
   ```

### **Debug Commands**

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check ECR permissions
aws ecr describe-repositories

# Check Terraform state
terraform -chdir=stacks/services/messaging-service state show aws_ecr_repository.messaging_service

# Check Terraform plan
terraform -chdir=stacks/services/messaging-service plan -var-file ../../environments/dev.tfvars -target=aws_ecr_repository.messaging_service
```

## 📝 **Next Steps**

After creating the ECR repository:

1. **Build and Push Docker Image**:
   ```bash
   # Build the messaging service image
   docker build -f services/messaging-service/Dockerfile -t goalsguild_messaging_service .
   
   # Tag for ECR
   docker tag goalsguild_messaging_service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
   
   # Push to ECR
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
   ```

2. **Deploy Full Service**:
   ```powershell
   # Deploy the complete messaging service
   .\scripts\deploy-messaging-service-with-build.ps1 -Env dev
   ```

3. **Test the Service**:
   ```bash
   # Test the Lambda function URL
   curl https://your-function-url.lambda-url.region.on.aws/health
   ```

## 🎯 **Success Criteria**

The ECR repository creation is successful when:
- ✅ ECR repository exists in AWS
- ✅ Repository has correct name: `goalsguild_messaging_service`
- ✅ Image scanning is enabled
- ✅ Terraform state is updated
- ✅ Docker login works
- ✅ Image push succeeds

## 📞 **Support**

For issues or questions:
- Check AWS CloudTrail logs
- Review Terraform state
- Verify AWS permissions
- Test Docker commands manually
