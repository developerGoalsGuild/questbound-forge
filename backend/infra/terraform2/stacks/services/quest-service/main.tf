data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../../security/terraform.tfstate" }
}

# Use existing ECR image directly
locals {
  existing_image_uri = "838284111015.dkr.ecr.us-east-2.amazonaws.com/goalsguild_quest_service@sha256:c0392e99596731a80d7484b1b70a128d0a1aff2a1b04e6bf2d26075bff4f6bdb"
}

module "quest_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_quest_service"
  image_uri     = local.existing_image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 256
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/quest-service/"
  }
}
