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
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GoalsGuild Landing Page - ${var.environment}"
  default_root_object = "index.html"

  # Custom domain (if provided)
  # Include both root domain and all additional domains (e.g., www subdomain)
  aliases = var.custom_domain != "" ? concat([var.custom_domain], var.additional_domains) : []

  # Default cache behavior - using modern cache policy (free tier compatible)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    # Use AWS managed cache policy (free tier compatible)
    # CachingOptimized policy: caches everything, respects origin cache headers
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
  }

  # Cache behaviors for static assets - using modern cache policies (free tier compatible)
  # Reduced to 4 ordered behaviors + 1 default = 5 total (free tier limit)
  
  # CSS files - long cache
  ordered_cache_behavior {
    path_pattern          = "*.css"
    allowed_methods       = ["GET", "HEAD"]
    cached_methods        = ["GET", "HEAD"]
    target_origin_id      = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress              = true
    viewer_protocol_policy = "redirect-to-https"
    
    # Use CachingOptimized policy - respects origin cache headers, long TTL
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
  }

  # JavaScript files - long cache
  ordered_cache_behavior {
    path_pattern          = "*.js"
    allowed_methods       = ["GET", "HEAD"]
    cached_methods        = ["GET", "HEAD"]
    target_origin_id      = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress              = true
    viewer_protocol_policy = "redirect-to-https"
    
    # Use CachingOptimized policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
  }

  # Image files - using most common pattern (png) to cover most images
  # Note: CloudFront doesn't support multiple patterns in one behavior
  # We combine by using a single pattern that covers the most common case
  ordered_cache_behavior {
    path_pattern          = "*.png"
    allowed_methods       = ["GET", "HEAD"]
    cached_methods        = ["GET", "HEAD"]
    target_origin_id      = "S3-${aws_s3_bucket.landing_page.bucket}"
    compress              = true
    viewer_protocol_policy = "redirect-to-https"
    
    # Use CachingOptimized policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
  }
  
  # Additional image types - jpg and svg will use default behavior
  # This keeps us at exactly 5 behaviors (1 default + 4 ordered)

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
  # Note: Certificate must be validated before CloudFront can use it
  # For Route53: validation happens automatically
  # For manual DNS (GoDaddy): validate certificate first, then apply CloudFront changes
  dynamic "viewer_certificate" {
    for_each = var.custom_domain != "" ? [1] : []
    content {
      # Use provided ARN if available, otherwise use created certificate
      # For Route53: use validated certificate ARN
      # For manual: use certificate ARN (must be validated manually first)
      acm_certificate_arn = var.ssl_certificate_arn != "" ? var.ssl_certificate_arn : (
        var.use_route53 && length(aws_acm_certificate_validation.landing_page) > 0 
          ? aws_acm_certificate_validation.landing_page[0].certificate_arn 
          : aws_acm_certificate.landing_page[0].arn
      )
      ssl_support_method       = "sni-only"
      # Use TLSv1.2_2019 for maximum browser compatibility (including Edge)
      # TLSv1.2_2021 removes some older cipher suites that Edge might need
      minimum_protocol_version = "TLSv1.2_2019"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.custom_domain == "" ? [1] : []
    content {
      cloudfront_default_certificate = true
    }
  }

  # Geographic restrictions (required block)
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type == "none" ? "none" : var.geo_restriction_type
      locations        = var.geo_restriction_type == "none" ? [] : var.geo_restrictions
    }
  }

  tags = merge(local.common_tags, {
    Name = "GoalsGuild Landing Page - ${var.environment}"
  })
}
