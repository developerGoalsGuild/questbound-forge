# GoalsGuild Landing Page - Production Environment Variables

environment = "prod"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_All"

# Custom domain for production (update with actual domain)
custom_domain = ""
ssl_certificate_arn = ""

# No geographic restrictions for production
geo_restrictions = []
geo_restriction_type = "none"

# Additional tags for production environment
tags = {
  Environment = "production"
  Purpose     = "live-website"
  CostCenter  = "marketing"
}
