# GoDaddy Domain Setup for GoalsGuild Landing Page

This guide will help you point your GoDaddy domain to the CloudFront distribution.

## Prerequisites

- Domain registered with GoDaddy
- AWS account with appropriate permissions
- CloudFront distribution ID: `E25AKY0B7XCOUK`
- CloudFront domain: `d1of22l34nde2a.cloudfront.net`

## Step 1: Create SSL Certificate in AWS (us-east-1)

CloudFront requires SSL certificates to be in the **us-east-1** region.

### Option A: Using AWS Console
1. Go to AWS Certificate Manager (ACM) in **us-east-1** region
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Enter your domain (e.g., `goalsguild.com` or `www.goalsguild.com`)
5. Add additional domains if needed (e.g., both `goalsguild.com` and `www.goalsguild.com`)
6. Choose **DNS validation** (recommended for GoDaddy)
7. Click "Request"

### Option B: Using Terraform (Recommended)

Update `LandingPage/terraform/environments/dev.tfvars`:

```hcl
custom_domain = "goalsguild.com"  # Your domain
additional_domains = ["www.goalsguild.com"]  # Optional: www subdomain
use_route53 = false  # We're using GoDaddy, not Route53
route53_zone_name = ""
```

Then deploy:
```powershell
cd LandingPage\scripts
.\deploy-landing-page.ps1 -Env dev -AutoApprove
```

This will create the ACM certificate and provide DNS validation records.

## Step 2: Validate SSL Certificate

After creating the certificate, you'll need to add DNS validation records in GoDaddy:

1. **Get DNS Validation Records:**
   - Check the Terraform output or AWS Console
   - Look for files like `dns-validation-dev.txt` in `LandingPage/terraform/`
   - Or check ACM console for validation records

2. **Add DNS Records in GoDaddy:**
   - Log in to GoDaddy
   - Go to "My Products" → "DNS" → Select your domain
   - Click "Add" to create a new record
   - For each validation record:
     - **Type:** CNAME
     - **Name:** The validation record name (e.g., `_abc123def456.goalsguild.com`)
     - **Value:** The validation record value (e.g., `_xyz789.abc.acm-validations.aws.`)
     - **TTL:** 600 (or default)
     - Click "Save"

3. **Wait for Validation:**
   - AWS will validate the certificate (usually 5-30 minutes)
   - Check ACM console for status

## Step 3: Update CloudFront with Custom Domain

Once the certificate is validated, update the Terraform configuration:

1. **Get the Certificate ARN:**
   ```powershell
   aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='goalsguild.com'].CertificateArn" --output text
   ```

2. **Update dev.tfvars:**
   ```hcl
   custom_domain = "goalsguild.com"
   additional_domains = ["www.goalsguild.com"]
   ssl_certificate_arn = "arn:aws:acm:us-east-1:838284111015:certificate/YOUR-CERT-ID"
   ```

3. **Deploy:**
   ```powershell
   cd LandingPage\scripts
   .\deploy-landing-page.ps1 -Env dev -AutoApprove -SkipInit
   ```

## Step 4: Configure DNS in GoDaddy

After CloudFront is updated with your custom domain, configure DNS records:

### For Root Domain (goalsguild.com)

1. **Go to GoDaddy DNS Management:**
   - Log in to GoDaddy
   - Go to "My Products" → "DNS" → Select your domain

2. **Add/Update A Record:**
   - Find existing A record for root domain (or create new)
   - **Type:** A
   - **Name:** @ (or leave blank for root domain)
   - **Value:** CloudFront Hosted Zone ID: `Z2FDTNDATAQYW2`
   - **Note:** Some DNS providers require the actual IP. For CloudFront, you may need to use an alias/CNAME approach

3. **Alternative: Use CNAME (if A record doesn't support alias):**
   - **Type:** CNAME
   - **Name:** @ (or leave blank)
   - **Value:** `d1of22l34nde2a.cloudfront.net`
   - **Note:** Some DNS providers don't allow CNAME on root domain. If GoDaddy doesn't support this, you may need to:
     - Use a subdomain (e.g., `www.goalsguild.com`)
     - Or use GoDaddy's domain forwarding feature

### For www Subdomain (www.goalsguild.com)

1. **Add CNAME Record:**
   - **Type:** CNAME
   - **Name:** www
   - **Value:** `d1of22l34nde2a.cloudfront.net`
   - **TTL:** 600 (or default)

## Step 5: Verify Configuration

1. **Wait for DNS Propagation:**
   - DNS changes can take 24-48 hours, but usually propagate within a few hours
   - Check DNS propagation: https://www.whatsmydns.net/

2. **Test Your Domain:**
   - Visit `https://goalsguild.com` (or your domain)
   - Should load the landing page

3. **Check SSL Certificate:**
   - The site should use HTTPS with a valid certificate
   - Browser should show the lock icon

## Quick Reference

### CloudFront Details
- **Distribution ID:** `E25AKY0B7XCOUK`
- **CloudFront Domain:** `d1of22l34nde2a.cloudfront.net`
- **CloudFront Hosted Zone ID:** `Z2FDTNDATAQYW2`

### DNS Records to Add in GoDaddy

#### Option 1: Root Domain (if GoDaddy supports CNAME on root)
```
Type: CNAME
Name: @
Value: d1of22l34nde2a.cloudfront.net
TTL: 600
```

#### Option 2: Root Domain (using A record with CloudFront IP)
```
Type: A
Name: @
Value: [CloudFront IP - you'll need to get this from AWS]
```

**Note:** CloudFront IPs can change, so this is not recommended. Better to use a subdomain.

#### Option 3: Use www Subdomain (Recommended)
```
Type: CNAME
Name: www
Value: d1of22l34nde2a.cloudfront.net
TTL: 600
```

Then configure GoDaddy domain forwarding:
- Forward `goalsguild.com` → `www.goalsguild.com`

## Troubleshooting

### Certificate Validation Fails
- Double-check DNS records are correct
- Wait 30 minutes for propagation
- Verify record names match exactly (including underscores)

### DNS Not Resolving
- Check DNS propagation: https://www.whatsmydns.net/
- Verify CNAME/A records are correct
- Clear browser DNS cache

### SSL Certificate Not Working
- Ensure certificate is in **us-east-1** region
- Verify certificate is validated and active
- Check CloudFront distribution has the certificate ARN configured
- **Important**: CloudFront aliases must include BOTH root domain AND www subdomain
  - If accessing `www.goalsguild.com`, ensure it's in `additional_domains` in `dev.tfvars`
  - CloudFront will automatically include all domains from `additional_domains` in aliases

### Browser-Specific SSL Errors (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)
- **Edge Browser**: May be stricter about SSL/TLS protocol versions
- **Solution**: Terraform now uses `TLSv1.2_2019` for maximum browser compatibility
- **After fixing**: Redeploy CloudFront distribution to apply changes
- **Wait time**: CloudFront changes can take 15-30 minutes to propagate globally
- **Verify**: Check certificate covers both `goalsguild.com` and `www.goalsguild.com`

### Access Denied After DNS Change
- Wait for CloudFront cache to clear
- Create cache invalidation: `aws cloudfront create-invalidation --distribution-id E25AKY0B7XCOUK --paths "/*"`

## Alternative: Use Route53 (Easier but Costs More)

If you prefer, you can:
1. Transfer DNS management to AWS Route53
2. Update Terraform: `use_route53 = true`
3. Terraform will automatically configure DNS records

This is easier but adds Route53 hosting costs (~$0.50/month per hosted zone).



