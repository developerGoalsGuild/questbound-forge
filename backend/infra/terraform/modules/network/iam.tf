# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  name = "goalsguild_lambda_exec_role_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "lambda"
  }
}

# IAM Policy for Lambda basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda to read SSM parameter for User Service env vars
resource "aws_iam_role_policy" "lambda_ssm_read_user_service_env" {
  name = "goalsguild_lambda_ssm_read_user_service_env_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement: [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter"
        ],
        Resource = [
          aws_ssm_parameter.user_service_env_vars.arn,
          aws_ssm_parameter.quest_service_env_vars.arn
        ]
      }
    ]
  })
}


# Lets API Gateway write logs to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "apigw_push_to_cw" {
  role       = aws_iam_role.apigw_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}


resource "aws_iam_role_policy" "apigw_cloudwatch_policy" {
  name = "goalsguild_apigw_cloudwatch_policy_${var.environment}"
  role = aws_iam_role.apigw_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}




# Inline policy granting read access to specific SSM parameters
resource "aws_iam_role_policy" "lambda_ssm_read_policy" {
  name = "goalsguild_lambda_ssm_read_policy_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement: [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = [
          aws_ssm_parameter.cognito_client_secret.arn,
          aws_ssm_parameter.cognito_client_id.arn,
          aws_ssm_parameter.cognito_user_pool_id.arn,
          aws_ssm_parameter.user_service_env_vars.arn,
          aws_ssm_parameter.goals_guild_jwt_secret.arn,
          aws_ssm_parameter.goals_guild_email_token_secret.arn,
          aws_ssm_parameter.goals_guild_google_client_id.arn,
          aws_ssm_parameter.goals_guild_google_client_secret.arn,
          aws_ssm_parameter.quest_service_env_vars.arn,
          # Future-proof: allow all user-service params under this path
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/user-service/*",
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/quest-service/*"
        ]
      }
    ]
  })
}

# Allow Lambda exec role to write to gg_core table
resource "aws_iam_role_policy" "lambda_ddb_write" {
  name = "goalsguild_lambda_ddb_write_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ],
        Resource: [
          var.ddb_table_arn,
          "${var.ddb_table_arn}/index/*"
        ]
      }
    ]
  })
}

# Allow user-service Lambda to send emails via SES
resource "aws_iam_role_policy" "lambda_ses_send" {
  name = "goalsguild_lambda_ses_send_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ],
        Resource = "*"
      }
    ]
  })
}

# Allow Lambda exec role to write/query login-attempts table
resource "aws_iam_role_policy" "lambda_ddb_login_attempts" {
  name = "goalsguild_lambda_ddb_login_attempts_${var.environment}"
  role = aws_iam_role.lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:PutItem",
          "dynamodb:Query"
        ],
        Resource: [
          var.login_attempts_table_arn
        ]
      }
    ]
  })
}
