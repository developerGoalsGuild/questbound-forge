# Create SSM Parameter for Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/goalsguild/${var.environment}/cognito/user_pool_id"
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
  name        = "/goalsguild/${var.environment}/cognito/client_id"
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
  name        = "/goalsguild/${var.environment}/cognito/client_secret"
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

# SSM Parameter for User Services environment variables (excluding AWS_REGION)
resource "aws_ssm_parameter" "user_service_env_vars" {
  name        = "/goalsguild/${var.environment}/user-service/env_vars"
  description = "JSON object of environment variables for User Service excluding AWS_REGION"
  type        = "String"
  value       = jsonencode({
    COGNITO_USER_POOL_ID     = aws_cognito_user_pool.user_pool.id
    COGNITO_CLIENT_ID        = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_CLIENT_SECRET    = aws_cognito_user_pool_client.user_pool_client.client_secret
    EMAIL_SENDER             = "no-reply@goalsguild.com"
    FRONTEND_BASE_URL        = "https://app.goalsguild.com"
    PASSWORD_KEY             = "your-encrypted-password-key" # Replace with actual secure value or SSM reference
  })

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "user-service"
  }
}
