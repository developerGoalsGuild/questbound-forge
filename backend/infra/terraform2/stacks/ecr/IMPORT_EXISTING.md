# Importing Existing ECR Repositories

If ECR repositories already exist (created manually or by previous deployments), you need to import them into Terraform state before running the ECR stack.

## Import Commands

Run these commands from the `backend/infra/terraform2/stacks/ecr` directory:

```powershell
cd backend/infra/terraform2/stacks/ecr

# Import each repository
terraform import 'aws_ecr_repository.services["goalsguild_user_service"]' goalsguild_user_service
terraform import 'aws_ecr_repository.services["goalsguild_quest_service"]' goalsguild_quest_service
terraform import 'aws_ecr_repository.services["goalsguild_subscription_service"]' goalsguild_subscription_service
terraform import 'aws_ecr_repository.services["goalsguild_collaboration_service"]' goalsguild_collaboration_service
terraform import 'aws_ecr_repository.services["goalsguild_guild_service"]' goalsguild_guild_service
terraform import 'aws_ecr_repository.services["goalsguild_messaging_service"]' goalsguild_messaging_service
```

## After Import

After importing, run:

```powershell
terraform plan -var-file ../../environments/dev.tfvars
```

This will show any differences between the existing repositories and the Terraform configuration. The lifecycle policies will be applied if they don't exist.

## Alternative: Skip ECR Stack

If repositories already exist and you don't want to manage them with Terraform, you can skip the ECR stack:

```powershell
.\deploy-all-with-build.ps1 -Env dev -Stacks @("database", "security", "authorizer", "s3", "appsync", "apigateway")
```

The services will work fine as long as the ECR repositories exist.

