# ECR Repositories Stack
# Creates all ECR repositories needed for GoalsGuild services

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# List of all service ECR repositories
locals {
  ecr_repositories = [
    "goalsguild_user_service",
    "goalsguild_quest_service",
    "goalsguild_subscription_service",
    "goalsguild_collaboration_service",
    "goalsguild_guild_service",
    "goalsguild_messaging_service"
  ]
}

# Try to import existing repositories or create new ones
# This handles the case where repositories already exist
resource "aws_ecr_repository" "services" {
  for_each = toset(local.ecr_repositories)
  
  lifecycle {
    ignore_changes = [
      # Ignore changes to existing repositories to avoid conflicts
      image_scanning_configuration,
      encryption_configuration
    ]
  }
  
  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "ecr"
    Service     = each.value
  }
}

# Lifecycle policies for ECR repositories
# Keep last 10 images to manage storage costs
resource "aws_ecr_lifecycle_policy" "services" {
  for_each = toset(local.ecr_repositories)
  
  repository = aws_ecr_repository.services[each.value].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

