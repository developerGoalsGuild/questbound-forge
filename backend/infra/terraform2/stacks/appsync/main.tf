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

data "terraform_remote_state" "database" {
  backend = "local"
  config = { path = "../database/terraform.tfstate" }
}

data "terraform_remote_state" "authorizer" {
  backend = "local"
  config = { path = "../authorizer/terraform.tfstate" }
}

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
