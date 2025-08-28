terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Example usage for two services: user_service and quest_service

module "user_service_image" {
  source             = "./modules/docker_image_builder"
  repository_name    = "goalsguild_user_service"
  ssm_parameter_name = "/goalsguild/user_service/image_uri"
  docker_build_context = "../backend/user_service"
  aws_region         = var.aws_region
  tags               = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "quest_service_image" {
  source             = "./modules/docker_image_builder"
  repository_name    = "goalsguild_quest_service"
  ssm_parameter_name = "/goalsguild/quest_service/image_uri"
  docker_build_context = "../backend/quest_service"
  aws_region         = var.aws_region
  tags               = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "lambda_user_service" {
  source                = "./modules/lambda"
  environment           = var.environment
  function_name         = "goalsguild_user_service"
  image_uri_ssm_parameter = module.user_service_image.ssm_parameter_name
  role_arn              = module.network.lambda_exec_role_arn
  memory_size           = 512
  timeout               = 10
  tags                  = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "lambda_quest_service" {
  source                = "./modules/lambda"
  environment           = var.environment
  function_name         = "goalsguild_quest_service"
  image_uri_ssm_parameter = module.quest_service_image.ssm_parameter_name
  role_arn              = module.network.lambda_exec_role_arn
  memory_size           = 512
  timeout               = 10
  tags                  = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}
