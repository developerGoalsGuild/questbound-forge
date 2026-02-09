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
        }
      ],
      # IAM: allow all except PassRole and CreateServiceLinkedRole (scoped by RequestTag); PassRole only with PassedToService
      [
        {
          Sid       = "IAMNoPassRole"
          Effect    = "Allow"
          NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"]
          Resource  = "*"
          Condition = { StringEquals = { "aws:RequestTag/environment" = "dev" } }
        },
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
      # Allow update/delete on existing resources that already have tag environment=dev (project uses IAM, ECR only; no EC2)
      [
        { Sid = "IAMResourceTag", Effect = "Allow", NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"], Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "dev" } } },
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
        }
      ],
      [
        {
          Sid       = "IAMNoPassRole"
          Effect    = "Allow"
          NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"]
          Resource  = "*"
          Condition = { StringEquals = { "aws:RequestTag/environment" = "staging" } }
        },
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
        { Sid = "IAMResourceTag", Effect = "Allow", NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"], Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "staging" } } },
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
        }
      ],
      [
        {
          Sid       = "IAMNoPassRole"
          Effect    = "Allow"
          NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"]
          Resource  = "*"
          Condition = { StringEquals = { "aws:RequestTag/environment" = "prod" } }
        },
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
        { Sid = "IAMResourceTag", Effect = "Allow", NotAction = ["iam:PassRole", "iam:CreateServiceLinkedRole"], Resource = "*", Condition = { StringEquals = { "iam:ResourceTag/environment" = "prod" } } },
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
