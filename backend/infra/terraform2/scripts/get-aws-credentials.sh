#!/bin/bash

# AWS Credentials Helper Script
# This script helps you check, configure, and verify AWS credentials

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if command -v aws &> /dev/null; then
        local version
        version=$(aws --version 2>&1)
        print_success "AWS CLI is installed: $version"
        return 0
    else
        print_error "AWS CLI is not installed"
        echo ""
        echo "Install AWS CLI:"
        echo "  brew install awscli"
        echo "  or"
        echo "  pip3 install awscli"
        return 1
    fi
}

# Function to check credentials file
check_credentials_file() {
    local creds_file="$HOME/.aws/credentials"
    local config_file="$HOME/.aws/config"
    
    echo ""
    print_header "=== Checking AWS Credentials Files ==="
    
    if [ -f "$creds_file" ]; then
        print_success "Credentials file exists: $creds_file"
        
        # Count profiles
        local profile_count
        profile_count=$(grep -c "^\[" "$creds_file" 2>/dev/null || echo "0")
        echo "  Profiles found: $profile_count"
        
        # List profiles (without showing secrets)
        if [ "$profile_count" -gt 0 ]; then
            echo ""
            echo "  Available profiles:"
            grep "^\[" "$creds_file" | sed 's/\[\(.*\)\]/    - \1/' || true
        fi
    else
        print_warning "Credentials file not found: $creds_file"
    fi
    
    if [ -f "$config_file" ]; then
        print_success "Config file exists: $config_file"
        
        # Show region if set
        local region
        region=$(grep "^region" "$config_file" 2>/dev/null | head -1 | awk '{print $3}' || echo "")
        if [ -n "$region" ]; then
            echo "  Default region: $region"
        fi
    else
        print_warning "Config file not found: $config_file"
    fi
}

# Function to check environment variables
check_env_variables() {
    echo ""
    print_header "=== Checking Environment Variables ==="
    
    local found=0
    
    if [ -n "$AWS_ACCESS_KEY_ID" ]; then
        print_success "AWS_ACCESS_KEY_ID is set"
        echo "  Value: ${AWS_ACCESS_KEY_ID:0:8}...${AWS_ACCESS_KEY_ID: -4}"
        found=1
    else
        print_warning "AWS_ACCESS_KEY_ID is not set"
    fi
    
    if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        print_success "AWS_SECRET_ACCESS_KEY is set"
        echo "  Value: ${AWS_SECRET_ACCESS_KEY:0:8}...${AWS_SECRET_ACCESS_KEY: -4}"
        found=1
    else
        print_warning "AWS_SECRET_ACCESS_KEY is not set"
    fi
    
    if [ -n "$AWS_SESSION_TOKEN" ]; then
        print_success "AWS_SESSION_TOKEN is set (temporary credentials)"
        found=1
    fi
    
    if [ -n "$AWS_REGION" ]; then
        print_success "AWS_REGION is set: $AWS_REGION"
    elif [ -n "$AWS_DEFAULT_REGION" ]; then
        print_success "AWS_DEFAULT_REGION is set: $AWS_DEFAULT_REGION"
    else
        print_warning "AWS region not set in environment"
    fi
    
    if [ $found -eq 0 ]; then
        print_info "No AWS credentials found in environment variables"
        print_info "Checking AWS credentials file instead..."
    fi
}

# Function to check if using SSO
check_sso_config() {
    local profile="${1:-default}"
    local config_file="$HOME/.aws/config"
    
    if [ ! -f "$config_file" ]; then
        return 1
    fi
    
    # Check if profile has SSO configuration
    if grep -A 10 "\[profile $profile\]" "$config_file" 2>/dev/null | grep -q "sso_start_url"; then
        return 0
    elif [ "$profile" = "default" ] && grep -q "sso_start_url" "$config_file" 2>/dev/null; then
        return 0
    fi
    
    return 1
}

# Function to get SSO profile name
get_sso_profile() {
    local config_file="$HOME/.aws/config"
    
    if [ ! -f "$config_file" ]; then
        return 1
    fi
    
    # Try to find SSO profile
    local profile
    profile=$(grep -B 2 "sso_start_url" "$config_file" 2>/dev/null | grep "\[profile" | head -1 | sed 's/\[profile \(.*\)\]/\1/' | tr -d ' ')
    
    if [ -n "$profile" ]; then
        echo "$profile"
        return 0
    fi
    
    # Check default profile
    if grep -A 10 "^\[default\]" "$config_file" 2>/dev/null | grep -q "sso_start_url"; then
        echo "default"
        return 0
    fi
    
    return 1
}

# Function to renew SSO token
renew_sso_token() {
    local profile="${1:-default}"
    
    print_info "Attempting to renew AWS SSO token for profile: $profile"
    
    if [ "$profile" = "default" ]; then
        if aws sso login 2>/dev/null; then
            print_success "SSO token renewed successfully"
            return 0
        else
            print_error "Failed to renew SSO token"
            return 1
        fi
    else
        if aws sso login --profile "$profile" 2>/dev/null; then
            print_success "SSO token renewed successfully for profile: $profile"
            return 0
        else
            print_error "Failed to renew SSO token for profile: $profile"
            return 1
        fi
    fi
}

# Function to check and renew expired credentials
check_and_renew_credentials() {
    local profile="${1:-default}"
    local error_output
    local aws_cmd
    
    # Build AWS command with or without profile
    if [ "$profile" = "default" ]; then
        aws_cmd="aws sts get-caller-identity"
    else
        aws_cmd="aws sts get-caller-identity --profile $profile"
    fi
    
    # Test credentials
    error_output=$(eval "$aws_cmd" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        return 0  # Credentials are valid
    fi
    
    # Check for expired token errors
    if echo "$error_output" | grep -qiE "(expired|ExpiredToken|TokenRefreshRequired|The SSO session associated with this profile has expired|Your session has expired|token.*expired|sso.*expired)"; then
        print_warning "AWS credentials appear to be expired"
        
        # Check if using SSO
        if check_sso_config "$profile"; then
            print_info "Detected SSO configuration, attempting to renew token..."
            if renew_sso_token "$profile"; then
                # Test again after renewal
                sleep 2  # Give it a moment to propagate
                if eval "$aws_cmd" &>/dev/null; then
                    print_success "Credentials renewed and validated successfully"
                    return 0
                fi
            fi
        else
            # Check if it's a session token issue
            if [ -n "$AWS_SESSION_TOKEN" ]; then
                print_warning "Session token expired. You may need to:"
                echo "  - Re-run 'aws configure sso' if using SSO"
                echo "  - Re-assume the role if using assume-role"
                echo "  - Get new temporary credentials"
            fi
        fi
    fi
    
    return 1
}

# Function to test AWS credentials
test_credentials() {
    local profile="${1:-default}"
    local auto_renew="${2:-true}"
    
    echo ""
    print_header "=== Testing AWS Credentials ==="
    
    # Check and renew if expired
    if [ "$auto_renew" = "true" ]; then
        if ! check_and_renew_credentials "$profile"; then
            # If renewal failed or not applicable, test directly
            if ! aws sts get-caller-identity --profile "$profile" &>/dev/null; then
                print_error "AWS credentials are invalid or not configured"
                echo ""
                echo "Error details:"
                aws sts get-caller-identity --profile "$profile" 2>&1 | sed 's/^/  /' || true
                return 1
            fi
        fi
    fi
    
    # Build AWS command with or without profile
    local aws_cmd
    if [ "$profile" = "default" ]; then
        aws_cmd="aws sts get-caller-identity"
    else
        aws_cmd="aws sts get-caller-identity --profile $profile"
    fi
    
    # Test credentials
    if eval "$aws_cmd" &>/dev/null; then
        print_success "AWS credentials are valid!"
        echo ""
        
        local account_id
        local user_arn
        local user_id
        
        if [ "$profile" = "default" ]; then
            account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
            user_arn=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
            user_id=$(aws sts get-caller-identity --query UserId --output text 2>/dev/null)
            region=$(aws configure get region 2>/dev/null || echo "${AWS_REGION:-${AWS_DEFAULT_REGION:-not set}}")
        else
            account_id=$(aws sts get-caller-identity --profile "$profile" --query Account --output text 2>/dev/null)
            user_arn=$(aws sts get-caller-identity --profile "$profile" --query Arn --output text 2>/dev/null)
            user_id=$(aws sts get-caller-identity --profile "$profile" --query UserId --output text 2>/dev/null)
            region=$(aws configure get region --profile "$profile" 2>/dev/null || echo "${AWS_REGION:-${AWS_DEFAULT_REGION:-not set}}")
        fi
        
        echo "  Account ID: $account_id"
        echo "  User ARN: $user_arn"
        echo "  User ID: $user_id"
        echo "  Region: $region"
        
        return 0
    else
        print_error "AWS credentials are invalid or not configured"
        echo ""
        echo "Error details:"
        eval "$aws_cmd" 2>&1 | sed 's/^/  /' || true
        return 1
    fi
}

# Function to show current configuration
show_configuration() {
    echo ""
    print_header "=== Current AWS Configuration ==="
    
    if command -v aws &> /dev/null; then
        echo ""
        echo "Default profile configuration:"
        aws configure list 2>/dev/null || print_warning "Could not retrieve configuration"
        
        echo ""
        echo "All configured profiles:"
        if [ -f "$HOME/.aws/credentials" ]; then
            grep "^\[" "$HOME/.aws/credentials" | sed 's/\[\(.*\)\]/  - \1/' || echo "  (none)"
        else
            echo "  (no credentials file)"
        fi
    fi
}

# Function to provide setup instructions
show_setup_instructions() {
    echo ""
    print_header "=== AWS Credentials Setup Instructions ==="
    echo ""
    echo "Option 1: Interactive Setup (Recommended)"
    echo "  Run: aws configure"
    echo ""
    echo "  You'll be prompted for:"
    echo "    - AWS Access Key ID"
    echo "    - AWS Secret Access Key"
    echo "    - Default region (e.g., us-east-2)"
    echo "    - Default output format (json)"
    echo ""
    echo "Option 2: Manual Configuration"
    echo "  1. Create credentials file:"
    echo "     mkdir -p ~/.aws"
    echo "     nano ~/.aws/credentials"
    echo ""
    echo "  2. Add your credentials:"
    echo "     [default]"
    echo "     aws_access_key_id = YOUR_ACCESS_KEY_ID"
    echo "     aws_secret_access_key = YOUR_SECRET_ACCESS_KEY"
    echo ""
    echo "  3. Create config file:"
    echo "     nano ~/.aws/config"
    echo ""
    echo "  4. Add configuration:"
    echo "     [default]"
    echo "     region = us-east-2"
    echo "     output = json"
    echo ""
    echo "Option 3: Environment Variables"
    echo "  export AWS_ACCESS_KEY_ID='your-access-key'"
    echo "  export AWS_SECRET_ACCESS_KEY='your-secret-key'"
    echo "  export AWS_REGION='us-east-2'"
    echo ""
    echo "  Add to ~/.zshrc or ~/.bash_profile for persistence"
    echo ""
    echo "Option 4: Using AWS SSO or IAM Roles"
    echo "  For SSO: aws configure sso"
    echo "  For IAM Roles: Use instance profiles or assume role"
    echo ""
    echo "Renewing Expired SSO Tokens:"
    echo "  This script automatically detects and renews expired SSO tokens"
    echo "  Manual renewal: $0 --renew"
    echo "  Or: aws sso login"
    echo ""
    echo "Getting AWS Credentials:"
    echo "  1. Log in to AWS Console: https://console.aws.amazon.com"
    echo "  2. Go to IAM > Users > Your User > Security Credentials"
    echo "  3. Create Access Key if you don't have one"
    echo "  4. Download or copy the Access Key ID and Secret Access Key"
    echo ""
    echo "⚠️  Security Note:"
    echo "  - Never commit credentials to git"
    echo "  - Use IAM roles when possible (EC2, ECS, Lambda)"
    echo "  - Rotate credentials regularly"
    echo "  - Use least privilege principle"
}

# Function to help configure credentials interactively
interactive_configure() {
    echo ""
    print_header "=== Interactive AWS Configuration ==="
    echo ""
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        echo "  brew install awscli"
        return 1
    fi
    
    echo "This will run 'aws configure' interactively."
    echo "Press Ctrl+C to cancel, or Enter to continue..."
    read -r
    
    aws configure
}

# Main function
main() {
    echo ""
    echo "=========================================="
    echo "AWS Credentials Helper"
    echo "=========================================="
    echo ""
    
    # Check if AWS CLI is installed
    if ! check_aws_cli; then
        echo ""
        exit 1
    fi
    
    # Parse command line arguments
    local show_instructions=false
    local interactive=false
    local test_only=false
    local renew_only=false
    local profile="default"
    local no_auto_renew=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup|--instructions)
                show_instructions=true
                shift
                ;;
            --configure|--interactive)
                interactive=true
                shift
                ;;
            --test)
                test_only=true
                shift
                ;;
            --renew|--refresh)
                renew_only=true
                shift
                ;;
            --profile)
                profile="$2"
                shift 2
                ;;
            --no-auto-renew)
                no_auto_renew=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --setup, --instructions    Show setup instructions"
                echo "  --configure, --interactive  Run interactive aws configure"
                echo "  --test                     Only test credentials (skip checks)"
                echo "  --renew, --refresh         Renew expired SSO tokens"
                echo "  --profile <name>           Use specific AWS profile (default: default)"
                echo "  --no-auto-renew            Don't automatically renew expired tokens"
                echo "  -h, --help                 Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use -h or --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # If renew only mode
    if [ "$renew_only" = true ]; then
        if check_sso_config "$profile"; then
            if renew_sso_token "$profile"; then
                echo ""
                test_credentials "$profile" false
                exit $?
            else
                print_error "Failed to renew SSO token"
                exit 1
            fi
        else
            print_warning "No SSO configuration found for profile: $profile"
            print_info "SSO token renewal is only available for SSO-configured profiles"
            exit 1
        fi
    fi
    
    # If interactive mode, run configure and exit
    if [ "$interactive" = true ]; then
        interactive_configure
        echo ""
        test_credentials "$profile" "$([ "$no_auto_renew" = true ] && echo false || echo true)"
        exit $?
    fi
    
    # If test only, just test and exit
    if [ "$test_only" = true ]; then
        test_credentials "$profile" "$([ "$no_auto_renew" = true ] && echo false || echo true)"
        exit $?
    fi
    
    # Run all checks
    check_credentials_file
    check_env_variables
    show_configuration
    
    # Test credentials (with auto-renew if enabled)
    local credentials_valid=false
    local auto_renew_flag=true
    if [ "$no_auto_renew" = true ]; then
        auto_renew_flag=false
    fi
    
    if test_credentials "$profile" "$auto_renew_flag"; then
        credentials_valid=true
    fi
    
    # Show instructions if credentials are invalid or if requested
    if [ "$credentials_valid" = false ] || [ "$show_instructions" = true ]; then
        show_setup_instructions
    fi
    
    echo ""
    echo "=========================================="
    if [ "$credentials_valid" = true ]; then
        print_success "AWS credentials are configured and valid!"
        echo ""
        exit 0
    else
        print_error "AWS credentials need to be configured"
        echo ""
        echo "Run with --configure to set up interactively:"
        echo "  $0 --configure"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"

