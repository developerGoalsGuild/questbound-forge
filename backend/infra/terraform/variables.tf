variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
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
