# Collaboration Service Lambda Function
module "collaboration_service_lambda" {
  source = "../../modules/docker_lambda_image"

  service_name         = "collaboration-service"
  ecr_repository_name  = "goalsguild_collaboration_service"
  aws_region          = var.aws_region
  environment         = var.environment
  dockerfile_path     = "Dockerfile"
  context_path        = "${path.module}/../../../services/collaboration-service"
  create_ecr          = true
}

# Lambda Function using the built image
resource "aws_lambda_function" "collaboration_service" {
  function_name = "collaboration-service-${var.environment}"
  role          = module.security.collaboration_service_role_arn
  package_type  = "Image"
  image_uri     = module.collaboration_service_lambda.image_uri
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      ENVIRONMENT          = var.environment
      AWS_REGION          = var.aws_region
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name
      LOG_LEVEL           = "INFO"
      COGNITO_USER_POOL_ID = module.security.cognito_user_pool_id
      COGNITO_USER_POOL_CLIENT_ID = module.security.cognito_user_pool_client_id
      API_GATEWAY_KEY     = module.api_gateway.api_key_value
    }
  }

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
    FunctionName = aws_lambda_function.collaboration_service.function_name
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
    FunctionName = aws_lambda_function.collaboration_service.function_name
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
    FunctionName = aws_lambda_function.collaboration_service.function_name
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
  value = aws_lambda_function.collaboration_service.arn
  description = "ARN of the collaboration service Lambda function"
}

output "collaboration_service_lambda_name" {
  value = aws_lambda_function.collaboration_service.function_name
  description = "Name of the collaboration service Lambda function"
}

output "collaboration_service_image_uri" {
  value = module.collaboration_service_lambda.image_uri
  description = "URI of the collaboration service Docker image"
}

