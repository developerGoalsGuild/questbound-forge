#!/bin/bash
# Script to set Stripe Price IDs in AWS SSM Parameter Store
# 
# Usage:
#   ./set-stripe-price-ids-ssm.sh
#   ./set-stripe-price-ids-ssm.sh --region us-east-1
#   ./set-stripe-price-ids-ssm.sh --price-id-initiate price_xxxxx --price-id-sage price_yyyyy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
AWS_REGION="${AWS_REGION:-us-east-2}"
SSM_PREFIX="/goalsguild/subscription-service"

# Parse command line arguments
PRICE_ID_INITIATE=""
PRICE_ID_JOURNEYMAN=""
PRICE_ID_SAGE=""
PRICE_ID_GUILDMASTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --price-id-initiate)
            PRICE_ID_INITIATE="$2"
            shift 2
            ;;
        --price-id-journeyman)
            PRICE_ID_JOURNEYMAN="$2"
            shift 2
            ;;
        --price-id-sage)
            PRICE_ID_SAGE="$2"
            shift 2
            ;;
        --price-id-guildmaster)
            PRICE_ID_GUILDMASTER="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --region REGION              AWS region (default: us-east-2)"
            echo "  --price-id-initiate ID        Set INITIATE price ID"
            echo "  --price-id-journeyman ID      Set JOURNEYMAN price ID"
            echo "  --price-id-sage ID            Set SAGE price ID"
            echo "  --price-id-guildmaster ID     Set GUILDMASTER price ID"
            echo "  --help, -h                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0  # Interactive mode"
            echo "  $0 --price-id-sage price_1Sr3wCIRfAuGCDH6YFqvlVNB"
            echo "  $0 --price-id-initiate price_xxx --price-id-journeyman price_yyy --price-id-sage price_zzz"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🔧 Stripe Price IDs SSM Configuration${NC}"
echo "=========================================="
echo ""
echo "This script will set Stripe Price IDs in AWS SSM Parameter Store."
echo "SSM Path: ${SSM_PREFIX}/STRIPE_PRICE_ID_*"
echo "Region: ${AWS_REGION} (use --region to change)"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "   Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "   Please run: aws configure"
    exit 1
fi

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " value
        value="${value:-$default_value}"
    else
        read -p "$prompt: " value
    fi
    
    echo "$value"
}

# Function to set SSM parameter
set_ssm_parameter() {
    local param_name="$1"
    local param_value="$2"
    local description="$3"
    
    if [ -z "$param_value" ]; then
        echo -e "${YELLOW}⏭️  Skipping ${param_name} (not provided)${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Setting ${param_name}...${NC}"
    
    if aws ssm put-parameter \
        --region "$AWS_REGION" \
        --name "${SSM_PREFIX}/${param_name}" \
        --value "$param_value" \
        --type "String" \
        --description "$description" \
        --overwrite &> /dev/null; then
        echo -e "${GREEN}✅ ${param_name} set successfully${NC}"
    else
        echo -e "${RED}❌ Failed to set ${param_name}${NC}"
        return 1
    fi
}

# Interactive mode if no price IDs provided
if [ -z "$PRICE_ID_INITIATE" ] && [ -z "$PRICE_ID_JOURNEYMAN" ] && [ -z "$PRICE_ID_SAGE" ] && [ -z "$PRICE_ID_GUILDMASTER" ]; then
    echo -e "${YELLOW}📝 Interactive Mode${NC}"
    echo "Enter Price IDs (press Enter to skip):"
    echo ""
    
    PRICE_ID_INITIATE=$(prompt_input "INITIATE Price ID (price_...)" "PRICE_ID_INITIATE" "")
    PRICE_ID_JOURNEYMAN=$(prompt_input "JOURNEYMAN Price ID (price_...)" "PRICE_ID_JOURNEYMAN" "")
    PRICE_ID_SAGE=$(prompt_input "SAGE Price ID (price_...)" "PRICE_ID_SAGE" "")
    PRICE_ID_GUILDMASTER=$(prompt_input "GUILDMASTER Price ID (price_...) [optional]" "PRICE_ID_GUILDMASTER" "")
    
    echo ""
fi

# Validate price IDs format
validate_price_id() {
    local price_id="$1"
    local tier="$2"
    
    if [ -z "$price_id" ]; then
        return 0  # Empty is OK (optional)
    fi
    
    if [[ ! "$price_id" =~ ^price_ ]]; then
        echo -e "${YELLOW}⚠️  Warning: ${tier} Price ID doesn't start with 'price_'${NC}"
        echo "   Make sure you're using the correct Price ID from Stripe Dashboard"
        read -p "   Continue anyway? (y/n) [y]: " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]] && [ -n "$confirm" ]; then
            return 1
        fi
    fi
    
    return 0
}

# Validate all price IDs
echo -e "${BLUE}🔍 Validating Price IDs...${NC}"
echo ""

if [ -n "$PRICE_ID_INITIATE" ]; then
    validate_price_id "$PRICE_ID_INITIATE" "INITIATE" || PRICE_ID_INITIATE=""
fi

if [ -n "$PRICE_ID_JOURNEYMAN" ]; then
    validate_price_id "$PRICE_ID_JOURNEYMAN" "JOURNEYMAN" || PRICE_ID_JOURNEYMAN=""
fi

if [ -n "$PRICE_ID_SAGE" ]; then
    validate_price_id "$PRICE_ID_SAGE" "SAGE" || PRICE_ID_SAGE=""
fi

if [ -n "$PRICE_ID_GUILDMASTER" ]; then
    validate_price_id "$PRICE_ID_GUILDMASTER" "GUILDMASTER" || PRICE_ID_GUILDMASTER=""
fi

# Check if at least one price ID is provided
if [ -z "$PRICE_ID_INITIATE" ] && [ -z "$PRICE_ID_JOURNEYMAN" ] && [ -z "$PRICE_ID_SAGE" ] && [ -z "$PRICE_ID_GUILDMASTER" ]; then
    echo -e "${RED}❌ No Price IDs provided${NC}"
    echo "   Please provide at least one Price ID"
    exit 1
fi

# Confirm before proceeding
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  Region: ${AWS_REGION}"
echo "  SSM Prefix: ${SSM_PREFIX}"
if [ -n "$PRICE_ID_INITIATE" ]; then
    echo "  INITIATE: ${PRICE_ID_INITIATE}"
fi
if [ -n "$PRICE_ID_JOURNEYMAN" ]; then
    echo "  JOURNEYMAN: ${PRICE_ID_JOURNEYMAN}"
fi
if [ -n "$PRICE_ID_SAGE" ]; then
    echo "  SAGE: ${PRICE_ID_SAGE}"
fi
if [ -n "$PRICE_ID_GUILDMASTER" ]; then
    echo "  GUILDMASTER: ${PRICE_ID_GUILDMASTER}"
fi
echo ""

read -p "Continue and set these parameters in SSM? (y/n) [y]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]] && [ -n "$confirm" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Setting parameters in SSM...${NC}"
echo ""

# Set parameters
ERRORS=0

set_ssm_parameter "STRIPE_PRICE_ID_INITIATE" "$PRICE_ID_INITIATE" "Stripe Price ID for INITIATE subscription tier" || ERRORS=$((ERRORS + 1))
set_ssm_parameter "STRIPE_PRICE_ID_JOURNEYMAN" "$PRICE_ID_JOURNEYMAN" "Stripe Price ID for JOURNEYMAN subscription tier" || ERRORS=$((ERRORS + 1))
set_ssm_parameter "STRIPE_PRICE_ID_SAGE" "$PRICE_ID_SAGE" "Stripe Price ID for SAGE subscription tier" || ERRORS=$((ERRORS + 1))
set_ssm_parameter "STRIPE_PRICE_ID_GUILDMASTER" "$PRICE_ID_GUILDMASTER" "Stripe Price ID for GUILDMASTER subscription tier" || ERRORS=$((ERRORS + 1))

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All Price IDs set successfully in SSM!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. The subscription service will automatically read from SSM"
    echo "  2. Restart the subscription service if it's running"
    echo "  3. Verify the service is reading from SSM (check logs)"
    echo ""
    echo "🔍 To verify parameters:"
    echo "  aws ssm get-parameter --name \"${SSM_PREFIX}/STRIPE_PRICE_ID_SAGE\" --region ${AWS_REGION}"
else
    echo -e "${RED}❌ Some parameters failed to set (${ERRORS} error(s))${NC}"
    exit 1
fi
