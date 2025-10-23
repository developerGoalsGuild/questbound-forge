# GoalsGuild Landing Page - Staging Environment Variables

environment = "staging"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_100"

# No custom domain for staging environment
custom_domain = ""
ssl_certificate_arn = ""

# No geographic restrictions for staging
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for staging environment
tags = {
  Environment = "staging"
  Purpose     = "pre-production"
}
