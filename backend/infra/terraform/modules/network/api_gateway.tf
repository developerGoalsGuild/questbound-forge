############################################
# Locals
############################################
locals {
  cors_allow_headers = "accept,content-type,authorization,x-api-key,origin,referer,x-amz-date,x-amz-security-token"
  cors_allow_origin  = length(var.frontend_allowed_origins) > 0 ? var.frontend_allowed_origins[0] : "*"
}

############################################
# REST API
############################################
resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "goalsguild_api_${var.environment}"
  description = "API Gateway for GoalsGuild services"

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "api-gateway"
  }
}

############################################
# Lambda Authorizer
############################################
resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                            = "goalsguild_lambda_authorizer_${var.environment}"
  rest_api_id                     = aws_api_gateway_rest_api.rest_api.id
  authorizer_uri                  = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.lambda_authorizer_arn}/invocations"
  authorizer_result_ttl_in_seconds = 300
  identity_source                 = "method.request.header.Authorization"
  type                            = "TOKEN"
}

############################################
# Resources (paths)
############################################
resource "aws_api_gateway_resource" "user_service_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "auth_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_renew_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.auth_resource.id
  path_part   = "renew"
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

############################################
# POST /users/signup (public, API key)
############################################
resource "aws_api_gateway_method" "user_signup_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.user_signup_resource.id
  http_method     = "POST"
  authorization   = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_signup_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_signup_resource.id
  http_method             = aws_api_gateway_method.user_signup_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.user_signup_post,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /users/signup (CORS)
resource "aws_api_gateway_method" "user_signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_signup_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "user_signup_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup_resource.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "user_signup_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup_resource.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  type        = "MOCK"

  integration_http_method = "POST" # provider quirk

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.user_signup_options]
}

resource "aws_api_gateway_integration_response" "user_signup_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_signup_resource.id
  http_method = aws_api_gateway_method.user_signup_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.user_signup_options_integration,
    aws_api_gateway_method_response.user_signup_options_200
  ]
}

############################################
# POST /users/login (public, API key)
############################################
resource "aws_api_gateway_method" "user_login_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.user_login_resource.id
  http_method     = "POST"
  authorization   = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_login_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_resource.id
  http_method             = aws_api_gateway_method.user_login_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.user_login_post,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /users/login (CORS)
resource "aws_api_gateway_method" "user_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "user_login_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_resource.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "user_login_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_resource.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.user_login_options]
}

resource "aws_api_gateway_integration_response" "user_login_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_resource.id
  http_method = aws_api_gateway_method.user_login_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.user_login_options_integration,
    aws_api_gateway_method_response.user_login_options_200
  ]
}

############################################
# POST /auth/renew (CUSTOM + authorizer)
############################################
resource "aws_api_gateway_method" "auth_renew_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.auth_renew_resource.id
  http_method     = "POST"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "auth_renew_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.auth_renew_resource.id
  http_method             = aws_api_gateway_method.auth_renew_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.auth_renew_post,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /auth/renew (CORS)
resource "aws_api_gateway_method" "auth_renew_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.auth_renew_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "auth_renew_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew_resource.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "auth_renew_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew_resource.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.auth_renew_options]
}

resource "aws_api_gateway_integration_response" "auth_renew_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.auth_renew_resource.id
  http_method = aws_api_gateway_method.auth_renew_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.auth_renew_options_integration,
    aws_api_gateway_method_response.auth_renew_options_200
  ]
}

############################################
# POST /users/logout (CUSTOM + authorizer)
############################################
resource "aws_api_gateway_method" "user_logout_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.user_logout_resource.id
  http_method     = "POST"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false

  lifecycle { create_before_destroy = false }
}

resource "aws_api_gateway_integration" "user_logout_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_logout_resource.id
  http_method             = aws_api_gateway_method.user_logout_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.user_logout_post,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /users/logout (CORS)
resource "aws_api_gateway_method" "user_logout_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_logout_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "user_logout_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_logout_resource.id
  http_method = aws_api_gateway_method.user_logout_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "user_logout_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_logout_resource.id
  http_method = aws_api_gateway_method.user_logout_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.user_logout_options]
}

resource "aws_api_gateway_integration_response" "user_logout_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_logout_resource.id
  http_method = aws_api_gateway_method.user_logout_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.user_logout_options_integration,
    aws_api_gateway_method_response.user_logout_options_200
  ]
}

############################################
# POST /users/login/google (public, API key)
############################################
resource "aws_api_gateway_method" "user_login_google_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.user_login_google_resource.id
  http_method     = "POST"
  authorization   = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "user_login_google_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_login_google_resource.id
  http_method             = aws_api_gateway_method.user_login_google_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.user_login_google_post,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /users/login/google (CORS)
resource "aws_api_gateway_method" "user_login_google_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_login_google_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "user_login_google_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_google_resource.id
  http_method = aws_api_gateway_method.user_login_google_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "user_login_google_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_google_resource.id
  http_method = aws_api_gateway_method.user_login_google_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.user_login_google_options]
}

resource "aws_api_gateway_integration_response" "user_login_google_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_login_google_resource.id
  http_method = aws_api_gateway_method.user_login_google_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.user_login_google_options_integration,
    aws_api_gateway_method_response.user_login_google_options_200
  ]
}

############################################
# GET /health (public, API key) + OPTIONS
############################################
resource "aws_api_gateway_method" "health_get" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.user_health_resource.id
  http_method     = "GET"
  authorization   = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "health_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_health_resource.id
  http_method             = aws_api_gateway_method.health_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.user_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.health_get,
    aws_lambda_permission.allow_api_gateway_user
  ]
}
# OPTIONS /health (CORS) — needed if you send x-api-key from browser
resource "aws_api_gateway_method" "health_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_health_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "health_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_health_resource.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "health_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_health_resource.id
  http_method = aws_api_gateway_method.health_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.health_options]
}

resource "aws_api_gateway_integration_response" "health_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.user_health_resource.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,GET'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.health_options_integration,
    aws_api_gateway_method_response.health_options_200
  ]
}

# Add resource and method for createTask mutation under /quests path

# Create a new resource for createTask mutation under /quests
resource "aws_api_gateway_resource" "quest_create_task_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quest_service_resource.id
  path_part   = "createTask"
}

# Create resource for tasks under /quests
resource "aws_api_gateway_resource" "quest_tasks_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quest_service_resource.id
  path_part   = "tasks"
}

# OPTIONS /quests/tasks (CORS) — supports collection-level operations if needed
resource "aws_api_gateway_method" "quest_tasks_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_tasks_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "quest_tasks_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_tasks_resource.id
  http_method = aws_api_gateway_method.quest_tasks_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "quest_tasks_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_tasks_resource.id
  http_method = aws_api_gateway_method.quest_tasks_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.quest_tasks_options]
}

resource "aws_api_gateway_integration_response" "quest_tasks_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_tasks_resource.id
  http_method = aws_api_gateway_method.quest_tasks_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,GET,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.quest_tasks_options_integration,
    aws_api_gateway_method_response.quest_tasks_options_200
  ]
}

# Create resource for individual task under /quests/tasks
resource "aws_api_gateway_resource" "quest_task_resource" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_resource.quest_tasks_resource.id
  path_part   = "{taskId}"
}

# POST /quests/createTask (CUSTOM + authorizer) - requires authentication
resource "aws_api_gateway_method" "quest_create_task_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.quest_create_task_resource.id
  http_method     = "POST"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "quest_create_task_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_create_task_resource.id
  http_method             = aws_api_gateway_method.quest_create_task_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.quest_create_task_post,
    aws_lambda_permission.allow_api_gateway_quest
  ]
}

# OPTIONS /quests/createTask (CORS)
resource "aws_api_gateway_method" "quest_create_task_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_create_task_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "quest_create_task_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_create_task_resource.id
  http_method = aws_api_gateway_method.quest_create_task_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "quest_create_task_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_create_task_resource.id
  http_method = aws_api_gateway_method.quest_create_task_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.quest_create_task_options]
}

resource "aws_api_gateway_integration_response" "quest_create_task_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_create_task_resource.id
  http_method = aws_api_gateway_method.quest_create_task_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.quest_create_task_options_integration,
    aws_api_gateway_method_response.quest_create_task_options_200
  ]
}

############################################
# PUT /quests/tasks/{taskId} (CUSTOM + authorizer) - requires authentication
############################################
resource "aws_api_gateway_method" "quest_task_put" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.quest_task_resource.id
  http_method     = "PUT"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "quest_task_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_task_resource.id
  http_method             = aws_api_gateway_method.quest_task_put.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.quest_task_put,
    aws_lambda_permission.allow_api_gateway_quest
  ]
}

# OPTIONS /quests/tasks/{taskId} (CORS)
resource "aws_api_gateway_method" "quest_task_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_task_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "quest_task_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_task_resource.id
  http_method = aws_api_gateway_method.quest_task_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "quest_task_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_task_resource.id
  http_method = aws_api_gateway_method.quest_task_options.http_method
  type        = "MOCK"

  integration_http_method = "POST" # provider quirk

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.quest_task_options]
}

resource "aws_api_gateway_integration_response" "quest_task_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_task_resource.id
  http_method = aws_api_gateway_method.quest_task_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,PUT,DELETE'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.quest_task_options_integration,
    aws_api_gateway_method_response.quest_task_options_200
  ]
}

############################################
# DELETE /quests/tasks/{taskId} (CUSTOM + authorizer) - requires authentication
############################################
resource "aws_api_gateway_method" "quest_task_delete" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.quest_task_resource.id
  http_method     = "DELETE"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "quest_task_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_task_resource.id
  http_method             = aws_api_gateway_method.quest_task_delete.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.quest_task_delete,
    aws_lambda_permission.allow_api_gateway_quest
  ]
}


############################################
# /quests (CUSTOM + authorizer)
############################################
resource "aws_api_gateway_method" "quest_get" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.quest_service_resource.id
  http_method     = "GET"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "quest_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_service_resource.id
  http_method             = aws_api_gateway_method.quest_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.quest_get,
    aws_lambda_permission.allow_api_gateway_quest
  ]
}
resource "aws_api_gateway_method" "quest_post" {
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  resource_id     = aws_api_gateway_resource.quest_service_resource.id
  http_method     = "POST"
  authorization   = "CUSTOM"
  authorizer_id   = aws_api_gateway_authorizer.lambda_authorizer.id
  api_key_required = false
}

resource "aws_api_gateway_integration" "quest_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.quest_service_resource.id
  http_method             = aws_api_gateway_method.quest_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.quest_service_lambda_arn}/invocations"

  depends_on = [
    aws_api_gateway_method.quest_post,
    aws_lambda_permission.allow_api_gateway_quest
  ]
}
# OPTIONS /quests (CORS) — supports both GET and POST
resource "aws_api_gateway_method" "quest_options" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.quest_service_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Origin"                         = false
    "method.request.header.Access-Control-Request-Method"  = false
    "method.request.header.Access-Control-Request-Headers" = false
  }
}

resource "aws_api_gateway_method_response" "quest_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_service_resource.id
  http_method = aws_api_gateway_method.quest_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
    "text/plain"       = "Empty"
  }
  response_parameters = {
    "method.response.header.Content-Type"                     = true
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Credentials" = true
    "method.response.header.Vary"                             = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Max-Age"           = true
  }
}

resource "aws_api_gateway_integration" "quest_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_service_resource.id
  http_method = aws_api_gateway_method.quest_options.http_method
  type        = "MOCK"

  integration_http_method = "POST"

  request_templates = {
    "application/json"                  = "{\"statusCode\": 200}"
    "text/plain"                        = "{\"statusCode\": 200}"
    "application/x-www-form-urlencoded" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.quest_options]
}

resource "aws_api_gateway_integration_response" "quest_options_200" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.quest_service_resource.id
  http_method = aws_api_gateway_method.quest_options.http_method
  status_code = 200
  response_parameters = {
    "method.response.header.Content-Type"                     = "'application/json'"
    "method.response.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
    "method.response.header.Vary"                             = "'Origin'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'OPTIONS,GET,POST'"
    "method.response.header.Access-Control-Max-Age"           = "'600'"
  }
  response_templates = {
    "application/json" = "{}"
    "text/plain"       = "{}"
  }
  depends_on = [
    aws_api_gateway_integration.quest_options_integration,
    aws_api_gateway_method_response.quest_options_200
  ]
}

############################################
# Default Gateway Responses (CORS on errors)
############################################
resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id  = aws_api_gateway_rest_api.rest_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
    "gatewayresponse.header.Vary"                             = "'Origin'"
    "gatewayresponse.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "gatewayresponse.header.Access-Control-Allow-Methods"     = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id  = aws_api_gateway_rest_api.rest_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"      = "'${local.cors_allow_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
    "gatewayresponse.header.Vary"                             = "'Origin'"
    "gatewayresponse.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "gatewayresponse.header.Access-Control-Allow-Methods"     = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
}

############################################
# Deployment + Stage (force redeploy on each apply)
############################################
resource "aws_api_gateway_deployment" "rest_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    # Only redeploy when this hash changes (stable across applies)
    config_hash = var.deployment_hash
  }

  depends_on = [
    # Methods
    aws_api_gateway_method.user_signup_post,
    aws_api_gateway_method.user_signup_options,
    aws_api_gateway_method.user_login_post,
    aws_api_gateway_method.user_login_options,
    aws_api_gateway_method.auth_renew_post,
    aws_api_gateway_method.auth_renew_options,
    aws_api_gateway_method.user_logout_post,
    aws_api_gateway_method.user_logout_options,
    aws_api_gateway_method.user_login_google_post,
    aws_api_gateway_method.user_login_google_options,
    aws_api_gateway_method.health_get,
    aws_api_gateway_method.health_options,
    aws_api_gateway_method.quest_get,
    aws_api_gateway_method.quest_post,
    aws_api_gateway_method.quest_options,
    aws_api_gateway_method.quest_create_task_post,
    aws_api_gateway_method.quest_create_task_options,
    aws_api_gateway_method.quest_task_put,
    aws_api_gateway_method.quest_task_delete,
    aws_api_gateway_method.quest_task_options,
    aws_api_gateway_method.quest_tasks_options,

    # Method responses
    aws_api_gateway_method_response.user_signup_options_200,
    aws_api_gateway_method_response.user_login_options_200,
    aws_api_gateway_method_response.auth_renew_options_200,
    aws_api_gateway_method_response.user_logout_options_200,
    aws_api_gateway_method_response.user_login_google_options_200,
    aws_api_gateway_method_response.health_options_200,
    aws_api_gateway_method_response.quest_options_200,
    aws_api_gateway_method_response.quest_create_task_options_200,
    aws_api_gateway_method_response.quest_task_options_200,
    aws_api_gateway_method_response.quest_tasks_options_200,

    # Integrations
    aws_api_gateway_integration.user_signup_post_integration,
    aws_api_gateway_integration.user_signup_options_integration,
    aws_api_gateway_integration.user_login_post_integration,
    aws_api_gateway_integration.user_login_options_integration,
    aws_api_gateway_integration.auth_renew_post_integration,
    aws_api_gateway_integration.auth_renew_options_integration,
    aws_api_gateway_integration.user_logout_post_integration,
    aws_api_gateway_integration.user_logout_options_integration,
    aws_api_gateway_integration.user_login_google_post_integration,
    aws_api_gateway_integration.user_login_google_options_integration,
    aws_api_gateway_integration.health_get_integration,
    aws_api_gateway_integration.health_options_integration,
    aws_api_gateway_integration.quest_get_integration,
    aws_api_gateway_integration.quest_post_integration,
    aws_api_gateway_integration.quest_options_integration,
    aws_api_gateway_integration.quest_create_task_post_integration,
    aws_api_gateway_integration.quest_create_task_options_integration,
    aws_api_gateway_integration.quest_task_put_integration,
    aws_api_gateway_integration.quest_task_delete_integration,
    aws_api_gateway_integration.quest_task_options_integration,
    aws_api_gateway_integration.quest_tasks_options_integration,

    # Integration responses
    aws_api_gateway_integration_response.user_signup_options_200,
    aws_api_gateway_integration_response.user_login_options_200,
    aws_api_gateway_integration_response.auth_renew_options_200,
    aws_api_gateway_integration_response.user_logout_options_200,
    aws_api_gateway_integration_response.user_login_google_options_200,
    aws_api_gateway_integration_response.health_options_200,
    aws_api_gateway_integration_response.quest_options_200,
    aws_api_gateway_integration_response.quest_create_task_options_200,
    aws_api_gateway_integration_response.quest_task_options_200,
    aws_api_gateway_integration_response.quest_tasks_options_200,

    # Default gateway responses
    aws_api_gateway_gateway_response.default_4xx,
    aws_api_gateway_gateway_response.default_5xx
  ]

  lifecycle { create_before_destroy = true }
}

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
    aws_iam_role_policy_attachment.apigw_logs
  ]
}

############################################
# API Key + Usage Plan (for public endpoints)
############################################
resource "random_string" "apigw_api_key" {
  length  = 32
  upper   = false
  lower   = true
  numeric = true
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

############################################
# CloudWatch Logging wiring for API Gateway
############################################
resource "aws_cloudwatch_log_group" "apigw_access_logs" {
  name              = "/aws/apigw/${aws_api_gateway_rest_api.rest_api.id}/access"
  retention_in_days = 14
}

resource "aws_iam_role" "apigw_cloudwatch_role" {
  name = "APIGatewayPushToCloudWatchLogs-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "apigateway.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_logs" {
  role       = aws_iam_role.apigw_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch_role.arn
}

############################################
# Lambda permissions (invoke)
############################################
resource "aws_lambda_permission" "allow_api_gateway_user" {
  statement_id  = "AllowAPIGatewayInvokeUser"
  action        = "lambda:InvokeFunction"
  function_name = var.user_service_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

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
