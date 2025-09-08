
# Local table reference so we can attach policy — use data source input

# GraphQL API
resource "aws_appsync_graphql_api" "this" {



name = var.name
authentication_type = var.auth_type
schema = file(var.schema_path)

dynamic "lambda_authorizer_config" {
    for_each = var.auth_type == "AWS_LAMBDA" ? [1] : []
    content {
        authorizer_uri = var.lambda_authorizer_arn
        authorizer_result_ttl_in_seconds = 900
        identity_validation_expression = "^Bearer [-0-9a-zA-Z\\._]*$" # also works
    }
}


/*dynamic "user_pool_config" {
    for_each = var.auth_type == "AMAZON_COGNITO_USER_POOLS" ? [1] : []
    content {
        user_pool_id = var.user_pool_id
        aws_region = var.region
        default_action = "ALLOW"
    }
}
*/

# Optionally allow API key as an additional auth provider for public fields
dynamic "additional_authentication_provider" {
  for_each = var.enable_api_key ? [1] : []
  content {
    authentication_type = "API_KEY"
  }
}

log_config {
      cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
      field_log_level           = "ALL"
      exclude_verbose_content   = false
    }
    xray_enabled = false
    tags = var.tags
}



resource "aws_appsync_datasource" "ddb" {
    api_id = aws_appsync_graphql_api.this.id
    name = "DDB"
    type = "AMAZON_DYNAMODB"
    service_role_arn = aws_iam_role.ds_ddb_role.arn
    dynamodb_config {
    table_name = var.ddb_table_name
   
}
}


# Data sources
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
    Statement = [{ Effect = "Allow", Action = ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:UpdateItem","dynamodb:TransactWriteItems"], Resource = [
     var.ddb_table_arn,"${var.ddb_table_arn}/index/*"
] }]
})
}





resource "aws_appsync_datasource" "none" {
    api_id = aws_appsync_graphql_api.this.id
    name = "NONE"
    type = "NONE"
}

# Optional Lambda data source for user operations (e.g., signup)
resource "aws_iam_role" "ds_lambda_role" {
  count = length(var.lambda_user_function_arn) > 0 ? 1 : 0
  name  = "${var.name}-ds-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "appsync.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "ds_lambda_invoke" {
  count = length(var.lambda_user_function_arn) > 0 ? 1 : 0
  role  = aws_iam_role.ds_lambda_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["lambda:InvokeFunction"],
      Resource = [var.lambda_user_function_arn]
    }]
  })
}

resource "aws_appsync_datasource" "lambda_user" {
  count = length(var.lambda_user_function_arn) > 0 ? 1 : 0
  api_id = aws_appsync_graphql_api.this.id
  name   = "LAMBDA_USER"
  type   = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.ds_lambda_role[0].arn
  lambda_config {
    lambda_function_arn = var.lambda_user_function_arn
  }
}

# Optional Lambda data source for persistence
resource "aws_appsync_datasource" "lambda_persist" {
  count = length(var.lambda_persist_function_arn) > 0 ? 1 : 0
  api_id = aws_appsync_graphql_api.this.id
  name   = "LAMBDA_PERSIST"
  type   = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.ds_lambda_role[0].arn
  lambda_config {
    lambda_function_arn = var.lambda_persist_function_arn
  }
}


# Resolvers from map
resource "aws_appsync_resolver" "this" {
    for_each = var.resolvers
    api_id = aws_appsync_graphql_api.this.id
    type = each.value.type
    field = each.value.field
    data_source = (
      each.value.data_source == "DDB" ? aws_appsync_datasource.ddb.name : (
      each.value.data_source == "LAMBDA_USER" ? aws_appsync_datasource.lambda_user[0].name : (
      each.value.data_source == "LAMBDA_PERSIST" ? aws_appsync_datasource.lambda_persist[0].name : aws_appsync_datasource.none.name)))
    kind = length(try(each.value.pipeline, [])) > 0 ? "PIPELINE" : "UNIT"
    code = file(each.value.code_path)
    dynamic "pipeline_config" {
      for_each = length(try(each.value.pipeline, [])) > 0 ? [1] : []
      content {
        functions = [for fkey in each.value.pipeline : aws_appsync_function.this[fkey].function_id]
      }
    }
    runtime { 
        name = "APPSYNC_JS" 
        runtime_version = "1.0.0" 
    }
}

# Allow AppSync to invoke the Lambda if configured
resource "aws_lambda_permission" "allow_appsync_invoke_user" {
  count         = length(var.lambda_user_function_arn) > 0 ? 1 : 0
  statement_id  = "AllowAppSyncInvokeUserLambda"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_user_function_arn
  principal     = "appsync.amazonaws.com"
  source_arn    = aws_appsync_graphql_api.this.arn
}

resource "aws_lambda_permission" "allow_appsync_invoke_persist" {
  count         = length(var.lambda_persist_function_arn) > 0 ? 1 : 0
  statement_id  = "AllowAppSyncInvokePersistLambda"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_persist_function_arn
  principal     = "appsync.amazonaws.com"
  source_arn    = aws_appsync_graphql_api.this.arn
}

# AppSync Functions for Pipelines
resource "aws_appsync_function" "this" {
  for_each    = var.functions
  api_id      = aws_appsync_graphql_api.this.id
  name        = each.value.name
  data_source = (
    each.value.data_source == "DDB" ? aws_appsync_datasource.ddb.name : (
    each.value.data_source == "LAMBDA_USER" ? aws_appsync_datasource.lambda_user[0].name : (
    each.value.data_source == "LAMBDA_PERSIST" ? aws_appsync_datasource.lambda_persist[0].name : aws_appsync_datasource.none.name)))
  code = file(each.value.code_path)
  runtime { 
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}



# Optional AppSync API key (used only when enable_api_key = true)
resource "aws_appsync_api_key" "this" {
  count  = var.enable_api_key ? 1 : 0
  api_id = aws_appsync_graphql_api.this.id
}
# IAM role to allow AppSync to write CloudWatch Logs
resource "aws_iam_role" "appsync_logs" {
  name = "${var.name}-cw-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "appsync.amazonaws.com" },
      Action   = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs_attach" {
  role       = aws_iam_role.appsync_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

# Ensure log group exists with 1-day retention
resource "aws_cloudwatch_log_group" "appsync" {
  name              = "/aws/appsync/apis/${aws_appsync_graphql_api.this.id}"
  retention_in_days = 1
}
