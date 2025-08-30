resource "null_resource" "docker_build" {
  provisioner "local-exec" {
    command = <<EOT
      docker build -t ${var.image_name}:${var.image_tag} ${var.dockerfile_path}
      docker tag ${var.image_name}:${var.image_tag} ${var.ecr_repository_url}:${var.image_tag}
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${var.ecr_repository_url}
      docker push ${var.ecr_repository_url}:${var.image_tag}
    EOT
  }
}

resource "aws_ssm_parameter" "image_uri" {
  name  = var.ssm_parameter_name
  type  = "String"
  value = "${var.ecr_repository_url}:${var.image_tag}"
  overwrite = true
}

resource "null_resource" "increment_version" {
  triggers = {
    image_tag = var.image_tag
  }

  provisioner "local-exec" {
    command = <<EOT
      aws ssm put-parameter --name ${var.ssm_parameter_name} --value ${var.ecr_repository_url}:${var.image_tag} --type String --overwrite
    EOT
  }
}
