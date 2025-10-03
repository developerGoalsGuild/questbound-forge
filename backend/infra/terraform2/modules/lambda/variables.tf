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

variable "enable_function_url" {
  type        = bool
  default     = false
  description = "Enable Lambda function URL"
}

variable "function_url_auth_type" {
  type        = string
  default     = "AWS_IAM"
  description = "Authorization type for function URL"
}

variable "function_url_cors" {
  type = object({
    allow_credentials = optional(bool)
    allow_headers     = optional(list(string))
    allow_methods     = optional(list(string))
    allow_origins     = optional(list(string))
    expose_headers    = optional(list(string))
    max_age          = optional(number)
  })
  default     = null
  description = "CORS configuration for function URL"
}