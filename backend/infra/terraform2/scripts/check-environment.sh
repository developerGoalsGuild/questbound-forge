#!/bin/bash

# Environment Check Script for GoalsGuild Backend Deployment
# This script verifies all prerequisites are installed and configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track check results
ERRORS=0
WARNINGS=0

# Function to print colored output
print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# Function to check if command exists
check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v "$cmd" &> /dev/null; then
        local version
        version=$($cmd --version 2>&1 | head -n 1)
        print_success "$name is installed: $version"
        return 0
    else
        print_error "$name is not installed"
        if [ -n "$install_hint" ]; then
            echo "  Install: $install_hint"
        fi
        return 1
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    print_info "Checking AWS credentials..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        return 1
    fi
    
    if aws sts get-caller-identity &> /dev/null; then
        local account_id
        local user_arn
        account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        user_arn=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
        print_success "AWS credentials are configured"
        echo "  Account ID: $account_id"
        echo "  User ARN: $user_arn"
        return 0
    else
        print_error "AWS credentials are not configured or invalid"
        echo "  Run: aws configure"
        return 1
    fi
}

# Function to check AWS region
check_aws_region() {
    print_info "Checking AWS region configuration..."
    
    local region
    region=$(aws configure get region 2>/dev/null || echo "")
    
    if [ -z "$region" ]; then
        # Check environment variables
        if [ -n "$AWS_REGION" ]; then
            region="$AWS_REGION"
        elif [ -n "$AWS_DEFAULT_REGION" ]; then
            region="$AWS_DEFAULT_REGION"
        fi
    fi
    
    if [ -n "$region" ]; then
        print_success "AWS region is set: $region"
        export AWS_REGION="$region"
        return 0
    else
        print_warning "AWS region is not configured"
        echo "  Set via: aws configure set region us-east-2"
        echo "  Or export: export AWS_REGION=us-east-2"
        return 1
    fi
}

# Function to check environment files
check_environment_files() {
    print_info "Checking environment configuration files..."
    
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local terraform_dir
    terraform_dir="$(cd "$script_dir/.." && pwd)"
    local env_dir="$terraform_dir/environments"
    
    local envs=("dev" "staging" "prod" "test" "local")
    local found=0
    
    for env in "${envs[@]}"; do
        local env_file="$env_dir/$env.tfvars"
        if [ -f "$env_file" ]; then
            print_success "Environment file found: $env.tfvars"
            found=$((found + 1))
        else
            print_warning "Environment file not found: $env.tfvars"
        fi
    done
    
    if [ $found -eq 0 ]; then
        print_error "No environment files found in $env_dir"
        return 1
    fi
    
    return 0
}

# Function to check Terraform configuration
check_terraform_config() {
    print_info "Checking Terraform configuration..."
    
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local terraform_dir
    terraform_dir="$(cd "$script_dir/.." && pwd)"
    
    # Check if stacks directory exists
    if [ ! -d "$terraform_dir/stacks" ]; then
        print_error "Terraform stacks directory not found: $terraform_dir/stacks"
        return 1
    fi
    
    print_success "Terraform stacks directory found"
    
    # Check for key stacks
    local required_stacks=("database" "security" "ecr" "authorizer" "s3" "appsync" "apigateway")
    for stack in "${required_stacks[@]}"; do
        if [ -d "$terraform_dir/stacks/$stack" ]; then
            print_success "Stack found: $stack"
        else
            print_warning "Stack not found: $stack"
        fi
    done
    
    return 0
}

# Function to check Docker (optional but recommended)
check_docker() {
    print_info "Checking Docker..."
    
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            local version
            version=$(docker --version 2>&1)
            print_success "Docker is installed and running: $version"
            return 0
        else
            print_warning "Docker is installed but not running"
            echo "  Start Docker Desktop or docker daemon"
            return 1
        fi
    else
        print_warning "Docker is not installed (required for service deployments)"
        echo "  Install: brew install --cask docker"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "GoalsGuild Environment Check"
    echo "=========================================="
    echo ""
    
    # Check required tools
    print_info "Checking required tools..."
    echo ""
    
    check_command "terraform" "Terraform" "brew install terraform"
    check_command "aws" "AWS CLI" "brew install awscli"
    check_command "python3" "Python 3" "brew install python@3.12"
    check_command "node" "Node.js" "brew install node"
    check_command "npm" "npm" "brew install node"
    check_command "docker" "Docker" "brew install --cask docker" || true
    
    echo ""
    
    # Check AWS configuration
    print_info "Checking AWS configuration..."
    echo ""
    
    check_aws_credentials
    check_aws_region
    
    echo ""
    
    # Check environment files
    check_environment_files
    
    echo ""
    
    # Check Terraform configuration
    check_terraform_config
    
    echo ""
    
    # Summary
    echo "=========================================="
    echo "Environment Check Summary"
    echo "=========================================="
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "All checks passed! Environment is ready for deployment."
        echo ""
        exit 0
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Environment check completed with warnings"
        echo "  Warnings: $WARNINGS"
        echo "  You may proceed, but some features may not work correctly."
        echo ""
        exit 0
    else
        print_error "Environment check failed"
        echo "  Errors: $ERRORS"
        echo "  Warnings: $WARNINGS"
        echo "  Please fix the errors before proceeding with deployment."
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"

