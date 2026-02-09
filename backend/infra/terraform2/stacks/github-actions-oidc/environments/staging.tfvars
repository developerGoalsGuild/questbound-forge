# GitHub Actions OIDC Stack - Staging Environment Configuration

environment     = "staging"
aws_region      = "us-east-2"

# GitHub Repository Configuration
# Update these with your actual GitHub repository details
github_repo_owner = "YOUR_GITHUB_ORG_OR_USERNAME"
github_repo_name  = "questbound-forge"

tags = {
  Environment = "staging"
  Project     = "goalsguild"
  ManagedBy   = "terraform"
}
