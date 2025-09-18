
# IAM Role for Lambda Authorizer with least privilege
resource "aws_iam_role" "lambda_authorizer_role" {
  name = var.user_service_lambda_authorizer_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = ["lambda.amazonaws.com"]
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_authorizer_policy" {
  name        = "goalsguild_lambda_authorizer_policy"
  description = "Policy for Lambda authorizer to access SSM, DynamoDB, and CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",          
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/user-service/*",
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/crypto/*",
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/cognito/*"
          
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/native-users-table"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
       {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_authorizer_attach" {
  role       = aws_iam_role.lambda_authorizer_role.name
  policy_arn = aws_iam_policy.lambda_authorizer_policy.arn
}


# Output Lambda authorizer ARN for API Gateway module usage
output "lambda_authorizer_role_arn" {
  value = aws_iam_role.lambda_authorizer_role.arn
}





# Output Lambda authorizer ARN for API Gateway module usage
