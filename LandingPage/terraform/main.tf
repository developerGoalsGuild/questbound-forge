# GoalsGuild Landing Page - Main Terraform Configuration
# Creates S3 bucket and CloudFront distribution for static site hosting

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  common_tags = {
    Project     = "GoalsGuild-LandingPage"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CreatedBy   = data.aws_caller_identity.current.arn
  }
}
