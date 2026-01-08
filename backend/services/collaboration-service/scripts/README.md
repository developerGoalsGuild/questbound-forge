# Collaboration Service Scripts

This directory contains scripts for setting up and managing the Collaboration Service environment.

## Scripts Overview

### `setup-env-variables.ps1`
Sets up environment variables in AWS SSM Parameter Store.

**Parameters:**
- `Environment`: Environment name (default: "dev")
- `Region`: AWS region (default: "us-east-2")
- `DryRun`: Show what would be done without making changes

**Usage:**
```powershell
# Setup for dev environment
.\setup-env-variables.ps1 -Environment dev

# Dry run to see what would be changed
.\setup-env-variables.ps1 -Environment dev -DryRun

# Setup for different region
.\setup-env-variables.ps1 -Environment staging -Region us-west-2
```

**SSM Parameter Created:**
- Path: `/goalsguild/collaboration-service/env_vars`
- Type: String
- Content: JSON with environment variables

### `setup-jwt-secret.ps1`
Sets up the JWT secret in AWS SSM Parameter Store.

**Parameters:**
- `Environment`: Environment name (default: "dev")
- `Region`: AWS region (default: "us-east-2")
- `JwtSecret`: JWT secret value (default: "test-secret-key-for-development-only")
- `DryRun`: Show what would be done without making changes

**Usage:**
```powershell
# Setup with default JWT secret
.\setup-jwt-secret.ps1 -Environment dev

# Setup with custom JWT secret
.\setup-jwt-secret.ps1 -Environment dev -JwtSecret "my-custom-secret"

# Dry run
.\setup-jwt-secret.ps1 -Environment dev -DryRun
```

**SSM Parameter Created/Updated:**
- Path: `/goalsguild/user-service/JWT_SECRET`
- Type: SecureString
- Note: This is the same parameter used by user-service, quest-service, and collaboration-service

## Environment Variables

The `env_vars` JSON contains the following configuration:

```json
{
  "CORE_TABLE": "gg_core",
  "JWT_AUDIENCE": "api://test",
  "JWT_ISSUER": "https://auth.test",
  "DYNAMODB_TABLE_NAME": "gg_core",
  "AWS_REGION": "us-east-2",
  "ENVIRONMENT": "dev",
  "LOG_LEVEL": "INFO",
  "CORS_MAX_AGE": "3600",
  "RATE_LIMIT_REQUESTS_PER_HOUR": "1000",
  "CACHE_TTL_SECONDS": "300",
  "MAX_INVITES_PER_USER_PER_HOUR": "20",
  "MAX_COMMENTS_PER_USER_PER_HOUR": "100"
}
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- SSM:PutParameter permission
- SSM:GetParameter permission

## Next Steps

After running these scripts:

1. **Redeploy the collaboration service** to pick up the new environment variables
2. **Test the collaboration API endpoints** to ensure JWT validation works
3. **Check CloudWatch logs** for any remaining issues


