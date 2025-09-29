terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "gg_core" {
  source          = "../../modules/dynamodb_single_table"
  table_name      = "gg_core"
  enable_streams  = true
  prevent_destroy = true
  tags = {
    Component   = "DataBase"
    Environment = var.environment
    Project     = "goalsguild"
  }
}

resource "aws_dynamodb_table" "login_attempts" {
  name         = "goalsguild_login_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "ts"

  attribute { name = "pk" type = "S" }
  attribute { name = "ts" type = "N" }

  ttl { attribute_name = "ttl" enabled = true }
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Environment = var.environment, Service = "user-service" }
}

output "gg_core_table_name" { value = module.gg_core.table_name }
output "gg_core_table_arn"  { value = module.gg_core.arn }
output "login_attempts_arn" { value = aws_dynamodb_table.login_attempts.arn }



