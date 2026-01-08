#!/bin/bash

# Authorizer stack deployment script

set -e

# Default values
ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SKIP_INIT=""
TF_LOG_PATH="$HOME/terraform-logs/tf-authorizer.log"

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
STACK_PATH="$TERRAFORM_DIR/stacks/authorizer"
ENV_FILE="$TERRAFORM_DIR/environments/$ENV.tfvars"

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

print_info "Starting authorizer stack deployment for environment: $ENV"
print_info "Stack path: $STACK_PATH"
print_info "Environment file: $ENV_FILE"

if [ ! -d "$STACK_PATH" ]; then
    print_error "Stack path not found: $STACK_PATH"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

(
    cd "$STACK_PATH"
    
    if [ -z "$SKIP_INIT" ]; then
        print_info "Running terraform init"
        terraform init -upgrade
    fi
    
    if [ -n "$PLAN_ONLY" ]; then
        print_info "Running terraform plan"
        terraform plan -var-file="$ENV_FILE"
    else
        if [ "$AUTO_APPROVE" = "true" ]; then
            print_info "Running terraform apply with auto-approve"
            terraform apply -var-file="$ENV_FILE" -auto-approve
        else
            print_info "Running terraform apply"
            terraform apply -var-file="$ENV_FILE"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Authorizer stack deployment completed"
    else
        print_error "Authorizer stack deployment failed"
        exit 1
    fi
)

