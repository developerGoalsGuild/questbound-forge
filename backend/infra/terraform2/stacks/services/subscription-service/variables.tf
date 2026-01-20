variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "existing_image_uri" {
  description = "Existing Docker image URI for the subscription service"
  type        = string
  default     = ""
}

# Additional variables from dev.tfvars to suppress warnings
variable "core_table_name" {
  type        = string
  default     = ""
  description = "Core DynamoDB table name"
}

variable "core_table_arn" {
  type        = string
  default     = ""
  description = "Core DynamoDB table ARN"
}

variable "ddb_table_name" {
  type        = string
  default     = ""
  description = "DynamoDB table name (alternative naming)"
}

variable "dynamodb_table_name" {
  type        = string
  default     = ""
  description = "DynamoDB table name"
}

variable "api_gateway_key" {
  type        = string
  default     = ""
  description = "API Gateway key"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags for resources"
}

variable "existing_lambda_exec_role_name" {
  type        = string
  default     = ""
  description = "Existing Lambda execution role name"
}

variable "frontend_base_url" {
  type        = string
  default     = ""
  description = "Frontend base URL"
}

variable "frontend_allowed_origins" {
  type        = list(string)
  default     = []
  description = "Frontend allowed origins"
}
