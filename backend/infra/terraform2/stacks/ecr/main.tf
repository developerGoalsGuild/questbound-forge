# ECR Repositories Stack
# Creates ECR repositories that don't exist yet; references existing ones via data source

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

# List existing ECR repository names in the account
data "aws_ecr_repositories" "all" {}

# List of all service ECR repositories we need
locals {
  ecr_repositories = [
    "goalsguild_user_service",
    "goalsguild_quest_service",
    "goalsguild_subscription_service",
    "goalsguild_collaboration_service",
    "goalsguild_guild_service",
    "goalsguild_messaging_service",
    "goalsguild_gamification_service"
  ]
  existing_names = coalesce(data.aws_ecr_repositories.all.names, [])
  to_create      = [for n in local.ecr_repositories : n if !contains(local.existing_names, n)]
}

# Create only repositories that do not already exist.
# If a repo already exists in AWS, we reference it via data source only (never delete).
resource "aws_ecr_repository" "services" {
  for_each = toset(local.to_create)

  name                 = each.value
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Project     = "goalsguild"
    environment = var.environment
    Component   = "ecr"
    Service     = each.value
  }

  lifecycle {
    # Never destroy ECR repos from this stack when they already exist in AWS
    # (avoids RepositoryNotEmptyException; use data source for existing repos).
    prevent_destroy = true
  }
}

# Reference existing repositories (created outside this stack or by service stacks)
data "aws_ecr_repository" "existing" {
  for_each = toset([for n in local.ecr_repositories : n if contains(local.existing_names, n)])
  name     = each.value
}

# Lifecycle policies for all repositories (created or existing)
# Keep last 10 images to manage storage costs
resource "aws_ecr_lifecycle_policy" "services" {
  for_each = toset(local.ecr_repositories)

  repository = contains(local.to_create, each.value) ? aws_ecr_repository.services[each.value].name : data.aws_ecr_repository.existing[each.value].name

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

