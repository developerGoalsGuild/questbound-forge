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