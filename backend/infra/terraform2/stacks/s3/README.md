# S3 Stack - Guild Avatar Storage

This Terraform stack creates and configures S3 buckets for storing guild avatars in the GoalsGuild application.

## Resources Created

### S3 Bucket
- **guild_avatars**: S3 bucket for storing guild avatar images
  - Configurable bucket name (auto-generated if not provided)
  - Optional versioning
  - Optional server-side encryption (AES256)
  - Optional public access block
  - Optional lifecycle configuration
  - CORS configuration for web access

## Configuration

### Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `aws_region` | AWS region | string | "us-east-1" |
| `environment` | Environment name | string | "dev" |
| `project_name` | Project name | string | "goalsguild" |
| `guild_avatar_bucket_name` | S3 bucket name | string | "" (auto-generated) |
| `guild_avatar_bucket_versioning` | Enable versioning | bool | true |
| `guild_avatar_bucket_encryption` | Enable encryption | bool | true |
| `guild_avatar_bucket_public_access_block` | Block public access | bool | true |
| `guild_avatar_bucket_lifecycle_days` | Lifecycle days (0 to disable) | number | 0 |
| `guild_avatar_bucket_cors_origins` | CORS allowed origins | list(string) | ["*"] |
| `guild_avatar_bucket_cors_methods` | CORS allowed methods | list(string) | ["GET", "PUT", "POST", "DELETE", "HEAD"] |
| `guild_avatar_bucket_cors_headers` | CORS allowed headers | list(string) | ["*"] |
| `guild_avatar_bucket_cors_max_age` | CORS max age | number | 3600 |

### Outputs

| Output | Description |
|--------|-------------|
| `guild_avatar_bucket_name` | Name of the S3 bucket |
| `guild_avatar_bucket_arn` | ARN of the S3 bucket |
| `guild_avatar_bucket_domain_name` | Domain name of the S3 bucket |
| `guild_avatar_bucket_regional_domain_name` | Regional domain name of the S3 bucket |
| `guild_avatar_bucket_website_endpoint` | Website endpoint of the S3 bucket |
| `guild_avatar_bucket_website_domain` | Website domain of the S3 bucket |
| `guild_avatar_bucket_hosted_zone_id` | Hosted zone ID of the S3 bucket |
| `guild_avatar_bucket_region` | Region of the S3 bucket |
| `guild_avatar_bucket_public_access_block_id` | ID of the public access block |
| `guild_avatar_bucket_versioning_id` | ID of the versioning configuration |
| `guild_avatar_bucket_server_side_encryption_configuration_id` | ID of the encryption configuration |
| `guild_avatar_bucket_cors_configuration_id` | ID of the CORS configuration |
| `guild_avatar_bucket_lifecycle_configuration_id` | ID of the lifecycle configuration |

## Usage

This stack is deployed as part of the main deployment process using environment-specific variable files.

### Environment Files

The stack uses environment-specific variable files located in the `environments/` directory:
- `dev.tfvars` - Development environment
- `staging.tfvars` - Staging environment  
- `prod.tfvars` - Production environment
- `local.tfvars` - Local development environment
- `test.tfvars` - Testing environment

### Deployment

The stack is automatically deployed as part of the main deployment process:

```bash
# Deploy all stacks for a specific environment
.\scripts\deploy.ps1 -Env dev
.\scripts\deploy.ps1 -Env staging
.\scripts\deploy.ps1 -Env prod
```

### Manual Deployment

To deploy this stack manually:

```bash
# Navigate to the S3 stack directory
cd stacks/s3

# Initialize Terraform
terraform init

# Plan the deployment (using environment file)
terraform plan -var-file="../../environments/dev.tfvars"

# Apply the configuration
terraform apply -var-file="../../environments/dev.tfvars"
```

## Security Features

- **Public Access Block**: Prevents accidental public access
- **Server-Side Encryption**: Encrypts data at rest using AES256
- **Versioning**: Keeps multiple versions of objects
- **CORS Configuration**: Controls cross-origin access
- **Lifecycle Configuration**: Optional automatic deletion of old objects

## Integration

This stack is designed to work with the guild-service and provides the S3 bucket for storing guild avatar images. The bucket name and configuration are used by the guild-service for avatar upload and retrieval operations.

## Dependencies

- AWS Provider (>= 5.0)
- Terraform (>= 1.0)

## Notes

- The bucket name is auto-generated if not provided: `{project_name}-guild-avatars-{environment}`
- CORS is configured to allow web access from the frontend
- Public access is blocked by default for security
- Encryption is enabled by default for data protection
- Versioning is enabled by default for data recovery
