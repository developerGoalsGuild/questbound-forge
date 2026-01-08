# Check AWS CloudFront and Certificate Configuration
# This script verifies the current AWS configuration

Write-Host "=== Checking AWS Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Check AWS credentials
Write-Host "1. Checking AWS Credentials..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -eq 0) {
    $identityObj = $identity | ConvertFrom-Json
    Write-Host "   Account: $($identityObj.Account)" -ForegroundColor Green
    Write-Host "   User/Role: $($identityObj.Arn)" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Could not get AWS identity" -ForegroundColor Red
    Write-Host "   $identity" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check CloudFront Distribution
Write-Host "2. Checking CloudFront Distribution (E25AKY0B7XCOUK)..." -ForegroundColor Yellow
$distConfig = aws cloudfront get-distribution-config --id E25AKY0B7XCOUK 2>&1
if ($LASTEXITCODE -eq 0) {
    $distObj = $distConfig | ConvertFrom-Json
    $config = $distObj.DistributionConfig
    
    Write-Host "   Status: $($distObj.ETag)" -ForegroundColor Green
    Write-Host "   Aliases:" -ForegroundColor Cyan
    if ($config.Aliases.Items) {
        foreach ($alias in $config.Aliases.Items) {
            Write-Host "     - $alias" -ForegroundColor Green
        }
    } else {
        Write-Host "     (none configured)" -ForegroundColor Yellow
    }
    
    Write-Host "   Viewer Certificate:" -ForegroundColor Cyan
    $cert = $config.ViewerCertificate
    Write-Host "     ACM Certificate ARN: $($cert.ACMCertificateArn)" -ForegroundColor Green
    Write-Host "     SSL Support Method: $($cert.SSLSupportMethod)" -ForegroundColor Green
    Write-Host "     Minimum Protocol Version: $($cert.MinimumProtocolVersion)" -ForegroundColor Green
    Write-Host "     Certificate Source: $($cert.CertificateSource)" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Could not get CloudFront distribution" -ForegroundColor Red
    Write-Host "   $distConfig" -ForegroundColor Red
}
Write-Host ""

# Check ACM Certificate
Write-Host "3. Checking ACM Certificate..." -ForegroundColor Yellow
$certArn = "arn:aws:acm:us-east-1:838284111015:certificate/a86d881f-b145-4d03-84fc-6fa92308103e"
$certInfo = aws acm describe-certificate --certificate-arn $certArn --region us-east-1 2>&1
if ($LASTEXITCODE -eq 0) {
    $certObj = $certInfo | ConvertFrom-Json
    $cert = $certObj.Certificate
    
    Write-Host "   Domain Name: $($cert.DomainName)" -ForegroundColor Green
    Write-Host "   Status: $($cert.Status)" -ForegroundColor $(if ($cert.Status -eq "ISSUED") { "Green" } else { "Yellow" })
    Write-Host "   Subject Alternative Names:" -ForegroundColor Cyan
    foreach ($san in $cert.SubjectAlternativeNames) {
        Write-Host "     - $san" -ForegroundColor Green
    }
    Write-Host "   Type: $($cert.Type)" -ForegroundColor Green
    Write-Host "   Validation Method: $($cert.DomainValidationOptions[0].ValidationMethod)" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Could not get certificate information" -ForegroundColor Red
    Write-Host "   $certInfo" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Check the aliases above to ensure both 'goalsguild.com' and 'www.goalsguild.com' are included." -ForegroundColor Yellow
Write-Host "If not, you need to redeploy the Terraform configuration." -ForegroundColor Yellow















