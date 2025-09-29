data "terraform_remote_state" "database" {
  backend = "local"
  config = { path = "../database/terraform.tfstate" }
}

data "terraform_remote_state" "authorizer" {
  backend = "local"
  config = { path = "../authorizer/terraform.tfstate" }
}

locals {
  schema_path = "${path.module}/../../../../infra/terraform/graphql/schema.graphql"
}

module "appsync" {
  source      = "../../modules/appsync"
  name        = "goalsguild-${var.environment}-api"
  auth_type   = var.appsync_auth_type
  schema_path = local.schema_path
  region      = var.aws_region
  enable_api_key = var.enable_appsync_api_key
  lambda_authorizer_arn = data.terraform_remote_state.authorizer.outputs.lambda_authorizer_arn
  ddb_table_name = data.terraform_remote_state.database.outputs.gg_core_table_name
  ddb_table_arn  = data.terraform_remote_state.database.outputs.gg_core_table_arn
  tags = {
    Project     = "goalsguild"
    Environment = var.environment
  }
}
