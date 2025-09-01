provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}


data "aws_caller_identity" "me" {}

# Short-lived ECR auth (user=AWS, password=token)
data "aws_ecr_authorization_token" "ecr" {
  registry_id = data.aws_caller_identity.me.account_id
}

provider "docker" {
  registry_auth {
    # docker provider expects address without https://
    address  = replace(data.aws_ecr_authorization_token.ecr.proxy_endpoint, "https://", "")
    username = data.aws_ecr_authorization_token.ecr.user_name
    password = data.aws_ecr_authorization_token.ecr.password
  }
}
