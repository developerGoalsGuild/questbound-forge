GoalsGuild Terraform Modularization

Layout
- stacks/
  - database/           → gg_core + login_attempts
  - security/           → IAM roles/policies used across stacks
  - services-user/      → user-service Lambda + ECR image
  - services-quest/     → quest-service Lambda + ECR image
  - appsync/            → AppSync GraphQL and resolvers
  - apigateway/         → API Gateway REST + Cognito + CORS

Preserve gg_core
- The `database` stack provisions `gg_core` with `prevent_destroy = true`, so `terraform destroy` and accidental replacements are blocked.
- Existing data is preserved. Any schema/GSI changes should be performed via migrations, not table replacement.

Per-stack deployment
1) cd stacks/security && terraform init && terraform apply -auto-approve
2) cd stacks/database && terraform init && terraform apply -auto-approve
3) cd stacks/services-user && terraform init && terraform apply -auto-approve
4) cd stacks/services-quest && terraform init && terraform apply -auto-approve
5) cd stacks/appsync && terraform init && terraform apply -auto-approve
6) cd stacks/apigateway && terraform init && terraform apply -auto-approve

Targeted changes
- Re-run only the stack that changed. Example: API changes → apply only `stacks/apigateway`.
- Docker image updates for services → apply their corresponding `services-*` stacks.

API Gateway redeploy
- `stacks/apigateway` exposes variable `deployment_hash`. Bump it to force a redeploy when API config changes without resource identity changes.

Environment
- Each stack uses the same provider and remote/local backend as configured. If you switch to a remote state (S3+DynamoDB), configure it per stack.

# Infrastructure (Terraform) Notes

## Public GraphQL operations with API Key
- Default auth remains `AWS_LAMBDA` (Lambda authorizer).
- Specific fields annotated with `@aws_api_key` are callable with an API key.
- Enable API key provider by setting in `terraform.tfvars`:
  - `enable_appsync_api_key = true`
- Apply: `terraform init && terraform apply`
- Outputs include:
  - `appsync_graphql_url`
  - `appsync_api_key_id` (use as `x-api-key`)
  - `appsync_api_key_expires`

## Rotate the AppSync API key
- Recommended: use Terraform to rotate.
- One-off replacement during next apply:
  - `terraform apply -replace=module.appsync.aws_appsync_api_key.this[0]`
- Or disable/enable to force recreation across environments:
  - Set `enable_appsync_api_key = false`, apply, then set back to `true` and apply again.
- After rotation, update your frontend env var `VITE_APPSYNC_API_KEY`.

## WAF protection for AppSync
Attach an AWS WAFv2 Web ACL to your AppSync API to throttle/limit abuse of public fields.

Terraform example (regional):

```hcl
resource "aws_wafv2_web_acl" "appsync_waf" {
  name        = "goalsguild-appsync-waf"
  description = "Basic rate limiting for AppSync"
  scope       = "REGIONAL"

  default_action { allow {} }

  rule {
    name     = "rate-limit"
    priority = 1
    action { block {} }
    statement {
      rate_based_statement {
        limit              = 2000   # requests per 5-minute period
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "appsync-waf"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with the AppSync API
resource "aws_wafv2_web_acl_association" "appsync_assoc" {
  resource_arn = module.appsync.api_id != null ? aws_appsync_graphql_api.this.arn : null
  web_acl_arn  = aws_wafv2_web_acl.appsync_waf.arn
}
```

Notes:
- Replace limits and names to fit your environment.
- You can add managed rule groups (e.g., AWSManagedRulesCommonRuleSet) to strengthen protection.
- Ensure the association uses the AppSync API ARN.
## Sync key to frontend .env
- After `terraform apply`, run from `frontend/`:
  - `npm run sync:appsync-key`
- This reads Terraform outputs and updates `frontend/.env` with `VITE_APPSYNC_API_KEY`.
- Restart the dev server to pick up changes.

## Outputs with human-readable expiry
- `appsync_api_key_expires_human`: friendly timestamp for the API key expiry.
## WAF Monitor vs Enforce
- Monitor (default):
  - `enable_appsync_waf = true`
  - `waf_enforce = false`
  - Rules use `count` so they only record matches in CloudWatch metrics/sampled requests.
- Enforce:
  - Set `waf_enforce = true` and `terraform apply`.
  - Rate-limit blocks, managed rules enforce vendor actions (blocks allowed).

## WAF Logging
- Metrics: Enabled via `visibility_config` (already on). View in CloudWatch Metrics under WAF.
- Full request logs: AWS WAF supports logging via Kinesis Data Firehose (not directly to CloudWatch Logs).
  - Create a Firehose delivery stream (e.g., to S3) and set:
    - `enable_appsync_waf_logging = true`
    - `waf_logging_firehose_arn = <firehose_stream_arn>`
  - Apply to enable `aws_wafv2_web_acl_logging_configuration`.
- Sampled requests: Available in the WAF console for quick inspection even without Firehose.
## Optional: Auto-provision Firehose->S3 for WAF logs (disabled by default)
- Flags (all default to false):
  - `enable_appsync_waf` � create WAF and associate to AppSync
  - `waf_enforce` � enforce (block) vs monitor (count)
  - `enable_appsync_waf_logging` � turn on WAF logging
  - `enable_waf_logging_stream` � create a Kinesis Data Firehose stream to S3 for logs
- To enable end-to-end logging without preexisting Firehose:
  1) `enable_appsync_waf           = true`
  2) `waf_enforce                  = false`   # start in monitor mode
  3) `enable_appsync_waf_logging   = true`
  4) `enable_waf_logging_stream    = true`
  5) `terraform apply`
- This provisions:
  - S3 bucket `${local.name}-waf-logs`
  - IAM role/policy for Firehose
  - Firehose delivery stream `${local.name}-waf-logs`
  - WAF logging config targeting that stream
- Later switch to enforce by setting `waf_enforce = true` and applying again.
## Environment tfvars and frontend .envs
- Backend tfvars (backend/infra/terraform/environments):
  - dev.tfvars: WAF disabled, logging disabled
  - staging.tfvars: WAF enabled (monitor), logging via auto-provisioned Firehose->S3
  - prod.tfvars: WAF enabled (monitor), logging via auto-provisioned Firehose->S3
- Apply with specific environment:
  - Dev:     `terraform apply -var-file=environments/dev.tfvars`
  - Staging: `terraform apply -var-file=environments/staging.tfvars`
  - Prod:    `terraform apply -var-file=environments/prod.tfvars`

- Frontend env files:
  - `frontend/.env.development`
  - `frontend/.env.staging`
  - `frontend/.env.production`

- Sync API key to a specific frontend env file:
  - Dev:  `npm run sync:appsync-key:dev` (writes .env.development)
  - Prod: `npm run sync:appsync-key:prod` (writes .env.production)
## One-command apply + key sync (PowerShell)
Use the helper script to apply per environment and sync the API key into the correct frontend env file.

Examples (run from repo root or anywhere):

- Dev (WAF/logging disabled):
  - `pwsh backend/infra/terraform/scripts/deploy.ps1 -Env dev -AutoApprove`
  - Then start frontend: `npm run dev` (will use .env.development)

- Staging (WAF monitor + logging):
  - `pwsh backend/infra/terraform/scripts/deploy.ps1 -Env staging -AutoApprove`
  - Sync writes to `.env.staging`

- Prod (WAF monitor + logging):
  - `pwsh backend/infra/terraform/scripts/deploy.ps1 -Env prod -AutoApprove`
  - Sync writes to `.env.production`

Flags:
- `-SkipInit` to skip `terraform init` if already initialized
- `-AutoApprove` to skip confirmation in `terraform apply`

## Frontend development helper
Run the frontend in development mode with optional key sync:

- `pwsh frontend/scripts/start-dev.ps1`          # syncs key to .env.development, then runs Vite
- `pwsh frontend/scripts/start-dev.ps1 -SkipSync` # skip key sync if not needed
