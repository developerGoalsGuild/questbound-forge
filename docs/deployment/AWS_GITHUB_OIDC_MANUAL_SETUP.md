# Manual GitHub–AWS OIDC Setup

Step-by-step manual setup for GitHub Actions → AWS OIDC (no Terraform). Use this if you prefer AWS Console and GitHub UI.

---

## What you’ll create

1. **AWS**
   - One OIDC identity provider for GitHub
   - Three IAM roles: dev, staging, prod
   - Three IAM policies (one per environment), each scoped so the role can only create/update resources tagged `environment` = that environment (dev, staging, or prod)
2. **GitHub**
   - Three repository secrets: `AWS_ROLE_ARN_DEV`, `AWS_ROLE_ARN_STAGING`, `AWS_ROLE_ARN_PROD`
   - Three environments: `dev`, `staging`, `prod` (with optional protection rules)

Replace placeholders:

- `YOUR_AWS_ACCOUNT_ID` – 12-digit AWS account ID
- `YOUR_GITHUB_OWNER` – GitHub org or username (e.g. `GoalsGuild`)
- `YOUR_REPO_NAME` – Repository name (e.g. `questbound-forge`)

---

## Part 1: AWS

### 1.1 Get your AWS account ID

```bash
aws sts get-caller-identity --query Account --output text
```

Use this value as `YOUR_AWS_ACCOUNT_ID` below.

---

### 1.2 Create the OIDC provider

1. In **AWS Console** go to **IAM** → **Identity providers** → **Add provider**.
2. **Provider type**: OpenID Connect.
3. **Provider URL**:  
   `https://token.actions.githubusercontent.com`
4. **Audience**:  
   `sts.amazonaws.com`
5. Click **Add provider**.

No thumbprint needed; AWS will use the issuer URL.

---

### 1.3 Create the IAM policies (one per environment, tag-scoped)

Each role must only create and update resources whose tag `environment` matches the role (dev, staging, or prod). Create **three** policies with the same structure but different condition values and names.

For each environment (`dev`, `staging`, `prod`):

1. **IAM** → **Policies** → **Create policy** → **JSON**.
2. Use the template below. Replace `ENV` with `dev`, `staging`, or `prod` in:
   - Every `"aws:RequestTag/environment": "ENV"`
   - Every `"ec2:ResourceTag/environment": "ENV"` (and the other `*:ResourceTag/environment` keys).
3. **Next** → Name: `goalsguild-github-actions-deployment-policy-ENV` (e.g. `goalsguild-github-actions-deployment-policy-dev`) → **Create policy**.

**Policy template (use ENV = dev, staging, or prod):**

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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
    {
      "Sid": "APIGatewayReadOperations",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:HEAD",
        "apigateway:OPTIONS"
      ],
      "Resource": "*"
    },
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
    },
    {
      "Sid": "IAMNoPassRole",
      "Effect": "Allow",
      "NotAction": ["iam:PassRole", "iam:CreateServiceLinkedRole"],
      "Resource": "*",
      "Condition": { "StringEquals": { "aws:RequestTag/environment": "ENV" } }
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
      "Condition": { "StringEquals": { "aws:RequestTag/environment": "ENV" } }
    },
    {
      "Sid": "IAMResourceTag",
      "Effect": "Allow",
      "NotAction": ["iam:PassRole", "iam:CreateServiceLinkedRole"],
      "Resource": "*",
      "Condition": { "StringEquals": { "iam:ResourceTag/environment": "ENV" } }
    },
    {
      "Sid": "IAMPassRoleResourceTag",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*",
      "Condition": {
        "StringEquals": { "iam:ResourceTag/environment": "ENV" },
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
      "Condition": { "StringEquals": { "ecr:ResourceTag/environment": "ENV" } }
    }
  ]
}
```

- **Project-scoped**: Only AWS services used by this project are allowed (Lambda, API Gateway, DynamoDB, S3, CloudFront, ACM, WAF, Logs, EventBridge, SSM, KMS, SES, Cognito, AppSync, ECR, CloudWatch). EC2, ECS, Route53, and application-autoscaling are not included.
- **Read Operations**: Separate statements allow read operations (Describe*, Get*, List*) without `aws:RequestTag` conditions, since read operations don't include request tags. These are needed for Terraform state refresh.
- **RequestTag** (DeploymentWithRequestTag, IAMNoPassRole): create/update requests must include tag `environment=ENV`.
- **PassRole**: `iam:PassRole` only when passing to Lambda, API Gateway, EventBridge, or CloudWatch Logs. `iam:CreateServiceLinkedRole` is not allowed.
- **S3**: ListBucket and object actions use separate resource ARNs (`tfstate-goalsguild-*` for bucket, `tfstate-goalsguild-*/*` for objects). Read operations are allowed on all S3 buckets for Terraform state refresh.
- **ECR**: `GetAuthorizationToken` is allowed with `Resource = "*"` (no tag) so CI can log in for docker push. Read operations (DescribeRepositories, ListImages, etc.) are allowed on all repositories. Write operations are restricted to repositories `goalsguild_*` and (where applicable) tag `environment=ENV`.
- **ResourceTag** (IAM, ECR): update/delete on existing resources only when they have tag `environment=ENV`.

Your Terraform (and any other automation) must tag all created resources with `environment = "dev"` / `"staging"` / `"prod"` so these policies apply correctly.

---

### 1.4 Create the three IAM roles

For each role you will:

- Create a role with **Web identity** trust and the correct **Provider** and **Audience**.
- Restrict the **Subject** so only your repo (and the right branch) can assume it.
- Attach the policy you created in 1.3.

**Trust policy template** (use the correct `Subject` for each role):

- **Provider**: `token.actions.githubusercontent.com` (choose the OIDC provider you added).
- **Audience**: `sts.amazonaws.com`.
- **Subject**: one of the values below (replace `YOUR_GITHUB_OWNER` and `YOUR_REPO_NAME`).

| Role   | Subject (use exactly one line per role) |
|--------|----------------------------------------|
| **Dev**    | `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/dev` |
| **Staging**| `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/staging` |
| **Prod**   | `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/main` (and optionally same for `refs/heads/master`) |

If you want to allow `workflow_dispatch` and pull requests from the same repo, you can use a **Subject condition** that matches multiple values (see “Optional: allow workflow_dispatch” below). For the minimal manual setup, the single `ref:refs/heads/...` subject above is enough.

**Steps for each role (dev, staging, prod):**

1. **IAM** → **Roles** → **Create role**.
2. **Trusted entity type**: **Web identity**.
3. **Identity provider**: `token.actions.githubusercontent.com`.
4. **Audience**: `sts.amazonaws.com`.
5. **Subject (condition)**:  
   - For **dev**: `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/dev`  
   - For **staging**: `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/staging`  
   - For **prod**: `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/main`  
   (You can add a second condition for `ref:refs/heads/master` if you use `master`.)
6. **Next**.
7. Attach the **environment-matching** policy:
   - Dev role → `goalsguild-github-actions-deployment-policy-dev`
   - Staging role → `goalsguild-github-actions-deployment-policy-staging`
   - Prod role → `goalsguild-github-actions-deployment-policy-prod`
8. **Next** → **Role name**:
   - Dev: `goalsguild-github-actions-role-dev`
   - Staging: `goalsguild-github-actions-role-staging`
   - Prod: `goalsguild-github-actions-role-prod`
9. **Create role**.

**Optional: allow workflow_dispatch and pull requests**

If you want manual runs and PRs from the same repo to assume the role, when creating the role use **Add condition** so the subject matches any of:

- `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:ref:refs/heads/BRANCH`
- `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:pull_request`
- `repo:YOUR_GITHUB_OWNER/YOUR_REPO_NAME:workflow_dispatch`

In the console that’s usually done with a **StringLike** condition on `token.actions.githubusercontent.com:sub` with multiple values. The minimal setup above only uses the branch ref; add these if you need them.

---

### 1.5 Get the role ARNs

Either:

- **IAM** → **Roles** → click each role → copy **ARN**, or  
- CLI:

```bash
aws iam get-role --role-name goalsguild-github-actions-role-dev       --query 'Role.Arn' --output text
aws iam get-role --role-name goalsguild-github-actions-role-staging    --query 'Role.Arn' --output text
aws iam get-role --role-name goalsguild-github-actions-role-prod      --query 'Role.Arn' --output text
```

You’ll need these for GitHub secrets.

---

## Part 2: GitHub

### 2.1 Add repository secrets

1. Repo → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** for each:

| Name                 | Value (example) |
|----------------------|------------------|
| `AWS_ROLE_ARN_DEV`   | `arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/goalsguild-github-actions-role-dev` |
| `AWS_ROLE_ARN_STAGING` | `arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/goalsguild-github-actions-role-staging` |
| `AWS_ROLE_ARN_PROD`  | `arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/goalsguild-github-actions-role-prod` |

Optional (only if you deploy prod with custom domain):

- `FRONTEND_ACM_CERT_ARN_PROD`
- `LANDING_PAGE_ACM_CERT_ARN_PROD`

---

### 2.2 Create environments (optional but recommended)

1. **Settings** → **Environments** → **New environment**.
2. Create three environments:

| Environment | Deployment branches      | Protection (optional)     |
|-------------|--------------------------|---------------------------|
| `dev`       | Branch: `dev`            | None                      |
| `staging`   | Branch: `staging`        | Required reviewers (e.g. 1) |
| `prod`      | Branches: `main`, `master` | Required reviewers (e.g. 1–2) |

Your workflows already use `environment: ${{ needs.context.outputs.environment }}`, so they will target these environments and trigger approvals where configured.

---

## Verify

1. Push a change to the `dev` branch (or run the workflow manually if you added `workflow_dispatch`).
2. Open **Actions** → select the run → confirm the “Configure AWS credentials” step succeeds.
3. If it fails, check:
   - Secret names are exactly `AWS_ROLE_ARN_DEV` / `AWS_ROLE_ARN_STAGING` / `AWS_ROLE_ARN_PROD`.
   - Role trust **Subject** matches your repo and branch (e.g. `repo:OWNER/REPO:ref:refs/heads/dev`).
   - OIDC provider URL is `https://token.actions.githubusercontent.com` and audience `sts.amazonaws.com`.

---

## Summary checklist

**AWS**

- [ ] OIDC provider: `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`
- [ ] Three policies: `goalsguild-github-actions-deployment-policy-dev`, `-staging`, `-prod` (each with tag condition for its environment)
- [ ] Role `goalsguild-github-actions-role-dev` (subject: `refs/heads/dev`) → policy `-dev`
- [ ] Role `goalsguild-github-actions-role-staging` (subject: `refs/heads/staging`) → policy `-staging`
- [ ] Role `goalsguild-github-actions-role-prod` (subject: `refs/heads/main` and optionally `refs/heads/master`) → policy `-prod`
- [ ] Each role has its matching deployment policy attached (dev→dev, staging→staging, prod→prod)
- [ ] Role ARNs copied for GitHub

**GitHub**

- [ ] Secrets: `AWS_ROLE_ARN_DEV`, `AWS_ROLE_ARN_STAGING`, `AWS_ROLE_ARN_PROD`
- [ ] Environments: `dev`, `staging`, `prod` (with optional protection)
- [ ] One successful run on `dev` (or manual run) to confirm OIDC works

For an automated (Terraform) setup, see [AWS_GITHUB_OIDC_SETUP.md](./AWS_GITHUB_OIDC_SETUP.md).
