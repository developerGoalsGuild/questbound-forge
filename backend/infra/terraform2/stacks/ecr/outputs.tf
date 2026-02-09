# ECR Stack Outputs (merged from created + existing repositories)

locals {
  ecr_urls = merge(
    { for k, r in aws_ecr_repository.services : k => r.repository_url },
    { for k, r in data.aws_ecr_repository.existing : k => r.repository_url }
  )
}

output "ecr_repositories" {
  description = "Map of ECR repository names to repository URLs"
  value       = local.ecr_urls
}

output "ecr_repository_urls" {
  description = "List of all ECR repository URLs"
  value       = [for _, url in local.ecr_urls : url]
}

output "user_service_repository_url" {
  description = "ECR repository URL for user-service"
  value       = local.ecr_urls["goalsguild_user_service"]
}

output "quest_service_repository_url" {
  description = "ECR repository URL for quest-service"
  value       = local.ecr_urls["goalsguild_quest_service"]
}

output "subscription_service_repository_url" {
  description = "ECR repository URL for subscription-service"
  value       = local.ecr_urls["goalsguild_subscription_service"]
}

output "collaboration_service_repository_url" {
  description = "ECR repository URL for collaboration-service"
  value       = local.ecr_urls["goalsguild_collaboration_service"]
}

output "guild_service_repository_url" {
  description = "ECR repository URL for guild-service"
  value       = local.ecr_urls["goalsguild_guild_service"]
}

output "messaging_service_repository_url" {
  description = "ECR repository URL for messaging-service"
  value       = local.ecr_urls["goalsguild_messaging_service"]
}

output "gamification_service_repository_url" {
  description = "ECR repository URL for gamification-service"
  value       = local.ecr_urls["goalsguild_gamification_service"]
}

