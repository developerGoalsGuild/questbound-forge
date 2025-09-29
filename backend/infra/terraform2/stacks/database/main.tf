module "gg_core" {
  source          = "../../modules/database/dynamodb_single_table"
  table_name      = "gg_core"
  enable_streams  = true
  prevent_destroy = true

  tags = {
    Project     = "goalsguild"
    Environment = var.environment
    Component   = "database"
  }
}
