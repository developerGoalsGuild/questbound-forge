# Fix OIDC Role DynamoDB Read Permissions - "AccessDeniedException: dynamodb:DescribeTable"

## Problem

The IAM policy allows `dynamodb:*` but only with the condition `aws:RequestTag/environment = "dev"`. This condition **only applies to CREATE/UPDATE operations** (when tagging resources). When Terraform **reads** existing tables (like `DescribeTable`), there's no request tag, so the condition fails.

**Error:**
```
User: arn:aws:sts::838284111015:assumed-role/goalsguild-github-actions-role-dev/GitHubActions 
is not authorized to perform: dynamodb:DescribeTable on resource: arn:aws:dynamodb:us-east-2:838284111015:table/gg_guild 
because no identity-based policy allows the dynamodb:DescribeTable action
```

---

## Root Cause

The policy has:
```json
{
  "Sid": "DeploymentWithRequestTag",
  "Effect": "Allow",
  "Action": ["dynamodb:*"],
  "Resource": "*",
  "Condition": { "StringEquals": { "aws:RequestTag/environment": "dev" } }
}
```

This only works for **write operations** (create/update) where you're tagging the resource. **Read operations** (DescribeTable, GetItem, Query, Scan) don't include request tags, so they're denied.

---

## Solution

Add a separate statement that allows **read operations** on DynamoDB tables. Since DynamoDB doesn't support `dynamodb:ResourceTag` condition keys, we'll allow read operations on tables that match your naming pattern or allow reads on all tables (writes are still restricted by RequestTag).

---

## Updated Policy - Add This Statement

Add this new statement **before** the `DeploymentWithRequestTag` statement in your `goalsguild-github-actions-deployment-policy-dev` policy:

```json
{
  "Sid": "DynamoDBTableManagement",
  "Effect": "Allow",
  "Action": [
    "dynamodb:DescribeTable",
    "dynamodb:DescribeTimeToLive",
    "dynamodb:ListTables",
    "dynamodb:DescribeContinuousBackups",
    "dynamodb:DescribeBackup",
    "dynamodb:ListBackups",
    "dynamodb:DescribeStream",
    "dynamodb:ListStreams",
    "dynamodb:ListTagsOfResource"
  ],
  "Resource": "*"
}
```

**Note:** This only includes **table management operations** (describe/list). Terraform doesn't need data operations (GetItem, Query, Scan) - those are for application code, not infrastructure. Write operations (CreateTable, UpdateTable, DeleteTable) are still restricted by `DeploymentWithRequestTag` (must include `environment=dev` tag).

---

## Alternative: Restrict by Table Name Pattern

If you want to restrict reads to specific tables, use:

```json
{
  "Sid": "DynamoDBTableManagement",
  "Effect": "Allow",
  "Action": [
    "dynamodb:DescribeTable",
    "dynamodb:DescribeTimeToLive",
    "dynamodb:ListTables",
    "dynamodb:DescribeContinuousBackups",
    "dynamodb:DescribeBackup",
    "dynamodb:ListBackups",
    "dynamodb:DescribeStream",
    "dynamodb:ListStreams",
    "dynamodb:ListTagsOfResource"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/gg_core",
    "arn:aws:dynamodb:*:*:table/gg_guild"
  ]
}
```

**Note:** Data operations (GetItem, Query, Scan) are **not needed** for Terraform - those are for application code (Lambda functions), not infrastructure management.

---

## Complete Updated Policy Structure

Your policy should have these statements (in order):

1. ✅ **TerraformStateListBucket** - S3 list bucket
2. ✅ **TerraformStateObjects** - S3 get/put/delete objects
3. ✅ **TerraformLock** - DynamoDB lock table
4. ✅ **STS** - GetCallerIdentity
5. ✅ **ECRGetAuthorizationToken** - ECR login
6. ✅ **DynamoDBTableManagement** - **NEW: DynamoDB table management (describe/list only)** ← Add this
7. ✅ **IAMNoPassRole** - IAM actions (except PassRole)
8. ✅ **IAMPassRole** - IAM PassRole (with service restrictions)
9. ✅ **DeploymentWithRequestTag** - Write operations (must tag with environment)
10. ✅ **IAMResourceTag** - IAM resource tag checks
11. ✅ **IAMPassRoleResourceTag** - IAM PassRole with resource tags
12. ✅ **ECRResourceTag** - ECR resource tag checks

---

## How to Update (AWS Console)

1. **IAM** → **Policies** → `goalsguild-github-actions-deployment-policy-dev`
2. Click **Edit**
3. Find the `DeploymentWithRequestTag` statement
4. **Add a new statement BEFORE it** with the `DynamoDBReadOperations` JSON above
5. Click **Next** → **Save changes**

Repeat for:
- `goalsguild-github-actions-deployment-policy-staging`
- `goalsguild-github-actions-deployment-policy-prod`

---

## How to Update (AWS CLI)

```bash
# Get current policy
POLICY_ARN="arn:aws:iam::838284111015:policy/goalsguild-github-actions-deployment-policy-dev"
aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text
# Get the version ID, then:
VERSION_ID="v1"  # Replace with actual version
aws iam get-policy-version \
  --policy-arn "$POLICY_ARN" \
  --version-id "$VERSION_ID" \
  --query 'PolicyVersion.Document' > dev-policy.json

# Edit dev-policy.json: add the DynamoDBReadOperations statement

# Create new policy version
aws iam create-policy-version \
  --policy-arn "$POLICY_ARN" \
  --policy-document file://dev-policy.json \
  --set-as-default
```

---

## Why This Works

- **Table management operations** (DescribeTable, ListTables, etc.) don't include request tags, so they need a separate statement without the `aws:RequestTag` condition.
- **Write operations** (CreateTable, UpdateTable, DeleteTable) still require the `environment=dev` tag via `DeploymentWithRequestTag`.
- **Data operations** (GetItem, Query, Scan, PutItem, etc.) are **not included** - Terraform only manages table structure, not data. Application code (Lambda functions) handles data operations with their own IAM policies.
- This follows the principle of least privilege: only table management operations needed for Terraform are allowed.

---

## Verification

After updating, re-run your GitHub Actions workflow. Terraform should be able to read existing DynamoDB tables (`gg_core`, `gg_guild`) and the error should be resolved.
