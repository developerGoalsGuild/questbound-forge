#!/bin/bash

# Deploy IAM-related stacks only (security, github-actions-oidc)
# This script is used by the deploy-iam workflow and requires a role with IAM permissions.
# Run with: ./deploy-iam.sh --env dev

set -e

ENV="dev"
PLAN_ONLY=""
AUTO_APPROVE="true"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STACKS_ROOT="$TERRAFORM_DIR/stacks"
ENV_FILE="$TERRAFORM_DIR/environments/$ENV.tfvars"

IAM_STACKS=("security" "github-actions-oidc")

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
    *)
      shift
      ;;
  esac
done

ENV_FILE="$TERRAFORM_DIR/environments/$ENV.tfvars"

echo "============================================================"
echo "GoalsGuild IAM Deployment"
echo "Environment: $ENV"
echo "Stacks: ${IAM_STACKS[*]}"
echo "============================================================"

for stack_name in "${IAM_STACKS[@]}"; do
  stack_path="$STACKS_ROOT/$stack_name"
  echo ""
  echo "=== Stack: $stack_name ==="

  if [ ! -d "$stack_path" ]; then
    echo "Stack path not found: $stack_path"
    exit 1
  fi

  (
    cd "$stack_path"
    terraform init -upgrade

    if [ -n "$PLAN_ONLY" ]; then
      terraform plan -var-file="$ENV_FILE"
    else
      if [ "$AUTO_APPROVE" = "true" ]; then
        terraform apply -var-file="$ENV_FILE" -auto-approve
      else
        terraform apply -var-file="$ENV_FILE"
      fi
    fi
  ) || exit 1
done

echo ""
echo "============================================================"
echo "IAM deployment completed successfully"
echo "============================================================"
