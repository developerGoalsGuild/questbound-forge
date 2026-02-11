# GitHub Actions OIDC Provider and IAM Roles Stack
# Creates OIDC provider for GitHub Actions and IAM roles for CI/CD deployments

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# GitHub OIDC Provider
# Only one OIDC provider is needed per AWS account
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  # GitHub's OIDC thumbprints (AWS automatically manages these)
  # Using empty thumbprint_list allows AWS to automatically fetch and update thumbprints
  thumbprint_list = []

  tags = merge(
    {
      Name        = "github-actions-oidc-provider"
      Project     = "goalsguild"
      environment = "shared"
      Component   = "ci-cd"
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# Local values for role configuration
locals {
  github_repo = "${var.github_repo_owner}/${var.github_repo_name}"

  # Branch restrictions per environment
  branch_restrictions = {
    dev     = ["ref:heads/dev"]
    staging = ["ref:heads/staging"]
    prod    = ["ref:heads/main", "ref:heads/master"]
  }

  # Common tags (use environment only; AWS tag keys are case-insensitive)
  common_tags = merge(
    {
      Project     = "goalsguild"
      environment = var.environment
      Component   = "ci-cd"
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# IAM Role for GitHub Actions - Dev Environment
resource "aws_iam_role" "github_actions_dev" {
  name = "goalsguild-github-actions-role-dev"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/dev",
              "repo:${local.github_repo}:pull_request",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-role-dev"
    environment = "dev"
  })
}

# IAM Role for GitHub Actions - Staging Environment
resource "aws_iam_role" "github_actions_staging" {
  name = "goalsguild-github-actions-role-staging"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/staging",
              "repo:${local.github_repo}:pull_request",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-role-staging"
    environment = "staging"
  })
}

# IAM Role for GitHub Actions - Prod Environment
resource "aws_iam_role" "github_actions_prod" {
  name = "goalsguild-github-actions-role-prod"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/main",
              "repo:${local.github_repo}:ref:refs/heads/master",
              "repo:${local.github_repo}:pull_request",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-role-prod"
    environment = "prod"
  })
}

# Environment-scoped deployment policies: each role can only create/update resources
# tagged with environment matching the role (dev, staging, prod).
# - Create: request must include tag environment=<env> (aws:RequestTag/environment).
# - Update/delete: resource must have tag environment=<env> (service ResourceTag where supported).

# Per-environment deployment policy (dev)
resource "aws_iam_policy" "github_actions_deployment_dev" {
  name        = "goalsguild-github-actions-deployment-policy-dev"
  description = "GitHub Actions deployment policy for dev; only resources with tag environment=dev"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        # Terraform state: ListBucket uses bucket ARN; object ops use bucket/* (no tag condition; shared)
        {
          Sid      = "TerraformStateListBucket"
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = ["arn:aws:s3:::terraform-state-*"]
        },
        {
          Sid      = "TerraformStateObjects"
          Effect   = "Allow"
          Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
          Resource = ["arn:aws:s3:::terraform-state-*/*"]
        },
        {
          Sid    = "TerraformLock"
          Effect = "Allow"
          Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
          Resource = ["arn:aws:dynamodb:*:*:table/terraform-state-lock"]
        },
        # STS (no resource)
        {
          Sid      = "STS"
          Effect   = "Allow"
          Action   = ["sts:GetCallerIdentity"]
          Resource = "*"
        },
        # ECR login (no resource/tag; required for docker push in CI)
        {
          Sid      = "ECRGetAuthorizationToken"
          Effect   = "Allow"
          Action   = ["ecr:GetAuthorizationToken"]
          Resource = "*"
        },
        # Terraform read operations (scoped by resource tag environment=dev)
        {
          Sid      = "CognitoReadOperations"
          Effect   = "Allow"
          Action   = ["cognito-idp:DescribeUserPool", "cognito-idp:DescribeUserPoolClient", "cognito-idp:ListUserPools", "cognito-idp:ListUserPoolClients", "cognito-idp:GetUserPoolMfaConfig", "cognito-idp:ListTagsForResource", "cognito-idp:DescribeIdentityProvider", "cognito-idp:ListIdentityProviders"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "dev" } }
        },
        {
          Sid      = "LambdaReadOperations"
          Effect   = "Allow"
          Action   = ["lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:GetFunctionConcurrency", "lambda:ListFunctions", "lambda:ListVersionsByFunction", "lambda:ListAliases", "lambda:ListEventSourceMappings", "lambda:GetPolicy", "lambda:ListTags", "lambda:GetFunctionUrlConfig", "lambda:ListFunctionUrlConfigs", "lambda:GetCodeSigningConfig", "lambda:GetLayerVersion", "lambda:ListLayerVersions", "lambda:ListLayers"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "dev" } }
        },
        {
          Sid      = "S3ReadOperations"
          Effect   = "Allow"
          Action   = ["s3:GetBucketLocation", "s3:GetBucketVersioning", "s3:GetBucketPublicAccessBlock", "s3:GetBucketAcl", "s3:GetBucketCORS", "s3:GetBucketEncryption", "s3:GetBucketLogging", "s3:GetBucketNotification", "s3:GetBucketPolicy", "s3:GetBucketPolicyStatus", "s3:GetBucketRequestPayment", "s3:GetBucketTagging", "s3:GetBucketWebsite", "s3:GetAccelerateConfiguration", "s3:GetLifecycleConfiguration", "s3:GetReplicationConfiguration", "s3:GetObject", "s3:GetObjectAcl", "s3:GetObjectTagging", "s3:GetObjectVersion", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging", "s3:ListBucket", "s3:ListBucketVersions", "s3:ListAllMyBuckets", "s3:ListMultipartUploadParts", "s3:ListMultipartUploads"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "dev" } }
        },
        {
          Sid      = "AppSyncReadOperations"
          Effect   = "Allow"
          Action   = ["appsync:GetGraphqlApi", "appsync:ListGraphqlApis", "appsync:GetSchemaCreationStatus", "appsync:GetDataSource", "appsync:ListDataSources", "appsync:GetResolver", "appsync:ListResolvers", "appsync:GetFunction", "appsync:ListFunctions", "appsync:ListApiKeys", "appsync:GetApiKey", "appsync:ListTagsForResource", "appsync:GetApiCache", "appsync:GetDomainName", "appsync:ListDomainNames"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "dev" } }
        }
      ],
      # IAM: PassRole only (for Lambda/API Gateway) - no create/update/delete of IAM roles or policies
      # All IAM create/update operations must run via the separate deploy-iam pipeline
      [
        {
          Sid      = "IAMPassRole"
          Effect   = "Allow"
          Action   = "iam:PassRole"
          Resource = "*"
          Condition = {
            "ForAnyValue:StringEquals" = {
              "iam:PassedToService" = [
                "lambda.amazonaws.com",
                "apigateway.amazonaws.com",
                "events.amazonaws.com",
                "logs.amazonaws.com"
              ]
            }
          }
        }
      ],
      # Services used by this project only: Lambda, API Gateway, DynamoDB, S3, CloudFront, ACM, WAF, Logs, EventBridge, SSM, KMS, SES, Cognito, AppSync, ECR, CloudWatch (no EC2, ECS, Route53, application-autoscaling)
      [for svc in [
        { actions = ["lambda:*"], sid = "Lambda" },
        { actions = ["apigateway:*"], sid = "APIGateway" },
        { actions = ["dynamodb:*"], sid = "DynamoDB" },
        { actions = ["s3:*"], sid = "S3" },
        { actions = ["cloudfront:*"], sid = "CloudFront" },
        { actions = ["acm:*"], sid = "ACM" },
        { actions = ["waf:*", "wafv2:*"], sid = "WAF" },
        { actions = ["logs:*"], sid = "Logs" },
        { actions = ["events:*"], sid = "Events" },
        { actions = ["ssm:*"], sid = "SSM" },
        { actions = ["kms:*"], sid = "KMS" },
        { actions = ["ses:*"], sid = "SES" },
        { actions = ["cognito-idp:*"], sid = "Cognito" },
        { actions = ["appsync:*"], sid = "AppSync" },
        { actions = ["ecr:*"], sid = "ECR" },
        { actions = ["cloudwatch:*"], sid = "CloudWatch" }
      ] : {
        Sid    = svc.sid
        Effect = "Allow"
        Action = svc.actions
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/environment" = "dev"
          }
        }
      }],
      # Allow update/delete on existing resources (no IAM - IAM ops in deploy-iam pipeline)
      [
        { Sid = "IAMPassRoleResourceTag", Effect = "Allow", Action = "iam:PassRole", Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "dev" }, "ForAnyValue:StringEquals" = { "iam:PassedToService" = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com", "logs.amazonaws.com"] } } },
        { Sid = "ECRResourceTag", Effect = "Allow", Action = ["ecr:*"], Resource = ["arn:aws:ecr:*:*:repository/goalsguild_*"], Condition = { StringEquals = { "ecr:ResourceTag/environment" = "dev" } } }
      ]
    )
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-deployment-policy-dev"
    environment = "dev"
  })
}

# Per-environment deployment policy (staging)
resource "aws_iam_policy" "github_actions_deployment_staging" {
  name        = "goalsguild-github-actions-deployment-policy-staging"
  description = "GitHub Actions deployment policy for staging; only resources with tag environment=staging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid      = "TerraformStateListBucket"
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = ["arn:aws:s3:::terraform-state-*"]
        },
        {
          Sid      = "TerraformStateObjects"
          Effect   = "Allow"
          Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
          Resource = ["arn:aws:s3:::terraform-state-*/*"]
        },
        {
          Sid    = "TerraformLock"
          Effect = "Allow"
          Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
          Resource = ["arn:aws:dynamodb:*:*:table/terraform-state-lock"]
        },
        {
          Sid      = "STS"
          Effect   = "Allow"
          Action   = ["sts:GetCallerIdentity"]
          Resource = "*"
        },
        {
          Sid = "ECRGetAuthorizationToken"
          Effect = "Allow"
          Action = ["ecr:GetAuthorizationToken"]
          Resource = "*"
        },
        {
          Sid      = "CognitoReadOperations"
          Effect   = "Allow"
          Action   = ["cognito-idp:DescribeUserPool", "cognito-idp:DescribeUserPoolClient", "cognito-idp:ListUserPools", "cognito-idp:ListUserPoolClients", "cognito-idp:GetUserPoolMfaConfig", "cognito-idp:ListTagsForResource", "cognito-idp:DescribeIdentityProvider", "cognito-idp:ListIdentityProviders"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "staging" } }
        },
        {
          Sid      = "LambdaReadOperations"
          Effect   = "Allow"
          Action   = ["lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:GetFunctionConcurrency", "lambda:ListFunctions", "lambda:ListVersionsByFunction", "lambda:ListAliases", "lambda:ListEventSourceMappings", "lambda:GetPolicy", "lambda:ListTags", "lambda:GetFunctionUrlConfig", "lambda:ListFunctionUrlConfigs", "lambda:GetCodeSigningConfig", "lambda:GetLayerVersion", "lambda:ListLayerVersions", "lambda:ListLayers"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "staging" } }
        },
        {
          Sid      = "S3ReadOperations"
          Effect   = "Allow"
          Action   = ["s3:GetBucketLocation", "s3:GetBucketVersioning", "s3:GetBucketPublicAccessBlock", "s3:GetBucketAcl", "s3:GetBucketCORS", "s3:GetBucketEncryption", "s3:GetBucketLogging", "s3:GetBucketNotification", "s3:GetBucketPolicy", "s3:GetBucketPolicyStatus", "s3:GetBucketRequestPayment", "s3:GetBucketTagging", "s3:GetBucketWebsite", "s3:GetAccelerateConfiguration", "s3:GetLifecycleConfiguration", "s3:GetReplicationConfiguration", "s3:GetObject", "s3:GetObjectAcl", "s3:GetObjectTagging", "s3:GetObjectVersion", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging", "s3:ListBucket", "s3:ListBucketVersions", "s3:ListAllMyBuckets", "s3:ListMultipartUploadParts", "s3:ListMultipartUploads"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "staging" } }
        },
        {
          Sid      = "AppSyncReadOperations"
          Effect   = "Allow"
          Action   = ["appsync:GetGraphqlApi", "appsync:ListGraphqlApis", "appsync:GetSchemaCreationStatus", "appsync:GetDataSource", "appsync:ListDataSources", "appsync:GetResolver", "appsync:ListResolvers", "appsync:GetFunction", "appsync:ListFunctions", "appsync:ListApiKeys", "appsync:GetApiKey", "appsync:ListTagsForResource", "appsync:GetApiCache", "appsync:GetDomainName", "appsync:ListDomainNames"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "staging" } }
        }
      ],
      [
        {
          Sid      = "IAMPassRole"
          Effect   = "Allow"
          Action   = "iam:PassRole"
          Resource = "*"
          Condition = { "ForAnyValue:StringEquals" = { "iam:PassedToService" = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com", "logs.amazonaws.com"] } }
        }
      ],
      [for svc in [
        { actions = ["lambda:*"], sid = "Lambda" },
        { actions = ["apigateway:*"], sid = "APIGateway" },
        { actions = ["dynamodb:*"], sid = "DynamoDB" },
        { actions = ["s3:*"], sid = "S3" },
        { actions = ["cloudfront:*"], sid = "CloudFront" },
        { actions = ["acm:*"], sid = "ACM" },
        { actions = ["waf:*", "wafv2:*"], sid = "WAF" },
        { actions = ["logs:*"], sid = "Logs" },
        { actions = ["events:*"], sid = "Events" },
        { actions = ["ssm:*"], sid = "SSM" },
        { actions = ["kms:*"], sid = "KMS" },
        { actions = ["ses:*"], sid = "SES" },
        { actions = ["cognito-idp:*"], sid = "Cognito" },
        { actions = ["appsync:*"], sid = "AppSync" },
        { actions = ["ecr:*"], sid = "ECR" },
        { actions = ["cloudwatch:*"], sid = "CloudWatch" }
      ] : { Sid = svc.sid, Effect = "Allow", Action = svc.actions, Resource = "*", Condition = { StringEquals = { "aws:RequestTag/environment" = "staging" } } }],
      [
        { Sid = "IAMPassRoleResourceTag", Effect = "Allow", Action = "iam:PassRole", Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "staging" }, "ForAnyValue:StringEquals" = { "iam:PassedToService" = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com", "logs.amazonaws.com"] } } },
        { Sid = "ECRResourceTag", Effect = "Allow", Action = ["ecr:*"], Resource = ["arn:aws:ecr:*:*:repository/goalsguild_*"], Condition = { StringEquals = { "ecr:ResourceTag/environment" = "staging" } } }
      ]
    )
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-deployment-policy-staging"
    environment = "staging"
  })
}

# Per-environment deployment policy (prod)
resource "aws_iam_policy" "github_actions_deployment_prod" {
  name        = "goalsguild-github-actions-deployment-policy-prod"
  description = "GitHub Actions deployment policy for prod; only resources with tag environment=prod"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid      = "TerraformStateListBucket"
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = ["arn:aws:s3:::terraform-state-*"]
        },
        {
          Sid      = "TerraformStateObjects"
          Effect   = "Allow"
          Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
          Resource = ["arn:aws:s3:::terraform-state-*/*"]
        },
        {
          Sid    = "TerraformLock"
          Effect = "Allow"
          Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
          Resource = ["arn:aws:dynamodb:*:*:table/terraform-state-lock"]
        },
        {
          Sid      = "STS"
          Effect   = "Allow"
          Action   = ["sts:GetCallerIdentity"]
          Resource = "*"
        },
        {
          Sid = "ECRGetAuthorizationToken"
          Effect = "Allow"
          Action = ["ecr:GetAuthorizationToken"]
          Resource = "*"
        },
        {
          Sid      = "CognitoReadOperations"
          Effect   = "Allow"
          Action   = ["cognito-idp:DescribeUserPool", "cognito-idp:DescribeUserPoolClient", "cognito-idp:ListUserPools", "cognito-idp:ListUserPoolClients", "cognito-idp:GetUserPoolMfaConfig", "cognito-idp:ListTagsForResource", "cognito-idp:DescribeIdentityProvider", "cognito-idp:ListIdentityProviders"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "prod" } }
        },
        {
          Sid      = "LambdaReadOperations"
          Effect   = "Allow"
          Action   = ["lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:GetFunctionConcurrency", "lambda:ListFunctions", "lambda:ListVersionsByFunction", "lambda:ListAliases", "lambda:ListEventSourceMappings", "lambda:GetPolicy", "lambda:ListTags", "lambda:GetFunctionUrlConfig", "lambda:ListFunctionUrlConfigs", "lambda:GetCodeSigningConfig", "lambda:GetLayerVersion", "lambda:ListLayerVersions", "lambda:ListLayers"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "prod" } }
        },
        {
          Sid      = "S3ReadOperations"
          Effect   = "Allow"
          Action   = ["s3:GetBucketLocation", "s3:GetBucketVersioning", "s3:GetBucketPublicAccessBlock", "s3:GetBucketAcl", "s3:GetBucketCORS", "s3:GetBucketEncryption", "s3:GetBucketLogging", "s3:GetBucketNotification", "s3:GetBucketPolicy", "s3:GetBucketPolicyStatus", "s3:GetBucketRequestPayment", "s3:GetBucketTagging", "s3:GetBucketWebsite", "s3:GetAccelerateConfiguration", "s3:GetLifecycleConfiguration", "s3:GetReplicationConfiguration", "s3:GetObject", "s3:GetObjectAcl", "s3:GetObjectTagging", "s3:GetObjectVersion", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging", "s3:ListBucket", "s3:ListBucketVersions", "s3:ListAllMyBuckets", "s3:ListMultipartUploadParts", "s3:ListMultipartUploads"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "prod" } }
        },
        {
          Sid      = "AppSyncReadOperations"
          Effect   = "Allow"
          Action   = ["appsync:GetGraphqlApi", "appsync:ListGraphqlApis", "appsync:GetSchemaCreationStatus", "appsync:GetDataSource", "appsync:ListDataSources", "appsync:GetResolver", "appsync:ListResolvers", "appsync:GetFunction", "appsync:ListFunctions", "appsync:ListApiKeys", "appsync:GetApiKey", "appsync:ListTagsForResource", "appsync:GetApiCache", "appsync:GetDomainName", "appsync:ListDomainNames"]
          Resource = "*"
          Condition = { StringEquals = { "aws:ResourceTag/environment" = "prod" } }
        }
      ],
      [
        {
          Sid      = "IAMPassRole"
          Effect   = "Allow"
          Action   = "iam:PassRole"
          Resource = "*"
          Condition = { "ForAnyValue:StringEquals" = { "iam:PassedToService" = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com", "logs.amazonaws.com"] } }
        }
      ],
      [for svc in [
        { actions = ["lambda:*"], sid = "Lambda" },
        { actions = ["apigateway:*"], sid = "APIGateway" },
        { actions = ["dynamodb:*"], sid = "DynamoDB" },
        { actions = ["s3:*"], sid = "S3" },
        { actions = ["cloudfront:*"], sid = "CloudFront" },
        { actions = ["acm:*"], sid = "ACM" },
        { actions = ["waf:*", "wafv2:*"], sid = "WAF" },
        { actions = ["logs:*"], sid = "Logs" },
        { actions = ["events:*"], sid = "Events" },
        { actions = ["ssm:*"], sid = "SSM" },
        { actions = ["kms:*"], sid = "KMS" },
        { actions = ["ses:*"], sid = "SES" },
        { actions = ["cognito-idp:*"], sid = "Cognito" },
        { actions = ["appsync:*"], sid = "AppSync" },
        { actions = ["ecr:*"], sid = "ECR" },
        { actions = ["cloudwatch:*"], sid = "CloudWatch" }
      ] : { Sid = svc.sid, Effect = "Allow", Action = svc.actions, Resource = "*", Condition = { StringEquals = { "aws:RequestTag/environment" = "prod" } } }],
      [
        { Sid = "IAMPassRoleResourceTag", Effect = "Allow", Action = "iam:PassRole", Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "prod" }, "ForAnyValue:StringEquals" = { "iam:PassedToService" = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com", "logs.amazonaws.com"] } } },
        { Sid = "ECRResourceTag", Effect = "Allow", Action = ["ecr:*"], Resource = ["arn:aws:ecr:*:*:repository/goalsguild_*"], Condition = { StringEquals = { "ecr:ResourceTag/environment" = "prod" } } }
      ]
    )
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-deployment-policy-prod"
    environment = "prod"
  })
}

# Attach environment-scoped policy to each role
resource "aws_iam_role_policy_attachment" "github_actions_dev_deployment" {
  role       = aws_iam_role.github_actions_dev.name
  policy_arn = aws_iam_policy.github_actions_deployment_dev.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_staging_deployment" {
  role       = aws_iam_role.github_actions_staging.name
  policy_arn = aws_iam_policy.github_actions_deployment_staging.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_prod_deployment" {
  role       = aws_iam_role.github_actions_prod.name
  policy_arn = aws_iam_policy.github_actions_deployment_prod.arn
}

# -----------------------------------------------------------------------------
# IAM Pipeline Roles - Separate roles with full IAM permissions for deploy-iam
# Bootstrap: Run github-actions-oidc stack manually with admin credentials first.
# Then add AWS_ROLE_ARN_IAM_DEV/STAGING/PROD to GitHub secrets.
# -----------------------------------------------------------------------------

resource "aws_iam_role" "github_actions_iam_dev" {
  name = "goalsguild-github-actions-iam-role-dev"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/dev",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-iam-role-dev"
    environment = "dev"
  })
}

resource "aws_iam_role" "github_actions_iam_staging" {
  name = "goalsguild-github-actions-iam-role-staging"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/staging",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-iam-role-staging"
    environment = "staging"
  })
}

resource "aws_iam_role" "github_actions_iam_prod" {
  name = "goalsguild-github-actions-iam-role-prod"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${local.github_repo}:ref:refs/heads/main",
              "repo:${local.github_repo}:ref:refs/heads/master",
              "repo:${local.github_repo}:workflow_dispatch"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "goalsguild-github-actions-iam-role-prod"
    environment = "prod"
  })
}

# IAM pipeline policy: Terraform state + IAM + security stack resources
resource "aws_iam_policy" "github_actions_iam_pipeline" {
  name        = "goalsguild-github-actions-iam-pipeline-policy"
  description = "Full IAM and security stack permissions for deploy-iam pipeline"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "TerraformState"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = ["arn:aws:s3:::terraform-state-*"]
      },
      {
        Sid      = "TerraformStateObjects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["arn:aws:s3:::terraform-state-*/*"]
      },
      {
        Sid      = "TerraformLock"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
        Resource = ["arn:aws:dynamodb:*:*:table/terraform-state-lock"]
      },
      {
        Sid      = "STS"
        Effect   = "Allow"
        Action   = ["sts:GetCallerIdentity"]
        Resource = "*"
      },
      {
        Sid      = "IAMFull"
        Effect   = "Allow"
        Action   = ["iam:*"]
        Resource = "*"
      },
      {
        Sid      = "Cognito"
        Effect   = "Allow"
        Action   = ["cognito-idp:*"]
        Resource = "*"
      },
      {
        Sid      = "SSM"
        Effect   = "Allow"
        Action   = ["ssm:*"]
        Resource = "*"
      },
      {
        Sid      = "ECR"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid      = "Lambda"
        Effect   = "Allow"
        Action   = ["lambda:*"]
        Resource = "*"
      },
      {
        Sid      = "APIGateway"
        Effect   = "Allow"
        Action   = ["apigateway:*"]
        Resource = "*"
      },
      {
        Sid      = "DynamoDB"
        Effect   = "Allow"
        Action   = ["dynamodb:*"]
        Resource = "*"
      },
      {
        Sid      = "S3"
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = "*"
      },
      {
        Sid      = "AppSync"
        Effect   = "Allow"
        Action   = ["appsync:*"]
        Resource = "*"
      },
      {
        Sid      = "CloudWatch"
        Effect   = "Allow"
        Action   = ["logs:*", "cloudwatch:*", "events:*"]
        Resource = "*"
      },
      {
        Sid      = "KMS"
        Effect   = "Allow"
        Action   = ["kms:*"]
        Resource = "*"
      },
      {
        Sid      = "ECRFull"
        Effect   = "Allow"
        Action   = ["ecr:*"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_iam_dev" {
  role       = aws_iam_role.github_actions_iam_dev.name
  policy_arn = aws_iam_policy.github_actions_iam_pipeline.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_iam_staging" {
  role       = aws_iam_role.github_actions_iam_staging.name
  policy_arn = aws_iam_policy.github_actions_iam_pipeline.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_iam_prod" {
  role       = aws_iam_role.github_actions_iam_prod.name
  policy_arn = aws_iam_policy.github_actions_iam_pipeline.arn
}
