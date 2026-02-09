environment = "prod"
aws_region  = "us-east-2"

# GitHub repo (for github-actions-oidc stack)
github_repo_owner = "developerGoalsGuild"
github_repo_name  = "questbound-forge"

frontend_base_url = "https://www.goalsguild.com"
frontend_allowed_origins = [
  "https://www.goalsguild.com",
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
cache_enabled = true  # Enable caching for production environment
api_stage_name = "v1"

# API Gateway overrides (optional; leave empty to use remote_state)
lambda_authorizer_arn_override    = ""
user_service_lambda_arn_override  = ""
quest_service_lambda_arn_override = ""

# S3 Guild Avatar Bucket Configuration
guild_avatar_bucket_name = ""  # Leave empty to auto-generate
guild_avatar_bucket_versioning = true
guild_avatar_bucket_encryption = true
guild_avatar_bucket_public_access_block = true
guild_avatar_bucket_lifecycle_days = 365  # 1 year lifecycle

# CORS Configuration
guild_avatar_bucket_cors_origins = ["https://goalsguild.com", "https://www.goalsguild.com"]
guild_avatar_bucket_cors_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
guild_avatar_bucket_cors_headers = ["*"]
guild_avatar_bucket_cors_max_age = 3600

# Guild Service Configuration
guild_ranking_calculation_frequency = "rate(1 hour)"  # Hourly for production
