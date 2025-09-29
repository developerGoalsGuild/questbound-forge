variable "service_name" { type = string }
variable "ecr_repository_name" { type = string }
variable "aws_region" { type = string }
variable "environment" { type = string }
variable "dockerfile_path" { type = string }
variable "context_path"  { type = string }
variable "create_ecr" {
  type    = bool
  default = true
}
