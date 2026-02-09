# Subscription Service Infrastructure
# FastAPI service for subscription management with Stripe integration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Remote state from S3 (same backend as other stacks)
locals {
  backend_s3 = {
    bucket         = "tfstate-goalsguild-${var.environment}"
    region         = var.aws_region
    dynamodb_table = "tfstate-goalsguild-${var.environment}-lock"
    encrypt        = true
  }
}

data "terraform_remote_state" "database" {
  backend = "s3"
  config  = merge(local.backend_s3, { key = "backend/database/terraform.tfstate" })
}

data "terraform_remote_state" "security" {
  backend = "s3"
  config  = merge(local.backend_s3, { key = "backend/security/terraform.tfstate" })
}

# Use existing ECR image (from env tfvars or -var so Lambda is created when applying with deploy-all/apply-one-stack)
locals {
  existing_image_uri = var.subscription_image_uri != "" ? var.subscription_image_uri : var.existing_image_uri
  has_valid_image    = local.existing_image_uri != ""

  lambda_exec_role_arn  = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  lambda_exec_role_name = try(data.terraform_remote_state.security.outputs.lambda_exec_role_name, element(split("/", data.terraform_remote_state.security.outputs.lambda_exec_role_arn), 1))
  gg_core_table_name   = data.terraform_remote_state.database.outputs.gg_core_table_name
  gg_core_table_arn    = data.terraform_remote_state.database.outputs.gg_core_table_arn
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Check if ECR repository already exists
data "aws_ecr_repositories" "existing_repos" {
  count = 1
}

locals {
  subscription_repo_exists = contains(data.aws_ecr_repositories.existing_repos[0].names, "goalsguild_subscription_service")
}

# ECR Repository for subscription service (only create if doesn't exist)
resource "aws_ecr_repository" "subscription_service" {
  count = local.subscription_repo_exists ? 0 : 1
  
  name                 = "goalsguild_subscription_service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
    Component   = "subscription-service"
  }
}

# Lambda function for subscription service (only create if valid image URI provided)
module "subscription_lambda" {
  count = local.has_valid_image ? 1 : 0
  
  source        = "../../../modules/lambda"
  function_name = "goalsguild_subscription_service"
  image_uri     = local.existing_image_uri
  
  depends_on = [aws_ecr_repository.subscription_service]
  role_arn      = local.lambda_exec_role_arn
  timeout       = 30
  memory_size   = 512
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    CORE_TABLE          = local.gg_core_table_name
    SETTINGS_SSM_PREFIX = "/goalsguild/subscription-service/"
    COGNITO_REGION      = var.aws_region
  }
  
  # Disable function URL - will use API Gateway instead
  enable_function_url     = false
}

# CloudWatch Log Group (only create if Lambda function exists)
resource "aws_cloudwatch_log_group" "subscription_service" {
  count = local.has_valid_image ? 1 : 0
  
  name              = "/aws/lambda/goalsguild-${var.environment}-subscription-service"
  retention_in_days = 30

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
    Component   = "subscription-service"
  }
}

# JWT Secret from SSM Parameter Store (use existing parameter)
data "aws_ssm_parameter" "jwt_secret" {
  name = "/goalsguild/user-service/JWT_SECRET"
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "subscription_service_dynamodb_policy" {
  name        = "goalsguild-${var.environment}-subscription-service-dynamodb-policy"
  description = "Policy for subscription service to access DynamoDB tables"

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
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable",
          "dynamodb:TransactWriteItems"
        ]
        Resource = [
          local.gg_core_table_arn,
          "${local.gg_core_table_arn}/index/*"
        ]
      }
    ]
  })

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
    Component   = "subscription-service"
  }
}

resource "aws_iam_role_policy_attachment" "subscription_service_dynamodb_policy" {
  role       = local.lambda_exec_role_name
  policy_arn = aws_iam_policy.subscription_service_dynamodb_policy.arn
}

# IAM Policy for SSM Parameter Store access (for Stripe keys and price IDs)
resource "aws_iam_policy" "subscription_service_ssm_policy" {
  name        = "goalsguild-${var.environment}-subscription-service-ssm-policy"
  description = "Policy for subscription service to access SSM Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/goalsguild/subscription-service/*",
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/goalsguild/user-service/*",
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/goalsguild/cognito/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/aws/ssm"
      }
    ]
  })

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
    Component   = "subscription-service"
  }
}

resource "aws_iam_role_policy_attachment" "subscription_service_ssm_policy" {
  role       = local.lambda_exec_role_name
  policy_arn = aws_iam_policy.subscription_service_ssm_policy.arn
}

# IAM Policy for Cognito access (for group management)
resource "aws_iam_policy" "subscription_service_cognito_policy" {
  name        = "goalsguild-${var.environment}-subscription-service-cognito-policy"
  description = "Policy for subscription service to manage Cognito user groups"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:ListGroupsForUser",
          "cognito-idp:GetGroup"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
    Component   = "subscription-service"
  }
}

resource "aws_iam_role_policy_attachment" "subscription_service_cognito_policy" {
  role       = local.lambda_exec_role_name
  policy_arn = aws_iam_policy.subscription_service_cognito_policy.arn
}
