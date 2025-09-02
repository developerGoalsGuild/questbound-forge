variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-2"
}


variable "account_id" {
  type = string
}


variable "user_service_lambda_authorizer_role_name" {
  type = string
}


