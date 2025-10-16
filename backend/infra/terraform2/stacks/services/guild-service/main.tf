data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../../security/terraform.tfstate" }
}

# Use existing ECR image directly (temporarily)
locals {
  existing_image_uri = "838284111015.dkr.ecr.us-east-2.amazonaws.com/goalsguild_guild_service:v3"
}

module "guild_lambda" {
  source        = "../../../modules/lambda"
  function_name = "goalsguild_guild_service"
  image_uri     = local.existing_image_uri
  role_arn      = data.terraform_remote_state.security.outputs.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 256
  environment   = var.environment
  environment_variables = {
    ENVIRONMENT         = var.environment
    SETTINGS_SSM_PREFIX = "/goalsguild/guild-service/"
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

# EventBridge Rule for Guild Ranking Calculations
resource "aws_cloudwatch_event_rule" "guild_ranking_calculation" {
  name                = "goalsguild-guild-ranking-calculation-${var.environment}"
  description         = "Trigger guild ranking calculations"
  schedule_expression = var.guild_ranking_calculation_frequency

  tags = {
    Name        = "goalsguild-guild-ranking-calculation-${var.environment}"
    Environment = var.environment
    Project     = "goalsguild"
    Service     = "guild-service"
  }
}

# EventBridge Target for Guild Ranking Calculations
resource "aws_cloudwatch_event_target" "guild_ranking_calculation_target" {
  rule      = aws_cloudwatch_event_rule.guild_ranking_calculation.name
  target_id = "GuildRankingCalculationTarget"
  arn       = module.guild_lambda.lambda_function_arn

  input = jsonencode({
    action = "calculate_rankings"
  })
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "guild_service_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.guild_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guild_ranking_calculation.arn
}

