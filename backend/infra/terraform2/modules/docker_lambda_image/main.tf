locals {
  _version_file = "${path.module}/.${var.service_name}_version"
  prev_version  = fileexists(local._version_file) ? tonumber(trimspace(file(local._version_file))) : 0
  new_version   = local.prev_version + 1
}

resource "aws_ecr_repository" "repo" {
  count                = var.create_ecr ? 1 : 0
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

data "aws_ecr_repository" "repo" {
  count = var.create_ecr ? 0 : 1
  name  = var.ecr_repository_name
}

locals {
  ecr_registry = one(concat(aws_ecr_repository.repo[*].repository_url, data.aws_ecr_repository.repo[*].repository_url))
  image_uri    = "${local.ecr_registry}:${local.new_version}"
}

resource "null_resource" "ecr_login" {
  triggers = { version = tostring(local.new_version), region = var.aws_region }
  provisioner "local-exec" { command = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${split("/", local.ecr_registry)[0]}" }
}

resource "docker_image" "app" {
  name = local.image_uri
  build {
    context    = var.context_path
    dockerfile = var.dockerfile_path
  }
}

resource "docker_registry_image" "app" {
  name          = docker_image.app.name
  keep_remotely = true
  depends_on    = [null_resource.ecr_login]
}

resource "local_file" "version_file" {
  filename = local._version_file
  content  = tostring(local.new_version)
}
