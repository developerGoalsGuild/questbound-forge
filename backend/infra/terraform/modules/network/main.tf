# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  name = "goalsguild_lambda_exec_role_${var.environment}"

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

# Attach AWS managed policy for basic Lambda execution permissions
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Cognito User Pool
resource "aws_cognito_user_pool" "user_pool" {
  name = "goalsguild_user_pool_${var.environment}"

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
  email_verification_subject = "Verify your email for GoalsGuild"

  # Disable email confirmation for simplicity
  verification_message_template {
    email_message = "Welcome to GoalsGuild! Your code is {####}."
    email_subject = "Welcome to GoalsGuild!"
    sms_message   = "Welcome to GoalsGuild! Your code is {####}."
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "goalsguild_user_pool_client_${var.environment}"
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

# API Gateway REST API
resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "goalsguild_api_${var.environment}"
  description = "API Gateway for GoalsGuild backend microservices"
}

# API Gateway Resources
resource "aws_api_gateway_resource" "user_service_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "quest_service_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "quests"
}

# API Gateway Authorizer using Cognito User Pool
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name            = "CognitoAuthorizer_${var.environment}"
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  identity_source = "method.request.header.Authorization"
  provider_arns   = [aws_cognito_user_pool.user_pool.arn]
  type            = "COGNITO_USER_POOLS"
}

# Outputs for use by other modules
output "lambda_exec_role_arn" {
  description = "ARN of the IAM role used by Lambda functions"
  value       = aws_iam_role.lambda_exec_role.arn
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "api_gateway_rest_api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.rest_api.id
}
