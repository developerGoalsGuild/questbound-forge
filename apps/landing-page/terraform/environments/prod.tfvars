# GoalsGuild Landing Page - Production Environment Variables

environment = "prod"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_All"

# SSL Certificate Configuration (optional)
# custom_domain = "goalsguild.com"
# additional_domains = ["www.goalsguild.com", "app.goalsguild.com"]
# use_route53 = true
# route53_zone_name = "goalsguild.com"

# Alternative: Use external certificate
# ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Custom domain for production (update with actual domain)
custom_domain = ""
ssl_certificate_arn = ""
use_route53 = false
route53_zone_name = ""

# No geographic restrictions for production
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for production environment
tags = {
  Environment = "production"
  Purpose     = "live-website"
  CostCenter  = "marketing"
}
