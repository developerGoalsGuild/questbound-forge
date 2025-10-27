# GoalsGuild Landing Page - CloudFront Distribution Configuration
# CDN for static site with optimized caching and security

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "landing_page" {
  name                              = "goalsguild-landing-page-${var.environment}"
  description                       = "OAC for GoalsGuild Landing Page"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "landing_page" {
  origin {
    domain_name              = aws_s3_bucket.landing_page.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.landing_page.id
    origin_id                = "S3-${aws_s3_bucket.landing_page.bucket}"

    s3_origin_config {
      origin_access_identity = ""
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GoalsGuild Landing Page - ${var.environment}"
  default_root_object = "index.html"

  # Custom domain (if provided)
  dynamic "aliases" {
    for_each = var.custom_domain != "" ? [var.custom_domain] : []
    content {
      aliases = [var.custom_domain]
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "*.css"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern     = "*.js"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern     = "*.png"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern     = "*.jpg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern     = "*.svg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000
  }

  # Custom error pages
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

  # Price class for cost optimization
  price_class = var.price_class

  # SSL certificate
  dynamic "viewer_certificate" {
    for_each = var.custom_domain != "" ? [1] : []
    content {
      acm_certificate_arn      = var.ssl_certificate_arn != "" ? var.ssl_certificate_arn : aws_acm_certificate.landing_page[0].arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.custom_domain == "" ? [1] : []
    content {
      cloudfront_default_certificate = true
    }
  }

  # Geographic restrictions (if any)
  dynamic "restrictions" {
    for_each = length(var.geo_restrictions) > 0 ? [1] : []
    content {
      geo_restriction {
        restriction_type = var.geo_restriction_type
        locations       = var.geo_restrictions
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "GoalsGuild Landing Page - ${var.environment}"
  })
}
