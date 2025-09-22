variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "image_uri" {
  description = "ECR image URI for the Lambda container"
  type        = string
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
}

variable "tags" {
  description = "Tags to apply to the Lambda function"
  type        = map(string)
  default     = {}
}

variable "log_retention_in_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "error_threshold" {
  description = "Number of errors to trigger CloudWatch alarm"
  type        = number
  default     = 1
}

variable "throttle_threshold" {
  description = "Number of throttles to trigger CloudWatch alarm"
  type        = number
  default     = 1
}

variable "duration_threshold_ms" {
  description = "Duration in milliseconds to trigger CloudWatch alarm"
  type        = number
  default     = 3000
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

variable "ok_actions" {
  description = "List of ARNs to notify when alarm recovers"
  type        = list(string)
  default     = []
}

variable "environment_variables" {
  description = "Additional environment variables to inject into the Lambda function"
  type        = map(string)
  default     = {}
}

variable "handler" {
  description = "handler"
  type        = string
  default     = ""
}
