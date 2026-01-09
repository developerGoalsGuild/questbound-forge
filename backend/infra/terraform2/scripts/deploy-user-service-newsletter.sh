#!/bin/bash

# Wrapper script to deploy user-service with newsletter endpoint
# This sets up proper logging paths and runs the deployment

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TERRAFORM_DIR/../.." && pwd)"

# Create log directory in workspace
LOG_DIR="$REPO_ROOT/terraform-logs"
mkdir -p "$LOG_DIR"
TF_LOG_PATH="$LOG_DIR/tf-user-service.log"

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

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Deploying User-Service with Newsletter${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check prerequisites
print_info "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured!"
    echo ""
    echo "Use the AWS credentials helper script to configure:"
    echo "  ./backend/infra/terraform2/scripts/get-aws-credentials.sh"
    echo ""
    echo "Or configure manually:"
    echo "  1. Run: aws configure"
    echo "  2. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    echo "  3. Use AWS SSO: aws sso login"
    echo ""
    echo "For interactive setup, run:"
    echo "  ./backend/infra/terraform2/scripts/get-aws-credentials.sh --configure"
    echo ""
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
REGION=$(aws configure get region 2>/dev/null || echo "${AWS_REGION:-us-east-2}")
print_success "AWS credentials OK (Account: $ACCOUNT_ID, Region: $REGION)"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_info "Checking Docker daemon..."
if ! docker ps &> /dev/null; then
    print_error "Docker daemon is not running or not accessible!"
    echo ""
    echo "Please:"
    echo "  1. Start Docker Desktop (or Docker daemon)"
    echo "  2. Ensure you have permission to access Docker"
    echo ""
    exit 1
fi
print_success "Docker is running"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install Terraform first."
    exit 1
fi
print_success "Terraform is installed"

echo ""
print_info "All prerequisites met. Starting deployment..."
echo ""

# Run the deployment script with proper log path
# Remove set -e temporarily to catch errors
set +e
"$SCRIPT_DIR/deploy-user-service-with-build.sh" \
    -e dev \
    -l "$TF_LOG_PATH" \
    "$@"

DEPLOY_EXIT_CODE=$?
set -e

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "The newsletter endpoint is now available at:"
    echo "  POST /newsletter/subscribe"
    echo ""
    echo "To verify deployment:"
    echo "  - Lambda function: goalsguild_user_service_dev"
    echo "  - Log file: $TF_LOG_PATH"
    echo ""
    echo "Test the endpoint:"
    echo "  curl -X POST https://\${API_GATEWAY_URL}/v1/newsletter/subscribe \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -H 'x-api-key: \${API_KEY}' \\"
    echo "    -d '{\"email\": \"test@example.com\", \"source\": \"footer\"}'"
else
    echo ""
    print_error "Deployment failed with exit code: $DEPLOY_EXIT_CODE"
    echo ""
    echo "Check the logs for details:"
    echo "  $TF_LOG_PATH"
    echo ""
    if [ -f "$TF_LOG_PATH" ]; then
        echo "Last 20 lines of log:"
        echo "---"
        tail -20 "$TF_LOG_PATH"
        echo "---"
    fi
    exit $DEPLOY_EXIT_CODE
fi
