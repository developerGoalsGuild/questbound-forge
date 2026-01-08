variable "environment" { type = string }
variable "aws_region"  { type = string }
variable "cognito_domain_prefix" { 
    type = string 
    default = "" 
}
variable existing_lambda_exec_role_name { 
    type = string 
    default = "" 
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