# Messaging Service Infrastructure
# FastAPI WebSocket service for real-time messaging

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources (optional - will use fallback values if not available)
data "terraform_remote_state" "database" {
  count   = fileexists("${path.module}/../database/terraform.tfstate") ? 1 : 0
  backend = "local"
  config = { path = "../database/terraform.tfstate" }
}

data "terraform_remote_state" "security" {
  count   = fileexists("${path.module}/../security/terraform.tfstate") ? 1 : 0
  backend = "local"
  config = { path = "../security/terraform.tfstate" }
}

# Use existing ECR image directly
locals {
  existing_image_uri = var.existing_image_uri
  has_valid_image = var.existing_image_uri != ""
  
  # Fallback values for remote state
  lambda_exec_role_arn = length(data.terraform_remote_state.security) > 0 ? data.terraform_remote_state.security[0].outputs.lambda_exec_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/goalsguild_lambda_exec_role_${var.environment}"
  lambda_exec_role_name = length(data.terraform_remote_state.security) > 0 ? data.terraform_remote_state.security[0].outputs.lambda_exec_role_name : "goalsguild_lambda_exec_role_${var.environment}"
  gg_core_table_name = length(data.terraform_remote_state.database) > 0 ? data.terraform_remote_state.database[0].outputs.gg_core_table_name : "gg_core"
  guild_table_name = length(data.terraform_remote_state.database) > 0 ? data.terraform_remote_state.database[0].outputs.guild_table_name : "gg_guild"
  gg_core_table_arn = length(data.terraform_remote_state.database) > 0 ? data.terraform_remote_state.database[0].outputs.gg_core_table_arn : "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/gg_core"
  guild_table_arn = length(data.terraform_remote_state.database) > 0 ? data.terraform_remote_state.database[0].outputs.guild_table_arn : "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/gg_guild"
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Check if ECR repository already exists
data "aws_ecr_repositories" "existing_repos" {
  count = 1
}

locals {
  messaging_repo_exists = contains(data.aws_ecr_repositories.existing_repos[0].names, "goalsguild_messaging_service")
}

# ECR Repository for messaging service (only create if doesn't exist)
resource "aws_ecr_repository" "messaging_service" {
  count = local.messaging_repo_exists ? 0 : 1
  
  name                 = "goalsguild_messaging_service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "messaging-service"
  }
}

# Lambda function for messaging service (only create if valid image URI provided)
module "messaging_lambda" {
  count = local.has_valid_image ? 1 : 0
  
  source        = "../../../modules/lambda"
  function_name = "goalsguild_messaging_service"
  image_uri     = local.existing_image_uri
  
  depends_on = [aws_ecr_repository.messaging_service]
  role_arn      = local.lambda_exec_role_arn
  timeout       = 30
  memory_size   = 512
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    DYNAMODB_TABLE_NAME = local.gg_core_table_name
    GUILD_TABLE_NAME   = local.guild_table_name
    JWT_SECRET_PARAMETER_NAME = "/goalsguild/user-service/JWT_SECRET"
  }
  
  # Disable function URL - will use API Gateway instead
  enable_function_url     = false
}

# CloudWatch Log Group (only create if Lambda function exists)
resource "aws_cloudwatch_log_group" "messaging_service" {
  count = local.has_valid_image ? 1 : 0
  
  name              = "/aws/lambda/goalsguild-${var.environment}-messaging-service"
  retention_in_days = 30

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "messaging-service"
  }
}

# JWT Secret from SSM Parameter Store (use existing parameter)
data "aws_ssm_parameter" "jwt_secret" {
  name = "/goalsguild/user-service/JWT_SECRET"
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "messaging_service_dynamodb_policy" {
  name        = "goalsguild-${var.environment}-messaging-service-dynamodb-policy"
  description = "Policy for messaging service to access DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
    Resource = [
      local.gg_core_table_arn,
      "${local.gg_core_table_arn}/index/*",
      local.guild_table_arn,
      "${local.guild_table_arn}/index/*"
    ]
      }
    ]
  })

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "messaging-service"
  }
}

resource "aws_iam_role_policy_attachment" "messaging_service_dynamodb_policy" {
  role       = local.lambda_exec_role_name
  policy_arn = aws_iam_policy.messaging_service_dynamodb_policy.arn
}

# IAM Policy for SSM Parameter Store access
resource "aws_iam_policy" "messaging_service_ssm_policy" {
  name        = "goalsguild-${var.environment}-messaging-service-ssm-policy"
  description = "Policy for messaging service to access SSM Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          data.aws_ssm_parameter.jwt_secret.arn
        ]
      }
    ]
  })

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "messaging-service"
  }
}

resource "aws_iam_role_policy_attachment" "messaging_service_ssm_policy" {
  role       = local.lambda_exec_role_name
  policy_arn = aws_iam_policy.messaging_service_ssm_policy.arn
}


























