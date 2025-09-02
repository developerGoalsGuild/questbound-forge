resource "aws_dynamodb_table" "native_users" {
  name           = "native-users-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "username"

  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "password_hash"
    type = "S"
  }

  attribute {
    name = "salt"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}
