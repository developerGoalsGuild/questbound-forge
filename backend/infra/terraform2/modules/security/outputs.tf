output "lambda_exec_role_arn" {
  value = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].arn : aws_iam_role.lambda_exec_role[0].arn
}

output "collaboration_service_role_arn" {
  value = aws_iam_role.collaboration_service_role.arn
}
output "cognito_user_pool_id" { value = aws_cognito_user_pool.user_pool.id }
output "cognito_user_pool_client_id" { value = aws_cognito_user_pool_client.user_pool_client.id }
output "cognito_user_pool_domain" {
  value = try(aws_cognito_user_pool_domain.user_pool_domain[0].domain, null)
}
