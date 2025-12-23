# Quick GoDaddy Domain Setup Guide

## Simple Setup (No SSL on Custom Domain)

This is the fastest way to point your domain to CloudFront. Your site will work, but visitors will see the CloudFront domain in the browser.

### Steps:

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account

2. **Navigate to DNS Management**
   - Click "My Products"
   - Find your domain and click "DNS" (or "Manage DNS")

3. **Add CNAME Record for www Subdomain**
   - Click "Add" or "+" to create a new record
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `d1of22l34nde2a.cloudfront.net`
   - **TTL:** 600 (or leave default)
   - Click "Save"

4. **Configure Domain Forwarding (Optional)**
   - In GoDaddy, go to "Domain Forwarding"
   - Forward `goalsguild.com` → `www.goalsguild.com`
   - Type: Permanent (301 redirect)

5. **Wait for DNS Propagation**
   - Usually takes 1-24 hours
   - Check: https://www.whatsmydns.net/#CNAME/www.goalsguild.com

6. **Test**
   - Visit `http://www.goalsguild.com` (will redirect to HTTPS via CloudFront)
   - Should load your landing page

---

## Full Setup (With SSL Certificate)

This setup gives you a proper SSL certificate for your custom domain.

### Step 1: Update Terraform Configuration

Edit `LandingPage/terraform/environments/dev.tfvars`:

```hcl
custom_domain = "goalsguild.com"  # Your domain
additional_domains = ["www.goalsguild.com"]  # Optional
use_route53 = false  # Using GoDaddy, not Route53
route53_zone_name = ""
```

### Step 2: Deploy to Create SSL Certificate

```powershell
cd LandingPage\scripts
.\deploy-landing-page.ps1 -Env dev -AutoApprove
```

This will:
- Create an ACM certificate in us-east-1
- Generate DNS validation records
- Create a file: `LandingPage/terraform/dns-validation-dev.txt`

### Step 3: Add DNS Validation Records in GoDaddy

1. **Check the validation file:**
   ```powershell
   cat LandingPage\terraform\dns-validation-dev.txt
   ```

2. **Add CNAME records in GoDaddy:**
   - For each validation record shown in the file:
     - **Type:** CNAME
     - **Name:** The validation name (e.g., `_abc123def456`)
     - **Value:** The validation value (e.g., `_xyz789.abc.acm-validations.aws.`)
     - **TTL:** 600

3. **Wait for Certificate Validation**
   - Check AWS ACM console (us-east-1 region)
   - Status should change to "Issued" (usually 5-30 minutes)

### Step 4: Update CloudFront (if needed)

If the certificate ARN wasn't automatically used, update `dev.tfvars`:

```hcl
ssl_certificate_arn = "arn:aws:acm:us-east-1:838284111015:certificate/YOUR-CERT-ID"
```

Then redeploy:
```powershell
.\deploy-landing-page.ps1 -Env dev -AutoApprove -SkipInit
```

### Step 5: Configure DNS in GoDaddy

1. **Add CNAME for www:**
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `d1of22l34nde2a.cloudfront.net`
   - **TTL:** 600

2. **Configure Domain Forwarding:**
   - Forward `goalsguild.com` → `www.goalsguild.com`
   - Type: Permanent (301)

3. **Wait for DNS Propagation**
   - Check: https://www.whatsmydns.net/

### Step 6: Test

- Visit `https://www.goalsguild.com`
- Should show valid SSL certificate
- Should load your landing page

---

## Current CloudFront Details

- **Distribution ID:** `E25AKY0B7XCOUK`
- **CloudFront Domain:** `d1of22l34nde2a.cloudfront.net`
- **Hosted Zone ID:** `Z2FDTNDATAQYW2`

## Important Notes

1. **Root Domain CNAME:** Most DNS providers (including GoDaddy) don't allow CNAME records on the root domain (`@`). That's why we use the `www` subdomain.

2. **Domain Forwarding:** GoDaddy's domain forwarding feature redirects the root domain to www, which is a good solution.

3. **SSL Certificate:** Must be in **us-east-1** region for CloudFront.

4. **DNS Propagation:** Can take 24-48 hours, but usually happens within a few hours.

## Troubleshooting

### Domain Not Resolving
- Check DNS propagation: https://www.whatsmydns.net/
- Verify CNAME record is correct
- Clear browser cache

### SSL Certificate Issues
- Ensure certificate is in us-east-1
- Verify certificate is validated
- Check CloudFront has the certificate configured

### Still Seeing CloudFront Domain
- Wait for DNS propagation
- Clear browser cache
- Check CNAME record is correct
















