variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "goalsguild"
}

variable "guild_table_name" {
  description = "Name of the guild DynamoDB table"
  type        = string
  default     = "gg_guild"
}

variable "guild_service_role_name" {
  description = "Name of the IAM role for the guild service"
  type        = string
  default     = ""
}