# GoalsGuild Landing Page - Development Environment Variables

environment = "dev"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_100"

# SSL Certificate Configuration for Development
# Disable custom domain and Route53 for dev (zone doesn't exist yet)
custom_domain = "goalsguild.com"  # Your domain
additional_domains = ["www.goalsguild.com"]  # Optional: www subdomain
use_route53 = false  # We're using GoDaddy, not Route53
route53_zone_name = ""
# Leave empty to let Terraform create certificate in us-east-1 (required for CloudFront)
# CloudFront requires certificates to be in us-east-1 region
ssl_certificate_arn = "arn:aws:acm:us-east-1:838284111015:certificate/a86d881f-b145-4d03-84fc-6fa92308103e"



# No geographic restrictions for dev
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for dev environment
tags = {
  Environment = "development"
  Purpose     = "testing"
}
