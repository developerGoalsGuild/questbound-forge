#!/bin/bash

# Master deployment script that deploys all services and infrastructure stacks
# This script orchestrates the complete deployment of the GoalsGuild application

set -e

# Default values
ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SKIP_INIT=""
SERVICES_ONLY=""
INFRASTRUCTURE_ONLY=""
SERVICES=()
STACKS=()
TF_LOG_PATH="$HOME/terraform-logs/tf-master-deploy.log"

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
    echo "GoalsGuild Master Deployment Script"
    echo "===================================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>      Environment to deploy (dev, staging, prod) [default: dev]"
    echo "  -p, --plan                   Only run terraform plan, don't apply changes"
    echo "  -n, --no-approve            Don't auto-approve terraform apply [default: auto-approve]"
    echo "  -s, --skip-init             Skip terraform init step"
    echo "  --services-only              Deploy only services, skip infrastructure"
    echo "  --infrastructure-only        Deploy only infrastructure, skip services"
    echo "  --service <name>             Deploy specific service (can be used multiple times)"
    echo "  --stack <name>               Deploy specific stack (can be used multiple times)"
    echo "  -l, --log-path <path>        Custom path for terraform log file"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev"
    echo "  $0 -e prod -p"
    echo "  $0 -e staging --services-only"
    echo "  $0 -e dev --service user-service --service quest-service"
    echo ""
}

# Function to write log
write_log() {
    local message=$1
    local level=${2:-INFO}
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[$timestamp] [$level] [master-deploy] $message"
    
    echo "$log_entry"
    if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
        echo "$log_entry" >> "$LOG_FILE"
    fi
}

# Parse command line arguments
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
        --services-only)
            SERVICES_ONLY="true"
            shift
            ;;
        --infrastructure-only)
            INFRASTRUCTURE_ONLY="true"
            shift
            ;;
        --service)
            SERVICES+=("$2")
            shift 2
            ;;
        --stack)
            STACKS+=("$2")
            shift 2
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
REPO_ROOT="$(cd "$TERRAFORM_DIR/../../.." && pwd)"
STACKS_ROOT="$TERRAFORM_DIR/stacks"
ENV_FILE="$TERRAFORM_DIR/environments/$ENV.tfvars"

# Setup logging
LOG_DIR="$(dirname "$TF_LOG_PATH")"
LOG_FILE="$LOG_DIR/tf-master-deploy.log"
mkdir -p "$LOG_DIR"

if [ -f "$TF_LOG_PATH" ]; then
    > "$TF_LOG_PATH"
else
    touch "$TF_LOG_PATH"
fi

export TF_LOG=DEBUG
export TF_LOG_PATH="$TF_LOG_PATH"

write_log "TF_LOG=DEBUG, TF_LOG_PATH=$TF_LOG_PATH"

# Validate environment file
if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file not found: $ENV_FILE"
    print_warning "Will use default variables or environment-specific defaults"
else
    print_info "Using environment file: $ENV_FILE"
fi

# Define all services that can be deployed
declare -A ALL_SERVICES
ALL_SERVICES[user-service]="deploy-user-service-with-build.sh|goalsguild_user_service"
ALL_SERVICES[quest-service]="deploy-quest-service-with-build.sh|goalsguild_quest_service"
ALL_SERVICES[subscription-service]="deploy-subscription-service-with-build.sh|goalsguild_subscription_service"
ALL_SERVICES[collaboration-service]="deploy-collaboration-service-with-build.sh|goalsguild_collaboration_service"
ALL_SERVICES[guild-service]="deploy-guild-service-with-build.sh|goalsguild_guild_service"
ALL_SERVICES[messaging-service]="deploy-messaging-service-with-build.sh|goalsguild_messaging_service"
ALL_SERVICES[gamification-service]="deploy-gamification-service-with-build.sh|goalsguild_gamification_service"

# Define infrastructure stacks in deployment order
ALL_STACKS=("database" "security" "ecr" "authorizer" "s3" "appsync" "apigateway")

# Filter services if specified
if [ ${#SERVICES[@]} -gt 0 ]; then
    SERVICES_TO_DEPLOY=()
    for service in "${SERVICES[@]}"; do
        if [[ -v ALL_SERVICES[$service] ]]; then
            SERVICES_TO_DEPLOY+=("$service")
        else
            print_warning "Unknown service: $service. Skipping."
        fi
    done
else
    SERVICES_TO_DEPLOY=("${!ALL_SERVICES[@]}")
fi

# Filter stacks if specified
if [ ${#STACKS[@]} -gt 0 ]; then
    STACKS_TO_DEPLOY=()
    for stack in "${STACKS[@]}"; do
        if [[ " ${ALL_STACKS[@]} " =~ " ${stack} " ]]; then
            STACKS_TO_DEPLOY+=("$stack")
        else
            print_warning "Unknown stack: $stack. Skipping."
        fi
    done
else
    STACKS_TO_DEPLOY=("${ALL_STACKS[@]}")
fi

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_info=${ALL_SERVICES[$service_name]}
    local script_name=$(echo "$service_info" | cut -d'|' -f1)
    local ecr_name=$(echo "$service_info" | cut -d'|' -f2)
    
    write_log "Starting deployment for service: $service_name" "INFO"
    echo ""
    echo "=== Service: $service_name ==="
    
    # Check if service has a deployment script in the scripts directory
    local service_script="$SCRIPT_DIR/$script_name"
    
    if [ ! -f "$service_script" ]; then
        # Check if service has its own deploy script
        local service_deploy_script="$REPO_ROOT/backend/services/$service_name/deploy-$service_name-with-build.sh"
        if [ -f "$service_deploy_script" ]; then
            service_script="$service_deploy_script"
            write_log "Found service script at: $service_script" "INFO"
        else
            # Try alternative path
            local alt_service_deploy_script="$REPO_ROOT/services/$service_name/deploy-$service_name-with-build.sh"
            if [ -f "$alt_service_deploy_script" ]; then
                service_script="$alt_service_deploy_script"
                write_log "Found service script at: $service_script" "INFO"
            else
                write_log "Deployment script not found for $service_name" "WARN"
                write_log "  Tried: $SCRIPT_DIR/$script_name" "WARN"
                write_log "  Tried: $service_deploy_script" "WARN"
                write_log "  Tried: $alt_service_deploy_script" "WARN"
                write_log "Skipping service: $service_name" "WARN"
                return 1
            fi
        fi
    fi
    
    # Make script executable
    chmod +x "$service_script"
    
    # Build command
    local cmd="$service_script"
    cmd="$cmd -e $ENV"
    [ -n "$PLAN_ONLY" ] && cmd="$cmd -p"
    [ "$AUTO_APPROVE" = "false" ] && cmd="$cmd -n"
    [ -n "$SKIP_INIT" ] && cmd="$cmd -s"
    [ -n "$TF_LOG_PATH" ] && cmd="$cmd -l $TF_LOG_PATH"
    
    if eval "$cmd"; then
        write_log "Successfully deployed service: $service_name" "INFO"
        return 0
    else
        local exit_code=$?
        write_log "Error deploying service $service_name: exit code $exit_code" "ERROR"
        return 1
    fi
}

# Function to deploy an infrastructure stack
deploy_stack() {
    local stack_name=$1
    local stack_path="$STACKS_ROOT/$stack_name"
    
    write_log "Starting deployment for stack: $stack_name" "INFO"
    echo ""
    echo "=== Stack: $stack_name ==="
    
    if [ ! -d "$stack_path" ]; then
        write_log "Stack path not found: $stack_path" "WARN"
        write_log "Skipping stack: $stack_name" "WARN"
        return 1
    fi
    
    (
        cd "$stack_path"
        
        if [ -z "$SKIP_INIT" ]; then
            write_log "Running terraform init for $stack_name" "INFO"
            if ! terraform init -upgrade; then
                write_log "Terraform init failed for $stack_name" "ERROR"
                return 1
            fi
        fi
        
        if [ -n "$PLAN_ONLY" ]; then
            write_log "Running terraform plan for $stack_name" "INFO"
            if [ -f "$ENV_FILE" ]; then
                terraform plan -var-file="$ENV_FILE"
            else
                terraform plan
            fi
        else
            if [ "$AUTO_APPROVE" = "true" ]; then
                write_log "Running terraform apply with auto-approve for $stack_name" "INFO"
                if [ -f "$ENV_FILE" ]; then
                    terraform apply -var-file="$ENV_FILE" -auto-approve
                else
                    terraform apply -auto-approve
                fi
            else
                write_log "Running terraform apply for $stack_name" "INFO"
                if [ -f "$ENV_FILE" ]; then
                    terraform apply -var-file="$ENV_FILE"
                else
                    terraform apply
                fi
            fi
        fi
        
        if [ $? -ne 0 ]; then
            write_log "Terraform deployment failed for $stack_name" "ERROR"
            return 1
        fi
        
        write_log "Successfully deployed stack: $stack_name" "INFO"
        return 0
    )
}

# Main execution
main() {
    write_log "Starting master deployment for environment: $ENV" "INFO"
    echo ""
    echo "============================================================"
    echo "GoalsGuild Master Deployment"
    echo "Environment: $ENV"
    echo "============================================================"
    echo ""
    
    declare -A deployment_results_services
    declare -A deployment_results_stacks
    
    # Phase 1: Deploy Infrastructure Stacks (if not services-only)
    if [ -z "$SERVICES_ONLY" ]; then
        echo ""
        echo "============================================================"
        echo "PHASE 1: Infrastructure Stacks"
        echo "============================================================"
        
        for stack_name in "${STACKS_TO_DEPLOY[@]}"; do
            if deploy_stack "$stack_name"; then
                deployment_results_stacks[$stack_name]=1
            else
                deployment_results_stacks[$stack_name]=0
                if [ -z "$PLAN_ONLY" ]; then
                    print_warning "Stack deployment failed: $stack_name"
                    print_warning "Continuing with remaining deployments..."
                else
                    exit 1
                fi
            fi
        done
    else
        write_log "Skipping infrastructure stacks (ServicesOnly mode)" "INFO"
    fi
    
    # Phase 2: Deploy Services (if not infrastructure-only)
    if [ -z "$INFRASTRUCTURE_ONLY" ]; then
        echo ""
        echo "============================================================"
        echo "PHASE 2: Services"
        echo "============================================================"
        
        for service_name in "${SERVICES_TO_DEPLOY[@]}"; do
            if deploy_service "$service_name"; then
                deployment_results_services[$service_name]=1
            else
                deployment_results_services[$service_name]=0
                if [ -z "$PLAN_ONLY" ]; then
                    print_warning "Service deployment failed: $service_name"
                    print_warning "Continuing with remaining deployments..."
                else
                    exit 1
                fi
            fi
        done
    else
        write_log "Skipping services (InfrastructureOnly mode)" "INFO"
    fi
    
    # Summary
    echo ""
    echo "============================================================"
    echo "DEPLOYMENT SUMMARY"
    echo "============================================================"
    echo ""
    
    if [ -z "$SERVICES_ONLY" ]; then
        echo "Infrastructure Stacks:"
        for stack_name in "${STACKS_TO_DEPLOY[@]}"; do
            if [ "${deployment_results_stacks[$stack_name]}" = "1" ]; then
                echo "  $stack_name : ✅ SUCCESS"
            else
                echo "  $stack_name : ❌ FAILED"
            fi
        done
        echo ""
    fi
    
    if [ -z "$INFRASTRUCTURE_ONLY" ]; then
        echo "Services:"
        for service_name in "${SERVICES_TO_DEPLOY[@]}"; do
            if [ "${deployment_results_services[$service_name]}" = "1" ]; then
                echo "  $service_name : ✅ SUCCESS"
            else
                echo "  $service_name : ❌ FAILED"
            fi
        done
        echo ""
    fi
    
    # Check if all deployments succeeded
    local all_stacks_succeeded=true
    if [ -z "$SERVICES_ONLY" ]; then
        for stack_name in "${STACKS_TO_DEPLOY[@]}"; do
            if [ "${deployment_results_stacks[$stack_name]}" != "1" ]; then
                all_stacks_succeeded=false
                break
            fi
        done
    fi
    
    local all_services_succeeded=true
    if [ -z "$INFRASTRUCTURE_ONLY" ]; then
        for service_name in "${SERVICES_TO_DEPLOY[@]}"; do
            if [ "${deployment_results_services[$service_name]}" != "1" ]; then
                all_services_succeeded=false
                break
            fi
        done
    fi
    
    if [ "$all_stacks_succeeded" = "true" ] && [ "$all_services_succeeded" = "true" ]; then
        write_log "All deployments completed successfully!" "INFO"
        print_success "All deployments completed successfully!"
        exit 0
    else
        write_log "Some deployments failed. Check the summary above." "WARN"
        print_warning "Some deployments failed. Check the summary above."
        exit 1
    fi
}

# Run main function
main "$@"

