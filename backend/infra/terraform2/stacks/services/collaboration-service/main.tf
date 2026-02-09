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
  config = merge(local.backend_s3, { key = "backend/security/terraform.tfstate" })
}

# Use existing ECR image directly (temporarily)
locals {
  existing_image_uri = "838284111015.dkr.ecr.us-east-2.amazonaws.com/goalsguild_collaboration_service:v6"
}

module "collaboration_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_collaboration_service"
  image_uri     = local.existing_image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 256
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/collaboration-service/"
  }

  # Enable function URL for AppSync HTTP data source
  enable_function_url     = true
  function_url_auth_type  = "AWS_IAM"  # Secure access for AppSync only
  function_url_cors = {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["POST", "GET"]
    allow_origins     = ["*"]
    max_age          = 86400
  }
}















































































