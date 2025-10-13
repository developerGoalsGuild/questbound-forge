environment = "dev"
aws_region  = "us-east-2"
frontend_base_url = "http://localhost:8080"
frontend_allowed_origins = [
  "http://localhost:8080",
]
appsync_auth_type = "AWS_LAMBDA"
enable_appsync_api_key = true
enable_appsync_waf = false
waf_enforce = false
enable_appsync_waf_logging = false
enable_waf_logging_stream = false

# Performance optimization controls
enable_api_gateway_waf = false
enable_appsync_caching = false
appsync_cache_ttl_seconds = 300
cache_enabled = false  # Disable caching for dev environment
api_stage_name = "v1"

# API Gateway overrides (to avoid remote_state dependency in dev)
lambda_authorizer_arn_override   = "arn:aws:lambda:us-east-2:838284111015:function:goalsguild_authorizer_dev"
user_service_lambda_arn_override = "arn:aws:lambda:us-east-2:838284111015:function:goalsguild_user_service_dev"
quest_service_lambda_arn_override = "arn:aws:lambda:us-east-2:838284111015:function:goalsguild_quest_service_dev"

# Security stack: reuse existing Lambda exec role in dev
existing_lambda_exec_role_name = "goalsguild_lambda_exec_role_dev"

# Database stack values (to avoid remote_state dependency in dev)
core_table_name = "gg_core"
core_table_arn = "arn:aws:dynamodb:us-east-2:838284111015:table/gg_core"

# Collaboration service variables
dynamodb_table_name = "gg_core"
tags = {
  Environment = "dev"
  Project     = "goalsguild"
  Service     = "collaboration-service"
}

# Collaboration service override (use actual ARN for API Gateway integration)
collaboration_service_lambda_arn_override = "arn:aws:lambda:us-east-2:838284111015:function:goalsguild_collaboration_service_dev"