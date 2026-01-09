#!/bin/bash

# User service deployment script with Docker build
# This script builds Docker image, auto-increments version, and deploys user-service

set -e

# Default values
ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SKIP_INIT=""
TF_LOG_PATH="$HOME/terraform-logs/tf-user-service.log"
SERVICE_NAME="user-service"
ECR_REPOSITORY="goalsguild_user_service"

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

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
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
        *)
            print_error "Unknown parameter: $1"
            exit 1
            ;;
    esac
done

# Get script directory and paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# Go up 3 levels from terraform2 to reach repo root: terraform2 -> infra -> backend -> repo root
REPO_ROOT="$(cd "$TERRAFORM_DIR/../../.." && pwd)"
SERVICE_PATH="$REPO_ROOT/backend/services/$SERVICE_NAME"
STACK_PATH="$TERRAFORM_DIR/stacks/services/$SERVICE_NAME"
ENV_FILE="$TERRAFORM_DIR/environments/$ENV.tfvars"
BACKEND_PATH="$REPO_ROOT/backend"

# Setup logging
LOG_DIR="$(dirname "$TF_LOG_PATH")"
LOG_FILE="$LOG_DIR/tf-$SERVICE_NAME.log"
mkdir -p "$LOG_DIR"
if [ -f "$TF_LOG_PATH" ]; then
    > "$TF_LOG_PATH"
else
    touch "$TF_LOG_PATH"
fi

export TF_LOG=DEBUG
export TF_LOG_PATH="$TF_LOG_PATH"

print_info "Starting $SERVICE_NAME build and deployment for environment: $ENV"

# Get AWS account ID and region
print_info "Getting AWS account ID and region..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>&1)
AWS_EXIT_CODE=$?
if [ $AWS_EXIT_CODE -ne 0 ] || [ -z "$ACCOUNT_ID" ]; then
    print_error "Failed to get AWS account ID (exit code: $AWS_EXIT_CODE)"
    print_error "Error output: $ACCOUNT_ID"
    print_error ""
    print_error "Please configure AWS credentials:"
    print_error "  1. Run: aws configure"
    print_error "  2. Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    print_error "  3. Or use: aws sso login (if using SSO)"
    exit 1
fi

REGION=$(aws configure get region 2>/dev/null || echo "${AWS_REGION:-us-east-2}")
if [ -z "$REGION" ]; then
    print_error "Failed to get AWS region. Setting default to us-east-2"
    REGION="us-east-2"
fi

print_info "AWS Account: $ACCOUNT_ID, Region: $REGION"

# Build and push Docker image (skip if plan-only)
if [ -z "$PLAN_ONLY" ]; then
    print_info "Building Docker image for $SERVICE_NAME..."
    
    # Get current version
    VERSION_FILE="$SERVICE_PATH/.version"
    CURRENT_VERSION=1
    if [ -f "$VERSION_FILE" ]; then
        CURRENT_VERSION=$(cat "$VERSION_FILE" 2>/dev/null || echo "1")
        if ! [[ "$CURRENT_VERSION" =~ ^[0-9]+$ ]]; then
            CURRENT_VERSION=1
        fi
    fi
    
    NEW_VERSION=$((CURRENT_VERSION + 1))
    ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY"
    IMAGE_TAG="v$NEW_VERSION"
    FULL_IMAGE_URI="$ECR_URI:$IMAGE_TAG"
    
    print_info "Building version $IMAGE_TAG for $SERVICE_NAME"
    print_info "ECR Repository: $ECR_URI"
    
    if [ ! -d "$BACKEND_PATH" ]; then
        print_error "Backend directory not found: $BACKEND_PATH"
        exit 1
    fi
    
    DOCKERFILE_PATH="services/$SERVICE_NAME/Dockerfile"
    
    if [ ! -f "$BACKEND_PATH/$DOCKERFILE_PATH" ]; then
        print_error "Dockerfile not found: $BACKEND_PATH/$DOCKERFILE_PATH"
        exit 1
    fi
    
    (
        cd "$BACKEND_PATH"
        
        print_info "Building Docker image..."
        if ! docker buildx build --platform linux/amd64 -f "$DOCKERFILE_PATH" -t "$FULL_IMAGE_URI" --provenance=false --sbom=false --load .; then
            print_error "Docker build failed for $SERVICE_NAME"
            exit 1
        fi
        
        print_info "Docker build completed successfully"
        
        # Login to ECR
        print_info "Logging in to ECR..."
        REGISTRY_HOST="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
        
        if ! aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY_HOST"; then
            print_error "ECR login failed"
            exit 1
        fi
        
        print_info "ECR login successful"
        
        # Push the image
        print_info "Pushing image to ECR..."
        if ! docker push "$FULL_IMAGE_URI"; then
            print_error "Docker push failed for $SERVICE_NAME"
            exit 1
        fi
        
        print_info "Image pushed successfully"
        
        # Save new version
        echo "$NEW_VERSION" > "$VERSION_FILE"
        
        print_success "Successfully built and pushed $FULL_IMAGE_URI"
    )
    
    IMAGE_URI="$FULL_IMAGE_URI"
else
    print_info "Skipping Docker build (plan-only mode)"
    IMAGE_URI=""
fi

# Deploy service using Terraform
print_info "Deploying $SERVICE_NAME with image: ${IMAGE_URI:-latest}"

if [ ! -d "$STACK_PATH" ]; then
    print_error "Stack path not found: $STACK_PATH"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Update Terraform file with new image URI if provided
if [ -n "$IMAGE_URI" ] && [ -f "$STACK_PATH/main.tf" ]; then
    # Use sed to update existing_image_uri in main.tf
    if grep -q "existing_image_uri" "$STACK_PATH/main.tf"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS sed
            sed -i '' "s|existing_image_uri = \"[^\"]*\"|existing_image_uri = \"$IMAGE_URI\"|g" "$STACK_PATH/main.tf"
        else
            # Linux sed
            sed -i "s|existing_image_uri = \"[^\"]*\"|existing_image_uri = \"$IMAGE_URI\"|g" "$STACK_PATH/main.tf"
        fi
        print_info "Updated $STACK_PATH/main.tf with new image URI"
    fi
fi

(
    cd "$STACK_PATH"
    
    if [ -z "$SKIP_INIT" ]; then
        print_info "Running terraform init for $SERVICE_NAME"
        terraform init -upgrade
    fi
    
    if [ -n "$PLAN_ONLY" ]; then
        print_info "Running terraform plan for $SERVICE_NAME"
        terraform plan -var-file="$ENV_FILE"
    else
        if [ "$AUTO_APPROVE" = "true" ]; then
            print_info "Running terraform apply with auto-approve for $SERVICE_NAME"
            terraform apply -var-file="$ENV_FILE" -auto-approve
        else
            print_info "Running terraform apply for $SERVICE_NAME"
            terraform apply -var-file="$ENV_FILE"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        print_success "$SERVICE_NAME deployment completed successfully"
    else
        print_error "$SERVICE_NAME deployment failed"
        exit 1
    fi
)

print_success "$SERVICE_NAME build and deployment completed successfully!"
echo ""
echo "$SERVICE_NAME Deployment Summary:"
echo "- Environment: $ENV"
if [ -n "$IMAGE_URI" ]; then
    echo "- Image URI: $IMAGE_URI"
    echo "- Image built and pushed to ECR"
fi
echo "- Infrastructure deployed"

