#!/usr/bin/env bash
# Verify dev deployment: run terraform plan on all stacks and report which are in sync (no changes) vs drift/error.
# Run from repo root. Prerequisite: aws sso login.
#
# Usage: ./scripts/deployment/verify-dev-deployment.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

ENV="dev"
BACKEND_ENV="$REPO_ROOT/backend/infra/terraform2/environments/$ENV.tfvars"
FRONTEND_ENV="$REPO_ROOT/apps/frontend/terraform/environments/$ENV.tfvars"
LANDING_ENV="$REPO_ROOT/apps/landing-page/terraform/environments/$ENV.tfvars"

# Export AWS credentials (same as deploy script)
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

run_plan() {
  local dir="$1"
  shift
  local extra=("$@")
  (
    cd "$dir"
    terraform plan -detailed-exitcode -input=false "${extra[@]}" 2>&1
  )
  return $?
}

echo "=============================================="
echo "Verify dev deployment – plan all stacks"
echo "=============================================="
echo ""

OK=()
DRIFT=()
FAIL=()

# Don't exit on non-zero from terraform plan (exit 2 = drift, exit 1 = error); we handle both
set +e

# Backend infra
for stack in database security s3 ses ecr authorizer; do
  dir="backend/infra/terraform2/stacks/$stack"
  echo -n "  $stack ... "
  out=$(run_plan "$dir" -var-file="$BACKEND_ENV" 2>&1)
  exitcode=$?
  if [ "$exitcode" -eq 0 ]; then
    echo "OK (no changes)"
    OK+=("$stack")
  elif [ "$exitcode" -eq 2 ]; then
    echo "DRIFT (changes present)"
    DRIFT+=("$stack")
  else
    echo "ERROR"
    FAIL+=("$stack")
    printf '%s\n' "$out" | tail -5
  fi
done

# Backend services
for svc in user-service quest-service guild-service gamification-service collaboration-service subscription-service messaging-service; do
  dir="backend/infra/terraform2/stacks/services/$svc"
  echo -n "  $svc ... "
  out=$(run_plan "$dir" -var-file="$BACKEND_ENV" 2>&1)
  exitcode=$?
  if [ "$exitcode" -eq 0 ]; then
    echo "OK (no changes)"
    OK+=("$svc")
  elif [ "$exitcode" -eq 2 ]; then
    echo "DRIFT (changes present)"
    DRIFT+=("$svc")
  else
    echo "ERROR"
    FAIL+=("$svc")
    printf '%s\n' "$out" | tail -5
  fi
done

# Stacks that read remote state
for stack in appsync apigateway github-actions-oidc; do
  dir="backend/infra/terraform2/stacks/$stack"
  echo -n "  $stack ... "
  out=$(run_plan "$dir" -var-file="$BACKEND_ENV" 2>&1)
  exitcode=$?
  if [ "$exitcode" -eq 0 ]; then
    echo "OK (no changes)"
    OK+=("$stack")
  elif [ "$exitcode" -eq 2 ]; then
    echo "DRIFT (changes present)"
    DRIFT+=("$stack")
  else
    echo "ERROR"
    FAIL+=("$stack")
    printf '%s\n' "$out" | tail -5
  fi
done

# Landing page
echo -n "  landing-page ... "
out=$(run_plan "apps/landing-page/terraform" -var-file="$LANDING_ENV" 2>&1)
exitcode=$?
if [ "$exitcode" -eq 0 ]; then
  echo "OK (no changes)"
  OK+=("landing-page")
elif [ "$exitcode" -eq 2 ]; then
  echo "DRIFT (changes present)"
  DRIFT+=("landing-page")
else
  echo "ERROR"
  FAIL+=("landing-page")
  printf '%s\n' "$out" | tail -5
fi

# Frontend
echo -n "  frontend ... "
if [ -f "$FRONTEND_ENV" ]; then
  out=$(run_plan "apps/frontend/terraform" -var-file="$FRONTEND_ENV" -var="enable_private_access=false" 2>&1)
else
  out=$(run_plan "apps/frontend/terraform" -var="enable_private_access=false" 2>&1)
fi
exitcode=$?
if [ "$exitcode" -eq 0 ]; then
  echo "OK (no changes)"
  OK+=("frontend")
elif [ "$exitcode" -eq 2 ]; then
  echo "DRIFT (changes present)"
  DRIFT+=("frontend")
else
  echo "ERROR"
  FAIL+=("frontend")
  printf '%s\n' "$out" | tail -5
fi

set -e

echo ""
echo "=============================================="
echo "Summary"
echo "=============================================="
echo "  OK (in sync):    ${#OK[@]} stacks"
echo "  DRIFT:           ${#DRIFT[@]} stacks"
echo "  ERROR:           ${#FAIL[@]} stacks"
if [ ${#DRIFT[@]} -gt 0 ]; then
  echo "  Drift: ${DRIFT[*]}"
fi
if [ ${#FAIL[@]} -gt 0 ]; then
  echo "  Failed: ${FAIL[*]}"
  exit 1
fi
if [ ${#DRIFT[@]} -gt 0 ]; then
  echo ""
  echo "Run deploy to apply: ./scripts/deployment/deploy-all-except-waf.sh -e dev"
  exit 2
fi
echo ""
echo "All dev stacks are deployed and in sync."
exit 0
