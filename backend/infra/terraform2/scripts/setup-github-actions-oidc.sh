#!/bin/bash

# GitHub Actions OIDC Setup Script
# This script sets up AWS OIDC provider and IAM roles for GitHub Actions CI/CD

set -e

# Default values
ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SKIP_INIT=""
GITHUB_REPO_OWNER=""
GITHUB_REPO_NAME=""
TF_LOG_PATH="$HOME/terraform-logs/tf-github-actions-oidc.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    echo ""
    echo "GitHub Actions OIDC Setup Script"
    echo "================================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>      Environment for tfvars (dev, staging, prod) [default: dev]"
    echo "  --github-owner <owner>       GitHub repository owner (org or username)"
    echo "  --github-repo <repo>         GitHub repository name"
    echo "  -p, --plan                   Only run terraform plan, don't apply"
    echo "  -n, --no-approve            Don't auto-approve terraform apply"
    echo "  -s, --skip-init             Skip terraform init step"
    echo "  -l, --log-path <path>       Custom path for terraform log file"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --github-owner GoalsGuild --github-repo questbound-forge"
    echo "  $0 -e dev --github-owner GoalsGuild --github-repo questbound-forge -p"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
                print_error "Invalid environment: $ENV. Must be dev, staging, or prod"
                exit 1
            fi
            shift 2
            ;;
        --github-owner)
            GITHUB_REPO_OWNER="$2"
            shift 2
            ;;
        --github-repo)
            GITHUB_REPO_NAME="$2"
            shift 2
            ;;
        -p|--plan)
            PLAN_ONLY="true"
            shift
            ;;
        -n|--no-approve)
            AUTO_APPROVE="false"
            shift
            ;;
        -s|--skip-init)
            SKIP_INIT="true"
            shift
            ;;
        -l|--log-path)
            TF_LOG_PATH="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown parameter: $1"
            show_help
            exit 1
            ;;
    esac
done

# Get script directory and paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STACK_PATH="$TERRAFORM_DIR/stacks/github-actions-oidc"
ENV_FILE="$STACK_PATH/environments/$ENV.tfvars"

# Validate prerequisites
print_info "Validating prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo "Install it with: brew install awscli (macOS) or see https://aws.amazon.com/cli/"
    exit 1
fi
print_success "AWS CLI is installed"

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured"
    echo ""
    print_info "Please configure AWS credentials:"
    echo "  1. Run: aws configure"
    echo "  2. Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    echo "  3. Or use: aws sso login (if using SSO)"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region 2>/dev/null || echo "${AWS_REGION:-us-east-2}")
print_success "AWS credentials are configured"
print_info "AWS Account: $ACCOUNT_ID"
print_info "AWS Region: $REGION"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed"
    echo "Install it with: brew install terraform (macOS) or see https://www.terraform.io/downloads"
    exit 1
fi
print_success "Terraform is installed"

# Prompt for GitHub repository info if not provided
if [ -z "$GITHUB_REPO_OWNER" ] || [ -z "$GITHUB_REPO_NAME" ]; then
    echo ""
    print_info "GitHub repository information is required"
    if [ -z "$GITHUB_REPO_OWNER" ]; then
        read -p "Enter GitHub repository owner (org or username): " GITHUB_REPO_OWNER
    fi
    if [ -z "$GITHUB_REPO_NAME" ]; then
        read -p "Enter GitHub repository name: " GITHUB_REPO_NAME
    fi
fi

if [ -z "$GITHUB_REPO_OWNER" ] || [ -z "$GITHUB_REPO_NAME" ]; then
    print_error "GitHub repository owner and name are required"
    exit 1
fi

print_info "GitHub Repository: $GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"

# Validate stack path and environment file
if [ ! -d "$STACK_PATH" ]; then
    print_error "Stack path not found: $STACK_PATH"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file not found: $ENV_FILE"
    print_info "Creating environment file from template..."
    cat > "$ENV_FILE" <<EOF
environment     = "$ENV"
aws_region      = "$REGION"
github_repo_owner = "$GITHUB_REPO_OWNER"
github_repo_name  = "$GITHUB_REPO_NAME"
tags = {
  Environment = "$ENV"
  Project     = "goalsguild"
  ManagedBy   = "terraform"
}
EOF
    print_success "Created environment file: $ENV_FILE"
else
    # Update GitHub repo info in existing file
    print_info "Updating GitHub repository information in environment file..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/github_repo_owner = .*/github_repo_owner = \"$GITHUB_REPO_OWNER\"/" "$ENV_FILE"
        sed -i '' "s/github_repo_name = .*/github_repo_name = \"$GITHUB_REPO_NAME\"/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/github_repo_owner = .*/github_repo_owner = \"$GITHUB_REPO_OWNER\"/" "$ENV_FILE"
        sed -i "s/github_repo_name = .*/github_repo_name = \"$GITHUB_REPO_NAME\"/" "$ENV_FILE"
    fi
fi

# Setup logging
LOG_DIR="$(dirname "$TF_LOG_PATH")"
mkdir -p "$LOG_DIR"
if [ -f "$TF_LOG_PATH" ]; then
    > "$TF_LOG_PATH"
else
    touch "$TF_LOG_PATH"
fi

export TF_LOG=DEBUG
export TF_LOG_PATH="$TF_LOG_PATH"

print_info "Starting GitHub Actions OIDC setup"
print_info "Stack path: $STACK_PATH"
print_info "Environment file: $ENV_FILE"
echo ""

# Deploy Terraform stack
(
    cd "$STACK_PATH"
    
    if [ -z "$SKIP_INIT" ]; then
        print_info "Running terraform init..."
        terraform init -upgrade
    fi
    
    if [ -n "$PLAN_ONLY" ]; then
        print_info "Running terraform plan..."
        terraform plan -var-file="$ENV_FILE"
    else
        if [ "$AUTO_APPROVE" = "true" ]; then
            print_info "Running terraform apply with auto-approve..."
            terraform apply -var-file="$ENV_FILE" -auto-approve
        else
            print_info "Running terraform apply..."
            terraform apply -var-file="$ENV_FILE"
        fi
        
        if [ $? -eq 0 ]; then
            echo ""
            print_success "GitHub Actions OIDC setup completed successfully!"
            echo ""
            print_info "=== Next Steps ==="
            echo ""
            print_info "1. Get the IAM role ARNs from Terraform outputs:"
            echo ""
            terraform output -json | jq -r '
                "AWS_ROLE_ARN_DEV=" + .github_actions_role_arn_dev.value,
                "AWS_ROLE_ARN_STAGING=" + .github_actions_role_arn_staging.value,
                "AWS_ROLE_ARN_PROD=" + .github_actions_role_arn_prod.value
            ' || terraform output
            echo ""
            print_info "2. Add these as secrets in your GitHub repository:"
            echo "   - Go to: Settings → Secrets and variables → Actions"
            echo "   - Add the following secrets:"
            echo "     * AWS_ROLE_ARN_DEV"
            echo "     * AWS_ROLE_ARN_STAGING"
            echo "     * AWS_ROLE_ARN_PROD"
            echo ""
            print_info "3. Create GitHub Environments (Settings → Environments):"
            echo "   - dev: No protection rules (auto-deploy)"
            echo "   - staging: Required reviewers (1+), deployment branches: staging"
            echo "   - prod: Required reviewers (1+), deployment branches: main, master"
            echo ""
            print_info "4. Your workflows are already configured to use OIDC authentication!"
            echo "   The workflows will automatically use the role ARNs from secrets."
            echo ""
        else
            print_error "GitHub Actions OIDC setup failed"
            exit 1
        fi
    fi
)
