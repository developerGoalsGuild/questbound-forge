variable "environment" { type = string }
variable "aws_region"  { type = string }

# Suppress warnings for unused variables from shared tfvars
variable "frontend_base_url" {
  type    = string
  default = ""
}

variable "frontend_allowed_origins" {
  type    = list(string)
  default = []
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


variable "collaboration_service_lambda_arn_override" {
  type    = string
  default = ""
}

variable "existing_lambda_exec_role_name" {
  type    = string
  default = ""
}

# Additional variables from dev.tfvars to suppress warnings
variable "appsync_cache_ttl_seconds" {
  type    = number
  default = 300
}

variable "dynamodb_table_name" {
  type    = string
  default = "gg_core"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "core_table_name" {
  type    = string
  default = ""
}

variable "core_table_arn" {
  type    = string
  default = ""
}

variable "cache_enabled" {
  type    = bool
  default = false
}

variable "enable_api_gateway_waf" {
  type    = bool
  default = false
}

variable "enable_appsync_caching" {
  type    = bool
  default = false
}
