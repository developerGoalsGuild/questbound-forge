output "ecr_repository_url" {
  description = "URL of the ECR repository for messaging service"
  value       = length(aws_ecr_repository.messaging_service) > 0 ? aws_ecr_repository.messaging_service[0].repository_url : "Repository already exists"
}

output "lambda_function_name" {
  description = "Name of the Lambda function for messaging service"
  value       = length(module.messaging_lambda) > 0 ? module.messaging_lambda[0].function_name : "No Lambda function created (no image URI provided)"
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for messaging service"
  value       = length(module.messaging_lambda) > 0 ? module.messaging_lambda[0].lambda_function_arn : "No Lambda function created (no image URI provided)"
}

output "function_url" {
  description = "Function URL for the messaging service (disabled - using API Gateway)"
  value       = "Disabled - Use API Gateway endpoints instead"
}

output "websocket_url" {
  description = "WebSocket URL for the messaging service (disabled - using API Gateway)"
  value       = "Disabled - Use API Gateway WebSocket endpoints instead"
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for messaging service"
  value       = length(aws_cloudwatch_log_group.messaging_service) > 0 ? aws_cloudwatch_log_group.messaging_service[0].name : "No log group created (no Lambda function)"
}

output "jwt_secret_parameter_name" {
  description = "Name of the JWT secret parameter in SSM Parameter Store"
  value       = data.aws_ssm_parameter.jwt_secret.name
}
