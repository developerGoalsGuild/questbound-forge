# Assuming existing aws_lambda_function resource named aws_lambda_function.lambda_function

# Fetch the image URI from SSM Parameter Store if image_uri_ssm_parameter is provided
data "aws_ssm_parameter" "image_uri" {
  count = var.image_uri_ssm_parameter != "" ? 1 : 0
  name  = var.image_uri_ssm_parameter
}

resource "aws_lambda_function" "lambda_function" {
  function_name = "${var.function_name}_${var.environment}"
  package_type  = "Image"
  image_uri     = var.image_uri_ssm_parameter != "" ? data.aws_ssm_parameter.image_uri[0].value : var.image_uri
  role          = var.role_arn
  timeout       = var.timeout
  memory_size   = var.memory_size

  tags = var.tags
}
