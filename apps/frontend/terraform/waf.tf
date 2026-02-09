# GoalsGuild Frontend - WAF for private access

resource "aws_wafv2_ip_set" "frontend_allowlist" {
  count              = var.enable_private_access && length(var.allowed_ip_cidrs) > 0 ? 1 : 0
  name               = "${var.bucket_name_prefix}-${var.environment}-allowlist"
  description        = "Allowlist for private frontend access (${var.environment})"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.allowed_ip_cidrs

  tags = merge(local.common_tags, {
    Name = "${var.bucket_name_prefix}-${var.environment}-allowlist"
  })
}

resource "aws_wafv2_web_acl" "frontend_private" {
  count = var.enable_private_access ? 1 : 0

  name  = "${var.bucket_name_prefix}-${var.environment}-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    block {}
  }

  dynamic "rule" {
    for_each = length(var.allowed_ip_cidrs) > 0 ? [1] : []
    content {
      name     = "allow-ipset"
      priority = 1
      action {
        allow {}
      }
      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.frontend_allowlist[0].arn
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "frontend-allowlist"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "frontend-private-${var.environment}"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.bucket_name_prefix}-${var.environment}-web-acl"
  })
}
