variable "environment" { type = string }
variable "aws_region"  { type = string }
variable "cognito_domain_prefix" { 
    type = string 
    default = "" 
}
variable existing_lambda_exec_role_name { 
    type = string 
    default = "" 
}
