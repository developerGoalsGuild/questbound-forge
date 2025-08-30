output "image_uri" {
  value = "${var.ecr_repository_url}:${var.image_tag}"
}
