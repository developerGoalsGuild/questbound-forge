variable "service_name" {
  description = "Name of the service (e.g., user-service, quest-service)"
  type        = string
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository to push the image"
  type        = string
}

variable "aws_region" {
  description = "AWS region for ECR and Lambda"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
}

variable "current_version" {
  description = "Current version number of the Docker image (optional, default 0)"
  type        = number
  default     = 0
}

variable "dockerfile_path" {
  description = "Path to the Dockerfile relative to the root of the Terraform project"
  type        = string
  #default     = "../../../../../backend/services/${var.service_name}/Dockerfile"
}

variable "context_path" {
  description = "Path to the Docker build context relative to the root of the Terraform project"
  type        = string
  #default     = "../../../../../backend/services/${var.service_name}"
}


variable "create_ecr"           { 
  type = bool    
  default = true 
}
