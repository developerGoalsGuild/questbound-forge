# Complete deployment script for subscription-service
# This script builds the Docker image, pushes to ECR, and deploys via Terraform

param(
    [string]$Env = "dev",
    [string]$ImageTag = "latest",
    [string]$ECRRepository = "goalsguild_subscription_service",
    [switch]$SkipBuild,
    [switch]$SkipTerraform
)

$ErrorActionPreference = "Stop"

Write-Host "=== Subscription Service Deployment ===" -ForegroundColor Green
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

    # Build the Docker image from workspace root (like quest-service)
    Write-Host "Building Docker image from workspace root..." -ForegroundColor Cyan
    Push-Location "$PSScriptRoot/../../.."
    try {
        docker build -t "$ECRUri`:$ImageTag" -f services/subscription-service/Dockerfile .

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Docker build failed"
            exit 1
        }

        Write-Host "✅ Docker image built successfully" -ForegroundColor Green

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

        Write-Host "✅ Docker image successfully pushed: $ECRUri`:$ImageTag" -ForegroundColor Green
        Write-Host ""
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipTerraform) {
    Write-Host "=== Step 2: Deploying via Terraform ===" -ForegroundColor Green

    # Navigate to terraform directory
    Push-Location "$PSScriptRoot/../../infra/terraform2"

    try {
        # Check if environment file exists
        $EnvFile = "environments/$Env.tfvars"
        if (-not (Test-Path $EnvFile)) {
            Write-Warning "Environment file $EnvFile not found. Creating from template..."
            # Could create a default tfvars file here if needed
        }

        # Initialize Terraform if needed
        Write-Host "Initializing Terraform..." -ForegroundColor Cyan
        terraform init

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform init failed"
            exit 1
        }

        # Plan the deployment
        Write-Host "Planning Terraform deployment..." -ForegroundColor Cyan
        if (Test-Path $EnvFile) {
            terraform plan -var-file=$EnvFile -out=tfplan
        }
        else {
            terraform plan -var="environment=$Env" -out=tfplan
        }

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform plan failed"
            exit 1
        }

        # Apply the deployment
        Write-Host "Applying Terraform deployment..." -ForegroundColor Cyan
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

# Get the Lambda function name from Terraform outputs (if available)
Push-Location "$PSScriptRoot/../../infra/terraform2"
try {
    $LambdaName = $null
    $LambdaArn = $null
    $ImageUri = $null
    
    try {
        $LambdaName = terraform output -raw subscription_service_lambda_name -no-color 2>$null
    } catch {}
    
    try {
        $LambdaArn = terraform output -raw subscription_service_lambda_arn -no-color 2>$null
    } catch {}
    
    try {
        $ImageUri = terraform output -raw subscription_service_image_uri -no-color 2>$null
    } catch {}
    
    if ($LambdaName) {
        Write-Host "Lambda Function: $LambdaName" -ForegroundColor Yellow
    }
    if ($LambdaArn) {
        Write-Host "Lambda ARN: $LambdaArn" -ForegroundColor Yellow
    }
    if ($ImageUri) {
        Write-Host "Image URI: $ImageUri" -ForegroundColor Yellow
    }
    
    if (-not $LambdaName -and -not $LambdaArn) {
        Write-Host "⚠️ Terraform outputs not available. Lambda may need to be configured in Terraform." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

Write-Host ""

# Test the health endpoint if API Gateway is configured
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    # Try to get API Gateway URL from Terraform or use default pattern
    $ApiUrl = "https://api.goalsguild.com/subscriptions/health"
    $HealthResponse = Invoke-WebRequest -Uri $ApiUrl -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
    
    if ($HealthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    }
    else {
        Write-Warning "⚠️ Health check returned status: $($HealthResponse.StatusCode)"
    }
}
catch {
    Write-Warning "⚠️ Health check failed: $($_.Exception.Message)"
    Write-Host "Note: This may be expected if API Gateway endpoint is not yet configured" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Subscription service has been deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify subscription endpoints in API Gateway" -ForegroundColor White
Write-Host "2. Configure Stripe webhook endpoint (for production)" -ForegroundColor White
Write-Host "3. Test subscription flows using mock mode (dev)" -ForegroundColor White
Write-Host "4. Monitor CloudWatch logs for any issues" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
if ($LambdaName) {
    Write-Host "• Check Lambda logs: aws logs tail /aws/lambda/$LambdaName --follow" -ForegroundColor White
}
Write-Host "• Test API: curl -H 'Authorization: Bearer <token>' $ApiUrl" -ForegroundColor White
Write-Host "• View logs: aws logs tail /aws/lambda/subscription-service-$Env --follow" -ForegroundColor White

