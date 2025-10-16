# S3 Stack Deployment Script

This PowerShell script provides a dedicated way to deploy only the S3 stack for guild avatar storage, independent of the main deployment process.

## Overview

The `deploy-s3.ps1` script is designed to:
- Deploy only the S3 stack for guild avatar storage
- Support all environments (dev, staging, prod, local, test)
- Provide detailed logging and error handling
- Display stack outputs after successful deployment
- Support both plan and apply operations

## Usage

### Basic Usage

```powershell
# Deploy S3 stack for development environment
.\deploy-s3.ps1 -Env dev

# Deploy S3 stack for production environment
.\deploy-s3.ps1 -Env prod

# Deploy S3 stack for staging environment
.\deploy-s3.ps1 -Env staging
```

### Advanced Usage

```powershell
# Plan only (don't apply changes)
.\deploy-s3.ps1 -Env dev -PlanOnly

# Deploy without auto-approve (interactive)
.\deploy-s3.ps1 -Env dev -AutoApprove:$false

# Skip terraform init (faster for repeated deployments)
.\deploy-s3.ps1 -Env dev -SkipInit

# Custom log path
.\deploy-s3.ps1 -Env dev -TfLogPath "C:\logs\s3-deploy.log"
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Env` | string | "dev" | Environment to deploy (dev, staging, prod, local, test) |
| `PlanOnly` | switch | false | Only run terraform plan, don't apply changes |
| `AutoApprove` | switch | true | Automatically approve terraform apply |
| `SkipInit` | switch | false | Skip terraform init step |
| `TfLogPath` | string | "D:\terraformLogs\tf-s3.log" | Path for terraform log file |

## Prerequisites

### Required Tools
- **PowerShell 5.1+** or **PowerShell Core 6+**
- **Terraform 1.0+** installed and in PATH
- **AWS CLI** configured with appropriate credentials

### Required Permissions
The AWS credentials must have the following permissions:
- `s3:CreateBucket`
- `s3:DeleteBucket`
- `s3:GetBucket*`
- `s3:PutBucket*`
- `s3:PutBucketVersioning`
- `s3:PutBucketEncryption`
- `s3:PutBucketPublicAccessBlock`
- `s3:PutBucketCors`
- `s3:PutBucketLifecycleConfiguration`
- `s3:GetBucketLocation`
- `s3:ListBucket`

### Environment Files
The script requires environment-specific variable files in the `environments/` directory:
- `dev.tfvars` - Development environment
- `staging.tfvars` - Staging environment
- `prod.tfvars` - Production environment
- `local.tfvars` - Local development environment
- `test.tfvars` - Testing environment

## Features

### Logging
- **Console Output**: Real-time status updates with color coding
- **File Logging**: Detailed logs saved to `D:\terraformlogs\tf-s3-deploy.log`
- **Terraform Logs**: Debug-level terraform logs saved to `D:\terraformLogs\tf-s3.log`

### Error Handling
- **Comprehensive Error Catching**: All operations wrapped in try-catch blocks
- **AWS Validation**: Verifies AWS credentials and account information
- **File Validation**: Checks for required environment files and directories
- **Exit Codes**: Proper exit codes for CI/CD integration

### Output Display
- **Stack Outputs**: Automatically displays terraform outputs after successful deployment
- **AWS Information**: Shows AWS account ID and region being used
- **Environment Details**: Displays which environment file is being used

## Examples

### Development Deployment
```powershell
# Quick development deployment
.\deploy-s3.ps1 -Env dev

# Development deployment with plan first
.\deploy-s3.ps1 -Env dev -PlanOnly
.\deploy-s3.ps1 -Env dev
```

### Production Deployment
```powershell
# Production deployment (always plan first!)
.\deploy-s3.ps1 -Env prod -PlanOnly
.\deploy-s3.ps1 -Env prod -AutoApprove:$false
```

### Testing
```powershell
# Test environment deployment
.\deploy-s3.ps1 -Env test

# Local development
.\deploy-s3.ps1 -Env local
```

### CI/CD Integration
```powershell
# For CI/CD pipelines
.\deploy-s3.ps1 -Env $env:ENVIRONMENT -AutoApprove -SkipInit
```

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Configured**
   ```
   Error: AWS credentials not configured properly
   Solution: Run `aws configure` to set up credentials
   ```

2. **Environment File Not Found**
   ```
   Error: Environment file not found: environments/dev.tfvars
   Solution: Ensure the environment file exists in the environments/ directory
   ```

3. **Terraform Init Failed**
   ```
   Error: Terraform init failed
   Solution: Check terraform version and AWS provider configuration
   ```

4. **Insufficient Permissions**
   ```
   Error: Access denied when calling CreateBucket
   Solution: Ensure AWS credentials have required S3 permissions
   ```

### Debug Mode

To enable detailed debugging:
```powershell
# Set environment variable for more verbose output
$env:TF_LOG = "DEBUG"
$env:TF_LOG_PATH = "C:\logs\terraform-debug.log"
.\deploy-s3.ps1 -Env dev
```

### Log Files

- **Script Logs**: `D:\terraformlogs\tf-s3-deploy.log`
- **Terraform Logs**: `D:\terraformLogs\tf-s3.log`
- **Custom Logs**: Use `-TfLogPath` parameter to specify custom location

## Integration

### With Main Deployment
This script can be used alongside the main deployment script:
```powershell
# Deploy S3 stack first
.\deploy-s3.ps1 -Env dev

# Then deploy other stacks
.\deploy.ps1 -Env dev
```

### With CI/CD Pipelines
```yaml
# Example GitHub Actions step
- name: Deploy S3 Stack
  run: |
    .\scripts\deploy-s3.ps1 -Env ${{ env.ENVIRONMENT }} -AutoApprove
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Security Considerations

- **Credentials**: Never commit AWS credentials to version control
- **Permissions**: Use least-privilege IAM policies
- **Logs**: Ensure log files don't contain sensitive information
- **Environment Files**: Keep environment files secure and encrypted if needed

## Support

For issues or questions:
1. Check the log files for detailed error information
2. Verify AWS credentials and permissions
3. Ensure all prerequisites are met
4. Check the main deployment documentation for additional context

## Changelog

- **v1.0.0**: Initial release with basic S3 stack deployment functionality
- Support for all environments (dev, staging, prod, local, test)
- Comprehensive logging and error handling
- Integration with existing environment file structure

