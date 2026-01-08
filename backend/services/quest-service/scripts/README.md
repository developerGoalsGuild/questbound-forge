# Quest Service Environment Setup Scripts

This directory contains scripts to set up the environment variables needed for the Quest service to run locally.

## 📁 **Scripts Overview**

### **1. `setup-env-variables.ps1`** (PowerShell - Recommended)
- Sets up permanent environment variables for Windows
- Creates `.env` files for local development
- Provides detailed feedback and verification
- **Usage**: Run as Administrator in PowerShell

### **2. `setup-env-variables.bat`** (Batch - Alternative)
- Simple batch script for basic setup
- Sets permanent environment variables
- **Usage**: Run as Administrator in Command Prompt

### **3. `verify-env-variables.ps1`** (Verification)
- Verifies all environment variables are set correctly
- Tests Python imports and AWS connection
- **Usage**: Run anytime to check configuration

## 🚀 **Quick Setup**

### **Option 1: PowerShell (Recommended)**
```powershell
# Run as Administrator
cd backend/services/quest-service/scripts
.\setup-env-variables.ps1
```

### **Option 2: Batch Script**
```cmd
# Run as Administrator
cd backend/services/quest-service/scripts
setup-env-variables.bat
```

### **Option 3: Manual Setup**
```powershell
# Set individual variables
[Environment]::SetEnvironmentVariable("AWS_DEFAULT_REGION", "us-east-2", "User")
[Environment]::SetEnvironmentVariable("CORE_TABLE", "gg_core_test", "User")
# ... (see script for full list)
# Note: AWS credentials should be set via AWS credentials file
```

## 🔍 **Verification**

After running the setup script, verify everything is working:

```powershell
# Verify environment variables
.\verify-env-variables.ps1

# Test Python imports
python -c "from app.settings import Settings; print('✅ OK')"

# Test Quest service startup
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📋 **Environment Variables Set**

### **AWS Configuration**
- `AWS_DEFAULT_REGION` - AWS region (us-east-2)
- `AWS_REGION` - AWS region (us-east-2)
- **Note**: AWS credentials should be set via AWS credentials file (~/.aws/credentials)

### **DynamoDB Configuration**
- `CORE_TABLE` - DynamoDB table name (gg_core_test)
- `AWS_ENDPOINT_URL` - Local DynamoDB endpoint (http://localhost:8000)

### **Quest Service Configuration**
- `QUEST_SERVICE_ENV_VARS` - JSON configuration for the service
- `QUEST_SERVICE_ROOT_PATH` - API root path (/DEV)
- `QUEST_LOG_ENABLED` - Enable logging (true)
- `SETTINGS_SSM_PREFIX` - SSM parameter prefix

### **Authentication Configuration**
- `JWT_AUDIENCE` - JWT audience (api://test)
- `JWT_ISSUER` - JWT issuer (https://auth.test)
- `COGNITO_REGION` - Cognito region (us-east-2)
- `COGNITO_USER_POOL_ID` - Cognito user pool ID (test-pool)
- `COGNITO_CLIENT_ID` - Cognito client ID (test-client)
- `ALLOWED_ORIGINS` - CORS allowed origins (http://localhost:3000)
- `QUEST_SERVICE_JWT_SECRET` - JWT secret key for testing

### **Manual Configuration Required**
These variables should be set manually in your environment:
- `GOALSGUILD_USER` - Test user email/username for login
- `GOALSGUILD_PASSWORD` - Test user password for login
- `VITE_API_GATEWAY_URL` - API Gateway URL for testing
- `VITE_API_GATEWAY_KEY` - API Gateway key for testing
- `QUEST_SERVICE_JWT_SECRET` - JWT secret key for token validation
- `QUEST_SERVICE_ENV_VARS` - JSON configuration for the quest service

### **Test Configuration**
- `TEST_CORE_TABLE` - Test DynamoDB table name
- `TEST_AWS_REGION` - Test AWS region
- `TEST_USER_ID` - Default test user ID
- `TEST_QUEST_PREFIX` - Quest ID prefix for tests
- `TEST_GOAL_PREFIX` - Goal ID prefix for tests
- `TEST_TASK_PREFIX` - Task ID prefix for tests

## ⚠️ **Important Notes**

### **AWS Credentials**
- AWS credentials should be set via AWS credentials file (~/.aws/credentials)
- Use `aws configure` to set up your AWS credentials
- For local testing, consider using DynamoDB Local

### **Local Development**
- The scripts configure the service to use DynamoDB Local by default
- Install DynamoDB Local: `npm install -g dynamodb-local`
- Start DynamoDB Local: `dynamodb-local`

### **Production Deployment**
- Use real AWS credentials via credentials file
- Set proper environment variables
- Configure actual DynamoDB table names
- Use real JWT secrets and Cognito configuration

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. "Access Denied" Error**
- **Problem**: Script can't set environment variables
- **Solution**: Run PowerShell as Administrator

#### **2. "Python Import Error"**
- **Problem**: Python can't import Quest modules
- **Solution**: 
  ```bash
  cd backend/services/quest-service
  python -c "from app.settings import Settings; print('OK')"
  ```

#### **3. "AWS Connection Error"**
- **Problem**: AWS credentials not working
- **Solution**: 
  - For local development: Use DynamoDB Local
  - For real AWS: Replace with actual credentials

#### **4. "Environment Variables Not Set"**
- **Problem**: Variables not visible after script
- **Solution**: 
  - Restart your terminal/PowerShell
  - Check with `echo $env:AWS_ACCESS_KEY_ID`

### **Verification Steps**

1. **Check Environment Variables**
   ```powershell
   [Environment]::GetEnvironmentVariable("AWS_ACCESS_KEY_ID", "User")
   ```

2. **Test Python Imports**
   ```bash
   python -c "from app.settings import Settings; s = Settings(); print(s.core_table_name)"
   ```

3. **Test Quest Service**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Run Tests**
   ```bash
   python tests/quest/run_tests.py
   ```

## 📚 **Additional Resources**

- [AWS Environment Variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [FastAPI Environment Variables](https://fastapi.tiangolo.com/advanced/settings/)
- [Quest Service Documentation](../README.md)

## 🎯 **Next Steps**

After running the setup scripts:

1. **Start DynamoDB Local** (if using local DB)
2. **Start Quest Service**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
3. **Run Tests**: `python tests/quest/run_tests.py`
4. **Test API**: Use Postman collection or curl commands
5. **Develop**: Start building Quest features!

---

**Note**: These scripts are designed for local development only. For production deployment, use proper AWS credentials and configuration management.
