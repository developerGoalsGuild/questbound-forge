resource "aws_lambda_function" "lambda_function" {
  function_name = "${var.function_name}_${var.environment}"
  package_type  = "Image"
  image_uri     = var.image_uri
  role          = var.role_arn
  timeout       = var.timeout
  memory_size   = var.memory_size

  tags = var.tags

  
}
