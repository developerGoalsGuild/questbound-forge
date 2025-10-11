locals {
  resolvers_path = "../../resolvers"
}

data "aws_iam_policy_document" "allow_appsync_ddb" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:BatchGetItem"]
    resources = [var.core_table_arn, "${var.core_table_arn}/index/*"]
  }
}

# First module block removed - using the second one below

resource "aws_appsync_resolver" "query_myProfile" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myProfile"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/myProfile.js")
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
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "isEmailAvailable"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/isEmailAvailable.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_isNicknameAvailable" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "isNicknameAvailable"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/isNicknameAvailable.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_isNicknameAvailableForUser" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "isNicknameAvailableForUser"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/isNicknameAvailableForUser.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Goals resolvers
resource "aws_appsync_resolver" "query_myGoals" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myGoals"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/myGoals.js")
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
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myDashboardGoals"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/myDashboardGoals.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "query_goal" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "goal"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/getGoal.js")
  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Quest resolvers
resource "aws_appsync_resolver" "query_myQuests" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myQuests"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/myQuests.js")
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

resource "aws_appsync_resolver" "query_activeGoalsCount" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "activeGoalsCount"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/activeGoalsCount.js")
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
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "goalProgress"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.quest_http.name
  code   = file("${local.resolvers_path}/goalProgress.js")
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
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "myGoalsProgress"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.quest_http.name
  code   = file("${local.resolvers_path}/myGoalsProgress.js")
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
    endpoint                      = data.terraform_remote_state.quest_service.outputs.lambda_function_url
    authorization_config {
      authorization_type = "AWS_IAM"
      aws_iam_config {
        signing_region      = var.aws_region
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
      Effect = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "quest_http_policy" {
  role = aws_iam_role.quest_http_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["lambda:InvokeFunctionUrl"]
      Resource = data.terraform_remote_state.quest_service.outputs.lambda_function_arn
    }]
  })
}

data "terraform_remote_state" "database" {
  backend = "local"
  config = { path = "../database/terraform.tfstate" }
}

data "terraform_remote_state" "authorizer" {
  backend = "local"
  config = { path = "../authorizer/terraform.tfstate" }
}

data "terraform_remote_state" "quest_service" {
  backend = "local"
  config = { path = "../services/quest-service/terraform.tfstate" }
}

# User queries
resource "aws_appsync_resolver" "query_me" {
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "me"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/me.js")
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
  api_id = module.appsync.api_id
  type   = "Query"
  field  = "user"
  kind   = "UNIT"
  data_source = aws_appsync_datasource.profile_ddb.name
  code   = file("${local.resolvers_path}/user.js")
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

# Removed query_goals resolver - already exists in AppSync API

# Quest queries - removed duplicate, already defined above

# Removed task resolvers - already exist in AppSync API

# Removed createTask mutation resolver - already exists in AppSync API

locals {
  schema_path = "${path.module}/../../graphql/schema.graphql"
}

module "appsync" {
  source      = "../../modules/appsync"
  name        = "goalsguild-${var.environment}-api"
  auth_type   = var.appsync_auth_type
  schema_path = local.schema_path
  region      = var.aws_region
  enable_api_key = var.enable_appsync_api_key
  lambda_authorizer_arn = data.terraform_remote_state.authorizer.outputs.lambda_authorizer_arn
  ddb_table_name = data.terraform_remote_state.database.outputs.gg_core_table_name
  ddb_table_arn  = data.terraform_remote_state.database.outputs.gg_core_table_arn
  tags = {
    Project     = "goalsguild"
    Environment = var.environment
  }
}
