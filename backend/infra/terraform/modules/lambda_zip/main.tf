locals {
  # Absolute paths
  src_abs   = abspath(var.src_dir)
  build_abs = abspath("${path.module}/${var.build_dir_name}")
  dist_abs  = abspath("${path.module}/${var.dist_dir_name}")
  zip_abs   = abspath("${path.module}/${var.dist_dir_name}/${var.zip_name}")

  # Change detection: hash all relevant source files (minus excludes)
  src_all      = fileset(local.src_abs, "**")
  excluded_set = flatten([for p in var.exclude_globs : fileset(local.src_abs, p)])
  src_files    = [for f in local.src_all : f if !contains(local.excluded_set, f)]
  src_hash     = sha1(join(",", [for f in local.src_files : filesha256("${local.src_abs}/${f}")]))

  func_name_full = "${var.function_name}_${var.environment}"
}


output "src_abs" {
  value = local.src_abs
}

output "build_abs" {
  value = local.build_abs
}



output "dist_abs" {
  value = local.dist_abs
}

output "zip_abs" {
  value = local.zip_abs
}





# ------------------- Build on Windows (PowerShell) -------------------
resource "null_resource" "build_ps"  {
  count = var.use_powershell ? 1 : 0

  triggers = {
    force = timestamp()
    src_hash  = local.src_hash
    src_abs   = local.src_abs
    build_abs = local.build_abs
    dist_abs  = local.dist_abs
    req_file  = var.requirements_file
    image     = var.python_builder_image
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command"]
    command = <<-POWERSHELL
      $VerbosePreference = "Continue"
      Write-Host "Cleaning build and dist directories..."
      if (Test-Path '${local.build_abs}') {
        Write-Host "Removing build directory: ${local.build_abs}"
        Remove-Item -Recurse -Force '${local.build_abs}'
      }
      if (Test-Path '${local.dist_abs}') {
        Write-Host "Removing dist directory: ${local.dist_abs}"
        Remove-Item -Recurse -Force '${local.dist_abs}'
      }
      Write-Host "Creating build directory: ${local.build_abs}"
      New-Item -Force -ItemType Directory -Path '${local.build_abs}' | Out-Null
      Write-Host "Creating dist directory: ${local.dist_abs}"
      New-Item -Force -ItemType Directory -Path '${local.dist_abs}' | Out-Null

      Write-Host "Copying source files from ${local.src_abs} to ${local.build_abs}..."
      robocopy '${local.src_abs}' '${local.build_abs}' /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null

      if (Test-Path '${local.src_abs}\\${var.requirements_file}') {
        Write-Host "Installing Python dependencies from ${var.requirements_file} into build directory..."
        docker run --rm `
          -v "${local.build_abs}:/out" `
          -v "${local.src_abs}:/src" `
          --entrypoint /bin/sh `
          ${var.python_builder_image} `
          -lc "pip install -r /src/${var.requirements_file} --target /out"
      } else {
        Write-Host "No requirements file found at ${local.src_abs}\\${var.requirements_file}, skipping dependency installation."
      }
    POWERSHELL
  }
}

# ------------------- Build on Linux/macOS (bash) -------------------
resource "null_resource" "build_bash" {
  count = var.use_powershell ? 0 : 1

  triggers = {
    src_hash  = local.src_hash
    src_abs   = local.src_abs
    build_abs = local.build_abs
    dist_abs  = local.dist_abs
    req_file  = var.requirements_file
    image     = var.python_builder_image
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command = <<-EOB
      set -euo pipefail
      echo "Cleaning build and dist directories..."
      rm -rf "${local.build_abs}" "${local.dist_abs}"
      echo "Creating build and dist directories..."
      mkdir -p "${local.build_abs}" "${local.dist_abs}"

      echo "Copying source files from ${local.src_abs} to ${local.build_abs}..."
      cp -R "${local.src_abs}/." "${local.build_abs}/"

      if [ -f "${local.src_abs}/${var.requirements_file}" ]; then
        echo "Installing Python dependencies from ${var.requirements_file} into build directory..."
        docker run --rm \
          -v "${local.build_abs}:/out" \
          -v "${local.src_abs}:/src" \
          --entrypoint /bin/sh \
          ${var.python_builder_image} \
          -lc 'pip install -r /src/${var.requirements_file} --target /out'
      else
        echo "No requirements file found at ${local.src_abs}/${var.requirements_file}, skipping dependency installation."
      fi
    EOB
  }
}

# ------------------- Zip the build output -------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = local.build_abs
  output_path = local.zip_abs

  depends_on = [
    null_resource.build_ps,
    null_resource.build_bash,
  ]
}

# ------------------- Lambda from ZIP -------------------
resource "aws_lambda_function" "this" {
  function_name = local.func_name_full
  role          = var.role_arn

  runtime = var.runtime
  handler = var.handler

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  timeout     = var.timeout
  memory_size = var.memory_size
  tags        = var.tags

  environment {
    variables = var.environment_variables
  }
}

# Optional: manage log group with retention
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = var.log_retention_in_days
  tags              = var.tags
}
