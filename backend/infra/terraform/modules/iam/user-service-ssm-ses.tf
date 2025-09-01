resource "aws_iam_policy" "user_service_ssm_ses_access" {
  name        = "UserServiceSSMandSESAccess"
  description = "Allow user service to access SSM parameters and SES send email"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/dev/crypto/*",
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/goalsguild/dev/cognito/*"
        ]
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

resource "aws_iam_role_policy_attachment" "user_service_ssm_ses_attach" {
  role       = var.user_service_role_name
  policy_arn = aws_iam_policy.user_service_ssm_ses_access.arn
}
