variable "environment" {
  type = string
}
variable "aws_region"  {
  type = string
}
variable "api_stage_name" {
  type    = string
  default = "v1"
}
variable "user_service_lambda_arn" {
  type = string
}
variable "quest_service_lambda_arn" {
  type = string
}

variable "collaboration_service_lambda_arn" {
  type = string
}
variable "guild_service_lambda_arn" {
  type = string
}
variable "messaging_service_lambda_arn" {
  type    = string
  default = ""
  description = "ARN of the messaging service Lambda. Leave empty if not deployed yet to avoid Invalid lambda function errors."
}

variable "gamification_service_lambda_arn" {
  type = string
}

variable "subscription_service_lambda_arn" {
  type    = string
  default = ""
  description = "ARN of the subscription service Lambda function. Leave empty if not deployed yet."
}
variable "lambda_authorizer_arn" {
  type = string
}
variable "frontend_allowed_origins" {
  type = list(string)
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