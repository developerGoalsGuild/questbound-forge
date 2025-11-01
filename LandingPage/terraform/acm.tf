# GoalsGuild Landing Page - ACM Certificate Configuration
# Let's Encrypt SSL certificate management for CloudFront

# Data source for Route53 hosted zone (if using Route53)
data "aws_route53_zone" "main" {
  count = var.use_route53 ? 1 : 0
  name  = var.route53_zone_name
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "landing_page" {
  count = var.custom_domain != "" ? 1 : 0
  
  domain_name               = var.custom_domain
  subject_alternative_names = var.additional_domains
  
  # Use DNS validation for Let's Encrypt
  validation_method = "DNS"
  
  # Certificate must be in us-east-1 for CloudFront
  provider = aws.us_east_1
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "GoalsGuild Landing Page SSL - ${var.environment}"
  })
}

# DNS validation records for the certificate
resource "aws_route53_record" "certificate_validation" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0
  
  for_each = {
    for dvo in aws_acm_certificate.landing_page[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main[0].zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "landing_page" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0
  
  certificate_arn         = aws_acm_certificate.landing_page[0].arn
  validation_record_fqdns  = [for record in aws_route53_record.certificate_validation[0] : record.fqdn]
  
  timeouts {
    create = "10m"
  }
}

# Route53 A record for CloudFront distribution
resource "aws_route53_record" "landing_page" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0
  
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.custom_domain
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.landing_page.domain_name
    zone_id                = aws_cloudfront_distribution.landing_page.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 AAAA record for CloudFront distribution (IPv6)
resource "aws_route53_record" "landing_page_ipv6" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0
  
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.custom_domain
  type    = "AAAA"
  
  alias {
    name                   = aws_cloudfront_distribution.landing_page.domain_name
    zone_id                = aws_cloudfront_distribution.landing_page.hosted_zone_id
    evaluate_target_health = false
  }
}

# Alternative: Manual DNS validation instructions
resource "local_file" "dns_validation_instructions" {
  count = var.custom_domain != "" && !var.use_route53 ? 1 : 0
  
  filename = "${path.module}/dns-validation-${var.environment}.txt"
  content = templatefile("${path.module}/templates/dns-validation.tpl", {
    domain_name = var.custom_domain
    validation_records = [
      for dvo in aws_acm_certificate.landing_page[0].domain_validation_options : {
        name   = dvo.resource_record_name
        record = dvo.resource_record_value
        type   = dvo.resource_record_type
      }
    ]
  })
}






