# GitHub Actions OIDC Stack - Dev Environment Configuration

environment     = "dev"
aws_region      = "us-east-2"

# GitHub Repository Configuration
# Update these with your actual GitHub repository details
github_repo_owner = "YOUR_GITHUB_ORG_OR_USERNAME"
github_repo_name  = "questbound-forge"

tags = {
  Environment = "dev"
  Project     = "goalsguild"
  ManagedBy   = "terraform"
}
