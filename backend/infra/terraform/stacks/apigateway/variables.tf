variable "aws_region" { type = string }
variable "environment" { type = string }
variable "account_id" { type = string }
variable "api_stage_name" { 
    type = string
     default = "v1" 
     }
variable "user_lambda_arn" { type = string }
variable "quest_lambda_arn" { type = string }
variable "lambda_authorizer_arn" { type = string }
variable "ddb_table_arn" { type = string }
variable "ddb_table_name" { type = string }
variable "login_attempts_table_arn" { type = string }
variable "frontend_base_url" { type = string }
variable "frontend_allowed_origins" { type = list(string) }
variable "deployment_hash" { 
    type = string 
    default = "static"
     }


