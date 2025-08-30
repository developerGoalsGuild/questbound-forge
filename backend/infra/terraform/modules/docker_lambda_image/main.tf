
locals {
  new_version = var.current_version + 1
  old_version = local.new_version > 3 ? local.new_version - 3 : 0
}

# Create or read the repo
resource "aws_ecr_repository" "repo" {
  count                 = var.create_ecr ? 1 : 0
  name                  = var.ecr_repository_name
  image_tag_mutability  = "MUTABLE"
  force_delete         = true  
  image_scanning_configuration { scan_on_push = true }
  
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

resource "docker_image" "app" {
  name = "${local.ecr_registry}:${local.new_version}"

  build {
    context    = "${var.context_path}"
    dockerfile = "${var.dockerfile_path}"
    # uncomment to pass build args:
    # build_arg = { VERSION = "1.0.0" }
  }

  # Rebuild when Dockerfile changes (extend as needed)
  triggers = {
    dockerfile_sha = filesha256("${var.dockerfile_path}")
  }
}





# Push to ECR
resource "docker_registry_image" "app" {
  name          = docker_image.app.name
  keep_remotely = true
  depends_on    = [aws_ecr_repository.repo]
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

