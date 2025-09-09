output "lambda_exec_role_arn" {
  description = "ARN of the IAM role used by Lambda functions"
  value       = aws_iam_role.lambda_exec_role.arn
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "App client ID for the Cognito User Pool"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "cognito_user_pool_domain" {
  description = "Cognito Hosted UI domain (if provisioned)"
  value       = try(aws_cognito_user_pool_domain.user_pool_domain[0].domain, null)
}

output "api_gateway_rest_api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.rest_api.id
}

output "api_invoke_url" {
  description = "Invoke URL for API Gateway stage"
  value       = "https://${aws_api_gateway_rest_api.rest_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage_name}"
}

output "api_gateway_api_key_value" {
  description = "API Gateway API key value for frontend"
  value       = aws_api_gateway_api_key.frontend_key.value
  sensitive   = true
}
