# GoalsGuild Landing Page - Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket name"
  type        = string
  default     = "goalsguild-landing-page"
}

variable "custom_domain" {
  description = "Custom domain for the CloudFront distribution (optional)"
  type        = string
  default     = ""
}

variable "additional_domains" {
  description = "Additional domains to include in the SSL certificate (SANs)"
  type        = list(string)
  default     = []
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for custom domain (optional - will create ACM certificate if not provided)"
  type        = string
  default     = ""
}

variable "use_route53" {
  description = "Whether to use Route53 for DNS management and automatic certificate validation"
  type        = bool
  default     = false
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name (e.g., example.com)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200", 
      "PriceClass_100"
    ], var.price_class)
    error_message = "Price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

variable "geo_restrictions" {
  description = "List of country codes to restrict access (empty list = no restrictions)"
  type        = list(string)
  default     = []
}

variable "geo_restriction_type" {
  description = "Type of geographic restriction (whitelist or blacklist)"
  type        = string
  default     = "none"
  validation {
    condition = contains(["whitelist", "blacklist", "none"], var.geo_restriction_type)
    error_message = "Geo restriction type must be one of: whitelist, blacklist, none."
  }
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
