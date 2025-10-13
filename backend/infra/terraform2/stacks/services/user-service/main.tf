data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../../security/terraform.tfstate" }
}

# Use existing ECR image directly (temporarily)
locals {
  existing_image_uri = "838284111015.dkr.ecr.us-east-2.amazonaws.com/goalsguild_user_service:v10"
}

module "user_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_user_service"
  image_uri     = local.existing_image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 512
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/user-service/"
  }
}









