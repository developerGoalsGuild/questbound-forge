terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "appsync" {
  source                = "../../modules/appsync_api"
  name                  = "goalsguild-${var.environment}-api"
  auth_type             = var.auth_type
  schema_path           = var.schema_path
  lambda_authorizer_arn = var.lambda_authorizer_arn
  region                = var.aws_region
  enable_api_key        = var.enable_api_key

  ddb_table_name = var.ddb_table_name
  ddb_table_arn  = var.ddb_table_arn

  resolvers = var.resolvers
  functions = {}

  tags = { Component = "BackendApis", Environment = var.environment, Project = "goalsguild" }
}

output "api_id"  { value = module.appsync.api_id }
output "api_arn" { value = module.appsync.api_arn }


