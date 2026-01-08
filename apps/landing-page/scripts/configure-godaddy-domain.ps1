# Script to help configure GoDaddy domain for CloudFront
# This script provides the DNS records you need to add in GoDaddy

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== GoDaddy Domain Configuration for GoalsGuild Landing Page ===" -ForegroundColor Cyan
Write-Host ""

# Get CloudFront distribution details
$TerraformPath = Join-Path $PSScriptRoot "..\terraform"
Push-Location $TerraformPath

try {
    $output = terraform output -json | ConvertFrom-Json
    $cloudfrontDomain = $output.cloudfront_domain_name.value
    $cloudfrontHostedZoneId = $output.cloudfront_hosted_zone_id.value
    $distributionId = $output.cloudfront_distribution_id.value
    
    Write-Host "CloudFront Distribution Details:" -ForegroundColor Yellow
    Write-Host "  Distribution ID: $distributionId" -ForegroundColor White
    Write-Host "  CloudFront Domain: $cloudfrontDomain" -ForegroundColor White
    Write-Host "  Hosted Zone ID: $cloudfrontHostedZoneId" -ForegroundColor White
    Write-Host ""
    
    Write-Host "DNS Records to Add in GoDaddy:" -ForegroundColor Green
    Write-Host ""
    
    # Option 1: CNAME for www subdomain (Recommended)
    Write-Host "Option 1: www Subdomain (Recommended)" -ForegroundColor Cyan
    Write-Host "  Type: CNAME" -ForegroundColor White
    Write-Host "  Name: www" -ForegroundColor White
    Write-Host "  Value: $cloudfrontDomain" -ForegroundColor White
    Write-Host "  TTL: 600" -ForegroundColor White
    Write-Host ""
    
    # Option 2: Root domain forwarding
    Write-Host "Option 2: Root Domain Forwarding" -ForegroundColor Cyan
    Write-Host "  In GoDaddy, configure domain forwarding:" -ForegroundColor White
    Write-Host "  - Forward: $Domain" -ForegroundColor White
    Write-Host "  - To: www.$Domain" -ForegroundColor White
    Write-Host "  - Type: Permanent (301)" -ForegroundColor White
    Write-Host ""
    
    # Option 3: A record (if GoDaddy supports it)
    Write-Host "Option 3: A Record (if GoDaddy supports CloudFront alias)" -ForegroundColor Cyan
    Write-Host "  Note: Most DNS providers don't support A records pointing to CloudFront" -ForegroundColor Yellow
    Write-Host "  Type: A" -ForegroundColor White
    Write-Host "  Name: @ (or blank for root)" -ForegroundColor White
    Write-Host "  Value: [Use GoDaddy's domain forwarding instead]" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Steps to Configure:" -ForegroundColor Green
    Write-Host "  1. Log in to GoDaddy" -ForegroundColor White
    Write-Host "  2. Go to 'My Products' → 'DNS' → Select your domain" -ForegroundColor White
    Write-Host "  3. Add the CNAME record for 'www' as shown above" -ForegroundColor White
    Write-Host "  4. Configure domain forwarding for root domain (if desired)" -ForegroundColor White
    Write-Host "  5. Wait 24-48 hours for DNS propagation (usually faster)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "To use custom domain with SSL certificate:" -ForegroundColor Yellow
    Write-Host "  1. Update LandingPage/terraform/environments/dev.tfvars:" -ForegroundColor White
    Write-Host "     custom_domain = `"$Domain`"" -ForegroundColor Gray
    Write-Host "     additional_domains = [`"www.$Domain`"]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Deploy to create ACM certificate:" -ForegroundColor White
    Write-Host "     cd LandingPage\scripts" -ForegroundColor Gray
    Write-Host "     .\deploy-landing-page.ps1 -Env $Environment -AutoApprove" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Add DNS validation records in GoDaddy (check dns-validation-$Environment.txt)" -ForegroundColor White
    Write-Host ""
    Write-Host "  4. After certificate is validated, CloudFront will use your domain" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Configuration:" -ForegroundColor Yellow
    Write-Host "  CloudFront Domain: d1of22l34nde2a.cloudfront.net" -ForegroundColor White
    Write-Host "  Add CNAME record in GoDaddy:" -ForegroundColor White
    Write-Host "    Name: www" -ForegroundColor White
    Write-Host "    Value: d1of22l34nde2a.cloudfront.net" -ForegroundColor White
} finally {
    Pop-Location
}

Write-Host "=== Configuration Complete ===" -ForegroundColor Green
Write-Host ""

















