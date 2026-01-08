output "function_name" { value = aws_lambda_function.this.function_name }
output "lambda_arn"     { value = aws_lambda_function.this.arn }
output "source_code_hash" { value = data.archive_file.lambda_zip.output_base64sha256 }
