# Terraform S3 backend config - prod
# Use: terraform init -backend-config=backend-config/prod.hcl

bucket         = "tfstate-goalsguild-prod"
region         = "us-east-2"
dynamodb_table = "tfstate-goalsguild-prod-lock"
encrypt        = true
