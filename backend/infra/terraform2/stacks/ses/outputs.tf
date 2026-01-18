output "sender_email" {
  description = "The verified sender email address"
  value       = module.ses.sender_email
}

output "domain_identity_arn" {
  description = "ARN of the domain identity (if domain is used)"
  value       = module.ses.domain_identity_arn
}

output "email_identity_arn" {
  description = "ARN of the email identity (if email is used)"
  value       = module.ses.email_identity_arn
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = module.ses.configuration_set_name
}
