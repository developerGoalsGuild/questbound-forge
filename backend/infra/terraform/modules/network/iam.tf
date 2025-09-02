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
          aws_ssm_parameter.user_service_env_vars.arn
        ]
      }
    ]
  })
}

# IAM Role for API Gateway to write logs
resource "aws_iam_role" "apigw_cloudwatch_role" {
  name = "goalsguild_apigw_cloudwatch_role_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
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
          aws_ssm_parameter.user_service_env_vars.arn
        ]
      }
    ]
  })
}


