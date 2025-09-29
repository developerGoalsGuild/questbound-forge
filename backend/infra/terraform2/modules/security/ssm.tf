resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/goalsguild/cognito/user_pool_id"
  description = "Cognito User Pool ID (${var.environment})"
  type        = "String"
  value       = aws_cognito_user_pool.user_pool.id
  overwrite   = true
}

resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "/goalsguild/cognito/client_id"
  description = "Cognito App Client ID (${var.environment})"
  type        = "String"
  value       = aws_cognito_user_pool_client.user_pool_client.id
  overwrite   = true
}

resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/goalsguild/cognito/client_secret"
  description = "Cognito App Client Secret (${var.environment})"
  type        = "SecureString"
  value       = aws_cognito_user_pool_client.user_pool_client.client_secret
  overwrite   = true
}
