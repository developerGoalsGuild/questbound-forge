# Free SSL Certificate Information

## Current Setup: AWS Certificate Manager (ACM) - FREE ✅

Your Terraform configuration is already set up to use **free SSL certificates** from AWS Certificate Manager (ACM).

### Key Points:

1. **ACM Certificates are FREE** - AWS provides SSL/TLS certificates at no cost
2. **CloudFront Requirement** - CloudFront requires certificates from ACM (must be in us-east-1 region)
3. **Automatic Renewal** - ACM certificates automatically renew before expiration
4. **No Manual Work** - Once validated, certificates are managed automatically

### Current Configuration:

The `acm.tf` file creates a free ACM certificate:
- **Provider**: AWS Certificate Manager (ACM)
- **Cost**: $0 (completely free)
- **Validation**: DNS validation (free)
- **Region**: us-east-1 (required for CloudFront)
- **Renewal**: Automatic

### How It Works:

1. **Certificate Creation**: Terraform creates an ACM certificate in us-east-1
2. **DNS Validation**: You add DNS records to validate domain ownership
3. **Automatic Validation**: AWS validates the certificate
4. **CloudFront Integration**: Certificate is automatically used by CloudFront
5. **Auto-Renewal**: AWS renews the certificate automatically

### Certificate Details:

- **Type**: Public SSL/TLS Certificate
- **Provider**: AWS Certificate Manager
- **Cost**: $0.00 (free forever)
- **Validity**: 1 year (auto-renewed)
- **Domains**: Supports multiple domains and subdomains

### To Use Your Free Certificate:

1. **Set your domain** in `dev.tfvars`:
   ```hcl
   custom_domain = "goalsguild.com"
   additional_domains = ["www.goalsguild.com"]
   ```

2. **Choose validation method**:
   - **With Route53**: Set `use_route53 = true` (automatic)
   - **With GoDaddy**: Set `use_route53 = false` (manual DNS records)

3. **Deploy**:
   ```powershell
   cd LandingPage\scripts
   .\deploy-landing-page.ps1 -Env dev -AutoApprove
   ```

4. **Add DNS validation records** (if not using Route53):
   - Check `dns-validation-dev.txt` for records
   - Add them to GoDaddy DNS
   - Wait 5-30 minutes for validation

### Important Notes:

- **ACM is FREE** - No charges for certificates or validation
- **CloudFront Requirement** - Must use ACM (can't use external Let's Encrypt directly)
- **us-east-1 Only** - CloudFront certificates must be in us-east-1 region
- **Auto-Renewal** - Certificates renew automatically, no action needed

### Alternative: Let's Encrypt (Not Recommended for CloudFront)

If you wanted to use Let's Encrypt directly:
- ❌ **Not supported** - CloudFront requires ACM certificates
- ❌ **More complex** - Would need manual renewal every 90 days
- ❌ **No benefit** - ACM is already free and easier

### Summary:

✅ **You're already using free certificates!**
- AWS Certificate Manager (ACM) = Free SSL/TLS certificates
- No cost for certificates or validation
- Automatic renewal
- Perfect for CloudFront

No changes needed - your setup is already optimized for free certificates!
















