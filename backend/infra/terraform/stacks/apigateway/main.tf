terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source                    = "../../modules/network"
  environment               = var.environment
  aws_region                = var.aws_region
  account_id                = var.account_id
  user_service_lambda_arn   = var.user_lambda_arn
  quest_service_lambda_arn  = var.quest_lambda_arn
  api_stage_name            = var.api_stage_name
  lambda_authorizer_arn     = var.lambda_authorizer_arn
  ddb_table_arn             = var.ddb_table_arn
  ddb_table_name            = var.ddb_table_name
  login_attempts_table_arn  = var.login_attempts_table_arn
  frontend_base_url         = var.frontend_base_url
  frontend_allowed_origins  = var.frontend_allowed_origins
  deployment_hash           = var.deployment_hash
}

output "api_invoke_url" { value = module.network.api_invoke_url }


