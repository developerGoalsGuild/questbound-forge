# Current versions can be stored in terraform.tfvars or remotely; here default 0 for demo
variable "user_service_current_version" {
  description = "Current version of user-service Docker image"
  type        = number
  default     = 0
}

variable "quest_service_current_version" {
  description = "Current version of quest-service Docker image"
  type        = number
  default     = 0
}



# Module for user-service Docker image build and push
module "user_service_image" {
  source               = "./modules/docker_lambda_image"
  service_name         = "user-service"
  ecr_repository_name  = "goalsguild_user_service"
  aws_region           = var.aws_region
  environment          = var.environment
  current_version      = var.user_service_current_version
  dockerfile_path      = "../../../backend/services/user-service/Dockerfile"
  context_path         = "../../../backend/services/user-service"
}

# Module for quest-service Docker image build and push
module "quest_service_image" {
  source               = "./modules/docker_lambda_image"
  service_name         = "quest-service"
  ecr_repository_name  = "goalsguild_quest_service"
  aws_region           = var.aws_region
  environment          = var.environment
  current_version      = var.quest_service_current_version
  dockerfile_path      = "../../../backend/services/quest-service/Dockerfile"
  context_path         = "../../../backend/services/quest-service"

}




# DynamoDB tables for users and quests
module "dynamodb_users" {
  source         = "./modules/dynamodb"
  environment    = var.environment
  table_name     = "goalsguild_users"
  hash_key       = "user_id"
  attribute_name = "user_id"
  attribute_type = "S"
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "dynamodb_quests" {
  source         = "./modules/dynamodb"
  environment    = var.environment
  table_name     = "goalsguild_quests"
  hash_key       = "quest_id"
  attribute_name = "quest_id"
  attribute_type = "S"
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

# Lambda functions for user and quest services
module "lambda_user_service" {
  source        = "./modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_user_service"
  image_uri     = module.user_service_image.image_uri  
  memory_size   = 512
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
  depends_on = [module.user_service_image]

}

module "lambda_quest_service" {
  source        = "./modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_quest_service"
  image_uri     = module.quest_service_image.image_uri
  memory_size   = 128
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
  depends_on = [module.quest_service_image]

}

# Note: API Gateway and Cognito resources are managed inside the network module for clarity and reuse
module "network" {
  source                  = "./modules/network"
  environment             = var.environment
  aws_region              = var.aws_region
  user_service_lambda_arn = module.lambda_user_service.lambda_function_arn
  quest_service_lambda_arn = module.lambda_quest_service.lambda_function_arn
  api_stage_name          = var.api_stage_name
}
