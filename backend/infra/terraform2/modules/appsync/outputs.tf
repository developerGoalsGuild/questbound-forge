output "api_id" { value = aws_appsync_graphql_api.this.id }
output "graphql_url" { value = aws_appsync_graphql_api.this.uris["GRAPHQL"] }
output "api_arn" { value = aws_appsync_graphql_api.this.arn }
output "api_key_id" { value = try(aws_appsync_api_key.this[0].id, null) }
