output "dynamodb_users_table_name" {
  description = "Name of the DynamoDB users table"
  value       = module.dynamodb_users.table_name
}

output "dynamodb_quests_table_name" {
  description = "Name of the DynamoDB quests table"
  value       = module.dynamodb_quests.table_name
}

output "lambda_user_service_function_name" {
  description = "Name of the user service Lambda function"
  value       = module.lambda_user_service.function_name
}

output "lambda_quest_service_function_name" {
  description = "Name of the quest service Lambda function"
  value       = module.lambda_quest_service.function_name
}

output "lambda_exec_role_arn" {
  description = "ARN of the IAM role used by Lambda functions"
  value       = module.network.lambda_exec_role_arn
}

output "api_gateway_rest_api_id" {
  description = "ID of the API Gateway REST API"
  value       = module.network.api_gateway_rest_api_id
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.network.cognito_user_pool_id
}
