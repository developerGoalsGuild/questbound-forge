provider "aws" {
  region                   = var.aws_region
  shared_credentials_files = [pathexpand("~/.aws/credentials")]
  shared_config_files      = [pathexpand("~/.aws/config")]

  default_tags {
    tags = {
      Project     = "goalsguild"
      Environment = var.environment
      Component   = "subscription-service"
    }
  }
}
