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

variable "user_service_image_uri" {
  description = "ECR image URI for the user service Lambda container"
  type        = string
}

variable "quest_service_image_uri" {
  description = "ECR image URI for the quest service Lambda container"
  type        = string
}
