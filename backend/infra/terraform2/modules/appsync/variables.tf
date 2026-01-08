variable "name" {
  type = string
}
variable "auth_type" {
  type = string
}
variable "schema_path" {
  type = string
}
variable "lambda_authorizer_arn" {
  type    = string
  default = null
}
variable "ddb_table_name" {
  type = string
}
variable "ddb_table_arn" {
  type = string
}
variable "guild_table_name" {
  type    = string
  default = null
}
variable "guild_table_arn" {
  type    = string
  default = null
}
variable "region" {
  type = string
}
variable "enable_api_key" {
  type    = bool
  default = false
}
variable "tags" {
  type    = map(string)
  default = {}
}
