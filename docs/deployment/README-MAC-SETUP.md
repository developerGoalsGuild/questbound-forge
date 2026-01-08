# Mac Setup and Deployment Guide

## Prerequisites Setup

### 1. Install Terraform

```bash
# Using Homebrew (recommended)
brew install terraform

# Or download from https://www.terraform.io/downloads
# Extract and add to PATH
```

Verify installation:
```bash
terraform version
```

### 2. Configure AWS Credentials

**Quick Setup:**
```bash
cd backend/infra/terraform2/scripts
./get-aws-credentials.sh --configure
```

**Or manually:**
```bash
# Configure AWS CLI
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-2)
# - Default output format (json)
```

**Check credentials status:**
```bash
./get-aws-credentials.sh
```

**Test credentials:**
```bash
./get-aws-credentials.sh --test
```

**Renew expired SSO tokens (automatic on test):**
```bash
./get-aws-credentials.sh --renew
```

**View setup instructions:**
```bash
./get-aws-credentials.sh --setup
```

**Note:** The script automatically detects and renews expired AWS SSO tokens when testing credentials. Use `--no-auto-renew` to disable this behavior.

### 3. Verify All Tools

Run the environment check script:
```bash
cd backend/infra/terraform2/scripts
./check-environment.sh
```

This will verify:
- ✅ Terraform is installed
- ✅ AWS CLI is installed and configured
- ✅ Python 3 is available
- ✅ Node.js and npm are installed
- ✅ Docker is installed and running
- ✅ Environment configuration files exist

## Deployment

### Quick Start - Deploy Everything

```bash
cd backend/infra/terraform2/scripts
./deploy-all-with-build.sh -e dev
```

### Deploy Individual Stacks

#### Infrastructure Stacks (in order):
1. Database
```bash
./deploy-database.sh -e dev
```

2. Security
```bash
./deploy-security.sh -e dev
```

3. ECR
```bash
./deploy-ecr.sh -e dev
```

4. Authorizer
```bash
./deploy-authorizer.sh -e dev
```

5. S3
```bash
./deploy-s3.sh -e dev
```

6. AppSync
```bash
./deploy-appsync.sh -e dev
```

7. API Gateway
```bash
./deploy-apigateway.sh -e dev
```

### Deploy Individual Services

```bash
# User Service
./deploy-user-service-with-build.sh -e dev

# Quest Service
./deploy-quest-service-with-build.sh -e dev

# Subscription Service
./deploy-subscription-service-with-build.sh -e dev

# Collaboration Service
./deploy-collaboration-service-with-build.sh -e dev

# Guild Service
./deploy-guild-service-with-build.sh -e dev

# Messaging Service
./deploy-messaging-service-with-build.sh -e dev

# Gamification Service
./deploy-gamification-service-with-build.sh -e dev
```

## Script Options

All scripts support the following options:

- `-e, --env <environment>` - Environment to deploy (dev, staging, prod) [default: dev]
- `-p, --plan` - Only run terraform plan, don't apply changes
- `-n, --no-approve` - Don't auto-approve terraform apply [default: auto-approve]
- `-s, --skip-init` - Skip terraform init step
- `-l, --log-path <path>` - Custom path for terraform log file
- `-h, --help` - Show help message

## Examples

### Preview changes before deploying:
```bash
./deploy-all-with-build.sh -e dev -p
```

### Deploy only infrastructure (skip services):
```bash
./deploy-all-with-build.sh -e dev --infrastructure-only
```

### Deploy only services (skip infrastructure):
```bash
./deploy-all-with-build.sh -e dev --services-only
```

### Deploy specific service:
```bash
./deploy-all-with-build.sh -e dev --service user-service --service quest-service
```

### Deploy to production (with confirmation):
```bash
./deploy-all-with-build.sh -e prod -n
```

## Troubleshooting

### Terraform not found
```bash
# Install via Homebrew
brew install terraform

# Or add to PATH if installed manually
export PATH=$PATH:/path/to/terraform
```

### AWS credentials not configured
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Docker not running
```bash
# Start Docker Desktop or Docker daemon
open -a Docker
```

### Permission denied on scripts
```bash
chmod +x backend/infra/terraform2/scripts/*.sh
```

## Notes

- All scripts use Mac-compatible paths and commands
- Logs are stored in `~/terraform-logs/` by default
- Service Docker images are automatically versioned and pushed to ECR
- The master deployment script handles dependencies and deployment order automatically

