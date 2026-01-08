terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
    docker = {
      source  = "kreuzwerker/docker"
    }
    local = {
      source  = "hashicorp/local"
    }
    null = {
      source  = "hashicorp/null"
    }
  }
}

