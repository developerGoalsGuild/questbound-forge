# Fix OIDC Role Missing Read Permissions - Multiple AccessDenied Errors

## Problem

The GitHub Actions IAM role (`oalsguild-github-actions-role-dev`) is missing several read permissions required by Terraform when refreshing state. These read operations don't include request tags, so they're denied by the `DeploymentWithRequestTag` condition.

**Errors from GitHub Actions:**
- `cognito-idp:GetUserPoolMfaConfig` - AccessDeniedException
- `lambda:GetFunctionConcurrency` - AccessDeniedException  
- `s3:GetAccelerateConfiguration` - AccessDeniedException
- `appsync:ListApiKeys` - AccessDeniedException
- `cloudwatch:ListTagsForResource` - AccessDeniedException (for CloudWatch Metric Alarms)
- `logs:ListTagsForResource` - AccessDeniedException (for CloudWatch Log Groups)

---

## Root Cause

The policy has:
```json
{
  "Sid": "DeploymentWithRequestTag",
  "Effect": "Allow",
  "Action": ["*:*"],
  "Resource": "*",
  "Condition": { "StringEquals": { "aws:RequestTag/environment": "ENV" } }
}
```

This only works for **write operations** (create/update) where you're tagging the resource. **Read operations** (Get*, List*, Describe*) don't include request tags, so they're denied.

---

## Solution

Add separate statements that allow **read operations** for each AWS service. These statements should **not** include the `aws:RequestTag` condition since read operations don't include request tags.

---

## Updated Policy - Add These Statements

Add these new statements **before** the `DeploymentWithRequestTag` statement in your `goalsguild-github-actions-deployment-policy-dev` policy:

### 1. Cognito Read Operations (Missing GetUserPoolMfaConfig)

```json
{
  "Sid": "CognitoReadOperations",
  "Effect": "Allow",
  "Action": [
    "cognito-idp:DescribeUserPool",
    "cognito-idp:DescribeUserPoolClient",
    "cognito-idp:ListUserPools",
    "cognito-idp:ListUserPoolClients",
    "cognito-idp:GetUserPoolMfaConfig",
    "cognito-idp:ListTagsForResource",
    "cognito-idp:DescribeIdentityProvider",
    "cognito-idp:ListIdentityProviders"
  ],
  "Resource": "*"
}
```

### 2. Lambda Read Operations (Missing GetFunctionConcurrency)

```json
{
  "Sid": "LambdaReadOperations",
  "Effect": "Allow",
  "Action": [
    "lambda:GetFunction",
    "lambda:GetFunctionConfiguration",
    "lambda:GetFunctionConcurrency",
    "lambda:ListFunctions",
    "lambda:ListVersionsByFunction",
    "lambda:ListAliases",
    "lambda:ListEventSourceMappings",
    "lambda:GetPolicy",
    "lambda:ListTags",
    "lambda:GetFunctionUrlConfig",
    "lambda:ListFunctionUrlConfigs",
    "lambda:GetCodeSigningConfig",
    "lambda:GetLayerVersion",
    "lambda:ListLayerVersions",
    "lambda:ListLayers"
  ],
  "Resource": "*"
}
```

### 3. S3 Read Operations (Missing GetAccelerateConfiguration)

```json
{
  "Sid": "S3ReadOperations",
  "Effect": "Allow",
  "Action": [
    "s3:GetBucketLocation",
    "s3:GetBucketVersioning",
    "s3:GetBucketPublicAccessBlock",
    "s3:GetBucketAcl",
    "s3:GetBucketCORS",
    "s3:GetBucketEncryption",
    "s3:GetBucketLogging",
    "s3:GetBucketNotification",
    "s3:GetBucketPolicy",
    "s3:GetBucketPolicyStatus",
    "s3:GetBucketRequestPayment",
    "s3:GetBucketTagging",
    "s3:GetBucketWebsite",
    "s3:GetAccelerateConfiguration",
    "s3:GetLifecycleConfiguration",
    "s3:GetReplicationConfiguration",
    "s3:GetObject",
    "s3:GetObjectAcl",
    "s3:GetObjectTagging",
    "s3:GetObjectVersion",
    "s3:GetObjectVersionAcl",
    "s3:GetObjectVersionTagging",
    "s3:ListBucket",
    "s3:ListBucketVersions",
    "s3:ListAllMyBuckets",
    "s3:ListMultipartUploadParts",
    "s3:ListMultipartUploads"
  ],
  "Resource": "*"
}
```

### 4. AppSync Read Operations (Missing ListApiKeys)

```json
{
  "Sid": "AppSyncReadOperations",
  "Effect": "Allow",
  "Action": [
    "appsync:GetGraphqlApi",
    "appsync:ListGraphqlApis",
    "appsync:GetSchemaCreationStatus",
    "appsync:GetDataSource",
    "appsync:ListDataSources",
    "appsync:GetResolver",
    "appsync:ListResolvers",
    "appsync:GetFunction",
    "appsync:ListFunctions",
    "appsync:ListApiKeys",
    "appsync:GetApiKey",
    "appsync:ListTagsForResource",
    "appsync:GetApiCache",
    "appsync:GetDomainName",
    "appsync:ListDomainNames"
  ],
  "Resource": "*"
}
```

### 5. CloudWatch Read Operations (Missing ListTagsForResource for Alarms)

```json
{
  "Sid": "CloudWatchReadOperations",
  "Effect": "Allow",
  "Action": [
    "cloudwatch:DescribeAlarms",
    "cloudwatch:DescribeAlarmHistory",
    "cloudwatch:ListMetrics",
    "cloudwatch:GetMetricStatistics",
    "cloudwatch:GetMetricData",
    "cloudwatch:GetDashboard",
    "cloudwatch:ListDashboards",
    "cloudwatch:ListTagsForResource"
  ],
  "Resource": "*"
}
```

### 6. CloudWatch Logs Read Operations (Missing ListTagsForResource)

```json
{
  "Sid": "CloudWatchLogsReadOperations",
  "Effect": "Allow",
  "Action": [
    "logs:DescribeLogGroups",
    "logs:DescribeLogStreams",
    "logs:GetLogEvents",
    "logs:FilterLogEvents",
    "logs:ListTagsForResource",
    "logs:DescribeResourcePolicies",
    "logs:DescribeExportTasks",
    "logs:ListTagsLogGroup"
  ],
  "Resource": "*"
}
```

---

## Complete Updated Policy Structure

Your policy should have these statements (in order):

1. ✅ **TerraformStateListBucket** - S3 list bucket
2. ✅ **TerraformStateObjects** - S3 get/put/delete objects
3. ✅ **TerraformLock** - DynamoDB lock table
4. ✅ **STS** - GetCallerIdentity
5. ✅ **ECRGetAuthorizationToken** - ECR login
6. ✅ **DynamoDBTableManagement** - DynamoDB table management
7. ✅ **CognitoReadOperations** - **UPDATED: Added GetUserPoolMfaConfig**
8. ✅ **SSMReadOperations** - SSM read operations
9. ✅ **ECRReadOperations** - ECR read operations
10. ✅ **LambdaReadOperations** - **UPDATED: Added GetFunctionConcurrency**
11. ✅ **IAMReadOperations** - IAM read operations
12. ✅ **S3ReadOperations** - **UPDATED: Added GetAccelerateConfiguration**
13. ✅ **CloudWatchReadOperations** - **UPDATED: Added ListTagsForResource**
14. ✅ **APIGatewayReadOperations** - API Gateway read operations
15. ✅ **AppSyncReadOperations** - **UPDATED: Added ListApiKeys**
16. ✅ **CloudWatchLogsReadOperations** - **NEW: Added ListTagsForResource**
17. ✅ **IAMNoPassRole** - IAM actions (except PassRole)
18. ✅ **IAMPassRole** - IAM PassRole
19. ✅ **DeploymentWithRequestTag** - Write operations (must tag with environment)
20. ✅ **IAMResourceTag** - IAM resource tag checks
21. ✅ **IAMPassRoleResourceTag** - IAM PassRole with resource tags
22. ✅ **ECRResourceTag** - ECR resource tag checks

---

## How to Update (AWS Console)

1. **IAM** → **Policies** → `goalsguild-github-actions-deployment-policy-dev`
2. Click **Edit**
3. Find the `DeploymentWithRequestTag` statement
4. **Update existing read operation statements** and **add new ones BEFORE it**:
   - Update `CognitoReadOperations` - add `GetUserPoolMfaConfig`
   - Update `LambdaReadOperations` - add `GetFunctionConcurrency`
   - Update `S3ReadOperations` - add `GetAccelerateConfiguration`
   - Update `AppSyncReadOperations` - add `ListApiKeys`
   - Update `CloudWatchReadOperations` - add `ListTagsForResource`
   - Add new `CloudWatchLogsReadOperations` statement
5. Click **Next** → **Save changes**

Repeat for:
- `goalsguild-github-actions-deployment-policy-staging`
- `goalsguild-github-actions-deployment-policy-prod`

---

## How to Update (AWS CLI)

```bash
# Get current policy
POLICY_ARN="arn:aws:iam::838284111015:policy/goalsguild-github-actions-deployment-policy-dev"
VERSION_ID=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
aws iam get-policy-version \
  --policy-arn "$POLICY_ARN" \
  --version-id "$VERSION_ID" \
  --query 'PolicyVersion.Document' > dev-policy.json

# Edit dev-policy.json: update existing statements and add new ones

# Create new policy version
aws iam create-policy-version \
  --policy-arn "$POLICY_ARN" \
  --policy-document file://dev-policy.json \
  --set-as-default
```

---

## Why This Works

- **Read operations** (Get*, List*, Describe*) don't include request tags, so they need separate statements without the `aws:RequestTag` condition.
- **Write operations** (Create*, Update*, Delete*) still require the `environment=ENV` tag via `DeploymentWithRequestTag`.
- This follows the principle of least privilege: only read operations needed for Terraform state refresh are allowed.

---

## Verification

After updating, re-run your GitHub Actions workflow. Terraform should be able to:
- Read Cognito User Pool MFA configuration
- Read Lambda function concurrency settings
- Read S3 bucket accelerate configuration
- List AppSync API keys
- List tags for CloudWatch alarms and log groups

All errors should be resolved.

---

## Additional Issue: Lambda Build Directory

There's also an issue with Lambda build directories not being created before Terraform tries to archive them. This is a separate issue that needs to be fixed in the Terraform code itself (see `backend/infra/terraform2/modules/lambda_zip/main.tf`).

The `null_resource.build_bash` creates the directory, but Terraform's `data.archive_file` may try to read it before it exists. Ensure proper dependencies are set.
