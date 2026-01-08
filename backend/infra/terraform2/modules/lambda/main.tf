locals {
  has_digest = length(regexall("@", var.image_uri)) > 0
  repo_url   = local.has_digest ? split("@", var.image_uri)[0] : join(":", slice(split(":", var.image_uri), 0, length(split(":", var.image_uri)) - 1))
  ref        = local.has_digest ? split("@", var.image_uri)[1] : element(split(":", var.image_uri), length(split(":", var.image_uri)) - 1)
  image_digest = local.has_digest ? local.ref : null
  image_tag    = local.has_digest ? null      : local.ref
  repo_name    = element(reverse(split("/", local.repo_url)), 0)
}

data "aws_ecr_image" "image" {
  count           = local.image_tag != null ? 1 : 0
  repository_name = local.repo_name
  image_tag       = local.image_tag
}

data "aws_ecr_image" "image_by_digest" {
  count           = local.image_digest != null ? 1 : 0
  repository_name = local.repo_name
  image_digest    = local.image_digest
}

locals { 
  resolved_image_uri = local.image_digest != null ? "${local.repo_url}@${local.image_digest}" : "${local.repo_url}@${data.aws_ecr_image.image[0].image_digest}"
}

resource "aws_lambda_function" "this" {
  function_name = "${var.function_name}_${var.environment}"
  role          = var.role_arn
  package_type  = "Image"
  image_uri     = local.resolved_image_uri
  timeout       = var.timeout
  memory_size   = var.memory_size
  tags          = var.tags
  environment { variables = var.environment_variables }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = var.log_retention_in_days
  tags              = var.tags
}

resource "aws_lambda_function_url" "this" {
  count              = var.enable_function_url ? 1 : 0
  function_name      = aws_lambda_function.this.function_name
  authorization_type = var.function_url_auth_type

  dynamic "cors" {
    for_each = var.function_url_cors != null ? [var.function_url_cors] : []
    content {
      allow_credentials = cors.value.allow_credentials
      allow_headers     = cors.value.allow_headers
      allow_methods     = cors.value.allow_methods
      allow_origins     = cors.value.allow_origins
      expose_headers    = cors.value.expose_headers
      max_age          = cors.value.max_age
    }
  }
}