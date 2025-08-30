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


variable "user_service_lambda_arn" {
  description = "ARN of the user-service Lambda function"
  type        = string
}

variable "quest_service_lambda_arn" {
  description = "ARN of the quest-service Lambda function"
  type        = string
}
# Cognito User Pool
resource "aws_cognito_user_pool" "user_pool" {
  name = "goalsguild_user_pool_${var.environment}"

  # keep email verification on
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

  # REMOVE the legacy fields:
  # email_verification_message = "Your verification code is {####}."
  # email_verification_subject = "Verify your email for GoalsGuild"

  # Keep only the new-style block:
  verification_message_template {
    email_message        = "Welcome to GoalsGuild! Your code is {####}."
    email_subject        = "Welcome to GoalsGuild!"
    sms_message          = "Welcome to GoalsGuild! Your code is {####}."
    default_email_option = "CONFIRM_WITH_CODE" # or "CONFIRM_WITH_LINK"
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

# Quest Service API Gateway Method and Integration

resource "aws_api_gateway_method" "quest_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "quest_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_service_resource.id
  http_method             = aws_api_gateway_method.quest_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_lambda_permission" "allow_api_gateway_user" {
  statement_id  = "AllowAPIGatewayInvokeUser"
  action        = "lambda:InvokeFunction"
  function_name = var.user_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_quest" {
  statement_id  = "AllowAPIGatewayInvokeQuest"
  action        = "lambda:InvokeFunction"
  function_name = var.quest_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

# Outputs for use by other modules



