

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

  verification_message_template {
    email_message        = "Welcome to GoalsGuild! Your code is {####}."
    email_subject        = "Welcome to GoalsGuild!"
    sms_message          = "Welcome to GoalsGuild! Your code is {####}."
    default_email_option = "CONFIRM_WITH_CODE"
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

resource "aws_api_gateway_resource" "user_signup_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "signup"
}

resource "aws_api_gateway_resource" "user_login_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "login"
}

resource "aws_api_gateway_resource" "user_logout_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "logout"
}

resource "aws_api_gateway_resource" "user_login_google_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_login_resource.id
  path_part   = "google"
}

resource "aws_api_gateway_resource" "user_health_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "health"
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

# User-Service API Gateway Methods and Integrations

# POST /users/signup (public)
resource "aws_api_gateway_method" "user_signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_signup_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "user_signup_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_signup_resource.id
  http_method             = aws_api_gateway_method.user_signup_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# POST /users/login (public)
resource "aws_api_gateway_method" "user_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "user_login_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_resource.id
  http_method             = aws_api_gateway_method.user_login_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# POST /users/logout (requires auth)
resource "aws_api_gateway_method" "user_logout_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_logout_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "user_logout_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_logout_resource.id
  http_method             = aws_api_gateway_method.user_logout_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# POST /users/login/google (public)
resource "aws_api_gateway_method" "user_login_google_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_google_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "user_login_google_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_google_resource.id
  http_method             = aws_api_gateway_method.user_login_google_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# GET /health (public)
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_health_resource.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "health_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_health_resource.id
  http_method             = aws_api_gateway_method.health_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# Quest-Service API Gateway Methods and Integrations

# GET /quests (requires auth)
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
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# POST /quests (requires auth)
resource "aws_api_gateway_method" "quest_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "quest_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_service_resource.id
  http_method             = aws_api_gateway_method.quest_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# Lambda permissions for API Gateway invocation

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

# Create SSM Parameter for Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/goalsguild/${var.environment}/cognito/user_pool_id"
  description = "Cognito User Pool ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool.user_pool.id
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool.user_pool]
}

# Create SSM Parameter for Cognito User Pool Client ID
resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "/goalsguild/${var.environment}/cognito/client_id"
  description = "Cognito User Pool Client ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool_client.user_pool_client.id
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}

# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/goalsguild/${var.environment}/cognito/client_secret"
  description = "Cognito User Pool Client Secret for GoalsGuild ${var.environment} environment"
  type        = "SecureString"
  value       = "1"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}




# CloudWatch Log Group for API Gateway Access Logs
resource "aws_cloudwatch_log_group" "apigw_access_logs" {
  name              = "/aws/apigateway/goalsguild_api_${var.environment}_access_logs"
  retention_in_days = 1

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "apigateway"
  }
}

# IAM Role for API Gateway to write logs
resource "aws_iam_role" "apigw_cloudwatch_role" {
  name = "goalsguild_apigw_cloudwatch_role_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# Lets API Gateway write logs to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "apigw_push_to_cw" {
  role       = aws_iam_role.apigw_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Must exist before any stage enables logging
resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch_role.arn
  depends_on          = [aws_iam_role_policy_attachment.apigw_push_to_cw]
}



resource "aws_iam_role_policy" "apigw_cloudwatch_policy" {
  name = "goalsguild_apigw_cloudwatch_policy_${var.environment}"
  role = aws_iam_role.apigw_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}


# Re-deploy whenever any integration changes
resource "aws_api_gateway_deployment" "rest_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeploy = sha1(jsonencode({
      user_signup_post  = aws_api_gateway_integration.user_signup_post_integration.id
      user_login_post   = aws_api_gateway_integration.user_login_post_integration.id
      user_logout_post  = aws_api_gateway_integration.user_logout_post_integration.id
      user_login_google = aws_api_gateway_integration.user_login_google_post_integration.id
      health_get        = aws_api_gateway_integration.health_get_integration.id
      quest_get         = aws_api_gateway_integration.quest_get_integration.id
      quest_post        = aws_api_gateway_integration.quest_post_integration.id
    }))
  }

  lifecycle { create_before_destroy = true }
}

# Enable API Gateway Stage with Access Logging
resource "aws_api_gateway_stage" "api_stage" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  stage_name    = var.api_stage_name
  deployment_id = aws_api_gateway_deployment.rest_api_deployment.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw_access_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  depends_on = [
    aws_api_gateway_account.account,         # <— ensure account setting in place
    aws_iam_role_policy.apigw_cloudwatch_policy
  ]
}

# Let API Gateway assume the CW role (needed for execution logging)

resource "aws_api_gateway_method_settings" "all_methods" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "*/*" # or "/" to apply to entire stage

  settings {
    logging_level      = "INFO"   # or "ERROR"
    metrics_enabled    = true
    data_trace_enabled = true
  }

  depends_on = [aws_api_gateway_account.account]
}


# New SSM Parameter for User Services environment variables (excluding AWS_REGION)
resource "aws_ssm_parameter" "user_service_env_vars" {
  name        = "/goalsguild/${var.environment}/user-service/env_vars"
  description = "JSON object of environment variables for User Service excluding AWS_REGION"
  type        = "String"
  value       = jsonencode({
    COGNITO_USER_POOL_ID     = aws_ssm_parameter.cognito_user_pool_id.value
    COGNITO_CLIENT_ID        = aws_ssm_parameter.cognito_client_id.value
    COGNITO_CLIENT_SECRET    = aws_ssm_parameter.cognito_client_secret.value
    EMAIL_SENDER             = "no-reply@goalsguild.com"
    FRONTEND_BASE_URL        = "https://app.goalsguild.com"
    PASSWORD_KEY             = "your-encrypted-password-key" # Replace with actual secure value or SSM reference
  })

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

# Attach IAM policy to Lambda execution role to allow reading the new SSM parameter
resource "aws_iam_role_policy" "lambda_ssm_read_user_service_env" {
  name = "goalsguild_lambda_ssm_read_user_service_env_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement: [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter"
        ],
        Resource = [
          aws_ssm_parameter.user_service_env_vars.arn
        ]
      }
    ]
  })
}


# Inline policy granting read access to specific SSM parameters
resource "aws_iam_role_policy" "lambda_ssm_read_policy" {
  name = "goalsguild_lambda_ssm_read_policy_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement: [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = [
          aws_ssm_parameter.cognito_client_secret.arn,
          aws_ssm_parameter.cognito_client_id.arn,
          aws_ssm_parameter.cognito_user_pool_id.arn,
          aws_ssm_parameter.user_service_env_vars.arn
        ]
      }
    ]
  })
}