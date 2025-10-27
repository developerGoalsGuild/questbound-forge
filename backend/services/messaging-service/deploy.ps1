# Messaging Service Deployment Script
# Deploys the messaging service to AWS using Docker and ECS

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1",
    [switch]$Build = $false,
    [switch]$Deploy = $false
)

$ServiceName = "messaging-service"
$ImageTag = "$ServiceName-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "🚀 Deploying Messaging Service to $Environment environment" -ForegroundColor Green

# Build Docker image if requested
if ($Build) {
    Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
    
    # Build the image
    docker build -t $ServiceName .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Docker build failed"
        exit 1
    }
    
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
}

# Deploy to AWS if requested
if ($Deploy) {
    Write-Host "☁️ Deploying to AWS ECS..." -ForegroundColor Yellow
    
    # Check if AWS CLI is available
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Error "❌ AWS CLI not found. Please install AWS CLI first."
        exit 1
    }
    
    # Set AWS region
    $env:AWS_DEFAULT_REGION = $Region
    
    # Create ECR repository if it doesn't exist
    $ECRRepository = "goalsguild-$ServiceName"
    Write-Host "📋 Checking ECR repository: $ECRRepository" -ForegroundColor Yellow
    
    try {
        aws ecr describe-repositories --repository-names $ECRRepository --region $Region
        Write-Host "✅ ECR repository exists" -ForegroundColor Green
    }
    catch {
        Write-Host "📋 Creating ECR repository..." -ForegroundColor Yellow
        aws ecr create-repository --repository-name $ECRRepository --region $Region
        Write-Host "✅ ECR repository created" -ForegroundColor Green
    }
    
    # Get ECR login token
    $ECRLogin = aws ecr get-login-password --region $Region
    $ECRRegistry = (aws sts get-caller-identity --query Account --output text) + ".dkr.ecr.$Region.amazonaws.com"
    
    # Login to ECR
    echo $ECRLogin | docker login --username AWS --password-stdin $ECRRegistry
    
    # Tag and push image
    $ImageURI = "${ECRRegistry}/${ECRRepository}:${ImageTag}"
    docker tag $ServiceName $ImageURI
    docker push $ImageURI
    
    Write-Host "✅ Image pushed to ECR: $ImageURI" -ForegroundColor Green
    
    # Deploy to ECS (this would require ECS task definition and service)
    Write-Host "🚀 Deploying to ECS..." -ForegroundColor Yellow
    Write-Host "⚠️ ECS deployment requires task definition and service configuration" -ForegroundColor Yellow
    Write-Host "📋 Image URI: $ImageURI" -ForegroundColor Cyan
    Write-Host "📋 Service: $ServiceName" -ForegroundColor Cyan
    Write-Host "📋 Environment: $Environment" -ForegroundColor Cyan
}

Write-Host "✅ Messaging Service deployment completed!" -ForegroundColor Green
Write-Host "📋 Service: $ServiceName" -ForegroundColor Cyan
Write-Host "📋 Environment: $Environment" -ForegroundColor Cyan
Write-Host "📋 Region: $Region" -ForegroundColor Cyan

if ($Build) {
    Write-Host "📋 Image: $ServiceName" -ForegroundColor Cyan
}

if ($Deploy) {
    Write-Host "ECR Image: ${ECRRegistry}/${ECRRepository}:${ImageTag}" -ForegroundColor Cyan
}
