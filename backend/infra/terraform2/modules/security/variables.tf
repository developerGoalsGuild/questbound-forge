variable "environment" { 
    description = "Environment" 
    type = string 
    }
variable "aws_region"  {
     description = "AWS region" 
     type = string 
     }
variable "cognito_domain_prefix" { 
    description = "Optional domain prefix for Cognito Hosted UI" 
    type = string 
    default = "" 
    }
variable "tags" { 
    description = "Tags to apply" 
    type = map(string) 
    default = {} 
    }
variable "existing_lambda_exec_role_name" {
    description = "Use an existing IAM role name for Lambda exec (skip creation)"
    type        = string
    default     = ""
}
