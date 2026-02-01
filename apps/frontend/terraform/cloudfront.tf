# GoalsGuild Frontend - CloudFront Distribution Configuration

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "goalsguild-frontend-${var.environment}"
  description                       = "OAC for GoalsGuild Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GoalsGuild Frontend - ${var.environment}"
  default_root_object = "index.html"

  aliases = var.custom_domain != "" ? concat([var.custom_domain], var.additional_domains) : []

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = var.price_class

  dynamic "viewer_certificate" {
    for_each = var.custom_domain != "" ? [1] : []
    content {
      acm_certificate_arn = var.ssl_certificate_arn != "" ? var.ssl_certificate_arn : (
        var.use_route53 && length(aws_acm_certificate_validation.frontend) > 0
          ? aws_acm_certificate_validation.frontend[0].certificate_arn
          : aws_acm_certificate.frontend[0].arn
      )
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2019"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.custom_domain == "" ? [1] : []
    content {
      cloudfront_default_certificate = true
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type == "none" ? "none" : var.geo_restriction_type
      locations        = var.geo_restriction_type == "none" ? [] : var.geo_restrictions
    }
  }

  web_acl_id = var.enable_private_access ? aws_wafv2_web_acl.frontend_private[0].arn : null

  tags = merge(local.common_tags, {
    Name = "GoalsGuild Frontend - ${var.environment}"
  })
}
