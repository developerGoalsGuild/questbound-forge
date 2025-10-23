variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}


variable "existing_image_uri" {
  description = "Existing Docker image URI for the messaging service"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

# Additional variables from dev.tfvars to suppress warnings
variable "core_table_name" {
  type    = string
  default = ""
  description = "Core DynamoDB table name"
}

variable "core_table_arn" {
  type    = string
  default = ""
  description = "Core DynamoDB table ARN"
}

variable "ddb_table_name" {
  type    = string
  default = ""
  description = "DynamoDB table name (alternative naming)"
}

variable "dynamodb_table_name" {
  type    = string
  default = ""
  description = "DynamoDB table name"
}

variable "api_gateway_key" {
  type    = string
  default = ""
  description = "API Gateway key"
}

variable "tags" {
  type    = map(string)
  default = {}
  description = "Tags for resources"
}

variable "enable_appsync_waf" {
  type    = bool
  default = false
  description = "Enable AppSync WAF"
}

variable "enable_appsync_api_key" {
  type    = bool
  default = false
  description = "Enable AppSync API key"
}

variable "enable_appsync_waf_logging" {
  type    = bool
  default = false
  description = "Enable AppSync WAF logging"
}

variable "enable_waf_logging_stream" {
  type    = bool
  default = false
  description = "Enable WAF logging stream"
}

variable "waf_enforce" {
  type    = bool
  default = false
  description = "WAF enforce"
}

variable "existing_lambda_exec_role_name" {
  type    = string
  default = ""
  description = "Existing Lambda execution role name"
}

variable "google_client_id" {
  type    = string
  default = ""
  description = "Google OAuth client ID"
}

variable "google_client_secret" {
  type    = string
  default = ""
  description = "Google OAuth client secret"
}

variable "email_token_secret" {
  type    = string
  default = ""
  description = "Email verification token secret"
}

variable "frontend_base_url" {
  type    = string
  default = ""
  description = "Frontend base URL"
}

variable "frontend_allowed_origins" {
  type    = list(string)
  default = []
  description = "Frontend allowed origins"
}

variable "appsync_auth_type" {
  type    = string
  default = ""
  description = "AppSync authentication type"
}

variable "enable_api_gateway_waf" {
  type    = bool
  default = false
  description = "Enable API Gateway WAF"
}

variable "enable_appsync_caching" {
  type    = bool
  default = false
  description = "Enable AppSync caching"
}

variable "appsync_cache_ttl_seconds" {
  type    = number
  default = 300
  description = "AppSync cache TTL in seconds"
}

variable "cache_enabled" {
  type    = bool
  default = true
  description = "Enable API Gateway caching"
}

variable "api_stage_name" {
  type    = string
  default = "v1"
  description = "API Gateway stage name"
}

variable "guild_avatar_bucket_name" {
  type    = string
  default = ""
  description = "Guild avatar bucket name"
}

variable "guild_avatar_bucket_versioning" {
  type    = bool
  default = true
  description = "Guild avatar bucket versioning"
}

variable "guild_avatar_bucket_encryption" {
  type    = bool
  default = true
  description = "Guild avatar bucket encryption"
}

variable "guild_avatar_bucket_public_access_block" {
  type    = bool
  default = true
  description = "Guild avatar bucket public access block"
}

variable "guild_avatar_bucket_lifecycle_days" {
  type    = number
  default = 0
  description = "Guild avatar bucket lifecycle days"
}

variable "guild_avatar_bucket_cors_origins" {
  type    = list(string)
  default = []
  description = "Guild avatar bucket CORS origins"
}

variable "guild_avatar_bucket_cors_methods" {
  type    = list(string)
  default = []
  description = "Guild avatar bucket CORS methods"
}

variable "guild_avatar_bucket_cors_headers" {
  type    = list(string)
  default = []
  description = "Guild avatar bucket CORS headers"
}

variable "guild_avatar_bucket_cors_max_age" {
  type    = number
  default = 3600
  description = "Guild avatar bucket CORS max age"
}

variable "guild_ranking_calculation_frequency" {
  type    = string
  default = "rate(1 day)"
  description = "Guild ranking calculation frequency"
}

variable "collaboration_service_lambda_arn_override" {
  type    = string
  default = ""
  description = "Collaboration service Lambda ARN override"
}

variable "user_service_lambda_arn_override" {
  type    = string
  default = ""
  description = "User service Lambda ARN override"
}

variable "lambda_authorizer_arn_override" {
  type    = string
  default = ""
  description = "Lambda authorizer ARN override"
}
