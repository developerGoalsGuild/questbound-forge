# GoalsGuild Landing Page - Main Terraform Configuration
# Creates S3 bucket and CloudFront distribution for static site hosting

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  common_tags = merge({
    Project     = "GoalsGuild-LandingPage"
    Environment = var.environment
    environment = var.environment
    ManagedBy   = "Terraform"
    CreatedBy   = data.aws_caller_identity.current.arn
  }, var.tags)
}

# Configure the AWS Provider for main region
provider "aws" {
  region = var.aws_region
}

# AWS provider for us-east-1 (required for ACM certificates used by CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
