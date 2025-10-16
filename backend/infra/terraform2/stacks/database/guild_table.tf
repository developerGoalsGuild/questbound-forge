# Guild DynamoDB Table
resource "aws_dynamodb_table" "guild_table" {
  name           = var.guild_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI1: Guild Type Index
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI2: Created By Index
  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI3: User Membership Index
  attribute {
    name = "GSI3PK"
    type = "S"
  }

  attribute {
    name = "GSI3SK"
    type = "S"
  }

  # GSI4: Comment Thread Index
  attribute {
    name = "GSI4PK"
    type = "S"
  }

  attribute {
    name = "GSI4SK"
    type = "S"
  }

  # GSI5: User Comments Index
  attribute {
    name = "GSI5PK"
    type = "S"
  }

  attribute {
    name = "GSI5SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI4"
    hash_key        = "GSI4PK"
    range_key       = "GSI4SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI5"
    hash_key        = "GSI5PK"
    range_key       = "GSI5SK"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Enable server-side encryption
  server_side_encryption {
    enabled = true
  }

  # TTL for automatic cleanup of expired items
  ttl {
    attribute_name = "TTL"
    enabled        = true
  }

  tags = {
    Name        = var.guild_table_name
    Environment = var.environment
    Project     = var.project_name
    Service     = "guild-service"
    Purpose     = "guild-data"
  }
}

# DynamoDB Table Policy for Guild Service
resource "aws_iam_policy" "guild_table_policy" {
  name        = "${var.project_name}-guild-table-policy-${var.environment}"
  description = "IAM policy for guild service to access guild DynamoDB table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:TransactGetItems"
        ]
        Resource = [
          aws_dynamodb_table.guild_table.arn,
          "${aws_dynamodb_table.guild_table.arn}/index/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-guild-table-policy-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Service     = "guild-service"
  }
}

# Attach policy to guild service role (only if role exists)
resource "aws_iam_role_policy_attachment" "guild_table_policy_attachment" {
  count      = var.guild_service_role_name != "" ? 1 : 0
  role       = var.guild_service_role_name
  policy_arn = aws_iam_policy.guild_table_policy.arn
}

