




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
  image_uri     = var.user_service_image_uri
  memory_size   = 512
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "lambda_quest_service" {
  source        = "./modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_quest_service"
  image_uri     = var.quest_service_image_uri
  memory_size   = 512
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

# Note: API Gateway and Cognito resources are managed inside the network module for clarity and reuse
module "network" {
  source                  = "./modules/network"
  environment             = var.environment
  aws_region              = var.aws_region
  user_service_lambda_arn = module.lambda_user_service.lambda_function_arn
  quest_service_lambda_arn = module.lambda_quest_service.lambda_function_arn
}