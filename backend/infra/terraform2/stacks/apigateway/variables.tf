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
