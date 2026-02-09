# Fix OIDC Role Read Permissions - Multiple AccessDenied Errors

## Problem

The IAM policy allows `*:*` actions but only with the condition `aws:RequestTag/environment = "ENV"`. This condition **only applies to CREATE/UPDATE operations** (when tagging resources). When Terraform **reads** existing resources (like `DescribeTable`, `GetRole`, `GetParameter`), there's no request tag, so the condition fails.

**Errors from GitHub Actions:**
- `dynamodb:ListTagsOfResource` - AccessDenied
- `cognito-idp:DescribeUserPool` - AccessDenied
- `ssm:GetParameter` - AccessDenied
- `ecr:DescribeRepositories` - AccessDenied
- `lambda:ListVersionsByFunction` - AccessDenied
- `iam:GetRole` - AccessDenied
- `s3:GetBucketPublicAccessBlock`, `s3:GetBucketVersioning`, `s3:GetEncryptionConfiguration`, `s3:GetBucketCORS` - AccessDenied
- `cloudwatch:DescribeAlarms` - AccessDenied
- `apigateway:GET` - AccessDenied

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

This only works for **write operations** (create/update) where you're tagging the resource. **Read operations** (Describe*, Get*, List*) don't include request tags, so they're denied.

---

## Solution

Add separate statements that allow **read operations** for each AWS service. These statements should **not** include the `aws:RequestTag` condition since read operations don't include request tags.

---

## Updated Policy - Add These Statements

Add these new statements **before** the `DeploymentWithRequestTag` statement in your `goalsguild-github-actions-deployment-policy-dev` policy:

### 1. DynamoDB Read Operations (already added, but missing ListTagsOfResource)

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

### 2. Cognito Read Operations

```json
{
  "Sid": "CognitoReadOperations",
  "Effect": "Allow",
  "Action": [
    "cognito-idp:DescribeUserPool",
    "cognito-idp:DescribeUserPoolClient",
    "cognito-idp:ListUserPools",
    "cognito-idp:ListUserPoolClients",
    "cognito-idp:ListTagsForResource"
  ],
  "Resource": "*"
}
```

### 3. SSM Read Operations

```json
{
  "Sid": "SSMReadOperations",
  "Effect": "Allow",
  "Action": [
    "ssm:GetParameter",
    "ssm:GetParameters",
    "ssm:GetParametersByPath",
    "ssm:DescribeParameters",
    "ssm:ListTagsForResource"
  ],
  "Resource": "*"
}
```

### 4. ECR Read Operations

```json
{
  "Sid": "ECRReadOperations",
  "Effect": "Allow",
  "Action": [
    "ecr:DescribeRepositories",
    "ecr:DescribeImages",
    "ecr:ListImages",
    "ecr:ListTagsForResource",
    "ecr:GetRepositoryPolicy",
    "ecr:GetLifecyclePolicy",
    "ecr:GetLifecyclePolicyPreview"
  ],
  "Resource": "*"
}
```

### 5. Lambda Read Operations

```json
{
  "Sid": "LambdaReadOperations",
  "Effect": "Allow",
  "Action": [
    "lambda:GetFunction",
    "lambda:GetFunctionConfiguration",
    "lambda:ListFunctions",
    "lambda:ListVersionsByFunction",
    "lambda:ListTags",
    "lambda:GetPolicy",
    "lambda:GetLayerVersion",
    "lambda:ListLayerVersions"
  ],
  "Resource": "*"
}
```

### 6. IAM Read Operations

```json
{
  "Sid": "IAMReadOperations",
  "Effect": "Allow",
  "Action": [
    "iam:GetRole",
    "iam:GetRolePolicy",
    "iam:ListRolePolicies",
    "iam:ListAttachedRolePolicies",
    "iam:GetPolicy",
    "iam:GetPolicyVersion",
    "iam:ListPolicyVersions",
    "iam:ListRoles",
    "iam:ListPolicies",
    "iam:GetUser",
    "iam:ListUsers",
    "iam:GetInstanceProfile",
    "iam:ListInstanceProfiles",
    "iam:ListInstanceProfilesForRole",
    "iam:GetOpenIDConnectProvider",
    "iam:ListOpenIDConnectProviders",
    "iam:ListRoleTags",
    "iam:ListPolicyTags",
    "iam:ListUserTags"
  ],
  "Resource": "*"
}
```

### 7. S3 Read Operations

```json
{
  "Sid": "S3ReadOperations",
  "Effect": "Allow",
  "Action": [
    "s3:GetBucketLocation",
    "s3:GetBucketVersioning",
    "s3:GetBucketPublicAccessBlock",
    "s3:GetBucketAcl",
    "s3:GetBucketPolicy",
    "s3:GetBucketCors",
    "s3:GetBucketEncryption",
    "s3:GetEncryptionConfiguration",
    "s3:GetBucketLogging",
    "s3:GetBucketNotification",
    "s3:GetBucketTagging",
    "s3:GetBucketWebsite",
    "s3:ListBucket",
    "s3:ListBucketMultipartUploads",
    "s3:ListBucketVersions",
    "s3:GetObject",
    "s3:GetObjectVersion",
    "s3:GetObjectAcl",
    "s3:GetObjectTagging",
    "s3:GetObjectVersionTagging",
    "s3:HeadObject",
    "s3:HeadBucket"
  ],
  "Resource": "*"
}
```

### 8. CloudWatch Read Operations

```json
{
  "Sid": "CloudWatchReadOperations",
  "Effect": "Allow",
  "Action": [
    "cloudwatch:DescribeAlarms",
    "cloudwatch:GetMetricStatistics",
    "cloudwatch:ListMetrics",
    "cloudwatch:GetDashboard",
    "cloudwatch:ListDashboards",
    "cloudwatch:GetMetricData",
    "cloudwatch:GetInsightRuleReport",
    "logs:DescribeLogGroups",
    "logs:DescribeLogStreams",
    "logs:GetLogEvents",
    "logs:FilterLogEvents",
    "logs:ListTagsLogGroup"
  ],
  "Resource": "*"
}
```

### 9. API Gateway Read Operations

```json
{
  "Sid": "APIGatewayReadOperations",
  "Effect": "Allow",
  "Action": [
    "apigateway:GET",
    "apigateway:HEAD",
    "apigateway:OPTIONS"
  ],
  "Resource": "*"
}
```

### 10. AppSync Read Operations

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
    "appsync:ListTagsForResource",
    "appsync:GetApiCache",
    "appsync:GetDomainName",
    "appsync:ListDomainNames"
  ],
  "Resource": "*"
}
```

---

## Complete Updated Policy Structure

Your policy should have these statements (in order):

1. ✅ **TerraformStateListBucket** - S3 list bucket (corrected bucket pattern: `tfstate-goalsguild-*`)
2. ✅ **TerraformStateObjects** - S3 get/put/delete objects (corrected bucket pattern: `tfstate-goalsguild-*/*`)
3. ✅ **TerraformLock** - DynamoDB lock table (corrected table pattern: `tfstate-goalsguild-*-lock`)
4. ✅ **STS** - GetCallerIdentity
5. ✅ **ECRGetAuthorizationToken** - ECR login
6. ✅ **DynamoDBTableManagement** - DynamoDB table management (updated with `ListTagsOfResource`)
7. ✅ **CognitoReadOperations** - **NEW: Cognito read operations**
8. ✅ **SSMReadOperations** - **NEW: SSM read operations**
9. ✅ **ECRReadOperations** - **NEW: ECR read operations**
10. ✅ **LambdaReadOperations** - **NEW: Lambda read operations**
11. ✅ **IAMReadOperations** - **NEW: IAM read operations**
12. ✅ **S3ReadOperations** - **NEW: S3 read operations**
13. ✅ **CloudWatchReadOperations** - **NEW: CloudWatch read operations**
14. ✅ **APIGatewayReadOperations** - **NEW: API Gateway read operations**
15. ✅ **AppSyncReadOperations** - **NEW: AppSync read operations**
16. ✅ **IAMNoPassRole** - IAM actions (except PassRole)
17. ✅ **IAMPassRole** - IAM PassRole (with service restrictions)
18. ✅ **DeploymentWithRequestTag** - Write operations (must tag with environment)
19. ✅ **IAMResourceTag** - IAM resource tag checks
20. ✅ **IAMPassRoleResourceTag** - IAM PassRole with resource tags
21. ✅ **ECRResourceTag** - ECR resource tag checks

---

## How to Update (AWS Console)

1. **IAM** → **Policies** → `goalsguild-github-actions-deployment-policy-dev`
2. Click **Edit**
3. Find the `DeploymentWithRequestTag` statement
4. **Add all the new read operation statements BEFORE it** (in the order listed above)
5. Also update `DynamoDBTableManagement` to include `dynamodb:ListTagsOfResource`
6. Click **Next** → **Save changes**

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

# Edit dev-policy.json: add all the read operation statements

# Create new policy version
aws iam create-policy-version \
  --policy-arn "$POLICY_ARN" \
  --policy-document file://dev-policy.json \
  --set-as-default
```

---

## Why This Works

- **Read operations** (Describe*, Get*, List*) don't include request tags, so they need separate statements without the `aws:RequestTag` condition.
- **Write operations** (Create*, Update*, Delete*) still require the `environment=ENV` tag via `DeploymentWithRequestTag`.
- This follows the principle of least privilege: only read operations needed for Terraform state refresh are allowed.
- Write operations remain restricted by the `aws:RequestTag/environment` condition.

---

## Verification

After updating, re-run your GitHub Actions workflow. Terraform should be able to:
- Read existing DynamoDB tables and their tags
- Read Cognito user pools
- Read SSM parameters
- Read ECR repositories
- Read Lambda functions and versions
- Read IAM roles and policies
- Read S3 bucket configurations
- Read CloudWatch alarms
- Read API Gateway REST APIs
- Read AppSync GraphQL APIs

All errors should be resolved.
