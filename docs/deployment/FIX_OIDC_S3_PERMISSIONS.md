# Fix OIDC Role S3 Permissions - "403 Forbidden" accessing Terraform state

## Problem

The IAM role for GitHub Actions can't access the Terraform state bucket `tfstate-goalsguild-dev` because the policy uses the wrong bucket name pattern.

**Error:**
```
Unable to access object "backend/database/terraform.tfstate" in S3 bucket "tfstate-goalsguild-dev": 
operation error S3: HeadObject, https response error StatusCode: 403, RequestID: ..., api error Forbidden: Forbidden
```

---

## Root Cause

The IAM policy attached to your GitHub Actions role (`goalsguild-github-actions-deployment-policy-dev`) uses:
- ❌ `arn:aws:s3:::terraform-state-*` (wrong pattern)

But your actual bucket name is:
- ✅ `tfstate-goalsguild-dev` (and `tfstate-goalsguild-staging`, `tfstate-goalsguild-prod`)

---

## Solution

Update the IAM policy to use the correct bucket name pattern: `tfstate-goalsguild-*`

---

## Updated Policy Statements (for dev role)

Update the **TerraformStateListBucket** and **TerraformStateObjects** statements in your `goalsguild-github-actions-deployment-policy-dev` policy:

### Old (Wrong):
```json
{
  "Sid": "TerraformStateListBucket",
  "Effect": "Allow",
  "Action": ["s3:ListBucket"],
  "Resource": ["arn:aws:s3:::terraform-state-*"]
},
{
  "Sid": "TerraformStateObjects",
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
  "Resource": ["arn:aws:s3:::terraform-state-*/*"]
}
```

### New (Correct):
```json
{
  "Sid": "TerraformStateListBucket",
  "Effect": "Allow",
  "Action": ["s3:ListBucket"],
  "Resource": ["arn:aws:s3:::tfstate-goalsguild-*"]
},
{
  "Sid": "TerraformStateObjects",
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
  "Resource": ["arn:aws:s3:::tfstate-goalsguild-*/*"]
}
```

---

## Updated DynamoDB Lock Table Pattern

Also update the DynamoDB lock table pattern to match your actual table name:

### Old (if using this pattern):
```json
{
  "Sid": "TerraformLock",
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:DeleteItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/terraform-state-lock"
  ]
}
```

### New (Correct):
```json
{
  "Sid": "TerraformLock",
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:DeleteItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/tfstate-goalsguild-*-lock"
  ]
}
```

---

## How to Update (AWS Console)

1. **IAM** → **Policies** → find `goalsguild-github-actions-deployment-policy-dev`
2. Click **Edit**
3. Find the statements with `Sid: TerraformStateListBucket` and `TerraformStateObjects`
4. Replace `terraform-state-*` with `tfstate-goalsguild-*`
5. Replace `terraform-state-lock` with `tfstate-goalsguild-*-lock` (if needed)
6. Click **Next** → **Save changes**

Repeat for:
- `goalsguild-github-actions-deployment-policy-staging`
- `goalsguild-github-actions-deployment-policy-prod`

---

## How to Update (AWS CLI)

```bash
# Get current policy
aws iam get-policy-version \
  --policy-arn arn:aws:iam::838284111015:policy/goalsguild-github-actions-deployment-policy-dev \
  --version-id v1 \
  --query 'PolicyVersion.Document' > dev-policy.json

# Edit dev-policy.json: replace terraform-state-* with tfstate-goalsguild-*

# Create new policy version
aws iam create-policy-version \
  --policy-arn arn:aws:iam::838284111015:policy/goalsguild-github-actions-deployment-policy-dev \
  --policy-document file://dev-policy.json \
  --set-as-default
```

---

## Complete Updated Policy (Dev)

Here's the complete updated policy with correct S3/DynamoDB patterns:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::tfstate-goalsguild-*"]
    },
    {
      "Sid": "TerraformStateObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::tfstate-goalsguild-*/*"]
    },
    {
      "Sid": "TerraformLock",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/tfstate-goalsguild-*-lock"
      ]
    },
    {
      "Sid": "STS",
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity"],
      "Resource": "*"
    },
    {
      "Sid": "ECRGetAuthorizationToken",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Sid": "IAMNoPassRole",
      "Effect": "Allow",
      "NotAction": ["iam:PassRole", "iam:CreateServiceLinkedRole"],
      "Resource": "*",
      "Condition": { "StringEquals": { "aws:RequestTag/environment": "dev" } }
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*",
      "Condition": {
        "ForAnyValue:StringEquals": {
          "iam:PassedToService": [
            "lambda.amazonaws.com",
            "apigateway.amazonaws.com",
            "events.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
      }
    },
    {
      "Sid": "DeploymentWithRequestTag",
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "s3:*",
        "cloudfront:*",
        "acm:*",
        "waf:*",
        "wafv2:*",
        "logs:*",
        "events:*",
        "ssm:*",
        "kms:*",
        "ses:*",
        "cognito-idp:*",
        "appsync:*",
        "ecr:*",
        "cloudwatch:*"
      ],
      "Resource": "*",
      "Condition": { "StringEquals": { "aws:RequestTag/environment": "dev" } }
    },
    {
      "Sid": "IAMResourceTag",
      "Effect": "Allow",
      "NotAction": ["iam:PassRole", "iam:CreateServiceLinkedRole"],
      "Resource": "*",
      "Condition": { "StringEquals": { "iam:ResourceTag/environment": "dev" } }
    },
    {
      "Sid": "IAMPassRoleResourceTag",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*",
      "Condition": {
        "StringEquals": { "iam:ResourceTag/environment": "dev" },
        "ForAnyValue:StringEquals": {
          "iam:PassedToService": [
            "lambda.amazonaws.com",
            "apigateway.amazonaws.com",
            "events.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
      }
    },
    {
      "Sid": "ECRResourceTag",
      "Effect": "Allow",
      "Action": ["ecr:*"],
      "Resource": ["arn:aws:ecr:*:*:repository/goalsguild_*"],
      "Condition": { "StringEquals": { "ecr:ResourceTag/environment": "dev" } }
    }
  ]
}
```

Replace `"dev"` with `"staging"` or `"prod"` for the other environments.

---

## Verification

After updating the policy, re-run your GitHub Actions workflow. The S3 access should succeed.

You can also test locally (after `aws sso login` and exporting credentials):

```bash
aws s3 ls s3://tfstate-goalsguild-dev/backend/database/terraform.tfstate
```

If you get a 403, the policy still needs updating. If you get "NoSuchKey" or can list the bucket, the permissions are correct.
