output "appsync_api_id" { value = module.appsync.api_id }
output "graphql_url" { value = module.appsync.graphql_url }
output "appsync_api_arn" { value = module.appsync.api_arn }
output "appsync_api_key_id" { value = module.appsync.api_key_id }
output "appsync_api_key_value" {
  value     = module.appsync.api_key_value
  sensitive = true
}
