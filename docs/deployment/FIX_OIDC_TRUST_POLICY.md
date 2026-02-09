# Fix OIDC Trust Policy - "Not authorized to perform sts:AssumeRoleWithWebIdentity"

## Problem

The IAM role trust policy has:
1. ❌ Wrong branch name: `refs/heads/Dev` (capital D) instead of `refs/heads/dev` (lowercase)
2. ❌ Missing environment condition: workflows use `environment: dev`, so OIDC token includes `environment:dev` in subject

## Solution

Update the trust policy to allow **both** branch-based and environment-based OIDC tokens.

---

## Corrected Trust Policy for Dev Role

Replace the trust policy on your `goalsguild-github-actions-role-dev` IAM role with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::838284111015:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:developerGoalsGuild/questbound-forge:ref:refs/heads/dev",
            "repo:developerGoalsGuild/questbound-forge:environment:dev",
            "repo:developerGoalsGuild/questbound-forge:pull_request",
            "repo:developerGoalsGuild/questbound-forge:workflow_dispatch"
          ]
        }
      }
    }
  ]
}
```

---

## Corrected Trust Policy for Staging Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::838284111015:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:developerGoalsGuild/questbound-forge:ref:refs/heads/staging",
            "repo:developerGoalsGuild/questbound-forge:environment:staging",
            "repo:developerGoalsGuild/questbound-forge:pull_request",
            "repo:developerGoalsGuild/questbound-forge:workflow_dispatch"
          ]
        }
      }
    }
  ]
}
```

---

## Corrected Trust Policy for Prod Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::838284111015:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:developerGoalsGuild/questbound-forge:ref:refs/heads/main",
            "repo:developerGoalsGuild/questbound-forge:ref:refs/heads/master",
            "repo:developerGoalsGuild/questbound-forge:environment:prod",
            "repo:developerGoalsGuild/questbound-forge:pull_request",
            "repo:developerGoalsGuild/questbound-forge:workflow_dispatch"
          ]
        }
      }
    }
  ]
}
```

---

## How to Update (AWS Console)

1. **IAM** → **Roles** → find your role (e.g. `goalsguild-github-actions-role-dev`)
2. Click **Trust relationships** tab
3. Click **Edit trust policy**
4. Replace the JSON with the corrected policy above
5. Click **Update policy**

---

## How to Update (AWS CLI)

```bash
# Dev role
aws iam update-assume-role-policy \
  --role-name goalsguild-github-actions-role-dev \
  --policy-document file://dev-trust-policy.json

# Staging role
aws iam update-assume-role-policy \
  --role-name goalsguild-github-actions-role-staging \
  --policy-document file://staging-trust-policy.json

# Prod role
aws iam update-assume-role-policy \
  --role-name goalsguild-github-actions-role-prod \
  --policy-document file://prod-trust-policy.json
```

---

## Key Changes

1. ✅ **Branch name**: `refs/heads/dev` (lowercase) instead of `refs/heads/Dev`
2. ✅ **Environment condition**: Added `environment:dev` / `environment:staging` / `environment:prod`
3. ✅ **Pull requests**: Added `pull_request` (optional, for PR-based workflows)
4. ✅ **Manual dispatch**: Added `workflow_dispatch` (for manual workflow runs)

---

## Why Environment Condition is Required

When a GitHub Actions workflow uses `environment: dev` (as your workflows do), GitHub includes the environment name in the OIDC token subject:

- **With environment**: `repo:OWNER/REPO:environment:dev`
- **Without environment**: `repo:OWNER/REPO:ref:refs/heads/dev`

Your workflows use `environment: dev|staging|prod`, so the trust policy **must** include the `environment:*` condition.

---

## Verification

After updating, re-run your GitHub Actions workflow. The OIDC authentication should succeed.
