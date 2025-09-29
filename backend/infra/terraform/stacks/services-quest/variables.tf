variable "aws_region" { type = string }
variable "environment" { type = string }
variable "lambda_exec_role_arn" { type = string }
variable "current_version" 
{ 
    type = number 
    default = 0 
}
variable "quest_log_enabled"
 { 
    type = bool 
    default = true 
}


