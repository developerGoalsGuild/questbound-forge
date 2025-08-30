



# -------- Lambda (container image) --------
resource "aws_lambda_function" "lambda_function" {
  function_name = "${var.function_name}_${var.environment}"
  role          = var.role_arn

  package_type  = "Image"
  image_uri     = var.image_uri

  timeout       = var.timeout
  memory_size   = var.memory_size
  tags = var.tags
  environment {
    variables = {
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
      AWS_LWA_PORT            = "8080"
      PORT                    = "8080"
      RUST_LOG                = "info"
    }
  }
}

# Allow API Gateway to invoke
resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowInvokeFromAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
}