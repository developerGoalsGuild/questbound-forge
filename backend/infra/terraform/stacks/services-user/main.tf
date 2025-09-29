terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "user_service_image" {
  source              = "../../modules/docker_lambda_image"
  service_name        = "user-service"
  ecr_repository_name = "goalsguild_user_service"
  aws_region          = var.aws_region
  environment         = var.environment
  current_version     = var.current_version
  dockerfile_path     = "user-service/Dockerfile"
  context_path        = "../../../../backend/services"
}

module "lambda_user_service" {
  source        = "../../modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_user_service"
  image_uri     = module.user_service_image.image_uri
  memory_size   = 512
  timeout       = 10
  role_arn      = var.lambda_exec_role_arn
  environment_variables = {
    SETTINGS_SSM_PREFIX = "/goalsguild/user-service/"
    ENVIRONMENT         = var.environment
    USER_LOG_ENABLED    = var.user_log_enabled
  }
  depends_on = [module.user_service_image]
}

output "user_lambda_arn" { value = module.lambda_user_service.lambda_function_arn }


