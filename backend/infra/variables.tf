variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "user_service_image_uri" {
  description = "ECR image URI for user service Lambda"
  type        = string
}

variable "quest_service_image_uri" {
  description = "ECR image URI for quest service Lambda"
  type        = string
}
