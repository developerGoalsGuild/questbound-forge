# GoalsGuild Frontend - ACM Certificate Configuration

resource "aws_acm_certificate" "frontend" {
  count = var.custom_domain != "" && var.ssl_certificate_arn == "" ? 1 : 0

  provider          = aws.us_east_1
  domain_name       = var.custom_domain
  validation_method = "DNS"

  subject_alternative_names = var.additional_domains

  tags = merge(local.common_tags, {
    Name = "GoalsGuild Frontend Certificate - ${var.environment}"
  })
}

data "aws_route53_zone" "frontend" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0
  name  = var.route53_zone_name
}

resource "aws_route53_record" "frontend_cert_validation" {
  count = var.custom_domain != "" && var.use_route53 ? length(aws_acm_certificate.frontend[0].domain_validation_options) : 0

  zone_id = data.aws_route53_zone.frontend[0].zone_id
  name    = aws_acm_certificate.frontend[0].domain_validation_options[count.index].resource_record_name
  type    = aws_acm_certificate.frontend[0].domain_validation_options[count.index].resource_record_type
  records = [aws_acm_certificate.frontend[0].domain_validation_options[count.index].resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "frontend" {
  count = var.custom_domain != "" && var.use_route53 ? 1 : 0

  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend[0].arn
  validation_record_fqdns = aws_route53_record.frontend_cert_validation[*].fqdn
}
