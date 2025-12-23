locals {
  resolvers_path = "../../resolvers"
  lambdas_path   = "../../lambdas"
}

data "aws_iam_policy_document" "allow_appsync_ddb" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:BatchGetItem"]
    resources = [var.core_table_arn, "${var.core_table_arn}/index/*"]
  }
}

# First module block removed - using the second one below

resource "aws_appsync_resolver" "query_myProfile" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myProfile"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myProfile.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

resource "aws_appsync_resolver" "query_isEmailAvailable" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "isEmailAvailable"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/isEmailAvailable.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_isNicknameAvailable" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "isNicknameAvailable"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/isNicknameAvailable.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_isNicknameAvailableForUser" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "isNicknameAvailableForUser"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/isNicknameAvailableForUser.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Goals resolvers
resource "aws_appsync_resolver" "query_myGoals" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myGoals"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myGoals.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

resource "aws_appsync_resolver" "query_myDashboardGoals" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myDashboardGoals"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myDashboardGoals.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Removed query_goal resolver - now using REST API endpoint

# Quest resolvers - removed query_myQuests, now using REST API endpoints

resource "aws_appsync_resolver" "query_activeGoalsCount" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "activeGoalsCount"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/activeGoalsCount.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

# Progress resolvers
resource "aws_appsync_resolver" "query_goalProgress" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "goalProgress"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.quest_http.name
  code        = file("${local.resolvers_path}/goalProgress.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub",
        "$context.arguments.goalId"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

resource "aws_appsync_resolver" "query_myGoalsProgress" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myGoalsProgress"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.quest_http.name
  code        = file("${local.resolvers_path}/myGoalsProgress.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

# Pipeline resolver for myGoalsWithTasks
resource "aws_appsync_resolver" "query_myGoalsWithTasks" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myGoalsWithTasks"
  kind   = "PIPELINE"
  code   = file("${local.resolvers_path}/myGoalsWithTasks.js")

  pipeline_config {
    functions = [
      aws_appsync_function.myGoalsWithTasks_getGoals.function_id,
      aws_appsync_function.myGoalsWithTasks_getTasks.function_id,
    ]
  }

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Pipeline function 1: Get Goals
resource "aws_appsync_function" "myGoalsWithTasks_getGoals" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.profile_ddb.name
  name        = "myGoalsWithTasks_getGoals"
  code        = file("${local.resolvers_path}/myGoalsWithTasks_getGoals.js")

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Pipeline function 2: Get Tasks
resource "aws_appsync_function" "myGoalsWithTasks_getTasks" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.profile_ddb.name
  name        = "myGoalsWithTasks_getTasks"
  code        = file("${local.resolvers_path}/myGoalsWithTasks_getTasks.js")

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_datasource" "profile_ddb" {
  api_id           = module.appsync.api_id
  name             = "ProfileDDB"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = module.appsync.ds_ddb_role_arn
  dynamodb_config {
    table_name = var.core_table_name
  }
}

# HTTP data source for quest service (progress operations)
resource "aws_appsync_datasource" "quest_http" {
  api_id           = module.appsync.api_id
  name             = "QuestHTTP"
  type             = "HTTP"
  service_role_arn = aws_iam_role.quest_http_role.arn
  http_config {
    endpoint = data.terraform_remote_state.quest_service.outputs.lambda_function_url
    authorization_config {
      authorization_type = "AWS_IAM"
      aws_iam_config {
        signing_region       = var.aws_region
        signing_service_name = "lambda"
      }
    }
  }
}

# IAM role for HTTP data source
resource "aws_iam_role" "quest_http_role" {
  name = "goalsguild-${var.environment}-appsync-quest-http-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "quest_http_policy" {
  role = aws_iam_role.quest_http_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["lambda:InvokeFunctionUrl"]
      Resource = data.terraform_remote_state.quest_service.outputs.lambda_function_arn
    }]
  })
}

data "terraform_remote_state" "database" {
  backend = "local"
  config  = { path = "../database/terraform.tfstate" }
}

data "terraform_remote_state" "authorizer" {
  backend = "local"
  config  = { path = "../authorizer/terraform.tfstate" }
}

data "terraform_remote_state" "quest_service" {
  backend = "local"
  config  = { path = "../services/quest-service/terraform.tfstate" }
}

data "aws_caller_identity" "current" {}

# User queries
resource "aws_appsync_resolver" "query_me" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "me"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/me.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

resource "aws_appsync_resolver" "query_user" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "user"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/user.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  # Enable caching for better performance - conditional
  dynamic "caching_config" {
    for_each = var.enable_appsync_caching ? [1] : []
    content {
      caching_keys = [
        "$context.identity.sub",
        "$context.arguments.userId"
      ]
      ttl = var.appsync_cache_ttl_seconds
    }
  }
}

resource "aws_appsync_resolver" "query_myLevelProgress" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myLevelProgress"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myLevelProgress.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_myLevelHistory" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myLevelHistory"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myLevelHistory.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_myBadges" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "myBadges"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/myBadges.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_badgeCatalog" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "badgeCatalog"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code        = file("${local.resolvers_path}/badgeCatalog.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Removed query_goals resolver - already exists in AppSync API

# Quest queries - removed duplicate, already defined above

# Removed task resolvers - already exist in AppSync API

# Removed createTask mutation resolver - already exists in AppSync API

# Messaging data source for core table (general rooms)
resource "aws_appsync_datasource" "messaging_ddb" {
  api_id           = module.appsync.api_id
  name             = "MessagingDDB"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.messaging_ddb_role.arn
  dynamodb_config {
    table_name = var.core_table_name
  }
}

# Messaging data source for guild table (guild rooms)
resource "aws_appsync_datasource" "messaging_guild_ddb" {
  api_id           = module.appsync.api_id
  name             = "MessagingGuildDDB"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.messaging_ddb_role.arn
  dynamodb_config {
    table_name = data.terraform_remote_state.database.outputs.guild_table_name
  }
}

# IAM role for messaging data source with permissions for both tables
# Subscription authorization data sources and functions

data "aws_lambda_function" "subscription_auth" {
  count         = var.lambda_subscription_auth_arn_override == "" && try(data.terraform_remote_state.authorizer.outputs.subscription_auth_lambda_arn, "") == "" ? 1 : 0
  function_name = "goalsguild_subscription_auth_${var.environment}"
}

resource "aws_iam_role" "subscription_auth_lambda_role" {
  name = "goalsguild-${var.environment}-appsync-subscription-auth-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "subscription_auth_lambda_policy" {
  role = aws_iam_role.subscription_auth_lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow",
      Action   = ["lambda:InvokeFunction"],
      Resource = local.subscription_auth_lambda_arn
    }]
  })
}

resource "aws_appsync_datasource" "subscription_auth_lambda" {
  api_id           = module.appsync.api_id
  name             = "SubscriptionAuthLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.subscription_auth_lambda_role.arn
  lambda_config {
    function_arn = local.subscription_auth_lambda_arn
  }
}

resource "aws_appsync_datasource" "none" {
  api_id = module.appsync.api_id
  name   = "NoneDataSource"
  type   = "NONE"
}

resource "aws_appsync_function" "subscription_auth" {
  api_id      = module.appsync.api_id
  name        = "SubscriptionAuthorizer"
  data_source = aws_appsync_datasource.subscription_auth_lambda.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/subscriptionAuth.js")
}

resource "aws_appsync_function" "availability_key_guard" {
  api_id      = module.appsync.api_id
  name        = "AvailabilityKeyGuard"
  data_source = aws_appsync_datasource.subscription_auth_lambda.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/availabilityAuth.js")
}

resource "aws_appsync_function" "availability_is_email" {
  api_id      = module.appsync.api_id
  name        = "AvailabilityIsEmail"
  data_source = aws_appsync_datasource.profile_ddb.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/isEmailAvailable.js")
}

resource "aws_appsync_function" "availability_is_nickname" {
  api_id      = module.appsync.api_id
  name        = "AvailabilityIsNickname"
  data_source = aws_appsync_datasource.profile_ddb.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/isNicknameAvailable.js")
}

resource "aws_appsync_function" "subscription_on_message_payload" {
  api_id      = module.appsync.api_id
  name        = "SubscriptionOnMessagePayload"
  data_source = aws_appsync_datasource.none.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/onMessage.subscribe.js")
}

resource "aws_appsync_function" "subscription_on_reaction_payload" {
  api_id      = module.appsync.api_id
  name        = "SubscriptionOnReactionPayload"
  data_source = aws_appsync_datasource.none.name
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
  code = file("${local.resolvers_path}/onReaction.subscribe.js")
}

resource "aws_iam_role" "messaging_ddb_role" {
  name = "goalsguild-${var.environment}-appsync-messaging-ddb-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "messaging_ddb_policy" {
  role = aws_iam_role.messaging_ddb_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:TransactWriteItems"
      ]
      Resource = [
        data.terraform_remote_state.database.outputs.gg_core_table_arn,
        "${data.terraform_remote_state.database.outputs.gg_core_table_arn}/index/*",
        data.terraform_remote_state.database.outputs.guild_table_arn,
        "${data.terraform_remote_state.database.outputs.guild_table_arn}/index/*"
      ]
    }]
  })
}

# Lambda function for batch fetching messages with reactions
# Use existing lambda exec role from variables or fallback to constructed ARN
locals {
  # Use var.existing_lambda_exec_role_name if provided, otherwise construct ARN
  # Fallback to the standard lambda exec role name pattern
  messages_batch_lambda_role_arn = var.existing_lambda_exec_role_name != "" ? "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.existing_lambda_exec_role_name}" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/goalsguild_lambda_exec_role_${var.environment}"
}

module "messages_batch_lambda" {
  source            = "../../modules/lambda_zip"
  function_name     = "goalsguild_appsync_messages_batch"
  environment       = var.environment
  role_arn          = local.messages_batch_lambda_role_arn
  handler           = "lambda_function.handler"
  src_dir           = "${local.lambdas_path}/appsync_messages_batch"
  timeout           = 10
  memory_size       = 256
  requirements_file = "requirements.txt"
  exclude_globs = [
    ".git/**",
    ".venv/**",
    "__pycache__/**",
    "*.pyc",
    "*.pyo",
    "*.pyd"
  ]
  environment_variables = {
    DYNAMODB_TABLE_NAME = var.core_table_name
    GUILD_TABLE_NAME     = data.terraform_remote_state.database.outputs.guild_table_name
    ENVIRONMENT         = var.environment
  }
}

# Lambda function for sending messages (supports both tables)
module "send_message_lambda" {
  source            = "../../modules/lambda_zip"
  function_name     = "goalsguild_appsync_send_message"
  environment       = var.environment
  role_arn          = local.messages_batch_lambda_role_arn
  handler           = "lambda_function.handler"
  src_dir           = "${local.lambdas_path}/appsync_send_message"
  timeout           = 10
  memory_size       = 256
  requirements_file = "requirements.txt"
  exclude_globs = [
    ".git/**",
    ".venv/**",
    "__pycache__/**",
    "*.pyc",
    "*.pyo",
    "*.pyd"
  ]
  environment_variables = {
    DYNAMODB_TABLE_NAME = var.core_table_name
    GUILD_TABLE_NAME     = data.terraform_remote_state.database.outputs.guild_table_name
    ENVIRONMENT         = var.environment
  }
}

# IAM role for AppSync to invoke the Lambda
resource "aws_iam_role" "messages_batch_lambda_invoke_role" {
  name = "goalsguild-${var.environment}-appsync-messages-batch-invoke-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "messages_batch_lambda_invoke_policy" {
  role = aws_iam_role.messages_batch_lambda_invoke_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow",
      Action   = ["lambda:InvokeFunction"],
      Resource = [
        module.messages_batch_lambda.lambda_arn,
        module.send_message_lambda.lambda_arn
      ]
    }]
  })
}

# AppSync data source for messages batch Lambda
resource "aws_appsync_datasource" "messages_batch_lambda" {
  api_id           = module.appsync.api_id
  name             = "MessagesBatchLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.messages_batch_lambda_invoke_role.arn
  lambda_config {
    function_arn = module.messages_batch_lambda.lambda_arn
  }
}

# AppSync data source for sendMessage Lambda
resource "aws_appsync_datasource" "send_message_lambda" {
  api_id           = module.appsync.api_id
  name             = "SendMessageLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.messages_batch_lambda_invoke_role.arn
  lambda_config {
    function_arn = module.send_message_lambda.lambda_arn
  }
}

# Messaging resolvers - Using Lambda for batch fetching messages with reactions
resource "aws_appsync_resolver" "query_messages" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "messages"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.messages_batch_lambda.name
  
  # Lambda resolver uses request/response templates
  request_template = <<-TEMPLATE
    {
      "version": "2018-05-29",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "resolverContext": $util.toJson($context.resolverContext)
      }
    }
  TEMPLATE
  
  response_template = <<-TEMPLATE
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    #if($ctx.result)
      $util.toJson($ctx.result)
    #else
      []
    #end
  TEMPLATE
}

# Resolver for Message.reactions field - kept as fallback but should not be needed
# since Lambda resolver returns reactions with messages. This is only used if reactions
# are queried separately (not included in messages query).
resource "aws_appsync_resolver" "message_reactions" {
  api_id      = module.appsync.api_id
  type        = "Message"
  field       = "reactions"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.messaging_ddb.name
  code        = file("${local.resolvers_path}/messageReactions.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "mutation_sendMessage" {
  api_id      = module.appsync.api_id
  type        = "Mutation"
  field       = "sendMessage"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.send_message_lambda.name
  
  # Lambda resolver uses request/response templates
  request_template = <<-TEMPLATE
    {
      "version": "2018-05-29",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "resolverContext": $util.toJson($context.resolverContext)
      }
    }
  TEMPLATE
  
  response_template = <<-TEMPLATE
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    #if($ctx.result)
      $util.toJson($ctx.result)
    #else
      $util.error("Failed to send message", "InternalFailure")
    #end
  TEMPLATE
}

# Reactions resolvers
resource "aws_appsync_resolver" "query_reactions" {
  api_id      = module.appsync.api_id
  type        = "Query"
  field       = "reactions"
  kind        = "UNIT"
  data_source = aws_appsync_datasource.messaging_ddb.name
  code        = file("${local.resolvers_path}/reactions.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_function" "addReaction_put" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.messaging_ddb.name
  name        = "addReaction_put"
  code        = file("${local.resolvers_path}/addReaction_put.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_function" "addReaction_updateSummary" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.messaging_ddb.name
  name        = "addReaction_updateSummary"
  code        = file("${local.resolvers_path}/reaction_updateSummary.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_function" "addReaction_fetchSummary" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.messaging_ddb.name
  name        = "addReaction_fetchSummary"
  code        = file("${local.resolvers_path}/reaction_fetchSummary.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_function" "removeReaction_delete" {
  api_id      = module.appsync.api_id
  data_source = aws_appsync_datasource.messaging_ddb.name
  name        = "removeReaction_delete"
  code        = file("${local.resolvers_path}/removeReaction_delete.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "mutation_addReaction" {
  api_id = module.appsync.api_id
  type   = "Mutation"
  field  = "addReaction"
  kind   = "PIPELINE"
  code   = file("${local.resolvers_path}/addReaction.js")

  pipeline_config {
    functions = [
      aws_appsync_function.addReaction_put.function_id,
      aws_appsync_function.addReaction_updateSummary.function_id,
      aws_appsync_function.addReaction_fetchSummary.function_id,
    ]
  }

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "mutation_removeReaction" {
  api_id = module.appsync.api_id
  type   = "Mutation"
  field  = "removeReaction"
  kind   = "PIPELINE"
  code   = file("${local.resolvers_path}/removeReaction.js")

  pipeline_config {
    functions = [
      aws_appsync_function.removeReaction_delete.function_id,
      aws_appsync_function.addReaction_updateSummary.function_id,
      aws_appsync_function.addReaction_fetchSummary.function_id,
    ]
  }

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "subscription_onMessage" {
  api_id = module.appsync.api_id
  type   = "Subscription"
  field  = "onMessage"
  kind   = "PIPELINE"
  pipeline_config {
    functions = [
      aws_appsync_function.subscription_auth.function_id,
      aws_appsync_function.subscription_on_message_payload.function_id,
    ]
  }
  request_template  = "$util.toJson({})"
  response_template = "$util.toJson($ctx.prev.result)"
}

resource "aws_appsync_resolver" "subscription_onReaction" {
  api_id = module.appsync.api_id
  type   = "Subscription"
  field  = "onReaction"
  kind   = "PIPELINE"
  pipeline_config {
    functions = [
      aws_appsync_function.subscription_auth.function_id,
      aws_appsync_function.subscription_on_reaction_payload.function_id,
    ]
  }
  request_template  = "$util.toJson({})"
  response_template = "$util.toJson($ctx.prev.result)"
}

locals {
  schema_path                  = "${path.module}/../../graphql/schema.graphql"
  appsync_param_prefix         = "/goalsguild/${var.environment}/appsync"
  subscription_key_expires     = timeadd(timestamp(), format("%dh", var.subscription_key_ttl_hours))
  availability_key_expires     = timeadd(timestamp(), format("%dh", var.availability_key_ttl_hours))
  subscription_auth_lambda_arn = var.lambda_subscription_auth_arn_override != "" ? var.lambda_subscription_auth_arn_override : try(data.terraform_remote_state.authorizer.outputs.subscription_auth_lambda_arn, data.aws_lambda_function.subscription_auth[0].arn)
}

module "appsync" {
  source                = "../../modules/appsync"
  name                  = "goalsguild-${var.environment}-api"
  auth_type             = var.appsync_auth_type
  schema_path           = local.schema_path
  region                = var.aws_region
  enable_api_key        = var.enable_appsync_api_key
  lambda_authorizer_arn = data.terraform_remote_state.authorizer.outputs.lambda_authorizer_arn
  ddb_table_name        = data.terraform_remote_state.database.outputs.gg_core_table_name
  ddb_table_arn         = data.terraform_remote_state.database.outputs.gg_core_table_arn
  guild_table_name      = data.terraform_remote_state.database.outputs.guild_table_name
  guild_table_arn       = data.terraform_remote_state.database.outputs.guild_table_arn
  tags = {
    Project     = "goalsguild"
    Environment = var.environment
  }
}

resource "aws_appsync_api_key" "subscription" {
  api_id      = module.appsync.api_id
  description = "GoalsGuild ${var.environment} subscription websocket key"
  expires     = local.subscription_key_expires
}

resource "aws_appsync_api_key" "availability" {
  api_id      = module.appsync.api_id
  description = "GoalsGuild ${var.environment} availability lookup key"
  expires     = local.availability_key_expires
}

resource "aws_ssm_parameter" "subscription_key" {
  name        = "${local.appsync_param_prefix}/subscription_key"
  description = "AppSync subscription key for ${var.environment}"
  type        = "SecureString"
  value       = aws_appsync_api_key.subscription.key
  overwrite   = true
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "appsync"
  }
}

resource "aws_ssm_parameter" "subscription_key_expires_at" {
  name        = "${local.appsync_param_prefix}/subscription_key_expires_at"
  description = "AppSync subscription key expiry for ${var.environment}"
  type        = "String"
  value       = aws_appsync_api_key.subscription.expires
  overwrite   = true
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "appsync"
  }
}

resource "aws_ssm_parameter" "availability_key" {
  name        = "${local.appsync_param_prefix}/availability_key"
  description = "AppSync availability key for ${var.environment}"
  type        = "SecureString"
  value       = aws_appsync_api_key.availability.key
  overwrite   = true
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "appsync"
  }
}

resource "aws_ssm_parameter" "availability_key_expires_at" {
  name        = "${local.appsync_param_prefix}/availability_key_expires_at"
  description = "AppSync availability key expiry for ${var.environment}"
  type        = "String"
  value       = aws_appsync_api_key.availability.expires
  overwrite   = true
  tags = {
    Environment = var.environment
    Service     = "goalsguild"
    Component   = "appsync"
  }
}

resource "aws_cloudwatch_metric_alarm" "appsync_unauthorized" {
  alarm_name          = "goalsguild-${var.environment}-appsync-unauthorized"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "4XXError"
  namespace           = "AWS/AppSync"
  period              = 300
  statistic           = "Sum"
  threshold           = var.appsync_unauthorized_error_threshold
  treat_missing_data  = "notBreaching"
  alarm_description   = "Triggers when AppSync 4XX errors exceed threshold (possible unauthorized subscriptions)."
  dimensions = {
    GraphQLAPIId = module.appsync.api_id
  }
}

resource "aws_cloudwatch_metric_alarm" "appsync_cost_guard" {
  provider            = aws.billing
  alarm_name          = "goalsguild-${var.environment}-appsync-cost-guard"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 21600
  statistic           = "Maximum"
  threshold           = var.appsync_monthly_cost_threshold
  treat_missing_data  = "notBreaching"
  alarm_description   = "Estimated AppSync spend is approaching the configured threshold."
  dimensions = {
    Currency    = var.billing_currency
    ServiceName = "Amazon AppSync"
  }
}


