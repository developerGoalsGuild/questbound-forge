# GitHub Actions OIDC Stack

This Terraform stack creates the AWS infrastructure needed for secure GitHub Actions CI/CD deployments using OIDC (OpenID Connect) authentication.

## What This Stack Creates

- **OIDC Provider**: AWS IAM OIDC provider that trusts GitHub's OIDC issuer
- **IAM Roles**: Three IAM roles for dev, staging, and prod environments
- **IAM Policies**: One deployment policy per environment; each policy restricts create/update to resources whose tag `environment` matches the role (dev, staging, or prod)

**Tag requirement:** All resources created or updated by CI/CD must be tagged with `environment = "dev"`, `"staging"`, or `"prod"` so that the dev/staging/prod role can only act on resources for its environment.

## Quick Start

Use the deployment script:

```bash
cd backend/infra/terraform2/scripts
./setup-github-actions-oidc.sh --github-owner YOUR_ORG --github-repo questbound-forge
```

## Manual Deployment

1. Update `environments/dev.tfvars` (or staging/prod) with your GitHub repository information:

```hcl
github_repo_owner = "YOUR_GITHUB_ORG_OR_USERNAME"
github_repo_name  = "questbound-forge"
```

2. Deploy:

```bash
terraform init
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"
```

3. Get role ARNs:

```bash
terraform output
```

## Outputs

- `github_actions_role_arn_dev` - ARN for dev environment role
- `github_actions_role_arn_staging` - ARN for staging environment role
- `github_actions_role_arn_prod` - ARN for prod environment role
- `oidc_provider_arn` - ARN of the OIDC provider

## Configuration

### Variables

- `environment` - Environment name (dev, staging, prod)
- `aws_region` - AWS region (default: us-east-2)
- `github_repo_owner` - GitHub repository owner
- `github_repo_name` - GitHub repository name
- `tags` - Additional tags for resources

### Trust Policies

Each role has a trust policy that restricts access:

- **dev role**: Only from `dev` branch
- **staging role**: Only from `staging` branch
- **prod role**: Only from `main` or `master` branches

All roles are restricted to your specific GitHub repository.

## IAM Permissions (project- and environment-scoped)

Each role’s policy allows only **AWS services used by this project**:

- **Services included**: Lambda, API Gateway, DynamoDB, S3, CloudFront, ACM, WAF, Logs, EventBridge, SSM, KMS, SES, Cognito, AppSync, ECR, CloudWatch.
- **Services excluded**: EC2, ECS, Route53, application-autoscaling (not used by this repo).

Scoping:

- **Create/update**: Only when the request includes tag `environment` = that role’s environment (`aws:RequestTag/environment`).
- **Update/delete on existing resources**: For IAM and ECR only when the resource has tag `environment` = that role’s environment. ECR is further restricted to repositories named `goalsguild_*`.
- **PassRole**: Only when passing a role to Lambda, API Gateway, EventBridge, or CloudWatch Logs (no EC2/ECS).
- **Terraform state and lock**: No tag condition (shared state).
- **STS GetCallerIdentity**: No tag condition.

Ensure all Terraform-managed resources are tagged with `environment` so these restrictions work as intended.

## Documentation

For complete setup instructions, see:
- [AWS GitHub OIDC Setup Guide](../../../../docs/deployment/AWS_GITHUB_OIDC_SETUP.md)
- [GitHub Actions CI/CD Documentation](../../../../docs/deployment/GITHUB_ACTIONS_CICD.md)

## Notes

- The OIDC provider is account-wide (only one needed per AWS account)
- This stack should be deployed once, not per environment
- The `environment` variable is used for tagging and can be set to any of the three values
- All three roles are created in a single deployment
