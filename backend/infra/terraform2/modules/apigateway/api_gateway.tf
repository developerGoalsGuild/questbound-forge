locals {
  cors_allow_headers = "accept,content-type,authorization,x-api-key,origin,referer,x-amz-date,x-amz-security-token,x-requested-with"
  cors_allow_origin  = length(var.frontend_allowed_origins) > 0 ? var.frontend_allowed_origins[0] : "*"
  
  # Security headers
  security_headers = {
    "X-Content-Type-Options"     = "nosniff"
    "X-Frame-Options"            = "DENY"
    "X-XSS-Protection"           = "1; mode=block"
    "Strict-Transport-Security"  = "max-age=31536000; includeSubDomains"
    "Referrer-Policy"            = "strict-origin-when-cross-origin"
    "Content-Security-Policy"    = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
}

resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "goalsguild_api_${var.environment}"
  description = "API Gateway for GoalsGuild services"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "*"
      }
    ]
  })
}

# API Gateway caching is configured at the method level via aws_api_gateway_method_settings

resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                            = "goalsguild_lambda_authorizer_${var.environment}"
  rest_api_id                     = aws_api_gateway_rest_api.rest_api.id
  authorizer_uri                  = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.lambda_authorizer_arn}/invocations"
  authorizer_result_ttl_in_seconds = 300
  identity_source                 = "method.request.header.Authorization"
  type                            = "TOKEN"
}

# Resources
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "users"
}
resource "aws_api_gateway_resource" "auth"  {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "auth"
}
resource "aws_api_gateway_resource" "auth_renew" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "renew"
}
resource "aws_api_gateway_resource" "quests" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "quests"
}
resource "aws_api_gateway_resource" "quests_tasks" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "tasks"
}

# OPTIONS /quests/tasks
resource "aws_api_gateway_method" "quests_tasks_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_tasks.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_tasks_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks.id
  http_method = aws_api_gateway_method.quests_tasks_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}
resource "aws_api_gateway_method_response" "quests_tasks_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks.id
  http_method = aws_api_gateway_method.quests_tasks_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_tasks_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks.id
  http_method = aws_api_gateway_method.quests_tasks_options.http_method
  status_code = aws_api_gateway_method_response.quests_tasks_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}
resource "aws_api_gateway_resource" "quests_goal_id" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "{goal_id}"
}

resource "aws_api_gateway_resource" "quests_create_task" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "createTask"
}

# Quest management resources
resource "aws_api_gateway_resource" "quests_create_quest" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "createQuest"
}

resource "aws_api_gateway_resource" "quests_quests" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "quests"
}

resource "aws_api_gateway_resource" "quests_quests_id" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_quests.id
  path_part   = "{quest_id}"
}

resource "aws_api_gateway_resource" "quests_quests_id_start" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_quests_id.id
  path_part   = "start"
}

resource "aws_api_gateway_resource" "quests_quests_id_cancel" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_quests_id.id
  path_part   = "cancel"
}

resource "aws_api_gateway_resource" "quests_quests_id_fail" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_quests_id.id
  path_part   = "fail"
}

# Quest auto-completion endpoint
resource "aws_api_gateway_resource" "quests_check_completion" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "check-completion"
}

# Quest analytics endpoint
resource "aws_api_gateway_resource" "quests_analytics" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "analytics"
}

# Quest templates endpoints
resource "aws_api_gateway_resource" "quests_templates" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "templates"
}

resource "aws_api_gateway_resource" "quests_templates_id" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_templates.id
  path_part   = "{template_id}"
}

# Progress endpoints
resource "aws_api_gateway_resource" "quests_progress" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "progress"
}

resource "aws_api_gateway_resource" "quests_goal_id_progress" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_goal_id.id
  path_part   = "progress"
}
resource "aws_api_gateway_resource" "quests_tasks_task_id" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quests_tasks.id
  path_part   = "{task_id}"
}
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "profile" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "profile"
}

# POST /users/signup (public)
resource "aws_api_gateway_resource" "user_signup" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "signup"
}
resource "aws_api_gateway_method" "user_signup_post" {
  rest_api_id      = aws_api_gateway_rest_api.rest_api.id
  resource_id      = aws_api_gateway_resource.user_signup.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}
resource "aws_api_gateway_method" "user_signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "user_signup_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_signup.id
  http_method             = aws_api_gateway_method.user_signup_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "user_signup_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "user_signup_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "user_signup_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = aws_api_gateway_method_response.user_signup_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# POST /users/login (public)
resource "aws_api_gateway_resource" "user_login" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "login"
}
resource "aws_api_gateway_method" "user_login_post" {
  rest_api_id      = aws_api_gateway_rest_api.rest_api.id
  resource_id      = aws_api_gateway_resource.user_login.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}
resource "aws_api_gateway_method" "user_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "user_login_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login.id
  http_method             = aws_api_gateway_method.user_login_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "user_login_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "user_login_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "user_login_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = aws_api_gateway_method_response.user_login_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# GET /profile (authenticated)
resource "aws_api_gateway_method" "profile_get" {
  rest_api_id      = aws_api_gateway_rest_api.rest_api.id
  resource_id      = aws_api_gateway_resource.profile.id
  http_method      = "GET"
  authorization    = "CUSTOM"
  authorizer_id    = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = true
}

# PUT /profile (authenticated)
resource "aws_api_gateway_method" "profile_put" {
  rest_api_id      = aws_api_gateway_rest_api.rest_api.id
  resource_id      = aws_api_gateway_resource.profile.id
  http_method      = "PUT"
  authorization    = "CUSTOM"
  authorizer_id    = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = true
}

# OPTIONS /profile (CORS)
resource "aws_api_gateway_method" "profile_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.profile.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# GET /health (public)
resource "aws_api_gateway_method" "health_get" {
  rest_api_id      = aws_api_gateway_rest_api.rest_api.id
  resource_id      = aws_api_gateway_resource.health.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}
resource "aws_api_gateway_method" "health_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "health_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "health_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "health_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "health_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = aws_api_gateway_method_response.health_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# /auth/renew (CUSTOM)
resource "aws_api_gateway_method" "auth_renew_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.auth_renew.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "auth_renew_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.auth_renew.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "auth_renew_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.auth_renew.id
  http_method             = aws_api_gateway_method.auth_renew_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "auth_renew_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "auth_renew_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "auth_renew_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  status_code = aws_api_gateway_method_response.auth_renew_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# Profile integrations
resource "aws_api_gateway_integration" "profile_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.profile.id
  http_method             = aws_api_gateway_method.profile_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
  cache_key_parameters    = ["method.request.header.Authorization"]
  cache_namespace         = "user-profile"
}

resource "aws_api_gateway_integration" "profile_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.profile.id
  http_method             = aws_api_gateway_method.profile_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"
}

# Profile OPTIONS method response
resource "aws_api_gateway_method_response" "profile_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.profile.id
  http_method = aws_api_gateway_method.profile_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Profile OPTIONS integration
resource "aws_api_gateway_integration" "profile_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.profile.id
  http_method = aws_api_gateway_method.profile_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Profile OPTIONS integration response
resource "aws_api_gateway_integration_response" "profile_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.profile.id
  http_method = aws_api_gateway_method.profile_options.http_method
  status_code = aws_api_gateway_method_response.profile_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# /quests (CUSTOM)
resource "aws_api_gateway_method" "quests_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests.id
  http_method             = aws_api_gateway_method.quests_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
  cache_key_parameters    = ["method.request.header.Authorization"]
  cache_namespace         = "quests-list"
}
resource "aws_api_gateway_integration" "quests_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests.id
  http_method = aws_api_gateway_method.quests_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "quests_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests.id
  http_method = aws_api_gateway_method.quests_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "quests_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests.id
  http_method = aws_api_gateway_method.quests_options.http_method
  status_code = aws_api_gateway_method_response.quests_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# /quests (POST) - Create goal
resource "aws_api_gateway_method" "quests_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_integration" "quests_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests.id
  http_method             = aws_api_gateway_method.quests_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_post_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests.id
  http_method = aws_api_gateway_method.quests_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_integration_response" "quests_post_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests.id
  http_method = aws_api_gateway_method.quests_options.http_method
  status_code = aws_api_gateway_method_response.quests_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = jsonencode({})
    "text/plain" = jsonencode({})
  }
}

# /quests/createTask (POST)
resource "aws_api_gateway_method" "quests_create_task_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_create_task.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_create_task_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_create_task.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_create_task_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_create_task.id
  http_method             = aws_api_gateway_method.quests_create_task_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_create_task_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_task.id
  http_method = aws_api_gateway_method.quests_create_task_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}
resource "aws_api_gateway_method_response" "quests_create_task_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_task.id
  http_method = aws_api_gateway_method.quests_create_task_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_create_task_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_task.id
  http_method = aws_api_gateway_method.quests_create_task_options.http_method
  status_code = aws_api_gateway_method_response.quests_create_task_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# /quests/tasks/{task_id} (PUT)
resource "aws_api_gateway_method" "quests_tasks_task_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_tasks_task_id_put_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_tasks_task_id_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method             = aws_api_gateway_method.quests_tasks_task_id_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_tasks_task_id_put_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method = aws_api_gateway_method.quests_tasks_task_id_put_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}
resource "aws_api_gateway_method_response" "quests_tasks_task_id_put_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method = aws_api_gateway_method.quests_tasks_task_id_put_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_tasks_task_id_put_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method = aws_api_gateway_method.quests_tasks_task_id_put_options.http_method
  status_code = aws_api_gateway_method_response.quests_tasks_task_id_put_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# /quests/{goal_id} (PUT)
resource "aws_api_gateway_method" "quests_goal_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_goal_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_goal_id_put_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_goal_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_goal_id_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_goal_id.id
  http_method             = aws_api_gateway_method.quests_goal_id_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_goal_id_put_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id.id
  http_method = aws_api_gateway_method.quests_goal_id_put_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_method_response" "quests_goal_id_put_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id.id
  http_method = aws_api_gateway_method.quests_goal_id_put_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_goal_id_put_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id.id
  http_method = aws_api_gateway_method.quests_goal_id_put_options.http_method
  status_code = aws_api_gateway_method_response.quests_goal_id_put_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = jsonencode({})
    "text/plain" = jsonencode({})
  }
}

# /quests/{goal_id} (DELETE)
resource "aws_api_gateway_method" "quests_goal_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_goal_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_integration" "quests_goal_id_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_goal_id.id
  http_method             = aws_api_gateway_method.quests_goal_id_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_goal_id_delete_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id.id
  http_method = aws_api_gateway_method.quests_goal_id_put_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_integration_response" "quests_goal_id_delete_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id.id
  http_method = aws_api_gateway_method.quests_goal_id_put_options.http_method
  status_code = aws_api_gateway_method_response.quests_goal_id_put_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = jsonencode({})
    "text/plain" = jsonencode({})
  }
}

# /quests/tasks/{task_id} (DELETE)
resource "aws_api_gateway_method" "quests_tasks_task_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

# /quests/progress (GET) - Get all goals progress
resource "aws_api_gateway_method" "quests_progress_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_progress.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_progress_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_progress.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_progress_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_progress.id
  http_method             = aws_api_gateway_method.quests_progress_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_progress_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_progress.id
  http_method = aws_api_gateway_method.quests_progress_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}
resource "aws_api_gateway_method_response" "quests_progress_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_progress.id
  http_method = aws_api_gateway_method.quests_progress_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_progress_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_progress.id
  http_method = aws_api_gateway_method.quests_progress_options.http_method
  status_code = aws_api_gateway_method_response.quests_progress_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# /quests/{goal_id}/progress (GET) - Get specific goal progress
resource "aws_api_gateway_method" "quests_goal_id_progress_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}
resource "aws_api_gateway_method" "quests_goal_id_progress_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}
resource "aws_api_gateway_integration" "quests_goal_id_progress_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method             = aws_api_gateway_method.quests_goal_id_progress_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_goal_id_progress_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method = aws_api_gateway_method.quests_goal_id_progress_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}
resource "aws_api_gateway_method_response" "quests_goal_id_progress_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method = aws_api_gateway_method.quests_goal_id_progress_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}
resource "aws_api_gateway_integration_response" "quests_goal_id_progress_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_goal_id_progress.id
  http_method = aws_api_gateway_method.quests_goal_id_progress_options.http_method
  status_code = aws_api_gateway_method_response.quests_goal_id_progress_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}
resource "aws_api_gateway_integration" "quests_tasks_task_id_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method             = aws_api_gateway_method.quests_tasks_task_id_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}
resource "aws_api_gateway_integration" "quests_tasks_task_id_delete_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method = aws_api_gateway_method.quests_tasks_task_id_put_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}
resource "aws_api_gateway_integration_response" "quests_tasks_task_id_delete_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_tasks_task_id.id
  http_method = aws_api_gateway_method.quests_tasks_task_id_put_options.http_method
  status_code = aws_api_gateway_method_response.quests_tasks_task_id_put_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# ---------- Quest Management Endpoints ----------

# POST /quests/createQuest
resource "aws_api_gateway_method" "quests_create_quest_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_create_quest.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_method" "quests_create_quest_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_create_quest.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "quests_create_quest_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_create_quest.id
  http_method             = aws_api_gateway_method.quests_create_quest_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "quests_create_quest_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_quest.id
  http_method = aws_api_gateway_method.quests_create_quest_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_create_quest_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_quest.id
  http_method = aws_api_gateway_method.quests_create_quest_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_create_quest_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_create_quest.id
  http_method = aws_api_gateway_method.quests_create_quest_options.http_method
  status_code = aws_api_gateway_method_response.quests_create_quest_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# POST /quests/quests/{quest_id}/start
resource "aws_api_gateway_method" "quests_quests_id_start_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_start.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_method" "quests_quests_id_start_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_start.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "quests_quests_id_start_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_quests_id_start.id
  http_method             = aws_api_gateway_method.quests_quests_id_start_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "quests_quests_id_start_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_start.id
  http_method = aws_api_gateway_method.quests_quests_id_start_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_quests_id_start_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_start.id
  http_method = aws_api_gateway_method.quests_quests_id_start_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_quests_id_start_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_start.id
  http_method = aws_api_gateway_method.quests_quests_id_start_options.http_method
  status_code = aws_api_gateway_method_response.quests_quests_id_start_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# PUT /quests/quests/{quest_id}
resource "aws_api_gateway_method" "quests_quests_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_method" "quests_quests_id_put_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "quests_quests_id_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_quests_id.id
  http_method             = aws_api_gateway_method.quests_quests_id_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "quests_quests_id_put_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id.id
  http_method = aws_api_gateway_method.quests_quests_id_put_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_quests_id_put_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id.id
  http_method = aws_api_gateway_method.quests_quests_id_put_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_quests_id_put_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id.id
  http_method = aws_api_gateway_method.quests_quests_id_put_options.http_method
  status_code = aws_api_gateway_method_response.quests_quests_id_put_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# POST /quests/quests/{quest_id}/cancel
resource "aws_api_gateway_method" "quests_quests_id_cancel_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_method" "quests_quests_id_cancel_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "quests_quests_id_cancel_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method             = aws_api_gateway_method.quests_quests_id_cancel_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "quests_quests_id_cancel_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method = aws_api_gateway_method.quests_quests_id_cancel_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_quests_id_cancel_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method = aws_api_gateway_method.quests_quests_id_cancel_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_quests_id_cancel_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_cancel.id
  http_method = aws_api_gateway_method.quests_quests_id_cancel_options.http_method
  status_code = aws_api_gateway_method_response.quests_quests_id_cancel_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# POST /quests/quests/{quest_id}/fail
resource "aws_api_gateway_method" "quests_quests_id_fail_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_method" "quests_quests_id_fail_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "quests_quests_id_fail_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method             = aws_api_gateway_method.quests_quests_id_fail_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_integration" "quests_quests_id_fail_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method = aws_api_gateway_method.quests_quests_id_fail_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_quests_id_fail_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method = aws_api_gateway_method.quests_quests_id_fail_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_quests_id_fail_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_quests_id_fail.id
  http_method = aws_api_gateway_method.quests_quests_id_fail_options.http_method
  status_code = aws_api_gateway_method_response.quests_quests_id_fail_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# POST /quests/check-completion
resource "aws_api_gateway_method" "quests_check_completion_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_check_completion.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_check_completion_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_check_completion.id
  http_method             = aws_api_gateway_method.quests_check_completion_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

resource "aws_api_gateway_method" "quests_check_completion_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_check_completion.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "quests_check_completion_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_check_completion.id
  http_method = aws_api_gateway_method.quests_check_completion_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_check_completion_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_check_completion.id
  http_method = aws_api_gateway_method.quests_check_completion_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "quests_check_completion_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_check_completion.id
  http_method = aws_api_gateway_method.quests_check_completion_options.http_method
  status_code = aws_api_gateway_method_response.quests_check_completion_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}

# GET /quests/analytics (authenticated)
resource "aws_api_gateway_method" "quests_analytics_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_analytics.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = true
}

resource "aws_api_gateway_method" "quests_analytics_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_analytics.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "quests_analytics_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_analytics.id
  http_method             = aws_api_gateway_method.quests_analytics_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
  cache_key_parameters    = ["method.request.header.Authorization", "method.request.querystring.period"]
  cache_namespace         = "quests-analytics"
}

resource "aws_api_gateway_integration" "quests_analytics_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_analytics.id
  http_method = aws_api_gateway_method.quests_analytics_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_analytics_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_analytics.id
  http_method = aws_api_gateway_method.quests_analytics_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "quests_analytics_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_analytics.id
  http_method = aws_api_gateway_method.quests_analytics_options.http_method
  status_code = aws_api_gateway_method_response.quests_analytics_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# Quest Templates Methods

# OPTIONS /quests/templates
resource "aws_api_gateway_method" "quests_templates_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "quests_templates_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates.id
  http_method = aws_api_gateway_method.quests_templates_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_templates_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates.id
  http_method = aws_api_gateway_method.quests_templates_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "quests_templates_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates.id
  http_method = aws_api_gateway_method.quests_templates_options.http_method
  status_code = aws_api_gateway_method_response.quests_templates_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# GET /quests/templates (authenticated)
resource "aws_api_gateway_method" "quests_templates_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_templates_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_templates.id
  http_method             = aws_api_gateway_method.quests_templates_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
  cache_key_parameters    = ["method.request.header.Authorization", "method.request.querystring.privacy"]
  cache_namespace         = "quests-templates"
}

# POST /quests/templates (authenticated)
resource "aws_api_gateway_method" "quests_templates_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_templates_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_templates.id
  http_method             = aws_api_gateway_method.quests_templates_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# OPTIONS /quests/templates/{template_id}
resource "aws_api_gateway_method" "quests_templates_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Access-Control-Request-Headers" = false
    "method.request.header.Access-Control-Request-Method" = false
    "method.request.header.Origin" = false
  }
}

resource "aws_api_gateway_integration" "quests_templates_id_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates_id.id
  http_method = aws_api_gateway_method.quests_templates_id_options.http_method
  type        = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"
  request_templates = {
    "application/json" = "{\"statusCode\":200}"
  }
}

resource "aws_api_gateway_method_response" "quests_templates_id_options_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates_id.id
  http_method = aws_api_gateway_method.quests_templates_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Max-Age" = true
    "method.response.header.Content-Type" = true
    "method.response.header.Vary" = true
  }
  response_models = {
    "application/json" = "Empty"
    "text/plain" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "quests_templates_id_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quests_templates_id.id
  http_method = aws_api_gateway_method.quests_templates_id_options.http_method
  status_code = aws_api_gateway_method_response.quests_templates_id_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin" = "'${local.cors_allow_origin}'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain" = "{}"
  }
}

# GET /quests/templates/{template_id} (authenticated)
resource "aws_api_gateway_method" "quests_templates_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_templates_id_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_templates_id.id
  http_method             = aws_api_gateway_method.quests_templates_id_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# PUT /quests/templates/{template_id} (authenticated)
resource "aws_api_gateway_method" "quests_templates_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_templates_id_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_templates_id.id
  http_method             = aws_api_gateway_method.quests_templates_id_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# DELETE /quests/templates/{template_id} (authenticated)
resource "aws_api_gateway_method" "quests_templates_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_templates_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_templates_id_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_templates_id.id
  http_method             = aws_api_gateway_method.quests_templates_id_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# DELETE /quests/quests/{quest_id}
resource "aws_api_gateway_method" "quests_quests_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quests_quests_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "quests_quests_id_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quests_quests_id.id
  http_method             = aws_api_gateway_method.quests_quests_id_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.rest_api.name}-${var.api_stage_name}"
  retention_in_days = var.environment == "dev" ? 1 : 14

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
    Stage       = var.api_stage_name
  }
}

# API Key
resource "aws_api_gateway_api_key" "api_key" {
  name        = "goalsguild_api_key_${var.environment}"
  description = "API Key for GoalsGuild ${var.environment} environment"
  enabled     = true

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
  }
}

# Usage Plan
# Default usage plan for all users
resource "aws_api_gateway_usage_plan" "default_usage_plan" {
  name        = "goalsguild_default_usage_plan_${var.environment}"
  description = "Default usage plan for GoalsGuild ${var.environment} environment"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_stage.stage.stage_name
  }

  # More conservative limits for default users
  quota_settings {
    limit  = 5000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 100
    rate_limit  = 50
  }

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
    Plan        = "default"
  }
}

# Premium usage plan for authenticated users
resource "aws_api_gateway_usage_plan" "premium_usage_plan" {
  name        = "goalsguild_premium_usage_plan_${var.environment}"
  description = "Premium usage plan for authenticated GoalsGuild users"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_stage.stage.stage_name
  }

  # Higher limits for premium users
  quota_settings {
    limit  = 20000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 500
    rate_limit  = 200
  }

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
    Plan        = "premium"
  }
}

# Admin usage plan for administrative operations
resource "aws_api_gateway_usage_plan" "admin_usage_plan" {
  name        = "goalsguild_admin_usage_plan_${var.environment}"
  description = "Admin usage plan for administrative operations"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_stage.stage.stage_name
  }

  # Very high limits for admin users
  quota_settings {
    limit  = 100000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 2000
    rate_limit  = 1000
  }

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
    Plan        = "admin"
  }
}

# Associate API Key with Default Usage Plan
resource "aws_api_gateway_usage_plan_key" "default_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.default_usage_plan.id
}

# Method-level throttling for sensitive endpoints
resource "aws_api_gateway_method_settings" "quest_create_throttling" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests.POST"

  settings {
    throttling_rate_limit  = 10  # 10 requests per second
    throttling_burst_limit = 20  # Burst up to 20 requests
  }
}

resource "aws_api_gateway_method_settings" "quest_completion_throttling" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests/check-completion.POST"

  settings {
    throttling_rate_limit  = 5   # 5 requests per second
    throttling_burst_limit = 10  # Burst up to 10 requests
  }
}

resource "aws_api_gateway_method_settings" "analytics_throttling" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests/analytics.GET"

  settings {
    throttling_rate_limit  = 20  # 20 requests per second
    throttling_burst_limit = 40  # Burst up to 40 requests
  }
}

resource "aws_api_gateway_method_settings" "template_create_throttling" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests/templates.POST"

  settings {
    throttling_rate_limit  = 5   # 5 requests per second
    throttling_burst_limit = 10  # Burst up to 10 requests
  }
}

# Caching settings for quest endpoints
resource "aws_api_gateway_method_settings" "quests_list_caching" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests.GET"

  settings {
    caching_enabled = true
    cache_ttl_in_seconds = 300  # 5 minutes cache
    cache_data_encrypted = true
    require_authorization_for_cache_control = true
  }
}

resource "aws_api_gateway_method_settings" "quests_analytics_caching" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests/analytics.GET"

  settings {
    caching_enabled = true
    cache_ttl_in_seconds = 600  # 10 minutes cache for analytics
    cache_data_encrypted = true
    require_authorization_for_cache_control = true
  }
}

resource "aws_api_gateway_method_settings" "quests_templates_caching" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "quests/templates.GET"

  settings {
    caching_enabled = true
    cache_ttl_in_seconds = 900  # 15 minutes cache for templates
    cache_data_encrypted = true
    require_authorization_for_cache_control = true
  }
}

# User service caching settings
resource "aws_api_gateway_method_settings" "profile_get_caching" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "profile.GET"

  settings {
    caching_enabled = true
    cache_ttl_in_seconds = 300  # 5 minutes cache for user profile
    cache_data_encrypted = true
    require_authorization_for_cache_control = true
  }
}

# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api_gateway_waf" {
  name  = "goalsguild-${var.environment}-api-gateway-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "goalsguild-${var.environment}-api-gateway-waf"
    sampled_requests_enabled   = true
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
  rule {
    name     = "SQLInjectionRule"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
      sampled_requests_enabled   = true
    }
  }

  # XSS protection
  rule {
    name     = "XSSRule"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSRule"
      sampled_requests_enabled   = true
    }
  }

  # IP reputation list
  rule {
    name     = "IPReputationRule"
    priority = 4

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "IPReputationRule"
      sampled_requests_enabled   = true
    }
  }

  # Known bad inputs
  rule {
    name     = "KnownBadInputsRule"
    priority = 5

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRule"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Environment = var.environment
    Service     = "api-gateway"
    Security    = "waf"
  }
}

# WAF association - conditional based on variable
resource "aws_wafv2_web_acl_association" "api_gateway_waf_association" {
  count       = var.enable_api_gateway_waf ? 1 : 0
  resource_arn = aws_api_gateway_stage.stage.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway_waf.arn
}

# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_logs_role" {
  name = "goalsguild-${var.environment}-api-gateway-logs-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Service     = "api-gateway"
  }
}

# IAM Policy for API Gateway CloudWatch Logs
resource "aws_iam_role_policy" "api_gateway_logs_policy" {
  name = "goalsguild-${var.environment}-api-gateway-logs-policy"
  role = aws_iam_role.api_gateway_logs_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Deployment + Stage (redeploy on change)
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  triggers = { 
    sha = sha1(jsonencode([
      aws_api_gateway_rest_api.rest_api,
      aws_api_gateway_method.user_signup_post,
      aws_api_gateway_method.user_signup_options,
      aws_api_gateway_method.user_login_post,
      aws_api_gateway_method.user_login_options,
      aws_api_gateway_method.health_get,
      aws_api_gateway_method.health_options,
      aws_api_gateway_method.auth_renew_post,
      aws_api_gateway_method.auth_renew_options,
      aws_api_gateway_method.quests_get,
      aws_api_gateway_method.quests_options,
      aws_api_gateway_method.quests_post,
      aws_api_gateway_method.quests_goal_id_put,
      aws_api_gateway_method.quests_goal_id_put_options,
      aws_api_gateway_method.quests_goal_id_delete,
      aws_api_gateway_method.quests_tasks_options,
      aws_api_gateway_method.quests_create_task_post,
      aws_api_gateway_method.quests_create_task_options,
      aws_api_gateway_method.quests_tasks_task_id_put,
      aws_api_gateway_method.quests_tasks_task_id_put_options,
      aws_api_gateway_method.quests_tasks_task_id_delete,
      # Progress endpoints
      aws_api_gateway_method.quests_progress_get,
      aws_api_gateway_method.quests_progress_options,
      aws_api_gateway_method.quests_goal_id_progress_get,
      aws_api_gateway_method.quests_goal_id_progress_options,
      # Quest management endpoints
      aws_api_gateway_method.quests_create_quest_post,
      aws_api_gateway_method.quests_create_quest_options,
      aws_api_gateway_method.quests_quests_id_start_post,
      aws_api_gateway_method.quests_quests_id_start_options,
      aws_api_gateway_method.quests_quests_id_put,
      aws_api_gateway_method.quests_quests_id_put_options,
      aws_api_gateway_method.quests_quests_id_cancel_post,
      aws_api_gateway_method.quests_quests_id_cancel_options,
      aws_api_gateway_method.quests_quests_id_fail_post,
      aws_api_gateway_method.quests_quests_id_fail_options,
      aws_api_gateway_method.quests_quests_id_delete,
      # Analytics endpoint
      aws_api_gateway_method.quests_analytics_get,
      aws_api_gateway_method.quests_analytics_options,
      # Template endpoints
      aws_api_gateway_method.quests_templates_get,
      aws_api_gateway_method.quests_templates_post,
      aws_api_gateway_method.quests_templates_options,
      aws_api_gateway_method.quests_templates_id_get,
      aws_api_gateway_method.quests_templates_id_put,
      aws_api_gateway_method.quests_templates_id_delete,
      aws_api_gateway_method.quests_templates_id_options,
    ]))
  }
  lifecycle { create_before_destroy = true }
}
resource "aws_api_gateway_stage" "stage" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  stage_name    = var.api_stage_name
  deployment_id = aws_api_gateway_deployment.deployment.id
  
  # Enable CloudWatch logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
        format = jsonencode({
          requestId      = "$context.requestId"
          ip             = "$context.identity.sourceIp"
          caller         = "$context.identity.caller"
          user           = "$context.identity.user"
          requestTime    = "$requestTime"
          httpMethod     = "$httpMethod"
          resourcePath   = "$resourcePath"
          status         = "$status"
          protocol       = "$protocol"
          responseLength = "$responseLength"
        })
  }
  
  # Enable X-Ray tracing (disabled for dev environment)
  xray_tracing_enabled = var.environment != "dev"
  
  # Enable caching for performance optimization
  cache_cluster_enabled = true
  cache_cluster_size    = "0.5"  # 0.5 GB cache cluster
  
  # Stage variables (if needed)
  variables = {
    environment = var.environment
  }
  
  depends_on = [aws_api_gateway_deployment.deployment]
}

# Lambda permissions
resource "aws_lambda_permission" "allow_user" {
  statement_id  = "AllowAPIGatewayInvokeUser"
  action        = "lambda:InvokeFunction"
  function_name = split(":", var.user_service_lambda_arn)[6]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}
resource "aws_lambda_permission" "allow_quest" {
  statement_id  = "AllowAPIGatewayInvokeQuest"
  action        = "lambda:InvokeFunction"
  function_name = split(":", var.quest_service_lambda_arn)[6]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}
resource "aws_lambda_permission" "allow_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = split(":", var.lambda_authorizer_arn)[6]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/authorizers/${aws_api_gateway_authorizer.lambda_authorizer.id}"
}
