output "lambda_function_arn" { value = module.guild_lambda.lambda_function_arn }
output "function_name" { value = module.guild_lambda.function_name }
output "lambda_function_url" { value = module.guild_lambda.lambda_function_url }

# EventBridge outputs
output "guild_ranking_calculation_rule_arn" {
  description = "ARN of the guild ranking calculation EventBridge rule"
  value       = aws_cloudwatch_event_rule.guild_ranking_calculation.arn
}

output "guild_ranking_calculation_rule_name" {
  description = "Name of the guild ranking calculation EventBridge rule"
  value       = aws_cloudwatch_event_rule.guild_ranking_calculation.name
}