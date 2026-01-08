provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "goalsguild"
      Environment = var.environment
      Component   = "messaging-service"
    }
  }
}
