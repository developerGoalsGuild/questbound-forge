# Build script for quest-service Docker image
param(
    [string]$ImageTag = "latest",
    [string]$ECRRepository = "goalsguild_quest_service"
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

Write-Host "Building Docker image for quest-service..."
Write-Host "ECR Repository: $ECRUri"
Write-Host "Image Tag: $ImageTag"

# Build the Docker image
# Changed to run from the parent directory (backend) to correctly resolve paths
docker build -t "$ECRUri`:$ImageTag" -f Dockerfile ../../..

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

# Login to ECR
Write-Host "Logging in to ECR..."
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com

if ($LASTEXITCODE -ne 0) {
    Write-Error "ECR login failed"
    exit 1
}

# Push the image
Write-Host "Pushing image to ECR..."
docker push "$ECRUri`:$ImageTag"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed"
    exit 1
}

Write-Host "Successfully built and pushed $ECRUri`:$ImageTag"
Write-Host "Image URI: $ECRUri`:$ImageTag"
