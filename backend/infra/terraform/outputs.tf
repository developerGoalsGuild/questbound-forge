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

#output "table_name"        { value = module.goalsguild_table.table_name }
output "table_name" { value = module.ddb.table_name }

#output "table_stream_arn"  { value = module.goalsguild_table.table_stream_arn }
#output "app_rw_policy_arn" { value = module.goalsguild_table.app_rw_policy_arn }
output "appsync_graphql_url" {
  description = "AppSync GraphQL endpoint URL"
  value       = module.appsync.graphql_url
}

output "appsync_api_id" {
  description = "AppSync API ID"
  value       = module.appsync.api_id
}

output "appsync_api_key_id" {
  description = "AppSync API key ID (x-api-key) when enabled"
  value       = module.appsync.api_key_id
}

output "appsync_api_key_expires" {
  description = "AppSync API key expiration when enabled"
  value       = module.appsync.api_key_expires
}

output "appsync_api_arn" {
  description = "AppSync API ARN"
  value       = module.appsync.api_arn
}

output "appsync_api_key_expires_human" {
  description = "AppSync API key expiration (human-readable)"
  value       = module.appsync.api_key_expires_human
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.network.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "App client ID for the Cognito User Pool"
  value       = module.network.cognito_user_pool_client_id
}

output "api_invoke_url" {
  description = "Invoke URL for API Gateway stage"
  value       = module.network.api_invoke_url
}

output "api_gateway_api_key_value" {
  description = "API Gateway API key value for frontend"
  value       = module.network.api_gateway_api_key_value
  sensitive   = true
}
