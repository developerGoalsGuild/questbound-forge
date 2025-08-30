
locals {
  new_version = var.current_version + 1
  old_version = local.new_version > 3 ? local.new_version - 3 : 0
}

# Create or read the repo
resource "aws_ecr_repository" "repo" {
  count                 = var.create_ecr ? 1 : 0
  name                  = var.ecr_repository_name
  image_tag_mutability  = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  lifecycle { prevent_destroy = true }
}

data "aws_ecr_repository" "repo" {
  count = var.create_ecr ? 0 : 1
  name  = var.ecr_repository_name
}

# Pick the repository URL from whichever block is active
locals {
  ecr_registry = one(concat(
    aws_ecr_repository.repo[*].repository_url,
    data.aws_ecr_repository.repo[*].repository_url,
  ))
  image_uri = "${local.ecr_registry}:${local.new_version}"
}

# Login to ECR
resource "null_resource" "ecr_login" {
  provisioner "local-exec" {
    # Tip: on Windows you may want interpreter = ["PowerShell","-Command"]
    command = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${local.ecr_registry}"
  }
}

# Build with the FULL registry tag
resource "null_resource" "docker_build" {
  depends_on = [null_resource.ecr_login]
  provisioner "local-exec" {
    command = "docker build -t ${local.image_uri} -f ${var.dockerfile_path} ${var.context_path}"
  }
}

# Push the image to ECR (full URI)
resource "null_resource" "docker_push" {
  depends_on = [null_resource.docker_build]
  provisioner "local-exec" {
    command = "docker push ${local.image_uri}"
  }
}

# (Optional) Let ECR auto-expire old images instead of shelling
resource "aws_ecr_lifecycle_policy" "keep_last_3" {
  count      = var.create_ecr ? 1 : 0
  repository = aws_ecr_repository.repo[0].name
  policy     = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 3 images by count"
      selection    = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 3
      }
      action = { type = "expire" }
    }]
  })
}

# Persist the new version (optional)
resource "local_file" "version_file" {
  content  = tostring(local.new_version)
  filename = "${path.module}/.${var.service_name}_version"
}

