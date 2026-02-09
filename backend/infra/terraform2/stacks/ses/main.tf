module "ses" {
  source = "../../modules/ses"

  environment = var.environment
  aws_region  = var.aws_region
  domain_name = var.domain_name
  sender_email = var.sender_email

  tags = merge(var.tags, {
    Project     = "goalsguild"
    Environment = var.environment
    environment = var.environment
  })
}
