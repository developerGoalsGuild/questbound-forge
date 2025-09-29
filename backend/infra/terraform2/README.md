# GoalsGuild Terraform v2 (modular & targeted)

This folder contains a modular Terraform setup that enables independent, targeted deployments per stack:

- Database (gg_core)
- Security (Cognito, IAM, SSM)
- Authorizer (Lambda ZIP)
- Services: user-service, quest-service (Lambda images)
- AppSync (GraphQL)
- API Gateway (REST)

Each stack has its own Terraform state and can be planned/applied independently.

## Structure
```
backend/infra/terraform2/
  environments/
    dev.tfvars
    staging.tfvars
    prod.tfvars
  stacks/
    database/
    security/
    authorizer/
    services/user-service/
    services/quest-service/
    appsync/
    apigateway/
  modules/
    database/dynamodb_single_table/
    security/
    appsync/
    apigateway/
    lambda/
    lambda_zip/
    docker_lambda_image/
```

## One-time migration (preserve gg_core)
1) Import existing table into the new database stack state (module address):
```
cd backend/infra/terraform2/stacks/database
terraform init
terraform import module.gg_core.aws_dynamodb_table.this gg_core
```
2) Apply database stack:
```
terraform apply -var-file=../../environments/dev.tfvars
```

## Deployment order (first run)
1) Database → 2) Security → 3) Authorizer → 4) Services (user, quest) → 5) AppSync → 6) API Gateway

## Targeted deployments (anytime)
- Database: `cd stacks/database && terraform plan|apply -var-file=../../environments/dev.tfvars`
- Security: `cd stacks/security && terraform plan|apply -var-file=../../environments/dev.tfvars`
- Authorizer: `cd stacks/authorizer && terraform plan|apply -var-file=../../environments/dev.tfvars`
- User service: `cd stacks/services/user-service && terraform plan|apply -var-file=../../../environments/dev.tfvars`
- Quest service: `cd stacks/services/quest-service && terraform plan|apply -var-file=../../../environments/dev.tfvars`
- AppSync: `cd stacks/appsync && terraform plan|apply -var-file=../../environments/dev.tfvars`
- API Gateway: `cd stacks/apigateway && terraform plan|apply -var-file=../../environments/dev.tfvars`

## Notes
- `gg_core` has `prevent_destroy = true`. Do not replace it.
- Stacks are independent; only changed stacks need to be applied.
