environment = "prod"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-frontend"
price_class = "PriceClass_All"

enable_private_access = false

# Custom domain set at deploy time for production.
custom_domain = ""
additional_domains = []
ssl_certificate_arn = ""
use_route53 = false
route53_zone_name = ""

tags = {
  Environment = "production"
  Purpose     = "live-frontend"
}
