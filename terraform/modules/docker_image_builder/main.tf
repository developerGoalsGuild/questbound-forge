terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {}

# Create or use existing ECR repository for the service
resource "aws_ecr_repository" "this" {
  name = var.repository_name
  tags = var.tags
}

# Get the latest image version from SSM Parameter Store
data "aws_ssm_parameter" "image_version" {
  name = var.ssm_parameter_name

  # Ignore error if parameter does not exist yet
  lifecycle {
    ignore_errors = true
  }
}

# Parse the current version number from the parameter value (expected format: <repository_uri>:v<version>)
locals {
  current_version = (
    can(regex("v(\\d+)$", data.aws_ssm_parameter.image_version.value))
    ? tonumber(regex("v(\\d+)$", data.aws_ssm_parameter.image_version.value)[0][1])
    : 0
  )
  new_version = local.current_version + 1
  new_image_tag = "v${local.new_version}"
  new_image_uri = "${aws_ecr_repository.this.repository_url}:${local.new_image_tag}"
}

# Build and push Docker image using null_resource and local-exec
resource "null_resource" "docker_build_push" {
  triggers = {
    image_tag = local.new_image_tag
  }

  provisioner "local-exec" {
    command = <<EOT
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.this.repository_url}
      docker build -t ${aws_ecr_repository.this.repository_url}:${local.new_image_tag} ${var.docker_build_context}
      docker push ${aws_ecr_repository.this.repository_url}:${local.new_image_tag}
    EOT
    interpreter = ["/bin/bash", "-c"]
  }
}

# Store the new image URI in SSM Parameter Store
resource "aws_ssm_parameter" "image_uri" {
  name  = var.ssm_parameter_name
  type  = "String"
  value = local.new_image_uri

  overwrite = true

  depends_on = [null_resource.docker_build_push]
  tags       = var.tags
}
