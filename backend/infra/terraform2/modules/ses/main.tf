# SES Module for Email Sending
# Supports both domain and email identity verification

# Domain Identity (if domain_name is provided)
resource "aws_sesv2_email_identity" "domain" {
  count = var.domain_name != "" ? 1 : 0
  email_identity = var.domain_name

  tags = merge(var.tags, {
    Environment = var.environment
    Component   = "ses"
    Type        = "domain"
  })
}

# Email Identity (if sender_email is provided and domain_name is not)
resource "aws_sesv2_email_identity" "email" {
  count = var.domain_name == "" && var.sender_email != "" ? 1 : 0
  email_identity = var.sender_email

  tags = merge(var.tags, {
    Environment = var.environment
    Component   = "ses"
    Type        = "email"
  })
}

# Configuration Set for tracking (optional but recommended)
resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = "goalsguild-${var.environment}"

  delivery_options {
    tls_policy = "REQUIRE"
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Component   = "ses"
  })
}

# Note: Event destinations can be added later if needed for monitoring
# They require additional configuration and are optional for basic email sending
