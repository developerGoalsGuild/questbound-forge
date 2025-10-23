# GoalsGuild Landing Page - Development Environment Variables

environment = "dev"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_100"

# No custom domain for dev environment
custom_domain = ""
ssl_certificate_arn = ""

# No geographic restrictions for dev
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for dev environment
tags = {
  Environment = "development"
  Purpose     = "testing"
}
