output "lambda_authorizer_arn" {
  value = data.aws_lambda_function.existing_authorizer.arn
}

output "subscription_auth_lambda_arn" {
  description = "ARN of the AppSync subscription authorization Lambda"
  value       = var.lambda_subscription_auth_arn_override != "" ? var.lambda_subscription_auth_arn_override : module.subscription_auth_lambda[0].lambda_arn
}
