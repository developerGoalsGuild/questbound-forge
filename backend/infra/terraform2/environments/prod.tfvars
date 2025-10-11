environment = "prod"
aws_region  = "us-east-2"
frontend_base_url = "https://app.goalsguild.com"
frontend_allowed_origins = [
  "https://app.goalsguild.com",
]
appsync_auth_type = "AWS_LAMBDA"
enable_appsync_api_key = true
enable_appsync_waf = true
waf_enforce = false
enable_appsync_waf_logging = true
enable_waf_logging_stream = true

# Performance optimization controls - ENABLED for production
enable_api_gateway_waf = true
enable_appsync_caching = true
appsync_cache_ttl_seconds = 600  # 10 minutes cache for production
api_stage_name = "v1"

# API Gateway overrides (optional; leave empty to use remote_state)
lambda_authorizer_arn_override    = ""
user_service_lambda_arn_override  = ""
quest_service_lambda_arn_override = ""
