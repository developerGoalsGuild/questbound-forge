# Fix GitHub Actions Deployment Failures - Summary

## Overview

This document summarizes the deployment failures encountered in GitHub Actions and their fixes.

---

## Issues Identified

### 1. Missing IAM Read Permissions

**Problem:** The GitHub Actions IAM role (`oalsguild-github-actions-role-dev`) is missing several read permissions required by Terraform when refreshing state.

**Affected Stacks:**
- `security` - Cognito MFA config read
- `authorizer` - Lambda concurrency read
- `s3` - S3 accelerate configuration read
- `appsync` - AppSync API keys list, CloudWatch tags read
- `apigateway` - CloudWatch Logs tags read

**Solution:** See [FIX_OIDC_MISSING_READ_PERMISSIONS.md](./FIX_OIDC_MISSING_READ_PERMISSIONS.md) for detailed instructions on adding the missing permissions.

**Quick Fix:** Add these permissions to `goalsguild-github-actions-deployment-policy-dev`:
- `cognito-idp:GetUserPoolMfaConfig`
- `lambda:GetFunctionConcurrency`
- `s3:GetAccelerateConfiguration`
- `appsync:ListApiKeys`
- `cloudwatch:ListTagsForResource`
- `logs:ListTagsForResource`

### 2. Lambda Build Directory Race Condition

**Problem:** Terraform tries to archive Lambda build directories before they're created by the `null_resource` provisioner.

**Error:**
```
error creating archive: error archiving directory: could not archive missing directory:
/home/runner/work/questbound-forge/questbound-forge/backend/infra/terraform2/modules/lambda_zip/.build/b5a91ecb
```

**Affected Modules:**
- `subscription_auth_lambda`
- `send_message_lambda`
- `messages_batch_lambda`

**Solution:** Fixed in `backend/infra/terraform2/modules/lambda_zip/main.tf`:
- Added error checking in build scripts to verify directory exists before completion
- Improved error handling with `set -e` in bash scripts
- Added directory existence verification before archiving

---

## Fixes Applied

### 1. IAM Permissions (Manual Update Required)

**File:** AWS IAM Policy `goalsguild-github-actions-deployment-policy-dev`

**Action Required:** Update the IAM policy in AWS Console or via CLI to add the missing read permissions. See [FIX_OIDC_MISSING_READ_PERMISSIONS.md](./FIX_OIDC_MISSING_READ_PERMISSIONS.md) for complete instructions.

### 2. Lambda Build Module (Code Fix Applied)

**File:** `backend/infra/terraform2/modules/lambda_zip/main.tf`

**Changes:**
- Added `set -e` to bash build script for better error handling
- Added directory existence verification before build completion
- Improved error messages for debugging

---

## Verification Steps

### 1. Verify IAM Permissions

After updating the IAM policy, test with:

```bash
# Test Cognito read
aws cognito-idp get-user-pool-mfa-config --user-pool-id <pool-id> --region us-east-2

# Test Lambda read
aws lambda get-function-concurrency --function-name <function-name> --region us-east-2

# Test S3 read
aws s3api get-bucket-accelerate-configuration --bucket <bucket-name> --region us-east-2

# Test AppSync read
aws appsync list-api-keys --api-id <api-id> --region us-east-2
```

### 2. Verify Lambda Build

After code changes, test locally:

```bash
cd backend/infra/terraform2/stacks/authorizer
terraform init
terraform plan
# Should not show archive creation errors
```

---

## Next Steps

1. **Update IAM Policy** - Follow instructions in [FIX_OIDC_MISSING_READ_PERMISSIONS.md](./FIX_OIDC_MISSING_READ_PERMISSIONS.md)
2. **Commit Code Changes** - The Lambda build module fix is ready to commit
3. **Re-run GitHub Actions** - After IAM policy update, re-run the failed workflow
4. **Monitor Deployment** - Watch for any remaining permission errors

---

## Related Documents

- [FIX_OIDC_MISSING_READ_PERMISSIONS.md](./FIX_OIDC_MISSING_READ_PERMISSIONS.md) - Detailed IAM permission fixes
- [FIX_OIDC_DYNAMODB_READ_PERMISSIONS.md](./FIX_OIDC_DYNAMODB_READ_PERMISSIONS.md) - Previous DynamoDB permission fixes
- [AWS_GITHUB_OIDC_MANUAL_SETUP.md](./AWS_GITHUB_OIDC_MANUAL_SETUP.md) - Complete OIDC setup guide

---

## Notes

- The IAM role name appears to have a typo: `oalsguild-github-actions-role-dev` (missing 'g' in 'goalsguild')
- All read operations must be added without `aws:RequestTag` conditions
- Write operations still require `environment=ENV` tags via `DeploymentWithRequestTag`
- Lambda build directories are created per-function using a hash to avoid conflicts
