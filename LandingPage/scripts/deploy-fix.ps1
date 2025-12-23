# Quick deployment script to fix the import.meta error
# Deploys updated main.js to S3 and invalidates CloudFront cache

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying Waitlist Fix ===" -ForegroundColor Cyan

# Get S3 bucket name from Terraform
Write-Host "`nGetting S3 bucket name..." -ForegroundColor Yellow
Push-Location "../terraform"
try {
    $S3Bucket = terraform output -raw s3_bucket_name 2>&1
    $CloudFrontId = terraform output -raw cloudfront_distribution_id 2>&1
    
    if (-not $S3Bucket -or $S3Bucket -match "Error") {
        Write-Host "Could not get S3 bucket name from Terraform" -ForegroundColor Red
        Write-Host "Trying to get from terraform.tfstate..." -ForegroundColor Yellow
        
        # Try to get from state file
        $state = Get-Content terraform.tfstate -Raw | ConvertFrom-Json
        $S3Bucket = $state.outputs.s3_bucket_name.value
        $CloudFrontId = $state.outputs.cloudfront_distribution_id.value
    }
    
    Write-Host "S3 Bucket: $S3Bucket" -ForegroundColor Green
    Write-Host "CloudFront ID: $CloudFrontId" -ForegroundColor Green
}
catch {
    Write-Host "Error getting Terraform outputs: $_" -ForegroundColor Red
    Write-Host "Please run: cd LandingPage\terraform && terraform output" -ForegroundColor Yellow
    exit 1
}
finally {
    Pop-Location
}

# Sync JavaScript files to S3
Write-Host "`nSyncing JavaScript files to S3..." -ForegroundColor Yellow
$SourcePath = Resolve-Path "../src" | Select-Object -ExpandProperty Path

try {
    # Sync JS files with no cache
    aws s3 cp "$SourcePath/js/main.js" "s3://$S3Bucket/js/main.js" `
        --cache-control "no-cache, no-store, must-revalidate" `
        --content-type "application/javascript"
    
    Write-Host "main.js uploaded successfully!" -ForegroundColor Green
    
    # Also sync HTML to ensure config is correct
    aws s3 cp "$SourcePath/index.html" "s3://$S3Bucket/index.html" `
        --cache-control "no-cache, no-store, must-revalidate" `
        --content-type "text/html"
    
    Write-Host "index.html uploaded successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error syncing files: $_" -ForegroundColor Red
    exit 1
}

# Invalidate CloudFront cache
Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor Yellow
try {
    $InvalidationId = aws cloudfront create-invalidation `
        --distribution-id $CloudFrontId `
        --paths "/js/main.js" "/index.html" `
        --query "Invalidation.Id" `
        --output text
    
    Write-Host "CloudFront invalidation created: $InvalidationId" -ForegroundColor Green
    Write-Host "Cache will be cleared within 1-2 minutes" -ForegroundColor Yellow
}
catch {
    Write-Host "Error creating invalidation: $_" -ForegroundColor Red
    Write-Host "You may need to wait a few minutes for changes to propagate" -ForegroundColor Yellow
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Please clear your browser cache or use Ctrl+Shift+R to hard refresh" -ForegroundColor Yellow
Write-Host "Or wait 1-2 minutes for CloudFront cache to clear" -ForegroundColor Yellow














