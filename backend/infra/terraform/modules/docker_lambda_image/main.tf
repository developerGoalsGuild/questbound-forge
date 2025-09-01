
# -------- Versioning: bump every apply --------
# Read last version from a local dotfile; start at 0 if missing
locals {
  _version_file   = "${path.module}/.${var.service_name}_version"
  prev_version    = fileexists(local._version_file) ? tonumber(trimspace(file(local._version_file))) : 0
  new_version     = local.prev_version + 1
  old_version     = local.new_version > 3 ? local.new_version - 3 : 0
}

# -------- Create or read the ECR repo --------
resource "aws_ecr_repository" "repo" {
  count                = var.create_ecr ? 1 : 0
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration { scan_on_push = true }
}

data "aws_ecr_repository" "repo" {
  count = var.create_ecr ? 0 : 1
  name  = var.ecr_repository_name
}

# -------- Repo URL / Image URI --------
locals {
  ecr_registry = one(concat(
    aws_ecr_repository.repo[*].repository_url,
    data.aws_ecr_repository.repo[*].repository_url,
  ))
  registry_host = split("/", local.ecr_registry)[0]                     # e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com
  image_uri     = "${local.ecr_registry}:${local.new_version}"          # e.g. .../repo:42
}

# -------- Login to ECR each run (safe no-op if already logged in) --------
resource "null_resource" "ecr_login" {
  # Change on every new version to ensure login happens before push
  triggers = {
    version = tostring(local.new_version)
    host    = local.registry_host
    region  = var.aws_region
  }

  provisioner "local-exec" {
    command = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${local.registry_host}"
    # For Windows PowerShell, uncomment:
    # interpreter = ["PowerShell", "-Command"]
  }
}

# -------- Build image with the NEW tag every apply --------
# docker provider will re-build because the 'name' (tag) changes each apply
resource "docker_image" "app" {
  name = local.image_uri

  build {
    context    = var.context_path
    dockerfile = var.dockerfile_path
    # If you build for Lambda on x86_64 locally, you may need:
    # platform   = "linux/amd64"   # (supported in newer docker provider versions)
  }
}

# -------- Push image to ECR (kept remotely) --------
resource "docker_registry_image" "app" {
  name          = docker_image.app.name
  keep_remotely = true
  depends_on    = [null_resource.ecr_login]
}

# -------- Keep only last 3 images (optional) --------
resource "aws_ecr_lifecycle_policy" "keep_last_3" {
  count      = var.create_ecr ? 1 : 0
  repository = aws_ecr_repository.repo[0].name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 3 images by count"
      selection    = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 3
      }
      action = { type = "expire" }
    }]
  })
}

# -------- Persist the new version for the next run --------
resource "local_file" "version_file" {
  content  = tostring(local.new_version)
  filename = local._version_file
}


