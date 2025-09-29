Stacks usage

Order (first time):
1) security
2) database
3) services-user / services-quest (in any order)
4) appsync
5) apigateway

Deploy one stack:
cd backend/infra/terraform/stacks/<stack> && terraform init && terraform apply -auto-approve

Inputs:
- Each stack has `variables.tf`. Provide via `-var` or a per-stack `terraform.tfvars`.

Notes:
- `database` preserves table `gg_core` with `prevent_destroy = true`.
- `apigateway` exposes `deployment_hash` to trigger redeploys when only configuration changes.


