# Build script for collaboration-service Docker image
param(
    [string]$ImageTag,
    [string]$ECRRepository = "goalsguild_collaboration_service"
)

if (-not $ImageTag) {
    Write-Error "ImageTag parameter is required"
    exit 1
}

$ErrorActionPreference = "Stop"

# Get AWS account ID and region
$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = (aws configure get region)

if (-not $AccountId -or -not $Region) {
    Write-Error "Failed to get AWS account ID or region. Make sure AWS CLI is configured."
    exit 1
}

$ECRUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository"

Write-Host "Building Docker image for collaboration-service..."
Write-Host "ECR Repository: $ECRUri"
Write-Host "Image Tag: $ImageTag"

# Create ECR repository if it doesn't exist
Write-Host "Ensuring ECR repository exists..."
try {
    aws ecr describe-repositories --repository-names $ECRRepository --region $Region 2>$null | Out-Null
    Write-Host "ECR repository already exists" -ForegroundColor DarkGray

    # Clean up old images to ensure only the new correct image is available
    Write-Host "Cleaning up old images..." -ForegroundColor DarkGray
    try {
        # Get all images except the current one being built
        $allImages = aws ecr list-images --repository-name $ECRRepository --region $Region --query 'imageIds[?type==`IMAGE`]' --output json 2>$null | ConvertFrom-Json
        if ($allImages) {
            Write-Host "Found $($allImages.Count) existing images, removing them..." -ForegroundColor DarkGray
            foreach ($image in $allImages) {
                if ($image.imageTag) {
                    Write-Host "Removing old image: $($image.imageTag)" -ForegroundColor DarkGray
                    aws ecr batch-delete-image --repository-name $ECRRepository --region $Region --image-ids imageTag=$($image.imageTag) 2>$null | Out-Null
                } elseif ($image.imageDigest) {
                    Write-Host "Removing untagged image: $($image.imageDigest)" -ForegroundColor DarkGray
                    aws ecr batch-delete-image --repository-name $ECRRepository --region $Region --image-ids imageDigest=$($image.imageDigest) 2>$null | Out-Null
                }
            }
            Write-Host "Old images cleaned up" -ForegroundColor Green
        }
    } catch {
        Write-Host "Warning: Could not clean up old images: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Creating ECR repository..." -ForegroundColor DarkGray
    aws ecr create-repository --repository-name $ECRRepository --region $Region
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create ECR repository"
        exit 1
    }
    Write-Host "ECR repository created successfully" -ForegroundColor Green
}

# Build the Docker image
# Navigate to backend directory and build from there
Push-Location ../..
try {
    # Build with specific platform for Lambda compatibility
    Write-Host "Building Docker image with buildx for Linux AMD64..." -ForegroundColor DarkGray
    $buildCmd = "docker buildx build --platform linux/amd64 -f services/collaboration-service/Dockerfile -t `"$ECRUri`:$ImageTag`" --load ."
    Write-Host "Running: $buildCmd" -ForegroundColor DarkGray

    $process = Start-Process -FilePath "docker" -ArgumentList "buildx", "build", "--platform", "linux/amd64", "-f", "services/collaboration-service/Dockerfile", "-t", "$ECRUri`:$ImageTag", "--load", "." -WorkingDirectory (Get-Location) -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -ne 0) {
        Write-Error "Docker build failed with exit code: $($process.ExitCode)"
        exit 1
    }

    Write-Host "Docker build completed successfully" -ForegroundColor Green
} finally {
    Pop-Location
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

# Login to ECR using AWS CLI
Write-Host "Logging in to ECR using AWS CLI..."
$RegistryHost = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$HttpsRegistryHost = "https://$RegistryHost"
Write-Host "ECR Registry: $RegistryHost"

try {
    # Ensure clean state
    Write-Host "Logging out of Docker registry (if logged in)..." -ForegroundColor DarkGray
    try { docker logout $HttpsRegistryHost 2>$null | Out-Null } catch {}
    try { docker logout $RegistryHost 2>$null | Out-Null } catch {}

    # First attempt: use cmd.exe pipeline (matches manual success)
    Write-Host "Attempting ECR login via cmd pipeline..." -ForegroundColor DarkGray
    $cmdLogin = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $RegistryHost"
    cmd.exe /c $cmdLogin | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "cmd pipeline login failed (code $LASTEXITCODE). Trying HTTPS..." -ForegroundColor DarkGray
        $cmdLoginHttps = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $HttpsRegistryHost"
        cmd.exe /c $cmdLoginHttps | Out-Null
    }

    if ($LASTEXITCODE -ne 0) {
        # Second attempt: get password, then login with -p (no pipe quirks)
        Write-Host "Falling back to direct -p login..." -ForegroundColor DarkGray
        $ECRPassword = aws ecr get-login-password --region $Region
        if ($LASTEXITCODE -ne 0 -or -not $ECRPassword) {
            throw "Failed to get ECR login password. Exit code: $LASTEXITCODE"
        }
        docker login $RegistryHost -u AWS -p $ECRPassword | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Direct login without HTTPS failed (code $LASTEXITCODE). Trying HTTPS..." -ForegroundColor DarkGray
            docker login $HttpsRegistryHost -u AWS -p $ECRPassword | Out-Null
        }
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker login failed with exit code: $LASTEXITCODE"
        exit 1
    }

    Write-Host "ECR login successful" -ForegroundColor Green
} catch {
    Write-Error "ECR login failed: $($_.Exception.Message)"
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
