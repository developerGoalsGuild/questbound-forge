# API Gateway REST API for GoalsGuild User-Service
resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "goalsguild_api_${var.environment}"
  description = "API Gateway for GoalsGuild services"

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "api-gateway"
  }
}

# Lambda Authorizer for API Gateway using user-service Lambda authorizer function
resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                   = "goalsguild_lambda_authorizer_${var.environment}"
  rest_api_id            = aws_api_gateway_rest_api.rest_api.id
  authorizer_uri         = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.lambda_authorizer_arn}/invocations"
  authorizer_result_ttl_in_seconds = 300
  identity_source        = "method.request.header.Authorization"
  type                   = "TOKEN"
  authorizer_credentials = var.api_gateway_authorizer_lambda_role_arn
}

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

resource "aws_api_gateway_resource" "user_signup_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "signup"
}

# /users/login resource
resource "aws_api_gateway_resource" "user_login_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "login"
}

# /users/logout resource
resource "aws_api_gateway_resource" "user_logout_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_service_resource.id
  path_part   = "logout"
}

# /users/login/google resource (nested under /users/login)
resource "aws_api_gateway_resource" "user_login_google_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.user_login_resource.id
  path_part   = "google"
}

# /health resource (root level)
resource "aws_api_gateway_resource" "user_health_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "health"
}

# --- Methods and Integrations for User-Service API ---

# POST /users/signup (public, no auth)
resource "aws_api_gateway_method" "user_signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_signup_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_signup_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_signup_resource.id
  http_method             = aws_api_gateway_method.user_signup_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# OPTIONS /users/signup (CORS preflight)
resource "aws_api_gateway_method" "user_signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_signup_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "user_signup_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_signup_resource.id
  http_method             = aws_api_gateway_method.user_signup_options.http_method
  type                    = "MOCK"
  request_templates       = { "application/json" = "{\"statusCode\": 200}" }

  integration_http_method = "POST"

  passthrough_behavior = "WHEN_NO_MATCH"

}

resource "aws_api_gateway_integration_response" "user_signup_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup_resource.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = "'*'",
    "method.response.header.Access-Control-Allow-Credentials"  = "'true'",
    "method.response.header.Vary"                              = "'Origin'",
    "method.response.header.Access-Control-Allow-Headers"      = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'",
    "method.response.header.Access-Control-Allow-Methods"      = "'OPTIONS,POST'"
  }
  response_templates = { "application/json" = "" }

  depends_on = [aws_api_gateway_integration.user_signup_options_integration]
}

resource "aws_api_gateway_method_response" "user_signup_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup_resource.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = 200
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = true,
    "method.response.header.Access-Control-Allow-Credentials"  = true,
    "method.response.header.Vary"                              = true,
    "method.response.header.Access-Control-Allow-Headers"      = true,
    "method.response.header.Access-Control-Allow-Methods"      = true
  }
}

resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
  "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
  "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
  "gatewayresponse.header.Vary" = "'Origin'"
  "gatewayresponse.header.Access-Control-Allow-Headers" = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'"
  "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
  }

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
  "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
  "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
  "gatewayresponse.header.Vary" = "'Origin'"
  "gatewayresponse.header.Access-Control-Allow-Headers" = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'"
  "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
}


# POST /users/login (public, no auth)
resource "aws_api_gateway_method" "user_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_login_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_resource.id
  http_method             = aws_api_gateway_method.user_login_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# OPTIONS /users/login (CORS preflight)
resource "aws_api_gateway_method" "user_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "user_login_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_resource.id
  http_method             = aws_api_gateway_method.user_login_options.http_method
  type                    = "MOCK"
  request_templates       = { "application/json" = "{\"statusCode\": 200}" }
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_integration_response" "user_login_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_resource.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = "'*'",
    "method.response.header.Access-Control-Allow-Credentials"  = "'true'",
    "method.response.header.Vary"                              = "'Origin'",
    "method.response.header.Access-Control-Allow-Headers"      = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'",
    "method.response.header.Access-Control-Allow-Methods"      = "'OPTIONS,POST'"
  }
  response_templates = { "application/json" = "" }

  depends_on = [aws_api_gateway_integration.user_login_options_integration]
}

resource "aws_api_gateway_method_response" "user_login_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_resource.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = 200
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = true,
    "method.response.header.Access-Control-Allow-Credentials"  = true,
    "method.response.header.Vary"                              = true,
    "method.response.header.Access-Control-Allow-Headers"      = true,
    "method.response.header.Access-Control-Allow-Methods"      = true
  }
}

# POST /users/logout (requires custom auth via Lambda authorizer)
resource "aws_api_gateway_method" "user_logout_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_logout_resource.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_api_gateway_integration" "user_logout_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_logout_resource.id
  http_method             = aws_api_gateway_method.user_logout_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [aws_api_gateway_method.user_logout_post]
}

# OPTIONS /users/logout (CORS preflight)
resource "aws_api_gateway_method" "user_logout_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_logout_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "user_logout_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_logout_resource.id
  http_method             = aws_api_gateway_method.user_logout_options.http_method
  type                    = "MOCK"
  request_templates       = { "application/json" = "{\"statusCode\": 200}" }
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_integration_response" "user_logout_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_logout_resource.id
  http_method = aws_api_gateway_method.user_logout_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = "'*'",
    "method.response.header.Access-Control-Allow-Credentials"  = "'true'",
    "method.response.header.Vary"                              = "'Origin'",
    "method.response.header.Access-Control-Allow-Headers"      = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'",
    "method.response.header.Access-Control-Allow-Methods"      = "'OPTIONS,POST'"
  }
  response_templates = { "application/json" = "" }
  depends_on = [aws_api_gateway_integration.user_logout_options_integration]
}

resource "aws_api_gateway_method_response" "user_logout_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_logout_resource.id
  http_method = aws_api_gateway_method.user_logout_options.http_method
  status_code = 200
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = true,
    "method.response.header.Access-Control-Allow-Credentials"  = true,
    "method.response.header.Vary"                              = true,
    "method.response.header.Access-Control-Allow-Headers"      = true,
    "method.response.header.Access-Control-Allow-Methods"      = true
  }
}

# POST /users/login/google (public, no auth)
resource "aws_api_gateway_method" "user_login_google_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_google_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_login_google_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_google_resource.id
  http_method             = aws_api_gateway_method.user_login_google_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# OPTIONS /users/login/google (CORS preflight)
resource "aws_api_gateway_method" "user_login_google_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_google_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "user_login_google_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_google_resource.id
  http_method             = aws_api_gateway_method.user_login_google_options.http_method
  type                    = "MOCK"
  request_templates       = { "application/json" = "{\"statusCode\": 200}" }
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_integration_response" "user_login_google_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_google_resource.id
  http_method = aws_api_gateway_method.user_login_google_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = "'*'",
    "method.response.header.Access-Control-Allow-Credentials"  = "'true'",
    "method.response.header.Vary"                              = "'Origin'",
    "method.response.header.Access-Control-Allow-Headers"      = "'content-type,authorization,x-api-key,x-amz-date,x-amz-security-token'",
    "method.response.header.Access-Control-Allow-Methods"      = "'OPTIONS,POST'"
  }
  response_templates = { "application/json" = "" }
  depends_on = [aws_api_gateway_integration.user_login_google_options_integration]
}

resource "aws_api_gateway_method_response" "user_login_google_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_google_resource.id
  http_method = aws_api_gateway_method.user_login_google_options.http_method
  status_code = 200
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"       = true,
    "method.response.header.Access-Control-Allow-Credentials"  = true,
    "method.response.header.Vary"                              = true,
    "method.response.header.Access-Control-Allow-Headers"      = true,
    "method.response.header.Access-Control-Allow-Methods"      = true
  }
}

# GET /health (public, no auth)
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_health_resource.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "health_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_health_resource.id
  http_method             = aws_api_gateway_method.health_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST" # Lambda proxy requires POST even for GET method
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# Quest-Service API Gateway Methods and Integrations

# GET /quests (requires auth)

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

# POST /quests (requires auth)
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

# Re-deploy whenever any integration changes
resource "aws_api_gateway_deployment" "rest_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeploy = sha1(jsonencode({
      user_signup_post  = aws_api_gateway_integration.user_signup_post_integration.id
      user_signup_options = aws_api_gateway_integration.user_signup_options_integration.id
      cors_signup_ir    = aws_api_gateway_integration_response.user_signup_options_200.id
      cors_signup_mr    = aws_api_gateway_method_response.user_signup_options_200.id
      user_login_post   = aws_api_gateway_integration.user_login_post_integration.id
      user_login_options = aws_api_gateway_integration.user_login_options_integration.id
      cors_login_ir     = aws_api_gateway_integration_response.user_login_options_200.id
      cors_login_mr     = aws_api_gateway_method_response.user_login_options_200.id
      user_logout_post  = aws_api_gateway_integration.user_logout_post_integration.id
      user_logout_options = aws_api_gateway_integration.user_logout_options_integration.id
      cors_logout_ir    = aws_api_gateway_integration_response.user_logout_options_200.id
      cors_logout_mr    = aws_api_gateway_method_response.user_logout_options_200.id
      user_login_google = aws_api_gateway_integration.user_login_google_post_integration.id
      user_login_google_options = aws_api_gateway_integration.user_login_google_options_integration.id
      cors_google_ir    = aws_api_gateway_integration_response.user_login_google_options_200.id
      cors_google_mr    = aws_api_gateway_method_response.user_login_google_options_200.id
      health_get        = aws_api_gateway_integration.health_get_integration.id
      quest_get         = aws_api_gateway_integration.quest_get_integration.id
      quest_post        = aws_api_gateway_integration.quest_post_integration.id
      default_4xx       = aws_api_gateway_gateway_response.default_4xx.id
      default_5xx       = aws_api_gateway_gateway_response.default_5xx.id
    }))
  }

  depends_on = [
    # all methods
    aws_api_gateway_method.user_signup_post,
    aws_api_gateway_method.user_signup_options,
    aws_api_gateway_method.user_login_post,
    aws_api_gateway_method.user_login_options,
    aws_api_gateway_method.user_logout_options,
    aws_api_gateway_method.user_login_google_options,
    aws_api_gateway_method.user_logout_post,
    aws_api_gateway_method.user_login_google_post,
    aws_api_gateway_method.health_get,
    aws_api_gateway_method.quest_get,
    aws_api_gateway_method.quest_post,

    # all integrations
    aws_api_gateway_integration.user_signup_post_integration,
    aws_api_gateway_integration.user_signup_options_integration,
    aws_api_gateway_integration.user_login_post_integration,
    aws_api_gateway_integration.user_login_options_integration,
    aws_api_gateway_integration.user_logout_options_integration,
    aws_api_gateway_integration.user_login_google_options_integration,
    aws_api_gateway_integration.user_logout_post_integration,
    aws_api_gateway_integration.user_login_google_post_integration,
    aws_api_gateway_integration.health_get_integration,
    aws_api_gateway_integration.quest_get_integration,
    aws_api_gateway_integration.quest_post_integration,

    # ensure all CORS method + integration responses exist before deployment
    aws_api_gateway_method_response.user_signup_options_200,
    aws_api_gateway_integration_response.user_signup_options_200,
    aws_api_gateway_method_response.user_login_options_200,
    aws_api_gateway_integration_response.user_login_options_200,
    aws_api_gateway_method_response.user_logout_options_200,
    aws_api_gateway_integration_response.user_logout_options_200,
    aws_api_gateway_method_response.user_login_google_options_200,
    aws_api_gateway_integration_response.user_login_google_options_200,
  ]

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

# API Key and Usage Plan for public methods
resource "random_string" "apigw_api_key" {
  length  = 32
  upper   = false
  lower   = true
  numeric  = true
  special = false
}

resource "aws_api_gateway_api_key" "frontend_key" {
  name        = "goalsguild_api_key_${var.environment}"
  description = "API key for frontend to call public REST endpoints"
  enabled     = true
  value       = random_string.apigw_api_key.result
}

resource "aws_api_gateway_usage_plan" "frontend_plan" {
  name        = "goalsguild_usage_plan_${var.environment}"
  description = "Usage plan for frontend API key"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_stage.api_stage.stage_name
  }

  throttle_settings {
    burst_limit = 50
    rate_limit  = 25
  }

  quota_settings {
    limit  = 100000
    period = "MONTH"
  }

  depends_on = [aws_api_gateway_stage.api_stage]
}

resource "aws_api_gateway_usage_plan_key" "frontend_key_attachment" {
  key_id        = aws_api_gateway_api_key.frontend_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.frontend_plan.id
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
# Lambda permissions for API Gateway to invoke user-service Lambda
resource "aws_lambda_permission" "allow_api_gateway_user" {
  statement_id  = "AllowAPIGatewayInvokeUser"
  action        = "lambda:InvokeFunction"
  function_name = var.user_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

# Lambda permission for API Gateway to invoke the Lambda authorizer
resource "aws_lambda_permission" "allow_api_gateway_lambda_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeLambdaAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_authorizer_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/authorizers/${aws_api_gateway_authorizer.lambda_authorizer.id}"
}


resource "aws_lambda_permission" "allow_api_gateway_quest" {
  statement_id  = "AllowAPIGatewayInvokeQuest"
  action        = "lambda:InvokeFunction"
  function_name = var.quest_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

