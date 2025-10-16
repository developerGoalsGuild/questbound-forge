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

variable "guild_avatar_bucket_name" {
  description = "Name of the S3 bucket for guild avatars"
  type        = string
  default     = ""
}

variable "guild_avatar_bucket_versioning" {
  description = "Enable versioning for guild avatar bucket"
  type        = bool
  default     = true
}

variable "guild_avatar_bucket_encryption" {
  description = "Enable encryption for guild avatar bucket"
  type        = bool
  default     = true
}

variable "guild_avatar_bucket_public_access_block" {
  description = "Block public access for guild avatar bucket"
  type        = bool
  default     = true
}

variable "guild_avatar_bucket_lifecycle_days" {
  description = "Number of days for lifecycle rule (0 to disable)"
  type        = number
  default     = 0
}

variable "guild_avatar_bucket_cors_origins" {
  description = "CORS allowed origins for guild avatar bucket"
  type        = list(string)
  default     = ["*"]
}

variable "guild_avatar_bucket_cors_methods" {
  description = "CORS allowed methods for guild avatar bucket"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE", "HEAD"]
}

variable "guild_avatar_bucket_cors_headers" {
  description = "CORS allowed headers for guild avatar bucket"
  type        = list(string)
  default     = ["*"]
}

variable "guild_avatar_bucket_cors_max_age" {
  description = "CORS max age for guild avatar bucket"
  type        = number
  default     = 3600
}