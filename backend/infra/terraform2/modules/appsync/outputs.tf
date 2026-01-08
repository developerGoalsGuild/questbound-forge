output "api_id" { value = aws_appsync_graphql_api.this.id }
output "graphql_url" { value = aws_appsync_graphql_api.this.uris["GRAPHQL"] }
output "api_arn" { value = aws_appsync_graphql_api.this.arn }
output "api_key_id" { value = try(aws_appsync_api_key.this[0].id, null) }
output "api_key_value" { 
  value = try(aws_appsync_api_key.this[0].key, null)
  sensitive = true
}
output "ds_ddb_role_arn" { value = aws_iam_role.ds_ddb_role.arn }
