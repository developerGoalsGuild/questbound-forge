variable "function_name" {
  type = string
}
variable "environment" {
  type = string
}
variable "role_arn" {
  type = string
}
variable "runtime" {
  type    = string
  default = "python3.12"
}
variable "handler" {
  type    = string
  default = "app.handler"
}
variable "timeout" {
  type    = number
  default = 30
}
variable "memory_size" {
  type    = number
  default = 512
}
variable "src_dir" {
  type = string
}
variable "use_powershell" {
  type    = bool
  default = true
}
variable "requirements_file" {
  type    = string
  default = "requirements.txt"
}
variable "python_builder_image" {
  type    = string
  default = "public.ecr.aws/lambda/python:3.12"
}
variable "exclude_globs" {
  type    = list(string)
  default = [".git/**", ".venv/**", "__pycache__/**"]
}
variable "log_retention_in_days" {
  type    = number
  default = 14
}
variable "environment_variables" {
  type    = map(string)
  default = {}
}
