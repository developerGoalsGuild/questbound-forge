# Optional WAFv2 for AppSync (REGIONAL)
resource "aws_wafv2_web_acl" "appsync" {
  count       = var.enable_appsync_waf ? 1 : 0
  name        = "${local.name}-appsync-waf"
  description = "WAF for AppSync public operations"
  scope       = "REGIONAL"

  default_action {
  allow {}
}

  # Rate-based rule to throttle abusive IPs
  rule {
    name     = "rate-limit"
    priority = 1

    # Enforce vs Monitor: block when enforce is true, count (monitor) otherwise
    dynamic "action" {
      for_each = var.waf_enforce ? [1] : []
      content { 
        block {} 
        }
    }
    dynamic "action" {
      for_each = var.waf_enforce ? [] : [1]
      content { 
        count {} 
        }
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Common
  rule {
    name     = "aws-managed-common"
    priority = 2

    # Enforce vs Monitor for managed rules: none (enforce vendor actions) vs count (monitor only)
    dynamic "override_action" {
      for_each = var.waf_enforce ? [1] : []
      content { 
        none {} 
        }
    }
    dynamic "override_action" {
      for_each = var.waf_enforce ? [] : [1]
      content { 
        count {} 
        }
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "aws-managed-common"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "appsync-waf"
    sampled_requests_enabled   = true
  }
}

# Full request logging requires Kinesis Data Firehose. Enable metrics above for CloudWatch monitoring.
resource "aws_wafv2_web_acl_logging_configuration" "appsync" {
  count                   = var.enable_appsync_waf && var.enable_appsync_waf_logging && (var.enable_waf_logging_stream || var.waf_logging_firehose_arn != "") ? 1 : 0
  resource_arn            = aws_wafv2_web_acl.appsync[0].arn
  log_destination_configs = [var.enable_waf_logging_stream ? aws_kinesis_firehose_delivery_stream.waf[0].arn : var.waf_logging_firehose_arn]
}

resource "aws_wafv2_web_acl_association" "appsync" {
  count        = var.enable_appsync_waf ? 1 : 0
  resource_arn = module.appsync.api_arn
  web_acl_arn  = aws_wafv2_web_acl.appsync[0].arn
}