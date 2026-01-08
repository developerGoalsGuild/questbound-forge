data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../../security/terraform.tfstate" }
}

# Use existing ECR image directly (temporarily)
locals {
  existing_image_uri = var.gamification_image_uri != "" ? var.gamification_image_uri : "838284111015.dkr.ecr.us-east-2.amazonaws.com/goalsguild_gamification_service:v9"
}

module "gamification_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_gamification_service"
  image_uri     = local.existing_image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 256
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/gamification-service/"
    GAMIFICATION_INTERNAL_KEY = var.gamification_internal_key
    BASE_XP_FOR_LEVEL   = tostring(var.base_xp_for_level)
  }
  
  # Enable function URL for AppSync HTTP data source (if needed)
  enable_function_url     = false
  function_url_auth_type  = "AWS_IAM"
  function_url_cors = {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["POST", "GET"]
    allow_origins     = ["*"]
    max_age          = 86400
  }
}










