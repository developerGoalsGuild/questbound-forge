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

variable "existing_lambda_exec_role_name" {
  type    = string
  default = ""
}

variable "gamification_image_uri" {
  type    = string
  default = ""
  description = "Optional override for the gamification service container image"
}

variable "gamification_internal_key" {
  type    = string
  default = ""
  description = "Shared internal key used for secure service-to-service calls"
}

variable "base_xp_for_level" {
  type    = number
  default = 100
  description = "Base XP progression constant"
}

