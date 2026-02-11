# IAM Pipeline (deploy-iam)

The IAM pipeline deploys security and GitHub Actions OIDC stacks separately from the main deployment pipeline. This separation restricts IAM role and policy creation to a dedicated pipeline with elevated permissions.

## Overview

- **Deploy pipeline** (`deploy-all`): Deploys database, ecr, authorizer, s3, appsync, apigateway, and services. It has **no** IAM create/update permissions (only PassRole for Lambda).
- **IAM pipeline** (`deploy-iam`): Deploys **security** and **github-actions-oidc** stacks. Requires a role with full IAM permissions.

## When to Run

Run the IAM pipeline when:
- Deploying or updating the security stack (Cognito, SSM, IAM roles)
- Creating or updating GitHub Actions OIDC roles and policies
- First-time bootstrap of the GitHub Actions OIDC provider

## Bootstrap (First-Time Setup)

1. **Run `github-actions-oidc` manually** with admin credentials to create the OIDC provider and all roles:
   ```bash
   cd backend/infra/terraform2/stacks/github-actions-oidc
   terraform init -upgrade
   terraform apply -var-file=../../environments/dev.tfvars
   ```

2. **Export the IAM role ARNs** and add them as GitHub secrets:
   ```bash
   terraform output github_actions_iam_role_arn_dev
   terraform output github_actions_iam_role_arn_staging
   terraform output github_actions_iam_role_arn_prod
   ```

3. **Add GitHub secrets** (Settings → Secrets and variables → Actions):
   - `AWS_ROLE_ARN_IAM_DEV` = output of `github_actions_iam_role_arn_dev`
   - `AWS_ROLE_ARN_IAM_STAGING` = output of `github_actions_iam_role_arn_staging`
   - `AWS_ROLE_ARN_IAM_PROD` = output of `github_actions_iam_role_arn_prod`

## Running the IAM Pipeline

### Via GitHub Actions

1. Go to **Actions** → **Deploy IAM (Security & GitHub Actions OIDC)**
2. Click **Run workflow**
3. Select the environment (dev, staging, or prod)
4. Click **Run workflow**

### Via CLI

```bash
./backend/infra/terraform2/scripts/deploy-iam.sh --env dev
./backend/infra/terraform2/scripts/deploy-iam.sh --env staging
./backend/infra/terraform2/scripts/deploy-iam.sh --env prod
```

### Options

- `--env <env>` – Environment (dev, staging, prod)
- `-p, --plan` – Terraform plan only (no apply)
- `-n, --no-approve` – Require manual approval for apply

## Deployment Order

For a fresh environment, run the IAM pipeline **before** the main deploy pipeline:

1. **Deploy IAM** (security, github-actions-oidc)
2. **Deploy All** (database, ecr, authorizer, s3, appsync, apigateway, services)

The authorizer stack depends on `lambda_exec_role_arn` from the security stack, so security must be deployed first.

## Stacks Deployed by IAM Pipeline

| Stack | Description |
|-------|-------------|
| security | Cognito, SSM parameters, IAM roles (lambda_exec_role, collaboration_service_role) |
| github-actions-oidc | OIDC provider, GitHub Actions IAM roles (deploy + IAM pipeline roles) |

## Related

- [Deploy All](README_DEPLOY_ALL.md)
- [GitHub Actions OIDC Setup](AWS_GITHUB_OIDC_SETUP.md)
