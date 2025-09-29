locals {
  lambda_role_name = var.existing_lambda_exec_role_name != "" ? var.existing_lambda_exec_role_name : "goalsguild_lambda_exec_role_${var.environment}"
}

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
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = merge(var.tags, {
    Environment = var.environment
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
    Statement = [{
      Effect = "Allow",
      Action = ["ssm:GetParameter","ssm:GetParameters","ssm:GetParametersByPath"],
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter/goalsguild/*"
      ]
    }]
  })
}
