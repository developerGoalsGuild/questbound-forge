# ECR Stack Outputs

output "ecr_repositories" {
  description = "Map of ECR repository names to repository URLs"
  value = {
    for repo_name, repo in aws_ecr_repository.services : repo_name => repo.repository_url
  }
}

output "ecr_repository_urls" {
  description = "List of all ECR repository URLs"
  value = [
    for repo in aws_ecr_repository.services : repo.repository_url
  ]
}

output "user_service_repository_url" {
  description = "ECR repository URL for user-service"
  value       = aws_ecr_repository.services["goalsguild_user_service"].repository_url
}

output "quest_service_repository_url" {
  description = "ECR repository URL for quest-service"
  value       = aws_ecr_repository.services["goalsguild_quest_service"].repository_url
}

output "subscription_service_repository_url" {
  description = "ECR repository URL for subscription-service"
  value       = aws_ecr_repository.services["goalsguild_subscription_service"].repository_url
}

output "collaboration_service_repository_url" {
  description = "ECR repository URL for collaboration-service"
  value       = aws_ecr_repository.services["goalsguild_collaboration_service"].repository_url
}

output "guild_service_repository_url" {
  description = "ECR repository URL for guild-service"
  value       = aws_ecr_repository.services["goalsguild_guild_service"].repository_url
}

output "messaging_service_repository_url" {
  description = "ECR repository URL for messaging-service"
  value       = aws_ecr_repository.services["goalsguild_messaging_service"].repository_url
}

