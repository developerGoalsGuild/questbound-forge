output "sender_email" {
  description = "The verified sender email address"
  value       = var.domain_name != "" ? var.domain_name : var.sender_email
}

output "domain_identity_arn" {
  description = "ARN of the domain identity (if domain is used)"
  value       = var.domain_name != "" ? aws_sesv2_email_identity.domain[0].arn : null
}

output "email_identity_arn" {
  description = "ARN of the email identity (if email is used)"
  value       = var.domain_name == "" && var.sender_email != "" ? aws_sesv2_email_identity.email[0].arn : null
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_sesv2_configuration_set.main.configuration_set_name
}
