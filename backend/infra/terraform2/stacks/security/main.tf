module "security" {
  source                = "../../modules/security"
  environment           = var.environment
  aws_region            = var.aws_region
  cognito_domain_prefix = var.cognito_domain_prefix
  existing_lambda_exec_role_name = var.existing_lambda_exec_role_name
  tags = {
    Project     = "goalsguild"
    Environment = var.environment
  }
}
