# GoalsGuild Landing Page - SSL Certificate Configuration Guide

## Overview

This Terraform configuration uses **AWS Certificate Manager (ACM)** to provide **FREE SSL/TLS certificates** for your CloudFront distribution. ACM certificates are completely free, automatically renew, and are the standard for CloudFront. The system can work with or without Route53 DNS management.

### ✅ FREE Certificates - No Cost!

- **AWS Certificate Manager (ACM)** = 100% FREE
- No charges for certificates, validation, or renewal
- Automatic renewal before expiration
- Industry-standard SSL/TLS certificates

## SSL Certificate Options

### Option 1: Automatic Certificate Creation with Route53 (Recommended)

If you're using Route53 for DNS management, the system will automatically:
- Create an ACM certificate
- Add DNS validation records
- Validate the certificate
- Configure CloudFront to use the certificate

**Configuration:**
```hcl
custom_domain = "goalsguild.com"
additional_domains = ["www.goalsguild.com", "app.goalsguild.com"]
use_route53 = true
route53_zone_name = "goalsguild.com"
```

### Option 2: Manual DNS Validation

If you're not using Route53, you'll need to manually add DNS validation records:

**Configuration:**
```hcl
custom_domain = "goalsguild.com"
additional_domains = ["www.goalsguild.com"]
use_route53 = false
route53_zone_name = ""
```

**Manual Steps:**
1. Run `terraform plan` to see the DNS validation records
2. Add the DNS records to your domain's DNS provider
3. Wait 5-10 minutes for DNS propagation
4. Run `terraform apply`

### Option 3: External Certificate

If you already have an ACM certificate, you can use it directly:

**Configuration:**
```hcl
custom_domain = "goalsguild.com"
ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
```

## Environment-Specific Configuration

### Development Environment (`dev.tfvars`)
```hcl
# No custom domain for dev (uses CloudFront default certificate)
custom_domain = ""
ssl_certificate_arn = ""
use_route53 = false
```

### Staging Environment (`staging.tfvars`)
```hcl
# Optional custom domain for staging
custom_domain = "staging.goalsguild.com"
additional_domains = ["www.staging.goalsguild.com"]
use_route53 = true
route53_zone_name = "goalsguild.com"
```

### Production Environment (`prod.tfvars`)
```hcl
# Production domain with full SSL support
custom_domain = "goalsguild.com"
additional_domains = ["www.goalsguild.com", "app.goalsguild.com"]
use_route53 = true
route53_zone_name = "goalsguild.com"
```

## Deployment Steps

### 1. Configure Domain Variables

Edit the appropriate `.tfvars` file for your environment:

```bash
# For development
vim terraform/environments/dev.tfvars

# For staging
vim terraform/environments/staging.tfvars

# For production
vim terraform/environments/prod.tfvars
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Plan Deployment

```bash
# For development
terraform plan -var-file="environments/dev.tfvars"

# For staging
terraform plan -var-file="environments/staging.tfvars"

# For production
terraform plan -var-file="environments/prod.tfvars"
```

### 4. Apply Configuration

```bash
# For development
terraform apply -var-file="environments/dev.tfvars"

# For staging
terraform apply -var-file="environments/staging.tfvars"

# For production
terraform apply -var-file="environments/prod.tfvars"
```

### 5. Manual DNS Validation (if not using Route53)

If you're not using Route53, Terraform will create a file with DNS validation instructions:

```bash
cat dns-validation-{environment}.txt
```

Add the DNS records to your domain provider, then run `terraform apply` again.

## Important Notes

### Certificate Region Requirement
- ACM certificates for CloudFront **must** be in the `us-east-1` region
- The configuration automatically handles this with a separate provider

### DNS Propagation
- DNS changes can take 5-10 minutes to propagate
- Certificate validation may take additional time
- Be patient during the initial deployment

### Certificate Renewal
- **ACM certificates are automatically renewed** by AWS
- **No manual intervention required** - completely hands-off
- Certificates are valid for 1 year and auto-renew before expiration
- **100% FREE** - No renewal fees or charges

### Security Features
- TLS 1.2 minimum protocol version
- SNI-only SSL support
- Automatic HTTPS redirect
- HSTS headers (if configured)

## Troubleshooting

### Certificate Validation Fails
1. Check DNS records are correctly added
2. Verify DNS propagation with `dig` or `nslookup`
3. Wait longer for propagation
4. Check domain ownership

### CloudFront Distribution Errors
1. Ensure certificate is in `us-east-1` region
2. Verify certificate status is "Issued"
3. Check CloudFront distribution status
4. Review CloudFront logs

### Route53 Issues
1. Verify hosted zone exists
2. Check Route53 permissions
3. Ensure domain is properly delegated
4. Verify zone name matches exactly

## Cost Considerations

### ✅ ACM Certificate Costs - COMPLETELY FREE!
- **ACM Certificates**: **$0.00** - Completely free forever
- **Certificate Validation**: **$0.00** - Free
- **Certificate Renewal**: **$0.00** - Automatic and free
- **CloudFront SSL**: **$0.00** - Free with ACM certificates

### Optional Costs (Only if using Route53)
- **Route53 Hosted Zone**: $0.50 per hosted zone per month (optional)
- **DNS queries**: $0.40 per million queries (usually minimal)

### Summary
**Your SSL certificate setup is 100% FREE!** ACM provides industry-standard SSL/TLS certificates at no cost, with automatic renewal. This is the best free option available for CloudFront.

### CloudFront Costs
- **Price Class**: Choose appropriate price class
- **Data Transfer**: Based on usage
- **Requests**: $0.0075 per 10,000 requests

## Security Best Practices

1. **Use HTTPS Only**: Always redirect HTTP to HTTPS
2. **HSTS Headers**: Consider adding HSTS headers
3. **Certificate Monitoring**: Monitor certificate expiration
4. **DNS Security**: Use DNSSEC if possible
5. **Access Logs**: Enable CloudFront access logs

## Example Complete Configuration

```hcl
# Production configuration with full SSL support
environment = "prod"
aws_region = "us-east-1"
bucket_name_prefix = "goalsguild-landing-page"
price_class = "PriceClass_All"

# SSL Certificate Configuration
custom_domain = "goalsguild.com"
additional_domains = ["www.goalsguild.com", "app.goalsguild.com"]
use_route53 = true
route53_zone_name = "goalsguild.com"

# No geographic restrictions
geo_restrictions = []
geo_restriction_type = "none"

# Production tags
tags = {
  Environment = "production"
  Purpose     = "live-website"
  Criticality = "high"
  CostCenter  = "marketing"
}
```

This configuration will create a fully SSL-enabled CloudFront distribution with automatic certificate management and DNS configuration.





















