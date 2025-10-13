# Complete deployment script for collaboration-service
# This script builds the Docker image, pushes to ECR, and deploys via Terraform

param(
    [string]$Env = "dev",
    [string]$ImageTag = "latest",
    [string]$ECRRepository = "goalsguild_collaboration_service",
    [switch]$SkipBuild,
    [switch]$SkipTerraform
)

$ErrorActionPreference = "Stop"

Write-Host "=== Collaboration Service Deployment ===" -ForegroundColor Green
Write-Host "Environment: $Env" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow
Write-Host ""

# Get AWS account ID and region
$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = (aws configure get region)

if (-not $AccountId -or -not $Region) {
    Write-Error "Failed to get AWS account ID or region. Make sure AWS CLI is configured."
    exit 1
}

$ECRUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository"

if (-not $SkipBuild) {
    Write-Host "=== Step 1: Building Docker Image ===" -ForegroundColor Green

    # Build the Docker image
    Write-Host "Building Docker image..."
    docker build -t "$ECRUri`:$ImageTag" -f Dockerfile .

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

    Write-Host "✅ Docker image successfully built and pushed: $ECRUri`:$ImageTag" -ForegroundColor Green
    Write-Host ""
}

if (-not $SkipTerraform) {
    Write-Host "=== Step 2: Deploying via Terraform ===" -ForegroundColor Green

    # Navigate to terraform directory
    Push-Location "../../infra/terraform2"

    try {
        # Initialize Terraform if needed
        Write-Host "Initializing Terraform..."
        terraform init

        # Plan the deployment
        Write-Host "Planning Terraform deployment..."
        terraform plan -var-file="environments/$Env.tfvars" -out=tfplan

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform plan failed"
            exit 1
        }

        # Apply the deployment
        Write-Host "Applying Terraform deployment..."
        terraform apply tfplan

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform apply failed"
            exit 1
        }

        Write-Host "✅ Terraform deployment successful" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    Write-Host ""
}

Write-Host "=== Step 3: Verification ===" -ForegroundColor Green

# Get the Lambda function name and API Gateway URL from Terraform outputs
Push-Location "../../infra/terraform2"
try {
    $LambdaName = terraform output -raw collaboration_service_lambda_name
    $LambdaArn = terraform output -raw collaboration_service_lambda_arn
    $ImageUri = terraform output -raw collaboration_service_image_uri
}
finally {
    Pop-Location
}

Write-Host "Lambda Function: $LambdaName" -ForegroundColor Yellow
Write-Host "Lambda ARN: $LambdaArn" -ForegroundColor Yellow
Write-Host "Image URI: $ImageUri" -ForegroundColor Yellow
Write-Host ""

# Test the health endpoint
Write-Host "Testing health endpoint..."
try {
    $HealthResponse = Invoke-WebRequest -Uri "https://api.goalsguild.com/collaborations/health" -Method GET -TimeoutSec 30
    if ($HealthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ Health check returned status: $($HealthResponse.StatusCode)"
    }
} catch {
    Write-Warning "⚠️ Health check failed: $($_.Exception.Message)"
    Write-Host "Note: This may be expected if API Gateway deployment is still propagating" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Collaboration service has been deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the collaboration features using the test scenarios"
Write-Host "2. Monitor CloudWatch logs for any issues"
Write-Host "3. Verify frontend integration works correctly"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "• Check Lambda logs: aws logs tail /aws/lambda/$LambdaName --follow"
Write-Host "• Test API: curl -H 'Authorization: Bearer <token>' https://api.goalsguild.com/collaborations/health"
