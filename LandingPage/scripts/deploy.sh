#!/bin/bash
# GoalsGuild Landing Page - Bash Deployment Script
# Deploys static files to S3 and invalidates CloudFront cache

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse command line arguments
ENVIRONMENT=""
SOURCE_PATH="../src"
SKIP_TERRAFORM=false
SKIP_INVALIDATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--source)
            SOURCE_PATH="$2"
            shift 2
            ;;
        --skip-terraform)
            SKIP_TERRAFORM=true
            shift
            ;;
        --skip-invalidation)
            SKIP_INVALIDATION=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 -e ENVIRONMENT [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment    Environment (dev, staging, prod)"
            echo "  -s, --source         Source path (default: ../src)"
            echo "  --skip-terraform     Skip Terraform deployment"
            echo "  --skip-invalidation  Skip CloudFront invalidation"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_color $RED "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$ENVIRONMENT" ]]; then
    print_color $RED "Environment is required. Use -e or --environment"
    exit 1
fi

# Check prerequisites
print_color $YELLOW "Checking prerequisites..."

if ! command_exists aws; then
    print_color $RED "AWS CLI is not installed or not in PATH"
    exit 1
fi

if ! command_exists terraform; then
    print_color $RED "Terraform is not installed or not in PATH"
    exit 1
fi

# Validate environment
VALID_ENVIRONMENTS=("dev" "staging" "prod")
if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    print_color $RED "Invalid environment. Must be one of: ${VALID_ENVIRONMENTS[*]}"
    exit 1
fi

# Check if source directory exists
if [[ ! -d "$SOURCE_PATH" ]]; then
    print_color $RED "Source directory not found: $SOURCE_PATH"
    exit 1
fi

print_color $GREEN "Starting deployment for environment: $ENVIRONMENT"

# Step 1: Deploy Terraform infrastructure (if not skipped)
if [[ "$SKIP_TERRAFORM" == false ]]; then
    print_color $YELLOW "Deploying Terraform infrastructure..."
    
    cd "../terraform"
    
    # Initialize Terraform
    print_color $YELLOW "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    print_color $YELLOW "Planning Terraform deployment..."
    terraform plan -var-file="environments/$ENVIRONMENT.tfvars" -out="terraform.tfplan"
    
    # Apply deployment
    print_color $YELLOW "Applying Terraform deployment..."
    terraform apply -auto-approve "terraform.tfplan"
    
    # Get outputs
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
    WEBSITE_URL=$(terraform output -raw website_url)
    
    print_color $GREEN "Infrastructure deployed successfully!"
    print_color $GREEN "S3 Bucket: $S3_BUCKET"
    print_color $GREEN "CloudFront ID: $CLOUDFRONT_ID"
    print_color $GREEN "Website URL: $WEBSITE_URL"
    
    # Export for later use
    export S3_BUCKET_NAME="$S3_BUCKET"
    export CLOUDFRONT_ID="$CLOUDFRONT_ID"
    export WEBSITE_URL="$WEBSITE_URL"
    
    cd "../scripts"
else
    print_color $YELLOW "Skipping Terraform deployment..."
    
    # Try to get outputs from existing state
    cd "../terraform"
    S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
    WEBSITE_URL=$(terraform output -raw website_url 2>/dev/null || echo "")
    
    if [[ -z "$S3_BUCKET" ]]; then
        print_color $RED "Could not get Terraform outputs. Please run without --skip-terraform first."
        exit 1
    fi
    
    export S3_BUCKET_NAME="$S3_BUCKET"
    export CLOUDFRONT_ID="$CLOUDFRONT_ID"
    export WEBSITE_URL="$WEBSITE_URL"
    
    cd "../scripts"
fi

# Step 2: Sync files to S3
print_color $YELLOW "Syncing files to S3 bucket: $S3_BUCKET_NAME"

# Sync all files to S3
aws s3 sync "$SOURCE_PATH" "s3://$S3_BUCKET_NAME/" \
    --delete \
    --exclude "*.git*" \
    --exclude "*.DS_Store" \
    --exclude "Thumbs.db" \
    --cache-control "max-age=31536000" \
    --metadata-directive REPLACE

# Set specific cache headers for HTML files
aws s3 cp "$SOURCE_PATH" "s3://$S3_BUCKET_NAME/" \
    --recursive \
    --exclude "*" \
    --include "*.html" \
    --cache-control "max-age=3600" \
    --metadata-directive REPLACE

print_color $GREEN "Files synced to S3 successfully!"

# Step 3: Invalidate CloudFront cache (if not skipped)
if [[ "$SKIP_INVALIDATION" == false ]]; then
    print_color $YELLOW "Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query "Invalidation.Id" \
        --output text)
    
    print_color $GREEN "CloudFront invalidation created: $INVALIDATION_ID"
    print_color $YELLOW "Cache invalidation is in progress. Changes will be visible within 15 minutes."
else
    print_color $YELLOW "Skipping CloudFront invalidation..."
fi

# Step 4: Verify deployment
print_color $YELLOW "Verifying deployment..."

# Test if the website is accessible
if curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL" | grep -q "200"; then
    print_color $GREEN "Website is accessible at: $WEBSITE_URL"
else
    print_color $YELLOW "Could not verify website accessibility. Please check manually at: $WEBSITE_URL"
fi

print_color $GREEN "Deployment completed successfully!"
print_color $GREEN "Website URL: $WEBSITE_URL"
