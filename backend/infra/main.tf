terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  backend "local" {}
}

provider "aws" {
  region = var.aws_region
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  name = "questbound_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB Tables

resource "aws_dynamodb_table" "users" {
  name           = "questbound_users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "questbound"
  }
}

resource "aws_dynamodb_table" "quests" {
  name           = "questbound_quests"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "quest_id"

  attribute {
    name = "quest_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "questbound"
  }
}

# Cognito User Pool

resource "aws_cognito_user_pool" "user_pool" {
  name = "questbound_user_pool"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  username_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  mfa_configuration = "OFF"

  email_verification_message = "Your verification code is {####}."
  email_verification_subject = "Verify your email for Questbound"

  # Disable email confirmation for simplicity
  verification_message_template {
    email_message = "Welcome to Questbound! Your code is {####}."
    email_subject = "Welcome to Questbound!"
    sms_message   = "Welcome to Questbound! Your code is {####}."
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "questbound_user_pool_client"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
  prevent_user_existence_errors = "ENABLED"
  generate_secret               = false
  allowed_oauth_flows           = []
  allowed_oauth_scopes          = []
  supported_identity_providers  = ["COGNITO"]
  callback_urls                 = []
  logout_urls                   = []
  allowed_oauth_flows_user_pool_client = false
}

# API Gateway Rest API

resource "aws_api_gateway_rest_api" "questbound_api" {
  name        = "questbound_api"
  description = "API Gateway for Questbound backend microservices"
}

# API Gateway Resource for User Service

resource "aws_api_gateway_resource" "user_service_resource" {
  rest_api_id = aws_api_gateway_rest_api.questbound_api.id
  parent_id   = aws_api_gateway_rest_api.questbound_api.root_resource_id
  path_part   = "users"
}

# API Gateway Resource for Quest Service

resource "aws_api_gateway_resource" "quest_service_resource" {
  rest_api_id = aws_api_gateway_rest_api.questbound_api.id
  parent_id   = aws_api_gateway_rest_api.questbound_api.root_resource_id
  path_part   = "quests"
}

# Lambda Functions (container images)

resource "aws_lambda_function" "user_service" {
  function_name = "questbound_user_service"
  package_type  = "Image"
  image_uri     = var.user_service_image_uri
  role          = aws_iam_role.lambda_exec_role.arn
  timeout       = 10
  memory_size   = 512
}

resource "aws_lambda_function" "quest_service" {
  function_name = "questbound_quest_service"
  package_type  = "Image"
  image_uri     = var.quest_service_image_uri
  role          = aws_iam_role.lambda_exec_role.arn
  timeout       = 10
  memory_size   = 512
}

# API Gateway Methods and Integrations for User Service

resource "aws_api_gateway_method" "user_get" {
  rest_api_id   = aws_api_gateway_rest_api.questbound_api.id
  resource_id   = aws_api_gateway_resource.user_service_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "user_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.questbound_api.id
  resource_id             = aws_api_gateway_resource.user_service_resource.id
  http_method             = aws_api_gateway_method.user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_service.invoke_arn
}

# API Gateway Methods and Integrations for Quest Service

resource "aws_api_gateway_method" "quest_get" {
  rest_api_id   = aws_api_gateway_rest_api.questbound_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "quest_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.questbound_api.id
  resource_id             = aws_api_gateway_resource.quest_service_resource.id
  http_method             = aws_api_gateway_method.quest_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.quest_service.invoke_arn
}

# Cognito Authorizer for API Gateway

resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name                   = "CognitoAuthorizer"
  rest_api_id            = aws_api_gateway_rest_api.questbound_api.id
  identity_source        = "method.request.header.Authorization"
  provider_arns          = [aws_cognito_user_pool.user_pool.arn]
  type                   = "COGNITO_USER_POOLS"
}

# Deployment and Stage

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.user_get_integration,
    aws_api_gateway_integration.quest_get_integration,
  ]
  rest_api_id = aws_api_gateway_rest_api.questbound_api.id
  stage_name  = var.environment
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "user_service_image_uri" {
  type = string
}

variable "quest_service_image_uri" {
  type = string
}
