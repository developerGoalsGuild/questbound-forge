# GoalsGuild Landing Page - Outputs

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.landing_page.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.landing_page.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.landing_page.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.landing_page.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.landing_page.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.landing_page.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront Route 53 zone ID"
  value       = aws_cloudfront_distribution.landing_page.hosted_zone_id
}

output "website_url" {
  description = "URL of the website"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${aws_cloudfront_distribution.landing_page.domain_name}"
}

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = var.custom_domain != "" ? (var.ssl_certificate_arn != "" ? var.ssl_certificate_arn : aws_acm_certificate.landing_page[0].arn) : null
}

output "ssl_certificate_status" {
  description = "Status of the SSL certificate"
  value       = var.custom_domain != "" ? (var.ssl_certificate_arn != "" ? "External" : aws_acm_certificate.landing_page[0].status) : null
}

output "dns_validation_records" {
  description = "DNS validation records for the certificate"
  value       = var.custom_domain != "" && !var.use_route53 ? [
    for dvo in aws_acm_certificate.landing_page[0].domain_validation_options : {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  ] : null
}

output "route53_records_created" {
  description = "Whether Route53 records were automatically created"
  value       = var.custom_domain != "" && var.use_route53
}

output "s3_website_url" {
  description = "S3 website URL (for testing before CloudFront)"
  value       = "http://${aws_s3_bucket.landing_page.bucket}.s3-website-${aws_s3_bucket.landing_page.region}.amazonaws.com"
}
