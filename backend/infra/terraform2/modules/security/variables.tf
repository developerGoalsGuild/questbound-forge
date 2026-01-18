variable "environment" {
  description = "Environment"
  type        = string
}
variable "aws_region" {
  description = "AWS region"
  type        = string
}
variable "cognito_domain_prefix" {
  description = "Optional domain prefix for Cognito Hosted UI"
  type        = string
  default     = ""
}
variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
variable "existing_lambda_exec_role_name" {
  description = "Use an existing IAM role name for Lambda exec (skip creation)"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret for user authentication"
  type        = string
  sensitive   = true
}

variable "email_token_secret" {
  description = "Email token secret for email verification"
  type        = string
  sensitive   = true
  default     = "email-verification-secret-key"
}

variable "google_client_id" {
  description = "Google OAuth Client ID for social login"
  type        = string
  sensitive   = true
  default     = "placeholder-google-client-id"
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for social login"
  type        = string
  sensitive   = true
  default     = "placeholder-google-client-secret"
}

variable "frontend_base_url" {
  description = "Frontend base URL for CORS and redirects"
  type        = string
  default     = "http://localhost:8080"
}

variable "frontend_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:8080"]
}

variable "ddb_table_name" {
  description = "DynamoDB table name"
  type        = string
  default     = "gg_core"
}

variable "api_gateway_key" {
  description = "API Gateway Key for authentication"
  type        = string
  sensitive   = true
  default     = "placeholder-api-gateway-key"
}

variable "guild_table_name" {
  description = "Guild DynamoDB table name"
  type        = string
  default     = "gg_guild"
}

variable "avatar_s3_bucket" {
  description = "S3 bucket name for guild avatars"
  type        = string
  default     = ""
}

variable "stripe_secret_key" {
  description = "Stripe secret key for subscription billing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret for webhook signature verification"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key for frontend checkout"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ses_sender_email" {
  description = "SES verified sender email address (e.g., no-reply@goalsguild.com)"
  type        = string
  default     = "no-reply@goalsguild.com"
}