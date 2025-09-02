output "function_name" {
  value = aws_lambda_function.this.function_name
}

output "lambda_arn" {
  value = aws_lambda_function.this.arn
}

output "zip_path" {
  value = data.archive_file.lambda_zip.output_path
}

output "source_code_hash" {
  value = data.archive_file.lambda_zip.output_base64sha256
}


