variable "environment" {
  type = string
}
variable "aws_region"  {
  type = string
}
variable "api_stage_name" {
  type    = string
  default = "v1"
}
variable "user_service_lambda_arn" {
  type = string
}
variable "quest_service_lambda_arn" {
  type = string
}
variable "lambda_authorizer_arn" {
  type = string
}
variable "frontend_allowed_origins" {
  type = list(string)
}
