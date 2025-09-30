data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../../security/terraform.tfstate" }
}

# Build and push Docker image to ECR
module "user_docker_image" {
  source                = "../../../modules/docker_lambda_image"
  service_name          = "goalsguild_user_service"
  ecr_repository_name   = "goalsguild_user_service"
  aws_region           = var.aws_region
  environment          = var.environment
  dockerfile_path      = "Dockerfile"
  context_path         = "../../../../services/user-service"
  create_ecr          = false
}

module "user_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_user_service"
  image_uri     = module.user_docker_image.image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 512
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/user-service/"
  }
  
  depends_on = [module.user_docker_image]
}
