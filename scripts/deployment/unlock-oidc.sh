#!/usr/bin/env bash
# Unlock the github-actions-oidc Terraform state lock. Run from repo root.
# Prerequisite: aws sso login.
#
# Usage: ./scripts/deployment/unlock-oidc.sh -e dev

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

BACKEND_ENV="$REPO_ROOT/backend/infra/terraform2/environments/$ENV.tfvars"
DIR="backend/infra/terraform2/stacks/github-actions-oidc"

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  eval $(aws configure export-credentials --format env 2>/dev/null) || true
  [ -n "$AWS_ACCESS_KEY_ID" ] && unset AWS_PROFILE
fi

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "Error: AWS credentials not set. Run: aws sso login"
  exit 1
fi

echo "=== Unlock github-actions-oidc state (env=$ENV) ==="
bash backend-config/tf-init-s3.sh "$DIR" || true

PLAN_OUT=$(mktemp)
trap "rm -f $PLAN_OUT" EXIT

(
  cd "$DIR"
  terraform plan -detailed-exitcode -input=false -var-file="$BACKEND_ENV" 2>&1 | tee "$PLAN_OUT"
  exit "${PIPESTATUS[0]}"
) || true

# Extract Lock ID (UUID in Lock Info block; Terraform may use box-drawing chars like │)
LOCK_ID=$(sed -n '/Lock Info:/,/Created:/p' "$PLAN_OUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$LOCK_ID" ]; then
  echo "Could not find Lock ID in plan output. Run plan manually and copy the ID:"
  echo "  cd $DIR"
  echo "  terraform plan -var-file=$BACKEND_ENV"
  echo "Then: terraform force-unlock <LOCK_ID>"
  exit 1
fi

echo "Found Lock ID: $LOCK_ID"
(
  cd "$DIR"
  terraform force-unlock -force "$LOCK_ID"
)
echo "Done. Run verify again: ./scripts/deployment/verify-dev-deployment.sh"
