variable "environment" {
    type = string
}
variable "aws_region"  {
    type = string
}
variable "api_stage_name" { 
    type = string 
    default = "v1" 
}
variable "frontend_allowed_origins" {
    type = list(string)
}

variable "lambda_authorizer_arn_override" {
    type    = string
    default = ""
}
variable "user_service_lambda_arn_override" {
    type    = string
    default = ""
}
variable "quest_service_lambda_arn_override" {
    type    = string
    default = ""
}
variable "collaboration_service_lambda_arn_override" {
    type    = string
    default = ""
}
variable "guild_service_lambda_arn_override" {
    type    = string
    default = ""
}

# Accept extra variables from shared tfvars to avoid warnings (not used here)
variable "frontend_base_url" {
    type    = string
    default = ""
}
variable "appsync_auth_type" {
    type    = string
    default = ""
}
variable "enable_appsync_api_key" {
    type    = bool
    default = false
}
variable "enable_appsync_waf" {
    type    = bool
    default = false
}
variable "waf_enforce" {
    type    = bool
    default = false
}
variable "enable_appsync_waf_logging" {
    type    = bool
    default = false
}
variable "enable_waf_logging_stream" {
    type    = bool
    default = false
}
variable "existing_lambda_exec_role_name" {
    type    = string
    default = ""
}

# Database stack values (to avoid remote_state dependency in dev)
variable "core_table_name" {
    type    = string
    default = ""
}
variable "core_table_arn" {
    type    = string
    default = ""
}

# Performance optimization controls
variable "enable_api_gateway_waf" {
    type        = bool
    default     = false
    description = "Enable WAF for API Gateway"
}

variable "enable_appsync_caching" {
    type        = bool
    default     = false
    description = "Enable AppSync resolver caching"
}

variable "appsync_cache_ttl_seconds" {
    type        = number
    default     = 300
    description = "AppSync cache TTL in seconds"
}

variable "cache_enabled" {
    type        = bool
    default     = true
    description = "Enable API Gateway caching"
}

# Additional variables from dev.tfvars to suppress warnings
variable "tags" {
    type    = map(string)
    default = {}
    description = "Tags for resources"
}

variable "dynamodb_table_name" {
    type    = string
    default = "gg_core"
    description = "DynamoDB table name"
}

# Additional variables from dev.tfvars to suppress warnings
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

variable "jwt_secret" {
    type    = string
    default = ""
    description = "JWT secret for authentication"
}

variable "ddb_table_name" {
    type    = string
    default = ""
    description = "DynamoDB table name (alternative naming)"
}

variable "api_gateway_key" {
    type    = string
    default = ""
    description = "API Gateway key"
}