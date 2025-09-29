terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "quest_service_image" {
  source              = "../../modules/docker_lambda_image"
  service_name        = "quest-service"
  ecr_repository_name = "goalsguild_quest_service"
  aws_region          = var.aws_region
  environment         = var.environment
  current_version     = var.current_version
  dockerfile_path     = "quest-service/Dockerfile"
  context_path        = "../../../../backend/services"
}

module "lambda_quest_service" {
  source        = "../../modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_quest_service"
  image_uri     = module.quest_service_image.image_uri
  memory_size   = 128
  timeout       = 10
  role_arn      = var.lambda_exec_role_arn
  environment_variables = {
    SETTINGS_SSM_PREFIX     = "/goalsguild/quest-service/"
    ENVIRONMENT             = var.environment
    QUEST_SERVICE_ROOT_PATH = "/${upper(var.environment)}"
    QUEST_LOG_ENABLED       = var.quest_log_enabled
  }
  depends_on = [module.quest_service_image]
}

output "quest_lambda_arn" { value = module.lambda_quest_service.lambda_function_arn }


