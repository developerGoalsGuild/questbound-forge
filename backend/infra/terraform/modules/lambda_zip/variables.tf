variable "function_name" {
  description = "Base name of the Lambda function (stage will be appended outside if you want)"
  type        = string
}

variable "environment" {
  description = "Environment suffix to append to the function name"
  type        = string
  default     = "dev"
}

variable "role_arn" {
  description = "IAM role ARN for Lambda execution"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime (zip-based)"
  type        = string
  default     = "python3.12"
}

variable "handler" {
  description = "Lambda handler, e.g. app.handler (file.function)"
  type        = string
  default     = "app.handler"
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda memory in MB"
  type        = number
  default     = 512
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

variable "src_dir" {
  description = "Path to your source directory containing handler code"
  type        = string
}

variable "requirements_file" {
  description = "Relative filename (inside src_dir) of the pip requirements list"
  type        = string
  default     = "requirements.txt"
}

variable "python_builder_image" {
  description = "Docker image used to build Linux-compatible wheels"
  type        = string
  default     = "public.ecr.aws/lambda/python:3.12"
}





variable "use_powershell" {
  description = "If true, use PowerShell build steps (Windows). If false, use bash (Linux/macOS)."
  type        = bool
  default     = true
}

variable "exclude_globs" {
  description = "Globs (relative to src_dir) to exclude from change detection/build context"
  type        = list(string)
  default     = [
    ".git/**",
    ".venv/**",
    "__pycache__/**",
    ".pytest_cache/**",
    ".mypy_cache/**",
    ".DS_Store",
  ]
}

variable "dist_dir_name" {
  description = "Directory (inside this module) where the zip will be written"
  type        = string
  default     = ".dist"
}

variable "build_dir_name" {
  description = "Directory (inside this module) used for staging build output"
  type        = string
  default     = ".build/lambda"
}

variable "zip_name" {
  description = "Name of the output zip file"
  type        = string
  default     = "lambda.zip"
}

variable "log_retention_in_days" {
  description = "CloudWatch Logs retention for this Lambda's log group"
  type        = number
  default     = 14
}

variable "environment_variables" {
  description = "Extra environment variables for the Lambda"
  type        = map(string)
  default     = {}
}
