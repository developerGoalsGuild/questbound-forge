variable "aws_region" { type = string }
variable "environment" { type = string }
variable "schema_path" { type = string }
variable "auth_type" { 
    type = string 
    default = "AWS_LAMBDA" 
}
variable "enable_api_key" { 
    type = bool 
default = false 
}
variable "lambda_authorizer_arn" { type = string }
variable "ddb_table_name" { type = string }
variable "ddb_table_arn" { type = string }
variable "resolvers" { 
    type = any 
    default = {} 
    }


