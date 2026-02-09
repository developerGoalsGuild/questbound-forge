# Terraform S3 backend config - staging
# Use: terraform init -backend-config=backend-config/staging.hcl

bucket         = "tfstate-goalsguild-staging"
region         = "us-east-2"
dynamodb_table = "tfstate-goalsguild-staging-lock"
encrypt        = true
