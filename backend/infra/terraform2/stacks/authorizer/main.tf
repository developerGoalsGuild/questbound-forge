data "terraform_remote_state" "security" {
  backend = "local"
  config = { path = "../security/terraform.tfstate" }
}

# Import existing Lambda function
data "aws_lambda_function" "existing_authorizer" {
  function_name = "goalsguild_authorizer_dev"
}

# Import existing CloudWatch Log Group
data "aws_cloudwatch_log_group" "existing_logs" {
  name = "/aws/lambda/goalsguild_authorizer_dev"
}
