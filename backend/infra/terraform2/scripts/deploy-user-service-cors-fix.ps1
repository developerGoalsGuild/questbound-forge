# Quick deployment script for user-service CORS fix
# This script builds and deploys the user-service with CORS fixes

param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$SkipInit
)

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying User-Service with CORS Fix ===" -ForegroundColor Cyan
Write-Host "Environment: $Env" -ForegroundColor Yellow
Write-Host ""

# Get script directory and paths
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$ScriptRoot\.." | Select-Object -ExpandProperty Path
$ServicePath = Resolve-Path "$RepoRoot\..\..\services\user-service" | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\services\user-service" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path

Write-Host "Paths:" -ForegroundColor Yellow
Write-Host "  Service: $ServicePath" -ForegroundColor Gray
Write-Host "  Stack: $StackPath" -ForegroundColor Gray
Write-Host "  Env File: $EnvFile" -ForegroundColor Gray
Write-Host ""

# Get AWS info
Write-Host "Getting AWS information..." -ForegroundColor Yellow
$AccountId = aws sts get-caller-identity --query Account --output text 2>&1
$Region = aws configure get region 2>&1

if ($LASTEXITCODE -ne 0 -or -not $AccountId) {
    Write-Host "ERROR: Failed to get AWS credentials" -ForegroundColor Red
    exit 1
}

Write-Host "AWS Account: $AccountId" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green
Write-Host ""

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
$ECRRepository = "goalsguild_user_service"
$ImageTag = "latest"
$FullImageUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository`:$ImageTag"

Push-Location $RepoRoot
try {
    $DockerfilePath = "services\user-service\Dockerfile"
    Write-Host "Building from: $(Get-Location)" -ForegroundColor Gray
    Write-Host "Dockerfile: $DockerfilePath" -ForegroundColor Gray
    
    docker buildx build --platform linux/amd64 -f $DockerfilePath -t $FullImageUri --provenance=false --sbom=false --load .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Docker build successful!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Docker build exception: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

# Login to ECR
Write-Host "`nLogging in to ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: ECR login failed" -ForegroundColor Red
    exit 1
}

# Push image
Write-Host "Pushing image to ECR..." -ForegroundColor Yellow
docker push $FullImageUri

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host "Image pushed successfully!" -ForegroundColor Green
Write-Host "Image URI: $FullImageUri" -ForegroundColor Cyan
Write-Host ""

# Deploy with Terraform
Write-Host "Deploying with Terraform..." -ForegroundColor Yellow
Push-Location $RepoRoot
try {
    if (-not $SkipInit) {
        Write-Host "Running terraform init..." -ForegroundColor Yellow
        terraform -chdir="$StackPath" init -upgrade
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Terraform init failed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Update image URI in main.tf
    $MainTfFile = "$StackPath\main.tf"
    if (Test-Path $MainTfFile) {
        $Content = Get-Content $MainTfFile -Raw
        $NewContent = $Content -replace 'existing_image_uri = "[^"]*"', "existing_image_uri = `"$FullImageUri`""
        Set-Content -Path $MainTfFile -Value $NewContent -Encoding UTF8
        Write-Host "Updated main.tf with image URI" -ForegroundColor Green
    }
    
    Write-Host "Running terraform apply..." -ForegroundColor Yellow
    terraform -chdir="$StackPath" apply -var-file "$EnvFile" -auto-approve
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Terraform apply failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
    Write-Host "User-service deployed with CORS fixes!" -ForegroundColor Green
    Write-Host "Image: $FullImageUri" -ForegroundColor Cyan
    Write-Host "`nWait 1-2 minutes for Lambda to update, then test the waitlist form." -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: Deployment failed: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}














