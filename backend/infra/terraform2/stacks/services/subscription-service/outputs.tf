output "ecr_repository_url" {
  description = "URL of the ECR repository for subscription service"
  value       = length(aws_ecr_repository.subscription_service) > 0 ? aws_ecr_repository.subscription_service[0].repository_url : "Repository already exists"
}

output "lambda_function_name" {
  description = "Name of the Lambda function for subscription service"
  value       = length(module.subscription_lambda) > 0 ? module.subscription_lambda[0].function_name : "No Lambda function created (no image URI provided)"
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for subscription service"
  value       = length(module.subscription_lambda) > 0 ? module.subscription_lambda[0].lambda_function_arn : "No Lambda function created (no image URI provided)"
}

output "subscription_service_lambda_arn" {
  description = "ARN of the Lambda function for subscription service (alias for API Gateway)"
  value       = length(module.subscription_lambda) > 0 ? module.subscription_lambda[0].lambda_function_arn : ""
}

output "function_url" {
  description = "Function URL for the subscription service (disabled - using API Gateway)"
  value       = "Disabled - Use API Gateway endpoints instead"
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for subscription service"
  value       = length(aws_cloudwatch_log_group.subscription_service) > 0 ? aws_cloudwatch_log_group.subscription_service[0].name : "No log group created (no Lambda function)"
}

output "jwt_secret_parameter_name" {
  description = "Name of the JWT secret parameter in SSM Parameter Store"
  value       = data.aws_ssm_parameter.jwt_secret.name
}
