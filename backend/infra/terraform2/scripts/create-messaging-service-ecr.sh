#!/bin/bash
# Script to create ECR repository for messaging service

set -e

# Default values
ENV="dev"
PLAN_ONLY=false
AUTO_APPROVE=true
SKIP_INIT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    --plan-only)
      PLAN_ONLY=true
      shift
      ;;
    --no-auto-approve)
      AUTO_APPROVE=false
      shift
      ;;
    --skip-init)
      SKIP_INIT=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--env dev|staging|prod] [--plan-only] [--no-auto-approve] [--skip-init]"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo "Creating ECR repository for messaging service in environment: $ENV"

# Get AWS information
echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
  echo "Failed to get AWS account ID. Make sure AWS CLI is configured and you have valid credentials."
  exit 1
fi

echo "Getting AWS region..."
REGION=$(aws configure get region)
if [ $? -ne 0 ]; then
  echo "Failed to get AWS region. Make sure AWS CLI is configured."
  exit 1
fi

echo "AWS Account: $ACCOUNT_ID, Region: $REGION"

# Get paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STACK_PATH="$REPO_ROOT/stacks/services/messaging-service"
ENV_FILE="$REPO_ROOT/environments/$ENV.tfvars"

echo "Repository root: $REPO_ROOT"
echo "Stack path: $STACK_PATH"
echo "Environment file: $ENV_FILE"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE"
  echo "Please create the environment file first."
  exit 1
fi

# Change to repository root
cd "$REPO_ROOT"

# Initialize Terraform if not skipped
if [ "$SKIP_INIT" = false ]; then
  echo "Running terraform init for messaging service ECR..."
  terraform -chdir="$STACK_PATH" init -upgrade
  if [ $? -ne 0 ]; then
    echo "Terraform init failed for messaging service ECR"
    exit 1
  fi
fi

# Run Terraform plan or apply
if [ "$PLAN_ONLY" = true ]; then
  echo "Running terraform plan for messaging service ECR..."
  terraform -chdir="$STACK_PATH" plan -var-file "$ENV_FILE" -target=aws_ecr_repository.messaging_service
else
  echo "Running terraform apply for messaging service ECR..."
  if [ "$AUTO_APPROVE" = true ]; then
    terraform -chdir="$STACK_PATH" apply -var-file "$ENV_FILE" -target=aws_ecr_repository.messaging_service -auto-approve
  else
    terraform -chdir="$STACK_PATH" apply -var-file "$ENV_FILE" -target=aws_ecr_repository.messaging_service
  fi
fi

if [ $? -ne 0 ]; then
  echo "Terraform deployment failed for messaging service ECR"
  exit 1
fi

echo "✅ Messaging service ECR repository creation completed successfully!"
echo ""
echo "Messaging Service ECR Repository Summary:"
echo "- Environment: $ENV"
echo "- Repository: goalsguild_messaging_service"
echo "- AWS Account: $ACCOUNT_ID"
echo "- AWS Region: $REGION"
echo "- ECR Repository created successfully"
