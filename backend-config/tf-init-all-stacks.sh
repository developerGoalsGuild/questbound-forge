#!/usr/bin/env bash
# Initialize all Terraform stacks with S3 backend (dev).
# Run from repo root after: aws sso login
#   bash backend-config/tf-init-all-stacks.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

STACKS=(
  apps/frontend/terraform
  apps/landing-page/terraform
  backend/infra/terraform2/stacks/database
  backend/infra/terraform2/stacks/ecr
  backend/infra/terraform2/stacks/s3
  backend/infra/terraform2/stacks/security
  backend/infra/terraform2/stacks/ses
  backend/infra/terraform2/stacks/authorizer
  backend/infra/terraform2/stacks/apigateway
  backend/infra/terraform2/stacks/appsync
  backend/infra/terraform2/stacks/github-actions-oidc
  backend/infra/terraform2/stacks/services/user-service
  backend/infra/terraform2/stacks/services/quest-service
  backend/infra/terraform2/stacks/services/guild-service
  backend/infra/terraform2/stacks/services/gamification-service
  backend/infra/terraform2/stacks/services/collaboration-service
  backend/infra/terraform2/stacks/services/subscription-service
  backend/infra/terraform2/stacks/services/messaging-service
)

for dir in "${STACKS[@]}"; do
  echo "=== Init $dir ==="
  bash backend-config/tf-init-s3.sh "$dir" || true
  echo ""
done

echo "Done. Re-run after 'aws sso login' when the session expires."
