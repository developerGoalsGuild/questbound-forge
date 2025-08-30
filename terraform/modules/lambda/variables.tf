variable "function_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "image_uri" {
  type = string
}

variable "role_arn" {
  type = string
}

variable "timeout" {
  type = number
}

variable "memory_size" {
  type = number
}

variable "tags" {
  type = map(string)
}
