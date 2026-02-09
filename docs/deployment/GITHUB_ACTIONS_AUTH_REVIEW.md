# GitHub Actions Authentication Review

**Date:** 2026-02-02  
**Status:** ✅ All workflows use consistent OIDC authentication

---

## Summary

All GitHub Actions workflows that require AWS access use **OIDC (OpenID Connect)** authentication with the same pattern. No hardcoded access keys found.

---

## Workflows Overview

### 1. **deploy-all.yml** ✅
- **Purpose:** Full deployment to dev → staging → prod
- **Authentication:** OIDC via `aws-actions/configure-aws-credentials@v4`
- **Permissions:** `id-token: write` ✅
- **Environments:** `dev`, `staging`, `prod` ✅
- **Secrets Used:**
  - `AWS_ROLE_ARN_DEV`
  - `AWS_ROLE_ARN_STAGING`
  - `AWS_ROLE_ARN_PROD`
  - `FRONTEND_ACM_CERT_ARN_PROD` (for prod frontend)
  - `LANDING_PAGE_ACM_CERT_ARN_PROD` (for prod landing)
- **Pattern:** ✅ Consistent

### 2. **ci-cd-components.yml** ✅
- **Purpose:** Component-based CI/CD (deploys only changed components)
- **Authentication:** OIDC via `aws-actions/configure-aws-credentials@v4`
- **Permissions:** `id-token: write` ✅
- **Environments:** Dynamic (`dev`, `staging`, `prod` based on branch/input) ✅
- **Secrets Used:**
  - `AWS_ROLE_ARN_DEV` (via context job)
  - `AWS_ROLE_ARN_STAGING` (via context job)
  - `AWS_ROLE_ARN_PROD` (via context job)
  - `FRONTEND_ACM_CERT_ARN_PROD` (for prod frontend)
  - `LANDING_PAGE_ACM_CERT_ARN_PROD` (for prod landing)
- **Pattern:** ✅ Consistent

### 3. **infra-tests.yml** ✅
- **Purpose:** Run backend infrastructure tests (no AWS access needed)
- **Authentication:** None (doesn't access AWS)
- **Permissions:** Not set (not needed)
- **Pattern:** ✅ Appropriate (no AWS access)

---

## Authentication Pattern

All AWS-using jobs follow this pattern:

```yaml
permissions:
  contents: read
  id-token: write  # Required for OIDC

jobs:
  deploy-job:
    runs-on: ubuntu-latest
    environment: dev|staging|prod  # Required for OIDC
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}  # or STAGING/PROD
          aws-region: us-east-2  # or us-east-1 for frontend/landing
```

---

## Required GitHub Secrets

Ensure these secrets are set in GitHub repository settings:

### OIDC Role ARNs (Required)
- ✅ `AWS_ROLE_ARN_DEV` - IAM role ARN for dev environment
- ✅ `AWS_ROLE_ARN_STAGING` - IAM role ARN for staging environment
- ✅ `AWS_ROLE_ARN_PROD` - IAM role ARN for prod environment

### ACM Certificates (Optional - only for prod)
- ✅ `FRONTEND_ACM_CERT_ARN_PROD` - ACM certificate ARN for frontend custom domain
- ✅ `LANDING_PAGE_ACM_CERT_ARN_PROD` - ACM certificate ARN for landing page custom domain

### Test Credentials (Optional - commented out)
- `TEST_USER_EMAIL` - For Selenium tests (currently disabled)
- `TEST_USER_PASSWORD` - For Selenium tests (currently disabled)

---

## Required GitHub Environments

Ensure these environments exist in GitHub repository settings with protection rules if needed:

1. **dev** - Development environment
2. **staging** - Staging environment
3. **prod** - Production environment (should have protection rules)

Each environment should have the corresponding `AWS_ROLE_ARN_*` secret configured.

---

## Verification Checklist

- [x] All workflows use `aws-actions/configure-aws-credentials@v4`
- [x] All workflows have `permissions: id-token: write`
- [x] All AWS-using jobs have `environment:` set
- [x] No hardcoded access keys found
- [x] All secrets use `${{ secrets.* }}` pattern
- [x] Consistent region usage (us-east-2 for backend, us-east-1 for frontend/landing)

---

## AWS IAM Setup

The OIDC roles must be configured in AWS with trust policies allowing GitHub Actions to assume them. See:

- `docs/deployment/AWS_GITHUB_OIDC_MANUAL_SETUP.md` - Manual setup guide
- `backend/infra/terraform2/stacks/github-actions-oidc/` - Terraform stack for OIDC setup

---

## Notes

1. **Region Usage:**
   - Backend services/infra: `us-east-2`
   - Frontend/Landing: `us-east-1` (CloudFront/S3)

2. **Selenium Tests:** Currently commented out in workflows. When enabled, they'll need `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` secrets.

3. **connect-service:** Detected in `ci-cd-components.yml` but deployment not implemented yet (fails with helpful message).

---

## Conclusion

✅ **All pipelines are ready and use consistent OIDC authentication.**

No changes needed. Ensure GitHub secrets and environments are configured as listed above.
