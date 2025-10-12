# Optional remote state data sources - only used if override ARNs are not provided
data "terraform_remote_state" "authorizer" {
  count   = var.lambda_authorizer_arn_override == "" ? 1 : 0
  backend = "local"
  config = { path = "../authorizer/terraform.tfstate" }
}

data "terraform_remote_state" "user_service" {
  count   = var.user_service_lambda_arn_override == "" ? 1 : 0
  backend = "local"
  config = { path = "../services/user-service/terraform.tfstate" }
}

data "terraform_remote_state" "quest_service" {
  count   = var.quest_service_lambda_arn_override == "" ? 1 : 0
  backend = "local"
  config = { path = "../services/quest-service/terraform.tfstate" }
}

data "terraform_remote_state" "collaboration_service" {
  count   = var.collaboration_service_lambda_arn_override == "" ? 1 : 0
  backend = "local"
  config = { path = "../services/collaboration-service/terraform.tfstate" }
}

locals {
  authorizer_arn   = var.lambda_authorizer_arn_override != "" ? var.lambda_authorizer_arn_override : try(data.terraform_remote_state.authorizer[0].outputs.lambda_authorizer_arn, "")
  user_lambda_arn  = var.user_service_lambda_arn_override != "" ? var.user_service_lambda_arn_override : try(data.terraform_remote_state.user_service[0].outputs.lambda_function_arn, "")
  quest_lambda_arn = var.quest_service_lambda_arn_override != "" ? var.quest_service_lambda_arn_override : try(data.terraform_remote_state.quest_service[0].outputs.lambda_function_arn, "")
  collaboration_lambda_arn = var.collaboration_service_lambda_arn_override != "" ? var.collaboration_service_lambda_arn_override : try(data.terraform_remote_state.collaboration_service[0].outputs.collaboration_service_lambda_arn, "")
}

module "apigw" {
  source                    = "../../modules/apigateway"
  environment               = var.environment
  aws_region                = var.aws_region
  api_stage_name            = var.api_stage_name
  frontend_allowed_origins  = var.frontend_allowed_origins
  lambda_authorizer_arn     = local.authorizer_arn
  user_service_lambda_arn   = local.user_lambda_arn
  quest_service_lambda_arn  = local.quest_lambda_arn
  collaboration_service_lambda_arn = local.collaboration_lambda_arn
  
  # Performance optimization controls
  enable_api_gateway_waf    = var.enable_api_gateway_waf
  enable_appsync_caching    = var.enable_appsync_caching
  appsync_cache_ttl_seconds = var.appsync_cache_ttl_seconds
  cache_enabled             = var.cache_enabled
}
