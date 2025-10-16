output "guild_avatar_bucket_name" {
  description = "Name of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.bucket
}

output "guild_avatar_bucket_arn" {
  description = "ARN of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.arn
}

output "guild_avatar_bucket_domain_name" {
  description = "Domain name of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.bucket_domain_name
}

output "guild_avatar_bucket_regional_domain_name" {
  description = "Regional domain name of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.bucket_regional_domain_name
}

output "guild_avatar_bucket_website_endpoint" {
  description = "Website endpoint of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.website_endpoint
}

output "guild_avatar_bucket_website_domain" {
  description = "Website domain of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.website_domain
}

output "guild_avatar_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.hosted_zone_id
}

output "guild_avatar_bucket_region" {
  description = "Region of the guild avatar S3 bucket"
  value       = aws_s3_bucket.guild_avatars.region
}

output "guild_avatar_bucket_public_access_block_id" {
  description = "ID of the public access block for guild avatar bucket"
  value       = var.guild_avatar_bucket_public_access_block ? aws_s3_bucket_public_access_block.guild_avatars[0].id : null
}

output "guild_avatar_bucket_versioning_id" {
  description = "ID of the versioning configuration for guild avatar bucket"
  value       = var.guild_avatar_bucket_versioning ? aws_s3_bucket_versioning.guild_avatars[0].id : null
}

output "guild_avatar_bucket_server_side_encryption_configuration_id" {
  description = "ID of the server-side encryption configuration for guild avatar bucket"
  value       = var.guild_avatar_bucket_encryption ? aws_s3_bucket_server_side_encryption_configuration.guild_avatars[0].id : null
}

output "guild_avatar_bucket_cors_configuration_id" {
  description = "ID of the CORS configuration for guild avatar bucket"
  value       = aws_s3_bucket_cors_configuration.guild_avatars.id
}

output "guild_avatar_bucket_lifecycle_configuration_id" {
  description = "ID of the lifecycle configuration for guild avatar bucket"
  value       = var.guild_avatar_bucket_lifecycle_days > 0 ? aws_s3_bucket_lifecycle_configuration.guild_avatars[0].id : null
}