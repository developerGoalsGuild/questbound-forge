# ECR Repositories Stack

This stack creates all ECR (Elastic Container Registry) repositories needed for GoalsGuild services.

## Purpose

ECR repositories must be created before services can push Docker images. This stack ensures all required repositories exist before service deployments.

## Repositories Created

The following ECR repositories are created:

1. **goalsguild_user_service** - User management service
2. **goalsguild_quest_service** - Quest management service
3. **goalsguild_subscription_service** - Subscription and billing service
4. **goalsguild_collaboration_service** - Collaboration features service
5. **goalsguild_guild_service** - Guild management service
6. **goalsguild_messaging_service** - Messaging service

## Features

- **Image Scanning**: All repositories have image scanning enabled on push
- **Lifecycle Policy**: Automatically keeps the last 10 images, removes older ones
- **Encryption**: All repositories use AES256 encryption
- **Tag Mutability**: Repositories allow mutable tags (for version management)

## Deployment Order

This stack should be deployed **after** the `security` stack and **before** any service deployments:

```
database → security → ecr → authorizer → services → ...
```

## Usage

### Deploy via Master Script

```powershell
.\deploy-all-with-build.ps1 -Env dev
```

The master deployment script automatically includes this stack in the correct order.

### Deploy Manually

```powershell
cd backend/infra/terraform2/stacks/ecr
terraform init
terraform plan -var-file ../../environments/dev.tfvars
terraform apply -var-file ../../environments/dev.tfvars
```

## Outputs

The stack provides outputs for all repository URLs:

- `ecr_repositories` - Map of all repository names to URLs
- `ecr_repository_urls` - List of all repository URLs
- `user_service_repository_url` - User service repository URL
- `quest_service_repository_url` - Quest service repository URL
- `subscription_service_repository_url` - Subscription service repository URL
- `collaboration_service_repository_url` - Collaboration service repository URL
- `guild_service_repository_url` - Guild service repository URL
- `messaging_service_repository_url` - Messaging service repository URL

## Variables

- `environment` - Environment name (dev, staging, prod)
- `aws_region` - AWS region (default: us-east-2)

## Lifecycle Policy

The lifecycle policy automatically:
- Keeps the last 10 images per repository
- Removes older images to save storage costs
- Applies to all tags

## Security

- Image scanning is enabled on push to detect vulnerabilities
- AES256 encryption is enabled for all repositories
- Repositories are tagged with environment and project information

## Notes

- Repositories are created idempotently - running the stack multiple times won't create duplicates
- If a repository already exists, Terraform will import it into state
- The lifecycle policy helps manage storage costs by automatically cleaning up old images

