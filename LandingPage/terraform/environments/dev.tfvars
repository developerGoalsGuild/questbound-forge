# GoalsGuild Landing Page - Development Environment Variables

environment = "dev"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_100"

# SSL Certificate Configuration for Development
custom_domain = "dev.goalsguild.com"
additional_domains = ["www.dev.goalsguild.com"]
use_route53 = true
route53_zone_name = "goalsguild.com"

# Alternative: Use external certificate (uncomment if you have an existing certificate)
# ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# No geographic restrictions for dev
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for dev environment
tags = {
  Environment = "development"
  Purpose     = "testing"
}
