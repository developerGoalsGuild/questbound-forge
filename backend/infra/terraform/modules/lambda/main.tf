# --- Parse repo / ref (tag or digest) ---
locals {
  # If there is an '@', we assume digest form; otherwise tag form
  has_digest = length(regexall("@", var.image_uri)) > 0

  # repo_url is the part before the last ':' (for tag form) or before '@' (for digest form)
  repo_url = local.has_digest ? split("@", var.image_uri)[0]:join(":", slice(split(":", var.image_uri), 0, length(split(":", var.image_uri)) - 1))

  # ref is either digest (after '@') or the tag (after the last ':')
  ref = local.has_digest? split("@", var.image_uri)[1]:element(split(":", var.image_uri), length(split(":", var.image_uri)) - 1)

  image_digest = local.has_digest ? local.ref : null
  image_tag    = local.has_digest ? null       : local.ref

  # ECR repository name (last path segment of repo_url)
  repo_name = element(reverse(split("/", local.repo_url)), 0)
}

# --- Resolve digest if a tag was provided (no conditional count) ---
data "aws_ecr_image" "image" {
  repository_name = local.repo_name
  image_tag       = local.image_tag    # null if digest form
  image_digest    = local.image_digest # null if tag form
}

# Always produce repo@digest (if var.image_uri already had a digest, we reuse it)
locals {
  resolved_image_uri = "${local.repo_url}@${coalesce(local.image_digest, data.aws_ecr_image.image.image_digest)}"
}

# --- Lambda using a digest (stable) ---
resource "aws_lambda_function" "lambda_function" {
  function_name = "${var.function_name}_${var.environment}"
  role          = var.role_arn

  package_type  = "Image"
  image_uri     = local.resolved_image_uri

  timeout       = var.timeout
  memory_size   = var.memory_size
  tags          = var.tags  
  environment {
    variables = merge(
      {
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
        AWS_LWA_PORT            = "8080"
        PORT                    = "8080"
        RUST_LOG                = "info"
      },
      var.environment_variables,
    )
  }
}
# Allow API Gateway to invoke
resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowInvokeFromAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
}

# CloudWatch Log Group for Lambda function logs
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.lambda_function.function_name}"
  retention_in_days = var.log_retention_in_days

  tags = var.tags
}

# CloudWatch Metric Filter for Lambda Errors
resource "aws_cloudwatch_log_metric_filter" "lambda_error_filter" {
  name           = "${var.function_name}_ErrorFilter"
  log_group_name = aws_cloudwatch_log_group.lambda_log_group.name
  pattern        = "ERROR"

  metric_transformation {
    name      = "${var.function_name}_Errors"
    namespace = "goalsguild/Lambda"
    value     = "1"
  }
}

# CloudWatch Metric Filter for Lambda Throttles
resource "aws_cloudwatch_log_metric_filter" "lambda_throttle_filter" {
  name           = "${var.function_name}_ThrottleFilter"
  log_group_name = aws_cloudwatch_log_group.lambda_log_group.name
  pattern        = "ThrottlingException"

  metric_transformation {
    name      = "${var.function_name}_Throttles"
    namespace = "goalsguild/Lambda"
    value     = "1"
  }
}

# CloudWatch Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "${var.function_name}_ErrorAlarm"
  alarm_description   = "Alarm when Lambda function ${var.function_name} has errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "${var.function_name}_Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.error_threshold
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"
  tags                = var.tags
}

# CloudWatch Alarm for Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttle_alarm" {
  alarm_name          = "${var.function_name}_ThrottleAlarm"
  alarm_description   = "Alarm when Lambda function ${var.function_name} is throttled"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "${var.function_name}_Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.throttle_threshold
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"
  tags                = var.tags
}

# CloudWatch Alarm for Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration_alarm" {
  alarm_name          = "${var.function_name}_DurationAlarm"
  alarm_description   = "Alarm when Lambda function ${var.function_name} duration exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = var.duration_threshold_ms
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"
  tags                = var.tags
}
