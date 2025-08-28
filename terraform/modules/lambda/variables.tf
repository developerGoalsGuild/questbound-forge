# (Full variables.tf with new variable added, preserving existing variables)

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "image_uri" {
  description = "Docker image URI for the Lambda function (optional if using SSM parameter)"
  type        = string
  default     = ""
}

variable "image_uri_ssm_parameter" {
  description = "Name of the SSM parameter that contains the Docker image URI for the Lambda function"
  type        = string
  default     = ""
}

variable "role_arn" {
  description = "ARN of the IAM role for Lambda execution"
  type        = string
}

variable "timeout" {
  description = "Timeout in seconds for the Lambda function"
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Memory size in MB for the Lambda function"
  type        = number
  default     = 512
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to the Lambda function"
  type        = map(string)
  default     = {}
}
