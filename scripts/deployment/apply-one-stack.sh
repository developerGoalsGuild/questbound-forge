#!/usr/bin/env bash
# Apply a single Terraform stack (fix drift). Run from repo root.
# Prerequisite: aws sso login.
#
# Usage: ./scripts/deployment/apply-one-stack.sh -e dev <stack-name>
# Example: ./scripts/deployment/apply-one-stack.sh -e dev security
#
# Stacks: database security s3 ses ecr authorizer |
#        user-service quest-service guild-service gamification-service |
#        collaboration-service subscription-service messaging-service |
#        appsync apigateway github-actions-oidc |
#        landing-page frontend

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

ENV="dev"
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)
      ENV="$2"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

STACK="${1:-}"
if [ -z "$STACK" ]; then
  echo "Usage: $0 -e dev|staging|prod <stack-name>"
  echo "Example: $0 -e dev security"
  exit 1
fi

BACKEND_ENV="$REPO_ROOT/backend/infra/terraform2/environments/$ENV.tfvars"
FRONTEND_ENV="$REPO_ROOT/apps/frontend/terraform/environments/$ENV.tfvars"
LANDING_ENV="$REPO_ROOT/apps/landing-page/terraform/environments/$ENV.tfvars"

# Export AWS credentials
if command -v aws &>/dev/null; then
  eval $(aws configure export-credentials --format env 2>/dev/null) || true
  if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    unset AWS_PROFILE
  fi
fi

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "Error: AWS credentials not set. Run: aws sso login"
  exit 1
fi

# Resolve stack to directory and plan/apply args
case "$STACK" in
  database|security|s3|ses|ecr|authorizer|appsync|apigateway|github-actions-oidc)
    DIR="backend/infra/terraform2/stacks/$STACK"
    VAR_FILE="-var-file=$BACKEND_ENV"
    ;;
  user-service|quest-service|guild-service|gamification-service|collaboration-service|subscription-service|messaging-service)
    DIR="backend/infra/terraform2/stacks/services/$STACK"
    VAR_FILE="-var-file=$BACKEND_ENV"
    ;;
  landing-page)
    DIR="apps/landing-page/terraform"
    VAR_FILE="-var-file=$LANDING_ENV"
    ;;
  frontend)
    DIR="apps/frontend/terraform"
    VAR_FILE="-var-file=$FRONTEND_ENV -var=enable_private_access=false"
    if [ ! -f "$FRONTEND_ENV" ]; then
      VAR_FILE="-var=enable_private_access=false"
    fi
    ;;
  *)
    echo "Unknown stack: $STACK"
    exit 1
    ;;
esac

if [ ! -d "$DIR" ]; then
  echo "Error: directory not found: $DIR"
  exit 1
fi

echo "=== Init then apply: $STACK (env=$ENV) ==="
bash backend-config/tf-init-s3.sh "$DIR" || true
(
  cd "$DIR"
  terraform apply -auto-approve -input=false $VAR_FILE
)
echo "Done: $STACK"
