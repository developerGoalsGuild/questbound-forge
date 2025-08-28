output "image_uri" {
  description = "The full image URI with version tag"
  value       = aws_ssm_parameter.image_uri.value
}
