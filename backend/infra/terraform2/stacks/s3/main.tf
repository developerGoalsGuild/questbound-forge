# Guild Avatar S3 Bucket
resource "aws_s3_bucket" "guild_avatars" {
  bucket = var.guild_avatar_bucket_name != "" ? var.guild_avatar_bucket_name : "${var.project_name}-guild-avatars-${var.environment}"

  tags = {
    Name        = "${var.project_name}-guild-avatars-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Service     = "guild-service"
    Purpose     = "guild-avatars"
  }
}

# Public Access Block for Guild Avatar Bucket
resource "aws_s3_bucket_public_access_block" "guild_avatars" {
  count  = var.guild_avatar_bucket_public_access_block ? 1 : 0
  bucket = aws_s3_bucket.guild_avatars.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning for Guild Avatar Bucket
resource "aws_s3_bucket_versioning" "guild_avatars" {
  count  = var.guild_avatar_bucket_versioning ? 1 : 0
  bucket = aws_s3_bucket.guild_avatars.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-Side Encryption for Guild Avatar Bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "guild_avatars" {
  count  = var.guild_avatar_bucket_encryption ? 1 : 0
  bucket = aws_s3_bucket.guild_avatars.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# CORS Configuration for Guild Avatar Bucket
resource "aws_s3_bucket_cors_configuration" "guild_avatars" {
  bucket = aws_s3_bucket.guild_avatars.id

  cors_rule {
    allowed_headers = var.guild_avatar_bucket_cors_headers
    allowed_methods = var.guild_avatar_bucket_cors_methods
    allowed_origins = var.guild_avatar_bucket_cors_origins
    expose_headers  = ["ETag"]
    max_age_seconds = var.guild_avatar_bucket_cors_max_age
  }
}

# Lifecycle Configuration for Guild Avatar Bucket
resource "aws_s3_bucket_lifecycle_configuration" "guild_avatars" {
  count  = var.guild_avatar_bucket_lifecycle_days > 0 ? 1 : 0
  bucket = aws_s3_bucket.guild_avatars.id

  rule {
    id     = "guild_avatar_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.guild_avatar_bucket_lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.guild_avatar_bucket_lifecycle_days
    }
  }
}