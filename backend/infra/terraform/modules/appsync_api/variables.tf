variable "name" { type = string }
variable "auth_type" { type = string }
variable "schema_path" { type = string }
variable "lambda_authorizer_arn" { 
    type = string 
    default = null 
}
variable "user_pool_id" { 
    type = string 
    default = null 
}
variable "user_pool_client_id" { 
    type = string
    default = null
}
variable "region" { type = string }
variable "ddb_table_name" { type = string }
variable "tags" { 
    type = map(string) 
    default = {} 
}


# Map of resolvers to register
variable "resolvers" {
        type = map(object({
        type = string
        field = string
        data_source = string # "DDB" | "NONE" | "LAMBDA_USER" | "LAMBDA_PERSIST"
        code_path = string
        pipeline   = optional(list(string), []) # list of function keys for pipeline
    }))
    default = {}
}


variable "ddb_table_arn"  { type = string }
variable "lambda_user_function_arn" {
  description = "ARN of the Lambda function used for user operations (e.g., signup)"
  type        = string
  default     = ""
}

variable "lambda_persist_function_arn" {
  description = "ARN of the Lambda function used to persist user profile to DDB"
  type        = string
  default     = ""
}

# AppSync Functions map for pipelines
variable "functions" {
  type = map(object({
    name        = string
    data_source = string   # "DDB" | "NONE" | "LAMBDA_USER" | "LAMBDA_PERSIST"
    code_path   = string
  }))
  default = {}
}
# Optional: enable API key as additional auth provider
variable "enable_api_key" {
  type    = bool
  default = false
}

# Optional: API key expiry in days (only used if you set it in the resource)
variable "api_key_expires_days" {
  type    = number
  default = 30
}
