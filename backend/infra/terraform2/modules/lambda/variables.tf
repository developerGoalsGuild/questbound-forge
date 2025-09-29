variable "function_name" { type = string }
variable "image_uri"     { type = string }
variable "role_arn"      { type = string }
variable "timeout" {
  type    = number
  default = 10
}
variable "memory_size" {
  type    = number
  default = 512
}
variable "environment"   { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}
variable "log_retention_in_days" {
  type    = number
  default = 14
}
variable "environment_variables" {
  type    = map(string)
  default = {}
}
