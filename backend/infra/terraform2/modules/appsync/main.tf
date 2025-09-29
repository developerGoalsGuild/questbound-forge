resource "aws_appsync_graphql_api" "this" {
  name                = var.name
  authentication_type = var.auth_type
  schema              = file(var.schema_path)

  dynamic "lambda_authorizer_config" {
    for_each = var.auth_type == "AWS_LAMBDA" ? [1] : []
    content {
      authorizer_uri                   = var.lambda_authorizer_arn
      authorizer_result_ttl_in_seconds = 300
      identity_validation_expression   = "^(Bearer\\s+)?[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"
    }
  }

  dynamic "additional_authentication_provider" {
    for_each = var.enable_api_key ? [1] : []
    content { authentication_type = "API_KEY" }
  }

  # Logging configuration removed as it requires additional IAM role setup
  # log_config {
  #   field_log_level = "ALL"
  # }

  tags = var.tags
}

resource "aws_appsync_datasource" "ddb" {
  api_id          = aws_appsync_graphql_api.this.id
  name            = "DDB"
  type            = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.ds_ddb_role.arn
  dynamodb_config {
    table_name = var.ddb_table_name
  }
}

resource "aws_iam_role" "ds_ddb_role" {
  name = "${var.name}-ds-ddb-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "appsync.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "ds_ddb_policy" {
  role = aws_iam_role.ds_ddb_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Action = ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:UpdateItem","dynamodb:TransactWriteItems"], Resource = [var.ddb_table_arn, "${var.ddb_table_arn}/index/*"] }]
  })
}

resource "aws_appsync_api_key" "this" {
  count  = var.enable_api_key ? 1 : 0
  api_id = aws_appsync_graphql_api.this.id
}
