# Build script for subscription-service Docker image
param(
    [string]$ImageTag = "latest",
    [string]$ECRRepository = "goalsguild_subscription_service"
)

$ErrorActionPreference = "Stop"

# Get AWS account ID and region
$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = (aws configure get region)

if (-not $AccountId -or -not $Region) {
    Write-Error "Failed to get AWS account ID or region. Make sure AWS CLI is configured."
    exit 1
}

$ECRUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository"

Write-Host "Building Docker image for subscription-service..." -ForegroundColor Green
Write-Host "ECR Repository: $ECRUri" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow
Write-Host ""

# Build the Docker image
# Build from the workspace root to correctly resolve paths (similar to quest-service)
Write-Host "Building Docker image from workspace root..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot/../../.."
try {
    docker build -t "$ECRUri`:$ImageTag" -f services/subscription-service/Dockerfile .
}
finally {
    Pop-Location
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Ensure ECR repository exists
Write-Host "Checking ECR repository..." -ForegroundColor Cyan
try {
    aws ecr describe-repositories --repository-names $ECRRepository --region $Region | Out-Null
    Write-Host "✅ ECR repository exists" -ForegroundColor Green
}
catch {
    Write-Host "Creating ECR repository..." -ForegroundColor Cyan
    aws ecr create-repository --repository-name $ECRRepository --region $Region --image-tag-mutability MUTABLE --image-scanning-configuration scanOnPush=true
    Write-Host "✅ ECR repository created" -ForegroundColor Green
}

# Login to ECR
Write-Host "Logging in to ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com

if ($LASTEXITCODE -ne 0) {
    Write-Error "ECR login failed"
    exit 1
}

# Push the image
Write-Host "Pushing image to ECR..." -ForegroundColor Cyan
docker push "$ECRUri`:$ImageTag"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed"
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully built and pushed $ECRUri`:$ImageTag" -ForegroundColor Green
Write-Host "Image URI: $ECRUri`:$ImageTag" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run deploy.ps1 to deploy via Terraform" -ForegroundColor White
Write-Host "2. Or update Terraform with the image URI above" -ForegroundColor White

