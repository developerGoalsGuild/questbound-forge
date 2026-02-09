# GitHub Actions CI/CD

This repository includes two workflows:

- `ci-cd-components.yml`: deploys only the components that changed.
- `deploy-all.yml`: manual run that deploys all components dev → staging → prod.

## Branch → environment mapping

- `dev` branch → `dev`
- `staging` branch → `staging`
- `main` or `master` → `prod`

## GitHub Environments (approvals)

Create environments in GitHub:

- `dev` (no approval required)
- `staging` (manual approval required)
- `prod` (manual approval required)

The workflows target these environments with `environment: <name>`.

## AWS authentication (OIDC)

GitHub Actions uses OIDC (OpenID Connect) to authenticate with AWS, eliminating the need for long-lived access keys.

### Initial Setup

- **Terraform/script:** [AWS GitHub OIDC Setup Guide](./AWS_GITHUB_OIDC_SETUP.md)
- **Manual (Console + GitHub UI):** [AWS GitHub OIDC – Manual Setup](./AWS_GITHUB_OIDC_MANUAL_SETUP.md)

The setup includes:
1. Deploying Terraform stack to create OIDC provider and IAM roles
2. Configuring GitHub secrets with role ARNs
3. Creating GitHub Environments with protection rules

### Required GitHub Secrets

Set the following repository secrets for AWS OIDC role assumption:

- `AWS_ROLE_ARN_DEV` - IAM role ARN for dev environment
- `AWS_ROLE_ARN_STAGING` - IAM role ARN for staging environment
- `AWS_ROLE_ARN_PROD` - IAM role ARN for prod environment

Each role trusts GitHub Actions OIDC and has permissions for its environment VPC and resources.

**Quick Setup:**
```bash
cd backend/infra/terraform2/scripts
./setup-github-actions-oidc.sh --github-owner YOUR_ORG --github-repo questbound-forge
```

## Frontend Terraform

Frontend hosting is provisioned by Terraform in `apps/frontend/terraform`:

- Dev/staging use a WAF web ACL that blocks all traffic by default.
- Add allowlisted IPs in `apps/frontend/terraform/environments/*.tfvars` via `allowed_ip_cidrs` to grant access.
- Production is public and uses the custom domain `goals.guild.com`.

Production certificate secret:

- `FRONTEND_ACM_CERT_ARN_PROD`

## Landing page production domain

Only production attaches the custom domain `goals.guild.com`. Provide:

- `LANDING_PAGE_ACM_CERT_ARN_PROD`

Dev and staging always deploy without CloudFront aliases.

## Backend services

Supported services with Terraform stacks and deploy scripts:

- `user-service`
- `quest-service`
- `subscription-service`
- `collaboration-service`
- `guild-service`
- `messaging-service`
- `gamification-service`
- `authorizer-service` (stack deploy)

`connect-service` currently has no Terraform stack or deploy script; the workflow fails if it changes.

## Tests

`ci-cd-components.yml` runs:

- Frontend unit tests and Selenium integration tests when frontend changes
- Backend pytest for changed services, authorizer, or connect-service

`deploy-all.yml` runs full frontend tests and backend service tests before deploying.

## Manual full deploy

Run from GitHub Actions → `Deploy All Environments`. It executes:

1. Tests
2. Dev deploy
3. Staging deploy (requires approval)
4. Prod deploy (requires approval)
