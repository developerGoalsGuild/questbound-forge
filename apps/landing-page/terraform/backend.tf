# GoalsGuild Landing Page - Backend Configuration
# State is stored in S3 per environment. Default below is dev; override with -backend-config for staging/prod.

terraform {
  backend "s3" {
    bucket         = "tfstate-goalsguild-dev"
    key            = "apps/landing-page/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "tfstate-goalsguild-dev-lock"
    encrypt        = true
  }
}
