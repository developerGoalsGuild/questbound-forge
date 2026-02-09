# AWS GitHub OIDC Setup Guide

This guide explains how to securely set up GitHub Actions to deploy to AWS using OIDC (OpenID Connect) authentication. This eliminates the need for long-lived AWS access keys and follows AWS security best practices.

## Overview

OIDC authentication allows GitHub Actions to assume IAM roles in AWS without storing credentials. This provides:

- **Security**: No long-lived access keys stored in GitHub
- **Auditability**: All role assumptions logged in CloudTrail
- **Flexibility**: Fine-grained access control per repository and branch
- **Compliance**: Meets security best practices for CI/CD

## Architecture

The setup includes:

1. **AWS OIDC Provider**: Trusts GitHub's OIDC issuer (`token.actions.githubusercontent.com`)
2. **IAM Roles**: Separate roles for dev, staging, and prod environments
3. **IAM Policies**: Comprehensive permissions for deployment operations
4. **GitHub Configuration**: Secrets and environment protection

## Manual setup (no Terraform)

If you prefer to configure everything by hand in the AWS Console and GitHub UI, use the **manual guide**:

- **[AWS GitHub OIDC – Manual Setup](./AWS_GITHUB_OIDC_MANUAL_SETUP.md)** – OIDC provider, IAM roles, policy JSON, and GitHub secrets/environments step-by-step.

This document describes the **Terraform/script** approach.

---

## Prerequisites

Before starting, ensure you have:

- [ ] AWS account with appropriate permissions (ability to create IAM roles and policies)
- [ ] AWS CLI installed and configured (`aws configure` or `aws sso login`)
- [ ] Terraform installed (version >= 1.0)
- [ ] Access to GitHub repository settings
- [ ] GitHub repository owner and name

## Step-by-Step Setup

### Step 1: Deploy Terraform Stack

The Terraform stack creates the OIDC provider and IAM roles. Deploy it using the provided script:

```bash
cd backend/infra/terraform2/scripts
./setup-github-actions-oidc.sh --github-owner YOUR_GITHUB_ORG --github-repo questbound-forge
```

**Options:**
- `-e, --env <environment>`: Environment for tfvars (dev, staging, prod) [default: dev]
- `--github-owner <owner>`: GitHub repository owner (organization or username)
- `--github-repo <repo>`: GitHub repository name
- `-p, --plan`: Only run terraform plan, don't apply
- `-n, --no-approve`: Don't auto-approve terraform apply

**Example:**
```bash
./setup-github-actions-oidc.sh \
  --github-owner GoalsGuild \
  --github-repo questbound-forge \
  -e dev
```

The script will:
1. Validate prerequisites (AWS CLI, Terraform, credentials)
2. Prompt for GitHub repository info if not provided
3. Deploy the Terraform stack
4. Output the IAM role ARNs for GitHub secrets

### Step 2: Get IAM Role ARNs

After successful deployment, the script will output the role ARNs. You can also retrieve them manually:

```bash
cd backend/infra/terraform2/stacks/github-actions-oidc
terraform output
```

You'll see output like:
```
github_actions_role_arn_dev = "arn:aws:iam::123456789012:role/goalsguild-github-actions-role-dev"
github_actions_role_arn_staging = "arn:aws:iam::123456789012:role/goalsguild-github-actions-role-staging"
github_actions_role_arn_prod = "arn:aws:iam::123456789012:role/goalsguild-github-actions-role-prod"
```

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add the following secrets:

   | Secret Name | Value | Description |
   |------------|-------|-------------|
   | `AWS_ROLE_ARN_DEV` | `arn:aws:iam::ACCOUNT_ID:role/goalsguild-github-actions-role-dev` | IAM role ARN for dev environment |
   | `AWS_ROLE_ARN_STAGING` | `arn:aws:iam::ACCOUNT_ID:role/goalsguild-github-actions-role-staging` | IAM role ARN for staging environment |
   | `AWS_ROLE_ARN_PROD` | `arn:aws:iam::ACCOUNT_ID:role/goalsguild-github-actions-role-prod` | IAM role ARN for prod environment |
   | `FRONTEND_ACM_CERT_ARN_PROD` | `arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/...` | ACM certificate ARN for production frontend domain |
   | `LANDING_PAGE_ACM_CERT_ARN_PROD` | `arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/...` | ACM certificate ARN for production landing page domain |

**Note**: The ACM certificate ARNs are only needed if you're deploying to production with custom domains.

### Step 4: Create GitHub Environments

GitHub Environments provide protection rules and approval workflows. Create them:

1. Go to **Settings → Environments**
2. Click **New environment** for each environment:

#### Dev Environment
- **Name**: `dev`
- **Deployment branches**: `dev` branch only
- **Protection rules**: None (auto-deploy)

#### Staging Environment
- **Name**: `staging`
- **Deployment branches**: `staging` branch only
- **Protection rules**:
  - ✅ **Required reviewers**: Add at least 1 reviewer
  - ✅ **Wait timer**: Optional (e.g., 5 minutes)

#### Prod Environment
- **Name**: `prod`
- **Deployment branches**: `main` and `master` branches
- **Protection rules**:
  - ✅ **Required reviewers**: Add at least 1 reviewer (recommended: 2+)
  - ✅ **Wait timer**: Optional (e.g., 10 minutes)

### Step 5: Verify Setup

Test the setup by running a workflow:

1. Push a change to the `dev` branch
2. Check the GitHub Actions workflow run
3. Verify that:
   - The workflow successfully assumes the IAM role
   - Deployment operations complete without permission errors
   - CloudTrail logs show the role assumption

**Check CloudTrail logs:**
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 10
```

## How It Works

### OIDC Authentication Flow

1. GitHub Actions workflow runs and requests an OIDC token from GitHub
2. GitHub issues a JWT token with claims about the repository, branch, and workflow
3. GitHub Actions uses `aws-actions/configure-aws-credentials@v4` to exchange the token for AWS credentials
4. AWS validates the token against the OIDC provider
5. AWS checks the trust policy conditions (repository, branch)
6. If valid, AWS issues temporary credentials for the IAM role
7. GitHub Actions uses these credentials for deployment operations

### Trust Policy Conditions

Each IAM role has a trust policy that restricts access:

- **Repository**: Only your specific repository can assume the role
- **Branch**: Each role is restricted to specific branches:
  - **dev role**: `dev` branch
  - **staging role**: `staging` branch
  - **prod role**: `main` or `master` branches
- **Audience**: Token must be intended for `sts.amazonaws.com`

### IAM Permissions

The deployment policy grants permissions for:

- **Terraform operations**: EC2, IAM, Lambda, API Gateway, DynamoDB, S3, CloudFront
- **Container operations**: ECR (push/pull images)
- **Infrastructure**: ACM, Route53, WAF, CloudWatch, EventBridge
- **Security**: SSM Parameter Store, KMS, SES, Cognito
- **Application services**: AppSync, ECS, Application Auto Scaling

## Security Best Practices

1. **Least Privilege**: The IAM policy grants only necessary permissions for deployments
2. **Environment Isolation**: Separate roles prevent cross-environment access
3. **Branch Protection**: Trust policies restrict which branches can assume each role
4. **Repository Scoping**: Trust policies limit to specific GitHub repository
5. **No Long-Lived Credentials**: OIDC eliminates need for access keys
6. **Audit Trail**: All assume-role operations logged in CloudTrail
7. **Manual Approvals**: Staging and prod require manual approval via GitHub Environments

## Troubleshooting

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Cause**: The trust policy conditions don't match the GitHub token claims.

**Solution**:
1. Verify the repository owner and name in the trust policy match your GitHub repository
2. Check that you're running the workflow from the correct branch
3. Verify the OIDC provider ARN is correct

### Error: "The request signature we calculated does not match"

**Cause**: The OIDC provider thumbprints may be outdated.

**Solution**: AWS automatically manages GitHub's OIDC thumbprints. If issues persist:
1. Check AWS documentation for current thumbprints
2. Update the `thumbprint_list` in the Terraform configuration if needed

### Error: "Access Denied" during deployment

**Cause**: The IAM policy doesn't grant sufficient permissions.

**Solution**:
1. Check CloudTrail logs to see which permission was denied
2. Update the IAM policy in `main.tf` to grant the required permission
3. Re-run `terraform apply`

### Workflow fails to assume role

**Checklist**:
- [ ] GitHub secret `AWS_ROLE_ARN_*` is set correctly
- [ ] GitHub Environment matches the branch name
- [ ] Workflow has `permissions: id-token: write`
- [ ] Repository owner/name matches Terraform configuration
- [ ] Branch name matches trust policy conditions

### Terraform state lock errors

**Cause**: Another deployment is running or a previous deployment failed.

**Solution**:
```bash
# Check for locks
aws dynamodb get-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"your-lock-id"}}'

# If needed, manually release the lock
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"your-lock-id"}}'
```

## Manual Terraform Deployment

If you prefer to deploy manually without the script:

```bash
cd backend/infra/terraform2/stacks/github-actions-oidc

# Update environments/dev.tfvars with your GitHub repo info
# Then initialize and apply:
terraform init
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"

# Get outputs
terraform output
```

## Updating Configuration

### Change GitHub Repository

1. Update `environments/*.tfvars` files with new `github_repo_owner` and `github_repo_name`
2. Run `terraform apply` to update trust policies

### Add More Branches

Edit `main.tf` to add branches to the trust policy conditions:

```hcl
StringLike = {
  "token.actions.githubusercontent.com:sub" = [
    "repo:${local.github_repo}:ref:refs/heads/main",
    "repo:${local.github_repo}:ref:refs/heads/master",
    "repo:${local.github_repo}:ref:refs/heads/release/*"  # Add new branch pattern
  ]
}
```

### Modify IAM Permissions

Edit the IAM policy in `main.tf` to add or remove permissions as needed.

## Cleanup

To remove the OIDC setup:

```bash
cd backend/infra/terraform2/stacks/github-actions-oidc
terraform destroy -var-file="environments/dev.tfvars"
```

**Warning**: This will delete:
- OIDC provider (if no other resources depend on it)
- All three IAM roles (dev, staging, prod)
- IAM deployment policy

Make sure to:
1. Remove GitHub secrets first
2. Remove GitHub Environments
3. Verify no workflows are running

## Additional Resources

- [AWS Documentation: Creating OpenID Connect (OIDC) identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [GitHub Documentation: Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS Actions: Configure AWS Credentials](https://github.com/aws-actions/configure-aws-credentials)

## Support

For issues or questions:
1. Check CloudTrail logs for detailed error messages
2. Review GitHub Actions workflow logs
3. Verify Terraform state and configuration
4. Consult AWS and GitHub documentation links above
