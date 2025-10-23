# Messaging Service Deployment Guide

## 🚀 **Quick Start**

### **Option 1: Automated Deployment (Recommended)**

```powershell
# Deploy to dev environment
.\scripts\deploy-messaging-service-with-build.ps1 -Env dev

# Deploy to staging environment  
.\scripts\deploy-messaging-service-with-build.ps1 -Env staging

# Deploy to production environment
.\scripts\deploy-messaging-service-with-build.ps1 -Env prod
```

### **Option 2: Manual Deployment**

1. **Build and Push Docker Image**:
   ```bash
   cd backend/services/messaging-service
   docker build -t goalsguild_messaging_service .
   docker tag goalsguild_messaging_service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/goalsguild_messaging_service:latest
   ```

2. **Configure Terraform**:
   ```bash
   cd backend/infra/terraform2/stacks/services/messaging-service
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Deploy Infrastructure**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## 📋 **Prerequisites**

### **Required Infrastructure**
- ✅ Database stack deployed (DynamoDB tables)
- ✅ Security stack deployed (IAM roles)
- ✅ VPC configuration (subnets, security groups)
- ✅ ECR repository created

### **Required Tools**
- ✅ AWS CLI configured
- ✅ Docker installed
- ✅ Terraform installed
- ✅ PowerShell (for automated deployment)

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Required
VPC_ID=vpc-xxxxxxxxx
VPC_CIDR=10.0.0.0/16
PUBLIC_SUBNET_IDS=subnet-xxxxxxxxx,subnet-yyyyyyyyy
PRIVATE_SUBNET_IDS=subnet-zzzzzzzzz,subnet-aaaaaaaaa
JWT_SECRET=your-jwt-secret-here

# Optional
TASK_CPU=256
TASK_MEMORY=512
DESIRED_COUNT=1
```

### **Terraform Variables**
```hcl
environment = "dev"
aws_region  = "us-east-1"
vpc_id   = "vpc-xxxxxxxxx"
vpc_cidr = "10.0.0.0/16"
public_subnet_ids = ["subnet-xxxxxxxxx", "subnet-yyyyyyyyy"]
private_subnet_ids = ["subnet-zzzzzzzzz", "subnet-aaaaaaaaa"]
jwt_secret = "your-jwt-secret-here"
```

## 🧪 **Testing**

### **Health Check**
```bash
curl http://your-alb-dns-name/health
```

### **WebSocket Connection**
```javascript
const ws = new WebSocket('ws://your-alb-dns-name/ws/rooms/ROOM-test?token=your-jwt-token');
```

### **Message Sending**
```javascript
ws.send(JSON.stringify({
  type: 'message',
  text: 'Hello World',
  roomId: 'ROOM-test'
}));
```

## 📊 **Monitoring**

### **CloudWatch Logs**
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/goalsguild"
```

### **ECS Service Status**
```bash
aws ecs describe-services --cluster goalsguild-dev-messaging-service --services goalsguild-dev-messaging-service
```

### **ALB Health**
```bash
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Database Connection Failed**
   - Check DynamoDB table permissions
   - Verify table names in environment variables

2. **WebSocket Connection Failed**
   - Check ALB configuration
   - Verify security group rules
   - Test health endpoint

3. **Authentication Failed**
   - Verify JWT secret in Secrets Manager
   - Check token validation logic

4. **Rate Limiting Issues**
   - Check rate limiting configuration
   - Verify user permissions

### **Debug Commands**

```bash
# Check ECS service status
aws ecs describe-services --cluster goalsguild-dev-messaging-service

# Check CloudWatch logs
aws logs tail /aws/ecs/goalsguild-dev-messaging-service --follow

# Test ALB health
curl -v http://your-alb-dns-name/health

# Check DynamoDB permissions
aws dynamodb describe-table --table-name gg_core
```

## 📈 **Scaling**

### **Horizontal Scaling**
```bash
# Update desired count
terraform apply -var="desired_count=3"
```

### **Vertical Scaling**
```bash
# Update CPU and memory
terraform apply -var="task_cpu=512" -var="task_memory=1024"
```

### **Auto Scaling**
Configure ECS auto scaling policies for automatic scaling based on CPU/memory usage.

## 🔒 **Security**

### **Network Security**
- ALB in public subnets
- ECS service in private subnets
- Security groups restrict traffic

### **Authentication**
- JWT tokens for WebSocket authentication
- Rate limiting to prevent abuse
- Guild membership validation

### **Data Protection**
- Secrets stored in AWS Secrets Manager
- Encrypted data in transit
- DynamoDB encryption at rest

## 📝 **Outputs**

After deployment, you'll get:
- **HTTP URL**: `http://your-alb-dns-name`
- **WebSocket URL**: `ws://your-alb-dns-name/ws`
- **ECR Repository**: For Docker images
- **CloudWatch Logs**: For monitoring
- **Security Groups**: For network access

## 🎯 **Next Steps**

1. **Deploy the messaging service**
2. **Configure frontend to use WebSocket URL**
3. **Test real-time messaging**
4. **Monitor performance and logs**
5. **Scale as needed**

## 📞 **Support**

For issues or questions:
- Check CloudWatch logs
- Review Terraform state
- Test individual components
- Verify AWS permissions
