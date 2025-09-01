# API Gateway REST API
resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "goalsguild_api_${var.environment}"
  description = "API Gateway for GoalsGuild services"

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "api-gateway"
  }
}

# Lambda Authorizer for API Gateway using user-service Lambda
resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                   = "goalsguild_lambda_authorizer_${var.environment}"
  rest_api_id            = aws_api_gateway_rest_api.rest_api.id
  authorizer_uri         = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
  authorizer_result_ttl_in_seconds = 300
  identity_source        = "method.request.header.Authorization"
  type                   = "TOKEN"
  authorizer_credentials = var.api_gateway_lambda_role_arn # Optional: IAM role ARN for API Gateway to assume when invoking Lambda authorizer
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

# POST /users/logout (requires auth via Lambda authorizer)
resource "aws_api_gateway_method" "user_logout_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_logout_resource.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
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

# GET /quests (requires auth via Lambda authorizer)
resource "aws_api_gateway_method" "quest_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
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

# POST /quests (requires auth via Lambda authorizer)
resource "aws_api_gateway_method" "quest_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
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

# Lambda permission for API Gateway to invoke the Lambda authorizer
resource "aws_lambda_permission" "allow_api_gateway_lambda_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeLambdaAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = var.user_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/authorizers/${aws_api_gateway_authorizer.lambda_authorizer.id}"
}

# Re-deploy whenever any integration or authorizer changes
resource "aws_api_gateway_deployment" "rest_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeploy = sha1(jsonencode({
      user_signup_post           = aws_api_gateway_integration.user_signup_post_integration.id
      user_login_post            = aws_api_gateway_integration.user_login_post_integration.id
      user_logout_post           = aws_api_gateway_integration.user_logout_post_integration.id
      user_login_google          = aws_api_gateway_integration.user_login_google_post_integration.id
      health_get                 = aws_api_gateway_integration.health_get_integration.id
      quest_get                  = aws_api_gateway_integration.quest_get_integration.id
      quest_post                 = aws_api_gateway_integration.quest_post_integration.id
      lambda_authorizer          = aws_api_gateway_authorizer.lambda_authorizer.id
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
    aws_api_gateway_account.account,
    aws_iam_role_policy.apigw_cloudwatch_policy
  ]
}

# Let API Gateway assume the CW role (needed for execution logging)

resource "aws_api_gateway_method_settings" "all_methods" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    metrics_enabled    = true
    data_trace_enabled = true
  }

  depends_on = [aws_api_gateway_account.account]
}
