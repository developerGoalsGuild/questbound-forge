locals {
  lambda_role_name = var.existing_lambda_exec_role_name != "" ? var.existing_lambda_exec_role_name : "goalsguild_lambda_exec_role_${var.environment}"
}

data "aws_caller_identity" "current" {}

data "aws_iam_role" "existing_lambda_exec" {
  count = var.existing_lambda_exec_role_name != "" ? 1 : 0
  name  = var.existing_lambda_exec_role_name
}

resource "aws_iam_role" "lambda_exec_role" {
  count = var.existing_lambda_exec_role_name == "" ? 1 : 0
  name  = local.lambda_role_name
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(var.tags, {
    Environment = var.environment
    environment = var.environment
    Component   = "lambda"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].name : aws_iam_role.lambda_exec_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_ssm_read" {
  name = "goalsguild_lambda_ssm_read_${var.environment}"
  role = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].id : aws_iam_role.lambda_exec_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/goalsguild/*"
        ]
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt"],
        Resource = "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/aws/ssm"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name = "goalsguild_lambda_dynamodb_access_${var.environment}"
  role = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].id : aws_iam_role.lambda_exec_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems",
        "dynamodb:TransactGetItems"
      ],
      Resource = [
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_core",
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_core/index/*",
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_guild",
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_guild/index/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_ses_access" {
  name = "goalsguild_lambda_ses_access_${var.environment}"
  role = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].id : aws_iam_role.lambda_exec_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "sesv2:SendEmail",
        "sesv2:SendBulkEmail"
      ],
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "goalsguild_lambda_s3_access_${var.environment}"
  role = var.existing_lambda_exec_role_name != "" ? data.aws_iam_role.existing_lambda_exec[0].id : aws_iam_role.lambda_exec_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      Resource = [
        "arn:aws:s3:::goalsguild-guild-avatars-${var.environment}/*"
      ]
    }]
  })
}

# Collaboration Service IAM Role
resource "aws_iam_role" "collaboration_service_role" {
  name = "goalsguild_collaboration_service_role_${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(var.tags, {
    Environment = var.environment
    environment = var.environment
    Component   = "collaboration-service"
  })
}

resource "aws_iam_role_policy_attachment" "collaboration_service_basic_execution" {
  role       = aws_iam_role.collaboration_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "collaboration_service_ssm_read" {
  name = "goalsguild_collaboration_service_ssm_read_${var.environment}"
  role = aws_iam_role.collaboration_service_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter/goalsguild/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "collaboration_service_dynamodb_access" {
  name = "goalsguild_collaboration_service_dynamodb_access_${var.environment}"
  role = aws_iam_role.collaboration_service_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      Resource = [
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_core",
        "arn:aws:dynamodb:${var.aws_region}:*:table/gg_core/index/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "collaboration_service_cognito_read" {
  name = "goalsguild_collaboration_service_cognito_read_${var.environment}"
  role = aws_iam_role.collaboration_service_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "cognito-idp:ListUsers",
        "cognito-idp:AdminGetUser"
      ],
      Resource = [
        "arn:aws:cognito-idp:${var.aws_region}:*:userpool/*"
      ]
    }]
  })
}
