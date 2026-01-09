#!/bin/bash

# Script to check AWS configuration before deployment

set -e

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

echo ""
print_info "Checking AWS Configuration..."
echo ""

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo "Install it with: brew install awscli"
    exit 1
fi
print_success "AWS CLI is installed"

# Check AWS credentials
print_info "Checking AWS credentials..."
AWS_IDENTITY=$(aws sts get-caller-identity 2>&1)
if [ $? -ne 0 ]; then
    print_error "AWS credentials are not configured"
    echo ""
    print_info "To configure AWS credentials, choose one:"
    echo ""
    echo "Option 1: AWS Configure (Interactive)"
    echo "  aws configure"
    echo ""
    echo "Option 2: Environment Variables"
    echo "  export AWS_ACCESS_KEY_ID=your-access-key"
    echo "  export AWS_SECRET_ACCESS_KEY=your-secret-key"
    echo "  export AWS_DEFAULT_REGION=us-east-2"
    echo ""
    echo "Option 3: AWS SSO"
    echo "  aws sso login"
    echo ""
    echo "Option 4: AWS Profiles"
    echo "  export AWS_PROFILE=your-profile-name"
    echo "  aws configure --profile your-profile-name"
    exit 1
fi

# Parse account info
ACCOUNT_ID=$(echo "$AWS_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
USER_ARN=$(echo "$AWS_IDENTITY" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)

print_success "AWS credentials are configured"
print_info "Account ID: $ACCOUNT_ID"
print_info "User ARN: $USER_ARN"

# Check region
REGION=$(aws configure get region 2>/dev/null || echo "${AWS_REGION:-us-east-2}")
if [ -z "$REGION" ]; then
    print_warning "AWS region not configured, using default: us-east-2"
    REGION="us-east-2"
else
    print_success "AWS region: $REGION"
fi

# Check Docker
echo ""
print_info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Install it from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker ps &> /dev/null; then
    print_error "Docker is not running"
    echo "Start Docker Desktop and try again"
    exit 1
fi
print_success "Docker is installed and running"

# Check Terraform
echo ""
print_info "Checking Terraform..."
if ! command -v terraform &> /dev/null; then
    print_warning "Terraform is not installed (optional if using scripts)"
else
    TERRAFORM_VERSION=$(terraform version -json | grep -o '"terraform_version": "[^"]*' | cut -d'"' -f4)
    print_success "Terraform is installed: $TERRAFORM_VERSION"
fi

# Check ECR access
echo ""
print_info "Checking ECR access..."
ECR_REPO="goalsguild_user_service"
if aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$REGION" &> /dev/null; then
    print_success "ECR repository '$ECR_REPO' is accessible"
else
    print_warning "Cannot access ECR repository '$ECR_REPO'"
    print_info "This might be okay if the repository doesn't exist yet (Terraform will create it)"
fi

# Check Lambda access
echo ""
print_info "Checking Lambda access..."
LAMBDA_FUNCTION="goalsguild_user_service_dev"
if aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" &> /dev/null; then
    print_success "Lambda function '$LAMBDA_FUNCTION' is accessible"
else
    print_warning "Cannot access Lambda function '$LAMBDA_FUNCTION'"
    print_info "This might be okay if the function doesn't exist yet (Terraform will create it)"
fi

echo ""
print_success "AWS configuration check completed!"
echo ""
print_info "You can now run the deployment script:"
echo "  ./backend/infra/terraform2/scripts/deploy-user-service-newsletter.sh"
echo ""
