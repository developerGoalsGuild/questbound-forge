variable "environment" {
  type = string
}
variable "aws_region" {
  type = string
}
variable "appsync_auth_type" {
  type = string
}
variable "enable_appsync_api_key" {
  type    = bool
  default = false
}

variable "subscription_key_ttl_hours" {
  type        = number
  default     = 720
  description = "Lifetime in hours for the subscription AppSync API key (default 30 days)."
}

variable "availability_key_ttl_hours" {
  type        = number
  default     = 48
  description = "Lifetime in hours for the availability AppSync API key (minimum 30 hours to satisfy AppSync 1-day requirement with buffer)."
  validation {
    condition     = var.availability_key_ttl_hours >= 30
    error_message = "availability_key_ttl_hours must be at least 30 hours (AppSync enforces a minimum validity of one full day)."
  }
}

variable "appsync_unauthorized_error_threshold" {
  type        = number
  default     = 5
  description = "Number of 4XX errors in a 5-minute window that will trigger the unauthorized alarm."
}

variable "appsync_monthly_cost_threshold" {
  type        = number
  default     = 150
  description = "Estimated monthly AppSync spend (USD) that triggers the cost guard alarm."
}

variable "billing_currency" {
  type        = string
  default     = "USD"
  description = "Currency code used for billing alarms."
}

variable "lambda_subscription_auth_arn_override" {
  type        = string
  default     = ""
  description = "Optional ARN of the subscription auth Lambda. Leave empty to look up goalsguild_subscription_auth_<env>."
}
# Accept extra variables from shared tfvars to avoid warnings (not used here)
variable "frontend_base_url" {
  type    = string
  default = ""
}
variable "frontend_allowed_origins" {
  type    = list(string)
  default = []
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
variable "api_stage_name" {
  type    = string
  default = ""
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
variable "existing_lambda_exec_role_name" {
  type    = string
  default = ""
}

variable "core_table_name" { type = string }
variable "core_table_arn" { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}

# Performance optimization controls
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
