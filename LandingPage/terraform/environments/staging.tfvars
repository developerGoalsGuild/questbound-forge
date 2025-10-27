# GoalsGuild Landing Page - Staging Environment Variables

environment = "staging"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_100"

# SSL Certificate Configuration (optional)
# custom_domain = "staging.goalsguild.com"
# additional_domains = ["www.staging.goalsguild.com"]
# use_route53 = true
# route53_zone_name = "goalsguild.com"

# Alternative: Use external certificate
# ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# No custom domain for staging environment
custom_domain = ""
ssl_certificate_arn = ""
use_route53 = false
route53_zone_name = ""

# No geographic restrictions for staging
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for staging environment
tags = {
  Environment = "staging"
  Purpose     = "pre-production"
}
