# Terraform S3 backend config - dev
# Use: terraform init -backend-config=backend-config/dev.hcl
# Or from repo root when in a stack: terraform init -backend-config=../../backend-config/dev.hcl

bucket         = "tfstate-goalsguild-dev"
region         = "us-east-2"
dynamodb_table = "tfstate-goalsguild-dev-lock"
encrypt        = true
