output "rest_api_id" { 
    value = aws_api_gateway_rest_api.rest_api.id 
}

output "invoke_url"  { 
    value = "https://${aws_api_gateway_rest_api.rest_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage_name}" 
}

output "stage_name" {
    value = aws_api_gateway_stage.stage.stage_name
    description = "The name of the API Gateway stage"
}

output "stage_arn" {
    value = aws_api_gateway_stage.stage.arn
    description = "The ARN of the API Gateway stage"
}

output "deployment_id" {
    value = aws_api_gateway_deployment.deployment.id
    description = "The ID of the API Gateway deployment"
}

output "cloudwatch_log_group_name" {
    value = aws_cloudwatch_log_group.api_gateway_logs.name
    description = "The name of the CloudWatch log group for API Gateway"
}

output "cloudwatch_log_group_arn" {
  value = aws_cloudwatch_log_group.api_gateway_logs.arn
  description = "The ARN of the CloudWatch log group for API Gateway"
}

output "api_key_id" {
  value = aws_api_gateway_api_key.api_key.id
  description = "The ID of the API Gateway API key"
}

output "api_key_value" {
  value = aws_api_gateway_api_key.api_key.value
  description = "The value of the API Gateway API key"
  sensitive = true
}

output "usage_plan_id" {
  value = aws_api_gateway_usage_plan.usage_plan.id
  description = "The ID of the API Gateway usage plan"
}
