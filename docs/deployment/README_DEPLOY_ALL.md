# Master Deployment Script - deploy-all-with-build.ps1

This script orchestrates the complete deployment of all GoalsGuild services and infrastructure stacks.

## Overview

The `deploy-all-with-build.ps1` script provides a unified way to deploy:
- **All Infrastructure Stacks**: database, security, authorizer, s3, appsync, apigateway
- **All Services**: user-service, quest-service, subscription-service, collaboration-service, guild-service, messaging-service

## Usage

### Basic Usage

Deploy everything to the default environment (dev):

```powershell
.\deploy-all-with-build.ps1
```

### Deploy to Specific Environment

```powershell
# Development
.\deploy-all-with-build.ps1 -Env dev

# Staging
.\deploy-all-with-build.ps1 -Env staging

# Production
.\deploy-all-with-build.ps1 -Env prod
```

### Deploy Only Services

Skip infrastructure stacks and deploy only services:

```powershell
.\deploy-all-with-build.ps1 -ServicesOnly
```

### Deploy Only Infrastructure

Skip services and deploy only infrastructure stacks:

```powershell
.\deploy-all-with-build.ps1 -InfrastructureOnly
```

### Deploy Specific Services

Deploy only selected services:

```powershell
.\deploy-all-with-build.ps1 -Services @("quest-service", "subscription-service")
```

### Deploy Specific Stacks

Deploy only selected infrastructure stacks:

```powershell
.\deploy-all-with-build.ps1 -Stacks @("database", "security")
```

### Terraform Plan Only

Preview changes without applying:

```powershell
.\deploy-all-with-build.ps1 -PlanOnly
```

### Manual Approval

Require manual approval for each Terraform apply:

```powershell
.\deploy-all-with-build.ps1 -AutoApprove:$false
```

### Skip Terraform Init

Skip `terraform init` (useful for faster subsequent runs):

```powershell
.\deploy-all-with-build.ps1 -SkipInit
```

## Deployment Order

The script deploys components in the following order:

### Phase 1: Infrastructure Stacks
1. **database** - DynamoDB tables
2. **security** - Cognito, IAM roles, SSM parameters
3. **authorizer** - Lambda authorizer for API Gateway
4. **s3** - S3 buckets for static assets
5. **appsync** - AppSync GraphQL API
6. **apigateway** - API Gateway REST API

### Phase 2: Services
1. **user-service** - User management service
2. **quest-service** - Quest management service
3. **subscription-service** - Subscription and billing service
4. **collaboration-service** - Collaboration features service
5. **guild-service** - Guild management service
6. **messaging-service** - Messaging service

## Service Deployment

Each service deployment:
1. Builds a Docker image with auto-incrementing version
2. Pushes the image to ECR
3. Deploys the service via Terraform

The script uses the individual service deployment scripts:
- `deploy-user-service-with-build.ps1`
- `deploy-quest-service-with-build.ps1`
- `deploy-subscription-service-with-build.ps1`
- `deploy-collaboration-service-with-build.ps1`
- `deploy-guild-service-with-build.ps1`
- `deploy-messaging-service-with-build.ps1`

## Infrastructure Stack Deployment

Each infrastructure stack:
1. Runs `terraform init -upgrade`
2. Runs `terraform plan` (if `-PlanOnly` is specified)
3. Runs `terraform apply` (with or without `-auto-approve`)

## Error Handling

- If a service deployment fails, the script logs the error and continues with remaining services
- If an infrastructure stack deployment fails, the script logs the error and continues with remaining stacks
- A summary is displayed at the end showing which deployments succeeded and which failed
- Exit code 0 = all succeeded, Exit code 1 = some failed

## Logging

All deployment activities are logged to:
- Console output (with color coding)
- Log file: `D:\terraformlogs\tf-master-deploy.log`
- Terraform debug logs: `D:\terraformLogs\tf-master-deploy.log`

## Examples

### Full Deployment to Dev

```powershell
.\deploy-all-with-build.ps1 -Env dev
```

### Deploy Only Subscription Service

```powershell
.\deploy-all-with-build.ps1 -ServicesOnly -Services @("subscription-service")
```

### Preview All Changes

```powershell
.\deploy-all-with-build.ps1 -PlanOnly
```

### Deploy Infrastructure and Specific Services

```powershell
.\deploy-all-with-build.ps1 -Stacks @("database", "security") -Services @("quest-service", "subscription-service")
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed and running
- Terraform installed (v1.x+)
- PowerShell 5.1+ (Windows)
- All service deployment scripts available in `backend/infra/terraform2/scripts/` or `backend/services/<service-name>/`
- Environment-specific `.tfvars` files in `backend/infra/terraform2/environments/`

## Notes

- The script automatically detects the repository root and resolves paths
- Service deployment scripts must follow the naming convention: `deploy-<service-name>-with-build.ps1`
- Infrastructure stacks must be in `backend/infra/terraform2/stacks/`
- Environment files must be in `backend/infra/terraform2/environments/` as `<env>.tfvars`

## Troubleshooting

### Service Script Not Found

If a service deployment script is not found, the script will:
- Log a warning
- Skip that service
- Continue with remaining services

### Stack Path Not Found

If an infrastructure stack path is not found, the script will:
- Log a warning
- Skip that stack
- Continue with remaining stacks

### Terraform Errors

If Terraform fails for a stack or service:
- The error is logged
- The script continues with remaining deployments
- Check the Terraform log file for detailed error messages

### Docker Build Failures

If Docker build fails for a service:
- The error is logged
- The service deployment is skipped
- Other services continue to deploy

## Related Scripts

- Individual service deployment scripts in `backend/infra/terraform2/scripts/`
- Infrastructure deployment script: `backend/infra/terraform2/scripts/deploy.ps1`
- Service-specific deployment scripts in `backend/services/<service-name>/`

