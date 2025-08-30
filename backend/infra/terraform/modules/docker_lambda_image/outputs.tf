output "image_uri" {
  description = "Full ECR image URI with incremented version tag"
  value       = local.image_uri
}

output "new_version" {
  description = "New incremented version number"
  value       = local.new_version
}
