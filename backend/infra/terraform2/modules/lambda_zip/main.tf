locals {
  src_abs   = abspath(var.src_dir)
  # Use unique build/dist directories per function to avoid conflicts when building multiple Lambdas
  # Hash the function name to create a unique identifier
  function_hash = substr(sha256("${var.function_name}_${var.environment}"), 0, 8)
  build_abs = abspath("${path.module}/.build/${local.function_hash}")
  dist_abs  = abspath("${path.module}/.dist/${local.function_hash}")
  zip_abs   = abspath("${path.module}/.dist/${local.function_hash}/lambda.zip")

  src_all      = fileset(local.src_abs, "**")
  excluded_set = flatten([for p in var.exclude_globs : fileset(local.src_abs, p)])
  src_files    = [for f in local.src_all : f if !contains(local.excluded_set, f)]
  src_hash     = sha1(join(",", [for f in local.src_files : filesha256("${local.src_abs}/${f}")]))
}

resource "null_resource" "build_ps" {
  count = var.use_powershell ? 1 : 0
  triggers = { src_hash = local.src_hash }
  provisioner "local-exec" {
    interpreter = ["PowerShell","-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-Command"]
    command = <<-POWERSHELL
      if (Test-Path '${local.build_abs}') { Remove-Item -Recurse -Force '${local.build_abs}' }
      if (Test-Path '${local.dist_abs}')  { Remove-Item -Recurse -Force '${local.dist_abs}' }
      New-Item -Force -ItemType Directory -Path '${local.build_abs}' | Out-Null
      New-Item -Force -ItemType Directory -Path '${local.dist_abs}'  | Out-Null
      robocopy '${local.src_abs}' '${local.build_abs}' /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
      if (Test-Path '${local.src_abs}\${var.requirements_file}') {
        docker run --rm -v "${local.build_abs}:/out" -v "${local.src_abs}:/src" --entrypoint /bin/sh ${var.python_builder_image} -lc "pip install -r /src/${var.requirements_file} --target /out"
      }
    POWERSHELL
  }
}

resource "null_resource" "build_bash" {
  count = var.use_powershell ? 0 : 1
  triggers = { src_hash = local.src_hash }
  provisioner "local-exec" {
    interpreter = ["/bin/bash","-lc"]
    command = <<-BASH
      rm -rf "${local.build_abs}" "${local.dist_abs}" && mkdir -p "${local.build_abs}" "${local.dist_abs}"
      cp -R "${local.src_abs}/." "${local.build_abs}/"
      if [ -f "${local.src_abs}/${var.requirements_file}" ]; then
        docker run --rm -v "${local.build_abs}:/out" -v "${local.src_abs}:/src" --entrypoint /bin/sh ${var.python_builder_image} -lc 'pip install -r /src/${var.requirements_file} --target /out'
      fi
    BASH
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = local.build_abs
  output_path = local.zip_abs
  depends_on  = [null_resource.build_ps, null_resource.build_bash]
}

resource "aws_lambda_function" "this" {
  function_name = "${var.function_name}_${var.environment}"
  role          = var.role_arn
  runtime       = var.runtime
  handler       = var.handler
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout       = var.timeout
  memory_size   = var.memory_size
  environment { variables = var.environment_variables }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = var.log_retention_in_days
}
