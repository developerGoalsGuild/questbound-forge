# State in S3 per environment. Default is dev; use -backend-config=.../staging.hcl or prod.hcl for others.

terraform {
  backend "s3" {
    bucket         = "tfstate-goalsguild-dev"
    key            = "backend/s3/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "tfstate-goalsguild-dev-lock"
    encrypt        = true
  }
}
