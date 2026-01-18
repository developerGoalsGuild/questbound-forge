# Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/goalsguild/cognito/user_pool_id"
  description = "Cognito User Pool ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool.user_pool.id
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
}

# Cognito User Pool Client ID
resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "/goalsguild/cognito/client_id"
  description = "Cognito User Pool Client ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool_client.user_pool_client.id
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
}

# Cognito User Pool Client Secret
resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/goalsguild/cognito/client_secret"
  description = "Cognito User Pool Client Secret for GoalsGuild ${var.environment} environment"
  type        = "SecureString"
  value       = aws_cognito_user_pool_client.user_pool_client.client_secret
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
}

# JWT Secret for user authentication
resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/goalsguild/user-service/JWT_SECRET"
  description = "JWT Secret for user authentication (${var.environment})"
  type        = "SecureString"
  value       = var.jwt_secret
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

# Email Token Secret
resource "aws_ssm_parameter" "email_token_secret" {
  name        = "/goalsguild/user-service/email_token_secret"
  description = "Email token secret for email verification (${var.environment})"
  type        = "SecureString"
  value       = var.email_token_secret
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

# Google OAuth Client ID
resource "aws_ssm_parameter" "google_client_id" {
  name        = "/goalsguild/user-service/google_client_id"
  description = "Google OAuth Client ID for social login (${var.environment})"
  type        = "SecureString"
  value       = var.google_client_id
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

# Google OAuth Client Secret
resource "aws_ssm_parameter" "google_client_secret" {
  name        = "/goalsguild/user-service/google_client_secret"
  description = "Google OAuth Client Secret for social login (${var.environment})"
  type        = "SecureString"
  value       = var.google_client_secret
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}


# API Gateway Key
resource "aws_ssm_parameter" "api_gateway_key" {
  name        = "/goalsguild/api_gateway/key"
  description = "API Gateway Key for GoalsGuild ${var.environment} environment"
  type        = "SecureString"
  value       = var.api_gateway_key
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "api-gateway"
  }
}

# User Service Environment Variables
resource "aws_ssm_parameter" "user_service_env_vars" {
  name        = "/goalsguild/user-service/env_vars"
  description = "JSON object of environment variables for User Service (${var.environment})"
  type        = "String"
  value = jsonencode({
    COGNITO_USER_POOL_ID                      = aws_cognito_user_pool.user_pool.id
    COGNITO_CLIENT_ID                         = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_CLIENT_SECRET                     = aws_cognito_user_pool_client.user_pool_client.client_secret
    COGNITO_REGION                            = var.aws_region
    JWT_ISSUER                                = "https://auth.local"
    JWT_AUDIENCE                              = "api://default"
    COGNITO_DOMAIN                            = "goalsguild.auth.us-east-2.amazoncognito.com"
    SES_SENDER_EMAIL                          = var.ses_sender_email
    FRONTEND_BASE_URL                         = var.frontend_base_url
    ALLOWED_ORIGINS                           = var.frontend_allowed_origins
    PASSWORD_KEY                              = "your-encrypted-password-key"
    DYNAMODB_USERS_TABLE                      = "gg_core"
    CORE_TABLE                                = var.ddb_table_name
    APP_BASE_URL                              = var.frontend_base_url
    LOGIN_ATTEMPTS_TABLE                      = "goalsguild_login_attempts"
    ENVIRONMENT                               = var.environment
    APPSYNC_SUBSCRIPTION_KEY_PARAM            = "/goalsguild/${var.environment}/appsync/subscription_key"
    APPSYNC_SUBSCRIPTION_KEY_EXPIRES_AT_PARAM = "/goalsguild/${var.environment}/appsync/subscription_key_expires_at"
    APPSYNC_AVAILABILITY_KEY_PARAM            = "/goalsguild/${var.environment}/appsync/availability_key"
    APPSYNC_AVAILABILITY_KEY_EXPIRES_AT_PARAM = "/goalsguild/${var.environment}/appsync/availability_key_expires_at"
  })
  overwrite = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

# Quest Service Environment Variables
resource "aws_ssm_parameter" "quest_service_env_vars" {
  name        = "/goalsguild/quest-service/env_vars"
  description = "JSON object of environment variables for Quest Service (${var.environment})"
  type        = "String"
  value = jsonencode({
    CORE_TABLE           = var.ddb_table_name
    JWT_ISSUER           = "https://auth.local"
    JWT_AUDIENCE         = "api://default"
    COGNITO_REGION       = var.aws_region
    COGNITO_USER_POOL_ID = aws_cognito_user_pool.user_pool.id
    COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.user_pool_client.id
    FRONTEND_BASE_URL    = var.frontend_base_url
    ALLOWED_ORIGINS      = var.frontend_allowed_origins
    JWT_SECRET_PARAM     = aws_ssm_parameter.jwt_secret.name
    ENVIRONMENT          = var.environment
  })
  overwrite = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "quest-service"
  }
}


# Collaboration Service Environment Variables
resource "aws_ssm_parameter" "collaboration_service_env_vars" {
  name        = "/goalsguild/collaboration-service/env_vars"
  description = "JSON object of environment variables for Collaboration Service (${var.environment})"
  type        = "String"
  value = jsonencode({
    # Core configuration
    ENVIRONMENT         = var.environment
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = var.ddb_table_name
    CORE_TABLE          = var.ddb_table_name

    # Cognito configuration
    COGNITO_USER_POOL_ID        = aws_cognito_user_pool.user_pool.id
    COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_CLIENT_ID           = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_REGION              = var.aws_region

    # JWT configuration
    JWT_ISSUER       = "https://auth.local"
    JWT_AUDIENCE     = "api://default"
    JWT_SECRET_PARAM = aws_ssm_parameter.jwt_secret.name

    # Frontend configuration
    FRONTEND_BASE_URL = var.frontend_base_url
    ALLOWED_ORIGINS   = var.frontend_allowed_origins

    # Service-specific configuration
    LOG_LEVEL                      = "INFO"
    RATE_LIMIT_REQUESTS_PER_HOUR   = "1000"
    CACHE_TTL_SECONDS              = "300"
    MAX_INVITES_PER_USER_PER_HOUR  = "20"
    MAX_COMMENTS_PER_USER_PER_HOUR = "100"
  })
  overwrite = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "collaboration-service"
  }
}

# Guild Service Configuration
resource "aws_ssm_parameter" "guild_service_config" {
  name        = "/goalsguild/guild-service/config"
  description = "Guild service configuration for GoalsGuild ${var.environment} environment"
  type        = "String"
  value = jsonencode({
    # Environment
    ENVIRONMENT = var.environment

    # Database configuration
    GUILD_TABLE_NAME = var.guild_table_name

    # S3 configuration
    AVATAR_S3_BUCKET = var.avatar_s3_bucket

    # Authentication configuration
    JWT_ISSUER       = "https://auth.local"
    JWT_AUDIENCE     = "api://default"
    JWT_SECRET_PARAM = aws_ssm_parameter.jwt_secret.name

    # Frontend configuration
    FRONTEND_BASE_URL = var.frontend_base_url
    ALLOWED_ORIGINS   = var.frontend_allowed_origins

    # Service-specific configuration
    LOG_LEVEL                     = "INFO"
    RATE_LIMIT_REQUESTS_PER_HOUR  = "1000"
    AVATAR_MAX_SIZE_MB            = "5"
    AVATAR_ALLOWED_TYPES          = "image/jpeg,image/png,image/webp"
    RANKING_CALCULATION_FREQUENCY = "rate(1 hour)"
  })
  overwrite = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "guild-service"
  }
}

# Stripe Secret Key
resource "aws_ssm_parameter" "stripe_secret_key" {
  count       = var.stripe_secret_key != "" ? 1 : 0
  name        = "/goalsguild/subscription-service/STRIPE_SECRET_KEY"
  description = "Stripe secret key for subscription billing (${var.environment})"
  type        = "SecureString"
  value       = var.stripe_secret_key
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "subscription-service"
  }
}

# Stripe Webhook Secret
resource "aws_ssm_parameter" "stripe_webhook_secret" {
  count       = var.stripe_webhook_secret != "" ? 1 : 0
  name        = "/goalsguild/subscription-service/STRIPE_WEBHOOK_SECRET"
  description = "Stripe webhook secret for webhook signature verification (${var.environment})"
  type        = "SecureString"
  value       = var.stripe_webhook_secret
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "subscription-service"
  }
}

# Stripe Publishable Key (for frontend)
resource "aws_ssm_parameter" "stripe_publishable_key" {
  count       = var.stripe_publishable_key != "" ? 1 : 0
  name        = "/goalsguild/subscription-service/STRIPE_PUBLISHABLE_KEY"
  description = "Stripe publishable key for frontend checkout (${var.environment})"
  type        = "SecureString"
  value       = var.stripe_publishable_key
  overwrite   = true

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "subscription-service"
  }
}
