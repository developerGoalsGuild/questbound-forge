# GoalsGuild Frontend - Backend Configuration
# State is stored in S3 per environment. Default below is dev; override with -backend-config for staging/prod.
#   terraform init -reconfigure -backend-config=../../../backend-config/dev.hcl      # dev (or omit)
#   terraform init -reconfigure -backend-config=../../../backend-config/staging.hcl # staging
#   terraform init -reconfigure -backend-config=../../../backend-config/prod.hcl    # prod

terraform {
  backend "s3" {
    bucket         = "tfstate-goalsguild-dev"
    key            = "apps/frontend/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "tfstate-goalsguild-dev-lock"
    encrypt        = true
  }
}
