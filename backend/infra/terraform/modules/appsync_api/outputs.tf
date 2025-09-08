output "api_id" { value = aws_appsync_graphql_api.this.id }
output "graphql_url"{ value = aws_appsync_graphql_api.this.uris["GRAPHQL"] }
# Optional API key outputs (present only when enable_api_key = true)
output "api_key_id" {
  description = "AppSync API key ID (use as x-api-key when enabled)"
  value       = try(aws_appsync_api_key.this[0].id, null)
}

output "api_key_expires" {
  description = "AppSync API key expiration (RFC3339)"
  value       = try(aws_appsync_api_key.this[0].expires, null)
}

output "api_arn" {
  description = "AppSync API ARN"
  value       = aws_appsync_graphql_api.this.arn
}
output "api_key_expires_human" {
  description = "AppSync API key expiration (human-readable)"
  value       = try(formatdate("YYYY-MM-DD HH:mm:ss ZZZ", aws_appsync_api_key.this[0].expires), null)
}
