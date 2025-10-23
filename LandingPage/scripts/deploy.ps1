# GoalsGuild Landing Page - PowerShell Deployment Script
# Deploys static files to S3 and invalidates CloudFront cache

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "../src",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTerraform,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInvalidation
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-ColorOutput "Checking prerequisites..." $Yellow

if (-not (Test-Command "aws")) {
    Write-ColorOutput "AWS CLI is not installed or not in PATH" $Red
    exit 1
}

if (-not (Test-Command "terraform")) {
    Write-ColorOutput "Terraform is not installed or not in PATH" $Red
    exit 1
}

# Validate environment
$ValidEnvironments = @("dev", "staging", "prod")
if ($Environment -notin $ValidEnvironments) {
    Write-ColorOutput "Invalid environment. Must be one of: $($ValidEnvironments -join ', ')" $Red
    exit 1
}

# Check if source directory exists
if (-not (Test-Path $SourcePath)) {
    Write-ColorOutput "Source directory not found: $SourcePath" $Red
    exit 1
}

Write-ColorOutput "Starting deployment for environment: $Environment" $Green

# Step 1: Deploy Terraform infrastructure (if not skipped)
if (-not $SkipTerraform) {
    Write-ColorOutput "Deploying Terraform infrastructure..." $Yellow
    
    Push-Location "../terraform"
    
    try {
        # Initialize Terraform
        Write-ColorOutput "Initializing Terraform..." $Yellow
        terraform init
        
        # Plan deployment
        Write-ColorOutput "Planning Terraform deployment..." $Yellow
        terraform plan -var-file="environments/$Environment.tfvars" -out="terraform.tfplan"
        
        # Apply deployment
        Write-ColorOutput "Applying Terraform deployment..." $Yellow
        terraform apply -auto-approve "terraform.tfplan"
        
        # Get outputs
        $S3Bucket = terraform output -raw s3_bucket_name
        $CloudFrontId = terraform output -raw cloudfront_distribution_id
        $WebsiteUrl = terraform output -raw website_url
        
        Write-ColorOutput "Infrastructure deployed successfully!" $Green
        Write-ColorOutput "S3 Bucket: $S3Bucket" $Green
        Write-ColorOutput "CloudFront ID: $CloudFrontId" $Green
        Write-ColorOutput "Website URL: $WebsiteUrl" $Green
        
        # Save outputs for later use
        $env:S3_BUCKET_NAME = $S3Bucket
        $env:CLOUDFRONT_ID = $CloudFrontId
        $env:WEBSITE_URL = $WebsiteUrl
        
    }
    catch {
        Write-ColorOutput "Terraform deployment failed: $($_.Exception.Message)" $Red
        exit 1
    }
    finally {
        Pop-Location
    }
}
else {
    Write-ColorOutput "Skipping Terraform deployment..." $Yellow
    
    # Try to get outputs from existing state
    Push-Location "../terraform"
    try {
        $env:S3_BUCKET_NAME = terraform output -raw s3_bucket_name
        $env:CLOUDFRONT_ID = terraform output -raw cloudfront_distribution_id
        $env:WEBSITE_URL = terraform output -raw website_url
    }
    catch {
        Write-ColorOutput "Could not get Terraform outputs. Please run without -SkipTerraform first." $Red
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Step 2: Sync files to S3
Write-ColorOutput "Syncing files to S3 bucket: $env:S3_BUCKET_NAME" $Yellow

try {
    # Sync all files to S3
    aws s3 sync $SourcePath s3://$env:S3_BUCKET_NAME/ `
        --delete `
        --exclude "*.git*" `
        --exclude "*.DS_Store" `
        --exclude "Thumbs.db" `
        --cache-control "max-age=31536000" `
        --metadata-directive REPLACE
    
    # Set specific cache headers for HTML files
    aws s3 cp $SourcePath s3://$env:S3_BUCKET_NAME/ `
        --recursive `
        --exclude "*" `
        --include "*.html" `
        --cache-control "max-age=3600" `
        --metadata-directive REPLACE
    
    Write-ColorOutput "Files synced to S3 successfully!" $Green
}
catch {
    Write-ColorOutput "S3 sync failed: $($_.Exception.Message)" $Red
    exit 1
}

# Step 3: Invalidate CloudFront cache (if not skipped)
if (-not $SkipInvalidation) {
    Write-ColorOutput "Invalidating CloudFront cache..." $Yellow
    
    try {
        $InvalidationId = aws cloudfront create-invalidation `
            --distribution-id $env:CLOUDFRONT_ID `
            --paths "/*" `
            --query "Invalidation.Id" `
            --output text
        
        Write-ColorOutput "CloudFront invalidation created: $InvalidationId" $Green
        Write-ColorOutput "Cache invalidation is in progress. Changes will be visible within 15 minutes." $Yellow
    }
    catch {
        Write-ColorOutput "CloudFront invalidation failed: $($_.Exception.Message)" $Red
        Write-ColorOutput "You may need to manually invalidate the cache in the AWS Console." $Yellow
    }
}
else {
    Write-ColorOutput "Skipping CloudFront invalidation..." $Yellow
}

# Step 4: Verify deployment
Write-ColorOutput "Verifying deployment..." $Yellow

try {
    # Test if the website is accessible
    $Response = Invoke-WebRequest -Uri $env:WEBSITE_URL -Method Head -TimeoutSec 30
    if ($Response.StatusCode -eq 200) {
        Write-ColorOutput "Website is accessible at: $env:WEBSITE_URL" $Green
    }
    else {
        Write-ColorOutput "Website returned status code: $($Response.StatusCode)" $Yellow
    }
}
catch {
    Write-ColorOutput "Could not verify website accessibility: $($_.Exception.Message)" $Yellow
    Write-ColorOutput "Please check the website manually at: $env:WEBSITE_URL" $Yellow
}

Write-ColorOutput "Deployment completed successfully!" $Green
Write-ColorOutput "Website URL: $env:WEBSITE_URL" $Green
