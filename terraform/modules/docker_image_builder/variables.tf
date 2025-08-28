variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
}

variable "ssm_parameter_name" {
  description = "Name of the SSM parameter to store the image URI"
  type        = string
}

variable "docker_build_context" {
  description = "Path to the Docker build context directory"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
