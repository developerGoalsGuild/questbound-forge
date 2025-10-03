# Variables for Progress Monitoring Module

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "quest_service_function_name" {
  description = "Name of the Quest Service Lambda function"
  type        = string
}

variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "appsync_api_id" {
  description = "AppSync GraphQL API ID"
  type        = string
}

variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
}
