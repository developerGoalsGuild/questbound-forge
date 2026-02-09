output "lambda_exec_role_arn"  { value = module.security.lambda_exec_role_arn }
output "lambda_exec_role_name" { value = module.security.lambda_exec_role_name }
output "cognito_user_pool_id"  { value = module.security.cognito_user_pool_id }
output "cognito_user_pool_client_id" { value = module.security.cognito_user_pool_client_id }
output "cognito_user_pool_domain" { value = module.security.cognito_user_pool_domain }
