# Create SSM Parameter for Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/goalsguild/cognito/user_pool_id"
  description = "Cognito User Pool ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool.user_pool.id
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool.user_pool]
}

# Create SSM Parameter for Cognito User Pool Client ID
resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "/goalsguild/cognito/client_id"
  description = "Cognito User Pool Client ID for GoalsGuild ${var.environment} environment"
  type        = "String"
  value       = aws_cognito_user_pool_client.user_pool_client.id
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}

# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/goalsguild/cognito/client_secret"
  description = "Cognito User Pool Client Secret for GoalsGuild ${var.environment} environment"
  type        = "SecureString"
  value       = "1"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "cognito"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}

# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "goals_guild_jwt_secret" {
  name        = "/goalsguild/user-service/JWT_SECRET"
  description = "jwt secret for jwt generation "
  type        = "SecureString"
  value       = "@teste1234"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}

# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "goals_guild_email_token_secret" {
  name        = "/goalsguild/user-service/email_token_secret"
  description = "email secret for email token generation "
  type        = "SecureString"
  value       = "1"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}


# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "goals_guild_google_client_id" {
  name        = "/goalsguild/user-service/google_client_secret"
  description = "Client secret for google login "
  type        = "SecureString"
  value       = "1"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}

# Create SSM Parameter for Cognito User Pool Client Secret (SecureString)
resource "aws_ssm_parameter" "goals_guild_google_client_secret" {
  name        = "/goalsguild/user-service/google_client_id"
  description = "Client id for google login "
  type        = "SecureString"
  value       = "1"//aws_cognito_user_pool_client.user_pool_client.client_secret
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
  depends_on = [aws_cognito_user_pool_client.user_pool_client]
}



# SSM Parameter for User Services environment variables (excluding AWS_REGION)
resource "aws_ssm_parameter" "user_service_env_vars" {
  name        = "/goalsguild/user-service/env_vars"
  description = "JSON object of environment variables for User Service excluding AWS_REGION"
  type        = "String"
  value       = jsonencode({
    COGNITO_USER_POOL_ID     = aws_cognito_user_pool.user_pool.id
    COGNITO_CLIENT_ID        = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_CLIENT_SECRET    = aws_cognito_user_pool_client.user_pool_client.client_secret
    COGNITO_REGION           = var.aws_region	  
    JWT_ISSUER           = "https://auth.local"
    JWT_AUDIENCE           = "api://default"
    COGNITO_DOMAIN           = "goalsguild.auth.us-east-2.amazoncognito.com"
    SES_SENDER_EMAIL         = "no-reply@goalsguild.com"
    FRONTEND_BASE_URL        = "https://app.goalsguild.com"
    PASSWORD_KEY             = "your-encrypted-password-key" # Replace with actual secure value or SSM reference
    DYNAMODB_USERS_TABLE     = "gg_core"
    CORE_TABLE               = var.ddb_table_name
    APP_BASE_URL              = "http://localhost:5050"
    LOGIN_ATTEMPTS_TABLE = "goalsguild_login_attempts"

  })

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}

