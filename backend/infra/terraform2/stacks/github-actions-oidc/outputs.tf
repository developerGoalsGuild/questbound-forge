# GitHub Actions OIDC Stack Outputs

output "oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "github_actions_role_arn_dev" {
  description = "ARN of the IAM role for GitHub Actions in dev environment"
  value       = aws_iam_role.github_actions_dev.arn
}

output "github_actions_role_arn_staging" {
  description = "ARN of the IAM role for GitHub Actions in staging environment"
  value       = aws_iam_role.github_actions_staging.arn
}

output "github_actions_role_arn_prod" {
  description = "ARN of the IAM role for GitHub Actions in prod environment"
  value       = aws_iam_role.github_actions_prod.arn
}

output "github_repo" {
  description = "GitHub repository (owner/repo)"
  value       = "${var.github_repo_owner}/${var.github_repo_name}"
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
