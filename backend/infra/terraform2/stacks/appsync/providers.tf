provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "billing"
  region = "us-east-1"
}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.48"
    }
  }
}
