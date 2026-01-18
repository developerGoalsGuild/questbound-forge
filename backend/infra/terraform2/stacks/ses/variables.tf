variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "domain_name" {
  description = "Domain name for SES (e.g., goalsguild.com). If not provided, email identity will be used."
  type        = string
  default     = ""
}

variable "sender_email" {
  description = "Email address to send from (e.g., no-reply@goalsguild.com). Required if domain_name is not set."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
