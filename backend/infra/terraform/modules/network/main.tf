




# CloudWatch Log Group for API Gateway Access Logs
resource "aws_cloudwatch_log_group" "apigw_access_logs" {
  name              = "/aws/apigateway/goalsguild_api_${var.environment}_access_logs"
  retention_in_days = 1

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "apigateway"
  }
}

# Must exist before any stage enables logging
resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch_role.arn
  depends_on          = [aws_iam_role_policy_attachment.apigw_push_to_cw]
}
