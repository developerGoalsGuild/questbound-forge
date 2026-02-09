#!/usr/bin/env bash
# Deploy all Terraform stacks except WAF (frontend is deployed with enable_private_access=false).
# Run from repo root. Prerequisite: aws sso login; run backend-config/tf-init-all-stacks.sh first (or use -s to skip init).
#
# Usage:
#   ./scripts/deployment/deploy-all-except-waf.sh [ -e dev|staging|prod ] [ -p ] [ -n ] [ -s ]
#   -e, --env       Environment (default: dev)
#   -p, --plan      Plan only, do not apply
#   -n, --no-approve  Do not auto-approve apply
#   -s, --skip-init  Skip terraform init (use if already inited)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="-auto-approve"
SKIP_INIT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)
      ENV="$2"
      shift 2
      ;;
    -p|--plan)
      PLAN_ONLY="1"
      shift
      ;;
    -n|--no-approve)
      AUTO_APPROVE=""
      shift
      ;;
    -s|--skip-init)
      SKIP_INIT="1"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Invalid environment: $ENV" >&2
  exit 1
fi

BACKEND_ENV="$REPO_ROOT/backend/infra/terraform2/environments/$ENV.tfvars"
FRONTEND_ENV="$REPO_ROOT/apps/frontend/terraform/environments/$ENV.tfvars"
LANDING_ENV="$REPO_ROOT/apps/landing-page/terraform/environments/$ENV.tfvars"

# Export AWS credentials so every Terraform run (including remote state) uses them.
# Stacks that use data.terraform_remote_state otherwise use the default profile and
# can fail with "profile default is configured to use SSO but is missing sso_region, sso_start_url".
if command -v aws &>/dev/null; then
  eval $(aws configure export-credentials --format env 2>/dev/null) || true
  if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    unset AWS_PROFILE
  fi
fi

# Log to file and stdout
LOG_DIR="${REPO_ROOT}/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/deploy-all-except-waf-${ENV}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee "$LOG_FILE") 2>&1
echo "Logging to: $LOG_FILE"
echo ""

run_init() {
  local dir="$1"
  if [ -z "$SKIP_INIT" ]; then
    bash backend-config/tf-init-s3.sh "$dir" || true
  fi
}

run_apply() {
  local dir="$1"
  shift
  (
    cd "$dir"
    if [ -n "$PLAN_ONLY" ]; then
      terraform plan "$@"
    else
      terraform apply $AUTO_APPROVE "$@"
    fi
  ) || return 1
}

echo "=============================================="
echo "Deploy all stacks (except WAF) - env: $ENV"
echo "=============================================="

# Backend infra stacks that do not depend on service state (order matters)
for stack in database security s3 ses ecr authorizer; do
  dir="backend/infra/terraform2/stacks/$stack"
  echo "=== $stack ==="
  run_init "$dir"
  if [ -f "$BACKEND_ENV" ]; then
    run_apply "$dir" -var-file="$BACKEND_ENV" || true
  else
    run_apply "$dir" || true
  fi
  echo ""
done

# Backend services (must run before appsync and apigateway so their remote state exists in S3)
for svc in user-service quest-service guild-service gamification-service collaboration-service subscription-service messaging-service; do
  dir="backend/infra/terraform2/stacks/services/$svc"
  echo "=== $svc ==="
  run_init "$dir"
  if [ -f "$BACKEND_ENV" ]; then
    run_apply "$dir" -var-file="$BACKEND_ENV" || true
  else
    run_apply "$dir" || true
  fi
  echo ""
done

# Stacks that read service remote state from S3 (appsync, apigateway) and CI (github-actions-oidc)
for stack in appsync apigateway github-actions-oidc; do
  dir="backend/infra/terraform2/stacks/$stack"
  echo "=== $stack ==="
  run_init "$dir"
  if [ -f "$BACKEND_ENV" ]; then
    run_apply "$dir" -var-file="$BACKEND_ENV" || true
  else
    run_apply "$dir" || true
  fi
  echo ""
done

# Landing page
echo "=== landing-page ==="
run_init "apps/landing-page/terraform"
if [ -f "$LANDING_ENV" ]; then
  run_apply "apps/landing-page/terraform" -var-file="$LANDING_ENV" || true
else
  run_apply "apps/landing-page/terraform" || true
fi
echo ""

# Frontend without WAF (enable_private_access=false)
echo "=== frontend (no WAF) ==="
run_init "apps/frontend/terraform"
if [ -f "$FRONTEND_ENV" ]; then
  run_apply "apps/frontend/terraform" -var-file="$FRONTEND_ENV" -var="enable_private_access=false" || true
else
  run_apply "apps/frontend/terraform" -var="enable_private_access=false" || true
fi

echo "=============================================="
echo "Done."
echo "=============================================="
