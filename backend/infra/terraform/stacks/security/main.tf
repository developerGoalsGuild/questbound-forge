terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

module "iam" {
  source  = "../../modules/iam"
  aws_region = var.aws_region
  account_id = data.aws_caller_identity.current.account_id
  user_service_lambda_authorizer_role_name = "user-service-role"
}

data "aws_caller_identity" "current" {}

output "lambda_authorizer_role_arn" { value = module.iam.lambda_authorizer_role_arn }


