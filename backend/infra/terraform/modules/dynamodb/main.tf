resource "aws_dynamodb_table" "dynamodb_table" {
  name         = "${var.table_name}_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = var.hash_key

  attribute {
    name = var.attribute_name
    type = var.attribute_type
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true } 
  tags = var.tags

  # Enable Row Level Security (RLS) and policies should be configured separately in Supabase or application layer
}



