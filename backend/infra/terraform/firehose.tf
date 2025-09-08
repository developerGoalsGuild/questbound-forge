# Optional Kinesis Data Firehose stream to S3 for WAF logging
resource "aws_s3_bucket" "waf_logs" {
  count  = var.enable_waf_logging_stream ? 1 : 0
  bucket = "${local.name}-waf-logs"
}

resource "aws_s3_bucket_public_access_block" "waf_logs" {
  count                   = var.enable_waf_logging_stream ? 1 : 0
  bucket                  = aws_s3_bucket.waf_logs[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "waf_logs" {
  count  = var.enable_waf_logging_stream ? 1 : 0
  bucket = aws_s3_bucket.waf_logs[0].id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# IAM role for Firehose to write to S3
resource "aws_iam_role" "firehose_waf" {
  count = var.enable_waf_logging_stream ? 1 : 0
  name  = "${local.name}-waf-firehose-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "firehose.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "firehose_waf_s3" {
  count = var.enable_waf_logging_stream ? 1 : 0
  name  = "${local.name}-waf-firehose-s3"
  role  = aws_iam_role.firehose_waf[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:AbortMultipartUpload","s3:GetBucketLocation","s3:GetObject","s3:ListBucket","s3:ListBucketMultipartUploads","s3:PutObject"],
        Resource = [aws_s3_bucket.waf_logs[0].arn, "${aws_s3_bucket.waf_logs[0].arn}/*"]
      },
      {
        Effect   = "Allow",
        Action   = ["logs:PutLogEvents"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "waf" {
  count       = var.enable_waf_logging_stream ? 1 : 0
  name        = "${local.name}-waf-logs"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_waf[0].arn
    bucket_arn = aws_s3_bucket.waf_logs[0].arn
    buffering_interval = 300
    buffering_size     = 5
    compression_format = "GZIP"
    prefix             = "year=!{timestamp:YYYY}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/!{timestamp:yyyy/MM/dd}/"
  }
}