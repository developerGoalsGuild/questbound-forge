module "security" {
  source                = "../../modules/security"
  environment           = var.environment
  aws_region            = var.aws_region
  cognito_domain_prefix = var.cognito_domain_prefix
  existing_lambda_exec_role_name = var.existing_lambda_exec_role_name
  jwt_secret            = var.jwt_secret
  email_token_secret    = var.email_token_secret
  google_client_id      = var.google_client_id
  google_client_secret  = var.google_client_secret
  frontend_base_url     = var.frontend_base_url
  frontend_allowed_origins = var.frontend_allowed_origins
  ddb_table_name        = var.ddb_table_name
  api_gateway_key       = var.api_gateway_key
  ses_sender_email      = var.ses_sender_email
  tags = {
    Project     = "goalsguild"
    Environment = var.environment
  }
}
