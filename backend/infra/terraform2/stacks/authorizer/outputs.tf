output "lambda_authorizer_arn" {
  value = data.aws_lambda_function.existing_authorizer.arn
}
