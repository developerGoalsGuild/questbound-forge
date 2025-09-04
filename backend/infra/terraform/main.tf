

locals {
  schema_path   = var.schema_path != "" ? var.schema_path : "${path.module}/graphql/schema.graphql"
  resolvers_dir = var.resolvers_dir != "" ? var.resolvers_dir : "${path.module}/resolvers"
  name          = "goalsguild-${var.environment}"
}


module "iam" {
  source = "./modules/iam"
  # ...vars
  aws_region                               = var.aws_region
  account_id                               = local.account_id
  user_service_lambda_authorizer_role_name = "user-service-role"
}

#module "ssm" {
#  source = "./modules/ssm"
# ...vars
#  aws_region = var.aws_region
#  account_id = local.account_id
#}


module "lambda_authorizer" {
  source = "./modules/lambda_zip"

  # names & IAM
  function_name = "goalsguild_authorizer"
  environment   = var.environment
  role_arn      = module.iam.lambda_authorizer_role_arn

  # your code location (relative to backend/infra/terraform)
  src_dir = "${path.module}/../../services/authorizer-service"

  # runtime/handler
  handler = "authorizer.handler" # authorizer.py -> def handler(...)
  runtime = "python3.12"         # or python3.9 if you must match older code

  # you're on Windows → keep PowerShell
  use_powershell = true

  environment_variables = {
    ENVIRONMENT = var.environment
  }

  # optional
  log_retention_in_days = 14
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }

  # optional noise filters for change detection
  exclude_globs = [
    ".git/**", "__pycache__/**", "tests/**", "*.md",
    ".venv/**", ".pytest_cache/**", ".mypy_cache/**",
    ".DS_Store", "package.sh",
  ]
}





# Current versions can be stored in terraform.tfvars or remotely; here default 0 for demo
variable "user_service_current_version" {
  description = "Current version of user-service Docker image"
  type        = number
  default     = 0
}

variable "quest_service_current_version" {
  description = "Current version of quest-service Docker image"
  type        = number
  default     = 0
}



# Module for user-service Docker image build and push
module "user_service_image" {
  source              = "./modules/docker_lambda_image"
  service_name        = "user-service"
  ecr_repository_name = "goalsguild_user_service"
  aws_region          = var.aws_region
  environment         = var.environment
  current_version     = var.user_service_current_version
  dockerfile_path     = "../../../backend/services/user-service/Dockerfile"
  context_path        = "../../../backend/services/user-service"
}

# Module for quest-service Docker image build and push
module "quest_service_image" {
  source              = "./modules/docker_lambda_image"
  service_name        = "quest-service"
  ecr_repository_name = "goalsguild_quest_service"
  aws_region          = var.aws_region
  environment         = var.environment
  current_version     = var.quest_service_current_version
  dockerfile_path     = "../../../backend/services/quest-service/Dockerfile"
  context_path        = "../../../backend/services/quest-service"

}




# DynamoDB tables for users and quests
module "dynamodb_users" {
  source         = "./modules/dynamodb"
  environment    = var.environment
  table_name     = "goalsguild_users"
  hash_key       = "user_id"
  attribute_name = "user_id"
  attribute_type = "S"
  tags = {
    Service     = "user-service"
    Component   = "user"
    Environment = var.environment
    Project     = "goalsguild"
  }
}

module "dynamodb_quests" {
  source         = "./modules/dynamodb"
  environment    = var.environment
  table_name     = "goalsguild_quests"
  hash_key       = "quest_id"
  attribute_name = "quest_id"
  attribute_type = "S"
  tags = {
    Service     = "quest-service"
    Component   = "quests"
    Environment = var.environment
    Project     = "goalsguild"
  }
}


# ------------------ DYNAMODB ------------------
module "ddb" {
  source         = "./modules/dynamodb_single_table"
  table_name     = "gg_core"
  enable_streams = true
  tags = {
    Owner       = "goalsGuildDB"
    Component   = "DataBase"
    Environment = var.environment
    Project     = "goalsguild"
  }
}


# ------------------ APPSYNC ------------------
module "appsync" {
  source                = "./modules/appsync_api"
  name                  = "${local.name}-api"
  auth_type             = var.appsync_auth_type
  schema_path           = local.schema_path
  lambda_authorizer_arn = module.lambda_authorizer.lambda_arn
  #user_pool_id = module.cognito.enabled ? module.cognito.user_pool_id : null
  #user_pool_client_id = module.cognito.enabled ? module.cognito.app_client_id : null
  region = var.aws_region


  # Attach DDB as a data source and register resolvers from local files
  ddb_table_name = module.ddb.table_name
  ddb_table_arn  = module.ddb.arn


  resolvers = {
    "Mutation.createUser" = {
      type        = "Mutation"
      field       = "createUser"
      data_source = "DDB"
      code_path   = "${local.resolvers_dir}/createUser.js"
    }
    "Mutation.createGoal" = {
      type        = "Mutation"
      field       = "createGoal"
      data_source = "DDB"
      code_path   = "${local.resolvers_dir}/createGoal.js"
    }
    "Mutation.addTask" = {
      type        = "Mutation"
      field       = "addTask"
      data_source = "DDB"
      code_path   = "${local.resolvers_dir}/addTask.js"
    }
    "Mutation.sendMessage" = {
      type        = "Mutation"
      field       = "sendMessage"
      data_source = "DDB"
      code_path   = "${local.resolvers_dir}/sendMessage.js"
    }
    "Subscription.onMessage" = {
      type        = "Subscription"
      field       = "onMessage"
      data_source = "NONE"
      code_path   = "${local.resolvers_dir}/onMessage.subscribe.js"
    }
  }


  tags = {

    Component   = "BackendApis"
    Environment = var.environment
    Project     = "goalsguild"
  }
}

/*module "goalsguild_table" {
  source        = "../../modules/dynamodb_goalsguild"
  environment   = var.environment
  table_base_name = "goalsguild"
  billing_mode  = "PAY_PER_REQUEST" # switch to PROVISIONED later if needed
  # kms_key_arn = "arn:aws:kms:us-east-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # optional
  tags = {
    Owner = "goalsGuildDB"       
    Component   = "DataBase"
    Environment = var.environment
    Project     = "goalsguild"  
  }
}

*/

# dynamodb.tf
resource "aws_dynamodb_table" "login_attempts" {
  name         = "goalsguild_login_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk" # USER#<email>
  range_key    = "ts" # epoch seconds of attempt

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "ts"
    type = "N"
  }

  # Auto-expire items ~48h after ttl is reached; we set ttl = now + 30 days in code
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Recommended hardening
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true } # or set kms_key_arn for a CMK

  tags = {
    Service     = "user-service"
    Component   = "login-attempts"
    Environment = var.environment
  }
}

# Lambda functions for user and quest services
module "lambda_user_service" {
  source        = "./modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_user_service"
  image_uri     = module.user_service_image.image_uri
  memory_size   = 512
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
  depends_on = [module.user_service_image]

}

module "lambda_quest_service" {
  source        = "./modules/lambda"
  environment   = var.environment
  function_name = "goalsguild_quest_service"
  image_uri     = module.quest_service_image.image_uri
  memory_size   = 128
  timeout       = 10
  role_arn      = module.network.lambda_exec_role_arn
  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
  depends_on = [module.quest_service_image]

}

# Note: API Gateway and Cognito resources are managed inside the network module for clarity and reuse
module "network" {
  source                                 = "./modules/network"
  environment                            = var.environment
  aws_region                             = var.aws_region
  user_service_lambda_arn                = module.lambda_user_service.lambda_function_arn
  quest_service_lambda_arn               = module.lambda_quest_service.lambda_function_arn
  api_stage_name                         = var.api_stage_name
  lambda_authorizer_arn                  = module.lambda_authorizer.lambda_arn
  api_gateway_authorizer_lambda_role_arn = module.iam.lambda_authorizer_role_arn

}

