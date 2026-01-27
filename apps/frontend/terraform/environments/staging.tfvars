environment = "staging"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-frontend"
price_class = "PriceClass_100"

# Staging should not be publicly accessible.
enable_private_access = true
allowed_ip_cidrs = []

# No custom domain for staging.
custom_domain = ""
additional_domains = []
ssl_certificate_arn = ""
use_route53 = false
route53_zone_name = ""

tags = {
  Environment = "staging"
  Purpose     = "pre-production"
}
