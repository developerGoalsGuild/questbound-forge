terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Load environment-specific variables
variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

# Call modules for infrastructure components
module "network" {
  source      = "./modules/network"
  environment = var.environment
  aws_region  = var.aws_region
}

module "dynamodb_users" {
  source      = "./modules/dynamodb"
  environment = var.environment
  table_name  = "goalsguild_users"
  hash_key    = "user_id"
  attribute_name = "user_id"
  attribute_type = "S"
  tags        = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "dynamodb_quests" {
  source      = "./modules/dynamodb"
  environment = var.environment
  table_name  = "goalsguild_quests"
  hash_key    = "quest_id"
  attribute_name = "quest_id"
  attribute_type = "S"
  tags        = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "lambda_user_service" {
  source           = "./modules/lambda"
  environment      = var.environment
  function_name    = "goalsguild_user_service"
  image_uri        = var.user_service_image_uri
  memory_size      = 512
  timeout          = 10
  role_arn         = module.network.lambda_exec_role_arn
  tags             = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "lambda_quest_service" {
  source           = "./modules/lambda"
  environment      = var.environment
  function_name    = "goalsguild_quest_service"
  image_uri        = var.quest_service_image_uri
  memory_size      = 512
  timeout          = 10
  role_arn         = module.network.lambda_exec_role_arn
  tags             = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

# API Gateway and Cognito resources are managed in the network module for clarity and reuse
