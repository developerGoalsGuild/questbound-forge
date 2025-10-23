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
  value       = "https://${aws_cloudfront_distribution.landing_page.domain_name}"
}

output "s3_website_url" {
  description = "S3 website URL (for testing before CloudFront)"
  value       = "http://${aws_s3_bucket.landing_page.bucket}.s3-website-${aws_s3_bucket.landing_page.region}.amazonaws.com"
}
