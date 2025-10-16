output "guild_table_name" {
  description = "Name of the guild DynamoDB table"
  value       = aws_dynamodb_table.guild_table.name
}

output "guild_table_arn" {
  description = "ARN of the guild DynamoDB table"
  value       = aws_dynamodb_table.guild_table.arn
}

output "guild_table_id" {
  description = "ID of the guild DynamoDB table"
  value       = aws_dynamodb_table.guild_table.id
}

output "guild_table_stream_arn" {
  description = "ARN of the guild DynamoDB table stream"
  value       = aws_dynamodb_table.guild_table.stream_arn
}

output "guild_table_stream_label" {
  description = "Label of the guild DynamoDB table stream"
  value       = aws_dynamodb_table.guild_table.stream_label
}

output "guild_table_policy_arn" {
  description = "ARN of the guild table IAM policy"
  value       = aws_iam_policy.guild_table_policy.arn
}