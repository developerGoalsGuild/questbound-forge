variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}


variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}



variable "user_service_lambda_authorizer_role_name" {
  type    = string
  default = "goalsguild_user_service_lambda_authorizer_role"
}

variable "user_service_lambda_authorizer_function_name" {
  type    = string
  default = "goalsguild_user_service_lambda_authorizer"
}

variable "api_gateway_lambda_role_name" {
  type    = string
  default = "goalsguild_apigateway_lambda_invoke_role"
}

# Authentication mode for AppSync: "AWS_LAMBDA" | "AMAZON_COGNITO_USER_POOLS" | "API_KEY"
variable "appsync_auth_type" {
  type    = string
  default = "AWS_LAMBDA"
}

# Paths
variable "schema_path" {
  type    = string
  default = ""
}

variable "resolvers_dir" {
  type    = string
  default = ""
}


# Enable public API key for AppSync (additional auth provider)
variable "enable_appsync_api_key" {
  type    = bool
  default = false
}
# Enable AWS WAFv2 for AppSync
variable "enable_appsync_waf" {
  type    = bool
  default = false
}

# Rate limit per 5 minutes per IP
variable "waf_rate_limit" {
  type    = number
  default = 2000
}

# WAF enforce/monitor toggle
variable "waf_enforce" {
  description = "If true, WAF rules block. If false, they only count (monitor)."
  type        = bool
  default     = false
}

# Enable WAF logging (requires Kinesis Data Firehose ARN)
variable "enable_appsync_waf_logging" {
  type    = bool
  default = false
}

variable "waf_logging_firehose_arn" {
  type    = string
  default = ""
}

# Provision a Firehose->S3 stream for WAF logging
variable "enable_waf_logging_stream" {
  type    = bool
  default = false
}

variable "cognito_domain_prefix" {
  description = "Optional domain prefix for Cognito Hosted UI (must be globally unique per region)"
  type        = string
  default     = ""
}
