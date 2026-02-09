locals {
  backend_s3 = {
    bucket         = "tfstate-goalsguild-${var.environment}"
    region         = var.aws_region
    dynamodb_table = "tfstate-goalsguild-${var.environment}-lock"
    encrypt        = true
  }
}

data "terraform_remote_state" "security" {
  backend = "s3"
  config  = merge(local.backend_s3, { key = "backend/security/terraform.tfstate" })
}

data "aws_caller_identity" "current" {}

locals {
  authorizer_function_name   = "goalsguild_authorizer_${var.environment}"
  subscription_function_name = "goalsguild_subscription_auth"
  lambda_exec_role_arn = coalesce(
    try(data.terraform_remote_state.security.outputs.lambda_exec_role_arn, null),
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/goalsguild_lambda_exec_role_${var.environment}"
  )
}

data "aws_lambda_function" "existing_authorizer" {
  function_name = local.authorizer_function_name
}

module "subscription_auth_lambda" {
  count             = var.lambda_subscription_auth_arn_override == "" ? 1 : 0
  source            = "../../modules/lambda_zip"
  function_name     = local.subscription_function_name
  environment       = var.environment
  role_arn          = local.lambda_exec_role_arn
  handler           = "subscription_auth.handler"
  src_dir           = "../../../../services/authorizer-service"
  timeout           = 10
  memory_size       = 256
  requirements_file = "requirements-subscription.txt"
  exclude_globs = [
    ".git/**",
    ".venv/**",
    "__pycache__/**",
    "tests/**",
    "*.ps1",
    "*.sh",
    "build/**",
    "dist/**",
    "authorizer.zip",
    "package.sh",
    "docs/**",
    ".pytest_cache/**"
  ]
  environment_variables = {
    ENVIRONMENT                    = var.environment
    SETTINGS_SSM_PREFIX            = "/goalsguild/user-service/"
    AUTH_LOG_ENABLED               = "1"
    APPSYNC_AVAILABILITY_KEY_PARAM = "/goalsguild/${var.environment}/appsync/availability_key"
  }
}
