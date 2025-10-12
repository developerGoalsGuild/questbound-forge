# Collaboration Service Lambda Function
module "collaboration_service_lambda" {
  source = "../../modules/docker_lambda_image"
  
  function_name = "collaboration-service-${var.environment}"
  image_uri     = "${var.ecr_repository_url}:collaboration-service-${var.environment}-latest"
  timeout       = 30
  memory_size   = 512
  
  environment_variables = {
    ENVIRONMENT          = var.environment
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = var.dynamodb_table_name
    LOG_LEVEL           = "INFO"
    COGNITO_USER_POOL_ID = module.security.cognito_user_pool_id
    COGNITO_USER_POOL_CLIENT_ID = module.security.cognito_user_pool_client_id
    API_GATEWAY_KEY     = module.api_gateway.api_key_value
  }
  
  iam_role_arn = module.security.collaboration_service_role_arn
  
  tags = var.tags
}

# CloudWatch Alarms for Collaboration Service
resource "aws_cloudwatch_metric_alarm" "collaboration_service_errors" {
  alarm_name          = "collaboration-service-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors collaboration service errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = module.collaboration_service_lambda.function_name
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "collaboration_service_duration" {
  alarm_name          = "collaboration-service-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"  # 10 seconds
  alarm_description   = "This metric monitors collaboration service duration"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = module.collaboration_service_lambda.function_name
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "collaboration_service_throttles" {
  alarm_name          = "collaboration-service-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors collaboration service throttles"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = module.collaboration_service_lambda.function_name
  }
  
  tags = var.tags
}

# SNS Topic for Alerts (if not already exists)
resource "aws_sns_topic" "alerts" {
  name = "goalsguild-alerts-${var.environment}"
  
  tags = var.tags
}

# Outputs
output "collaboration_service_lambda_arn" {
  value = module.collaboration_service_lambda.function_arn
  description = "ARN of the collaboration service Lambda function"
}

output "collaboration_service_lambda_name" {
  value = module.collaboration_service_lambda.function_name
  description = "Name of the collaboration service Lambda function"
}

