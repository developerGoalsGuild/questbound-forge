environment = "local"
aws_region  = "us-east-1"
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
cache_enabled = false  # Disable caching for local environment
api_stage_name = "v1"

# API Gateway overrides (to avoid remote_state dependency in local)
lambda_authorizer_arn_override   = "arn:aws:lambda:us-east-1:838284111015:function:goalsguild_authorizer_local"
user_service_lambda_arn_override = "arn:aws:lambda:us-east-1:838284111015:function:goalsguild_user_service_local"
quest_service_lambda_arn_override = "arn:aws:lambda:us-east-1:838284111015:function:goalsguild_quest_service_local"

# Security stack: reuse existing Lambda exec role in local
existing_lambda_exec_role_name = "goalsguild_lambda_exec_role_local"


# Email token secret for email verification
email_token_secret = "email-verification-secret-key-local"

# Google OAuth credentials (placeholders for local)
google_client_id = "placeholder-google-client-id"
google_client_secret = "placeholder-google-client-secret"

# Database configuration
ddb_table_name = "gg_core"

# API Gateway configuration
api_gateway_key = "placeholder-api-gateway-key"

# Database stack values (to avoid remote_state dependency in local)
core_table_name = "gg_core"
core_table_arn = "arn:aws:dynamodb:us-east-1:838284111015:table/gg_core"

# Collaboration service variables
dynamodb_table_name = "gg_core"
tags = {
  Environment = "local"
  Project     = "goalsguild"
  Service     = "collaboration-service"
}

# Collaboration service override (use actual ARN for API Gateway integration)
collaboration_service_lambda_arn_override = "arn:aws:lambda:us-east-1:838284111015:function:goalsguild_collaboration_service_local"

# S3 Guild Avatar Bucket Configuration
guild_avatar_bucket_name = ""  # Leave empty to auto-generate
guild_avatar_bucket_versioning = true
guild_avatar_bucket_encryption = true
guild_avatar_bucket_public_access_block = true
guild_avatar_bucket_lifecycle_days = 0  # 0 to disable lifecycle

# CORS Configuration
guild_avatar_bucket_cors_origins = ["*"]
guild_avatar_bucket_cors_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
guild_avatar_bucket_cors_headers = ["*"]
guild_avatar_bucket_cors_max_age = 3600

