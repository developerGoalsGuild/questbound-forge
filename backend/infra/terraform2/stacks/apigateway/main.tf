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

locals {
  authorizer_arn   = var.lambda_authorizer_arn_override != "" ? var.lambda_authorizer_arn_override : try(data.terraform_remote_state.authorizer[0].outputs.lambda_authorizer_arn, "")
  user_lambda_arn  = var.user_service_lambda_arn_override != "" ? var.user_service_lambda_arn_override : try(data.terraform_remote_state.user_service[0].outputs.lambda_function_arn, "")
  quest_lambda_arn = var.quest_service_lambda_arn_override != "" ? var.quest_service_lambda_arn_override : try(data.terraform_remote_state.quest_service[0].outputs.lambda_function_arn, "")
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
}
