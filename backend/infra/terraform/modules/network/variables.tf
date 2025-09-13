variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "account_id" {
  description = "AWS account ID (used to scope ARNs)"
  type        = string
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}


variable "user_service_lambda_arn" {
  description = "ARN of the user-service Lambda function"
  type        = string
}

variable "quest_service_lambda_arn" {
  description = "ARN of the quest-service Lambda function"
  type        = string
}


variable "lambda_authorizer_arn" {
  description = "ARN of the authorizer-service Lambda function"
  type        = string
}
variable "api_gateway_authorizer_lambda_role_arn" {
  description = "ARN of the authorizer-service Lambda function"
  type        = string
}

variable "cognito_domain_prefix" {
  description = "Optional domain prefix for Cognito Hosted UI (must be globally unique per region)"
  type        = string
  default     = ""
}

variable "ddb_table_arn" {
  description = "ARN of the gg_core DynamoDB table"
  type        = string
}

variable "ddb_table_name" {
  description = "Name of the gg_core DynamoDB table"
  type        = string
}

variable "login_attempts_table_arn" {
  description = "ARN of the login attempts DynamoDB table"
  type        = string
}


