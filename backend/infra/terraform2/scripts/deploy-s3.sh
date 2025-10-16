#!/bin/bash

# Shell script for deploying S3 stack
# This provides a Unix/Linux interface for S3 stack deployment

set -e

# Default values
ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SKIP_INIT=""
LOG_PATH=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo ""
    echo "S3 Stack Deployment Script"
    echo "========================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>    Environment to deploy (dev, staging, prod, local, test)"
    echo "  -p, --plan                 Only run terraform plan, don't apply changes"
    echo "  -n, --no-approve          Don't auto-approve terraform apply"
    echo "  -s, --skip-init           Skip terraform init step"
    echo "  -l, --log-path <path>     Custom path for terraform log file"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev"
    echo "  $0 -e prod -p"
    echo "  $0 -e staging -n"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if terraform is available
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed or not in PATH"
        exit 1
    fi
    
    # Check if aws cli is available
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured properly"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment file
validate_environment_file() {
    local env_file="environments/${ENV}.tfvars"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    print_info "Using environment file: $env_file"
}

# Function to deploy S3 stack
deploy_s3_stack() {
    local s3_stack_path="stacks/s3"
    
    if [ ! -d "$s3_stack_path" ]; then
        print_error "S3 stack directory not found: $s3_stack_path"
        exit 1
    fi
    
    print_info "Starting S3 stack deployment for environment: $ENV"
    echo ""
    echo "=== S3 Stack Deployment (env: $ENV) ==="
    
    cd "$s3_stack_path"
    
    # Initialize terraform if not skipped
    if [ -z "$SKIP_INIT" ]; then
        print_info "Running terraform init for S3 stack"
        terraform init -upgrade
    fi
    
    # Build terraform command
    local tf_cmd="terraform"
    
    if [ -n "$PLAN_ONLY" ]; then
        tf_cmd="$tf_cmd plan"
    else
        tf_cmd="$tf_cmd apply"
        if [ "$AUTO_APPROVE" = "true" ]; then
            tf_cmd="$tf_cmd -auto-approve"
        fi
    fi
    
    # Add environment file
    tf_cmd="$tf_cmd -var-file=\"../../environments/${ENV}.tfvars\""
    
    # Execute terraform command
    print_info "Executing: $tf_cmd"
    eval $tf_cmd
    
    if [ $? -eq 0 ]; then
        print_success "S3 stack deployment completed successfully"
        
        # Display outputs
        print_info "Retrieving S3 stack outputs"
        echo ""
        echo "=== S3 Stack Outputs ==="
        terraform output
    else
        print_error "S3 stack deployment failed"
        exit 1
    fi
}

# Parse command line arguments
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
            LOG_PATH="$2"
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

# Main execution
main() {
    echo ""
    echo "S3 Stack Deployment Script"
    echo "========================="
    echo "Environment: $ENV"
    echo "Plan Only: $PLAN_ONLY"
    echo "Auto Approve: $AUTO_APPROVE"
    echo "Skip Init: $SKIP_INIT"
    echo "Log Path: $LOG_PATH"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Validate environment file
    validate_environment_file
    
    # Deploy S3 stack
    deploy_s3_stack
    
    print_success "S3 stack deployment process completed successfully"
    echo ""
    echo "🎉 S3 stack deployment completed successfully!"
}

# Run main function
main "$@"

