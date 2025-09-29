output "rest_api_id" { 
    value = aws_api_gateway_rest_api.rest_api.id 
    }
output "invoke_url"  { 
    value = "https://${aws_api_gateway_rest_api.rest_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage_name}" 
}
