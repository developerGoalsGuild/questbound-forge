# GoalsGuild Landing Page - Backend Configuration
# Configure Terraform backend for state management

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
  # Alternative: S3 backend (uncomment and configure if needed)
  # backend "s3" {
  #   # Backend configuration will be provided via terraform init -backend-config
  #   # Example usage:
  #   # terraform init -backend-config="bucket=your-terraform-state-bucket" \
  #   #                -backend-config="key=goalsguild-landing-page/terraform.tfstate" \
  #   #                -backend-config="region=us-east-1"
  # }
}
