resource "aws_cognito_user_pool" "user_pool" {
  name                     = "goalsguild_user_pool_${var.environment}"
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Component   = "cognito"
  })
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name            = "goalsguild_user_pool_client_${var.environment}"
  user_pool_id    = aws_cognito_user_pool.user_pool.id
  generate_secret = true
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_pool_domain" "user_pool_domain" {
  count        = var.cognito_domain_prefix != "" ? 1 : 0
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.user_pool.id
}
