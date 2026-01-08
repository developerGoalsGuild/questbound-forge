# PowerShell script with UTF-8 BOM encoding
# This script builds Docker image, auto-increments version, and deploys subscription-service
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [string]$TfLogPath = 'D:\terraformLogs\tf-subscription-service.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-subscription-service.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = $TfLogPath

# Clean up existing terraform log file
try {
  $logDir = Split-Path -Parent $TfLogPath
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  if (Test-Path $TfLogPath) { Clear-Content $TfLogPath -ErrorAction SilentlyContinue } else { New-Item -ItemType File -Path $TfLogPath | Out-Null }
  $env:TF_LOG = 'DEBUG'
  $env:TF_LOG_PATH = $TfLogPath
  Write-Host "[deploy] TF_LOG=DEBUG, TF_LOG_PATH=$TfLogPath" -ForegroundColor DarkGray
} catch {}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [subscription-service-build-deploy] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Get AWS account ID and region
function Get-AWSInfo {
  try {
    Write-Log "Getting AWS account ID..." "INFO"
    $AccountId = (aws sts get-caller-identity --query Account --output text 2>$null)
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to get AWS account ID. Make sure AWS CLI is configured and you have valid credentials."
    }
    
    Write-Log "Getting AWS region..." "INFO"
    $Region = (aws configure get region 2>$null)
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to get AWS region. Make sure AWS CLI is configured."
    }
    
    if (-not $AccountId -or -not $Region) {
      throw "Failed to get AWS account ID or region. AccountId: '$AccountId', Region: '$Region'"
    }
    
    Write-Log "AWS Account: $AccountId, Region: $Region" "INFO"
    
    return @{
      AccountId = $AccountId
      Region = $Region
    }
  } catch {
    Write-Log "Error getting AWS info: $($_.Exception.Message)" "ERROR"
    throw
  }
}

# Build and push Docker image
function Build-AndPush-Image {
  param(
    [string]$ServicePath,
    [string]$ECRRepository,
    [string]$AccountId,
    [string]$Region
  )
  
  Write-Log "Building Docker image for subscription-service..." "INFO"
  
  # Get current version
  $VersionFile = "$ServicePath\.version"
  $CurrentVersion = 1
  if (Test-Path $VersionFile) {
    $CurrentVersion = [int](Get-Content $VersionFile -ErrorAction SilentlyContinue)
    if (-not $CurrentVersion) { $CurrentVersion = 1 }
  }
  
  $NewVersion = $CurrentVersion + 1
  $ECRUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository"
  $ImageTag = "v$NewVersion"
  $FullImageUri = "$ECRUri`:$ImageTag"
  
  Write-Log "Building version $ImageTag for subscription-service" "INFO"
  Write-Log "ECR Repository: $ECRUri" "INFO"
  
  # Ensure ECR repository exists
  Write-Log "Checking ECR repository..." "INFO"
  try {
    aws ecr describe-repositories --repository-names $ECRRepository --region $Region | Out-Null
    Write-Log "ECR repository exists" "INFO"
  }
  catch {
    Write-Log "Creating ECR repository..." "INFO"
    aws ecr create-repository --repository-name $ECRRepository --region $Region --image-tag-mutability MUTABLE --image-scanning-configuration scanOnPush=true
    Write-Log "ECR repository created" "INFO"
  }
  
  # Change to backend directory for proper build context
  $ServiceDir = Split-Path $ServicePath -Parent
  $BackendPath = Split-Path $ServiceDir -Parent
  Write-Log "Backend path: $BackendPath" "INFO"
  Write-Log "Service path: $ServicePath" "INFO"
  
  if (-not (Test-Path $BackendPath)) {
    throw "Backend directory not found: $BackendPath"
  }
  
  Push-Location $BackendPath
  try {
    # Build the Docker image with proper context
    Write-Log "Running docker build from backend directory..." "INFO"
    Write-Log "Current directory: $(Get-Location)" "INFO"
    $DockerfilePath = "services\subscription-service\Dockerfile"
    Write-Log "Dockerfile path: $DockerfilePath" "INFO"
    
    if (-not (Test-Path $DockerfilePath)) {
      throw "Dockerfile not found: $DockerfilePath"
    }
    
    # Build with docker buildx for Lambda compatibility
    Write-Log "Building Docker image..." "INFO"
    $buildCmd = "docker buildx build --platform linux/amd64 -f `"$DockerfilePath`" -t `"$FullImageUri`" --provenance=false --sbom=false --load ."
    Write-Log "Running: $buildCmd" "INFO"
    
    try {
      $process = Start-Process -FilePath "docker" -ArgumentList "buildx", "build", "--platform", "linux/amd64", "-f", $DockerfilePath, "-t", $FullImageUri, "--provenance=false", "--sbom=false", "--load", "." -WorkingDirectory (Get-Location) -Wait -PassThru -NoNewWindow
      
      if ($process.ExitCode -ne 0) {
        Write-Log "Docker build failed. Exit code: $($process.ExitCode)" "ERROR"
        throw "Docker build failed for subscription-service"
      }
      
      Write-Log "Docker build completed successfully" "INFO"
    } catch {
      Write-Log "Docker build failed with exception: $($_.Exception.Message)" "ERROR"
      throw "Docker build failed for subscription-service"
    }
    
    # Login to ECR using AWS CLI
    Write-Log "Logging in to ECR using AWS CLI..." "INFO"
    $RegistryHost = "$AccountId.dkr.ecr.$Region.amazonaws.com"
    $HttpsRegistryHost = "https://$RegistryHost"
    Write-Log "ECR Registry: $RegistryHost" "INFO"
    
    try {
      # Ensure clean state
      Write-Log "Logging out of Docker registry (if logged in)..." "INFO"
      try { docker logout $HttpsRegistryHost 2>$null | Out-Null } catch {}
      try { docker logout $RegistryHost 2>$null | Out-Null } catch {}
      
      # First attempt: use cmd.exe pipeline (matches manual success)
      Write-Log "Attempting ECR login via cmd pipeline..." "INFO"
      $cmdLogin = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $RegistryHost"
      cmd.exe /c $cmdLogin | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Log "cmd pipeline login failed (code $LASTEXITCODE). Trying HTTPS..." "INFO"
        $cmdLoginHttps = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $HttpsRegistryHost"
        cmd.exe /c $cmdLoginHttps | Out-Null
      }
      
      if ($LASTEXITCODE -ne 0) {
        # Second attempt: get password, then login with -p (no pipe quirks)
        Write-Log "Falling back to direct -p login..." "INFO"
        $ECRPassword = aws ecr get-login-password --region $Region
        if ($LASTEXITCODE -ne 0 -or -not $ECRPassword) {
          throw "Failed to get ECR login password. Exit code: $LASTEXITCODE"
        }
        docker login $RegistryHost -u AWS -p $ECRPassword | Out-Null
        if ($LASTEXITCODE -ne 0) {
          Write-Log "Direct login without HTTPS failed (code $LASTEXITCODE). Trying HTTPS..." "INFO"
          docker login $HttpsRegistryHost -u AWS -p $ECRPassword | Out-Null
        }
      }
      
      if ($LASTEXITCODE -ne 0) {
        Write-Log "Docker login failed with exit code: $LASTEXITCODE" "ERROR"
        throw "Docker login failed"
      }
      
      Write-Log "ECR login successful" "INFO"
    } catch {
      Write-Log "ECR login failed: $($_.Exception.Message)" "ERROR"
      throw "ECR login failed"
    }
    
    # Push the image
    Write-Log "Pushing image to ECR..." "INFO"
    $pushCmd = "docker push `"$FullImageUri`""
    Write-Log "Running: $pushCmd" "INFO"
    
    try {
      $pushProcess = Start-Process -FilePath "docker" -ArgumentList "push", $FullImageUri -Wait -PassThru -NoNewWindow
      
      if ($pushProcess.ExitCode -ne 0) {
        Write-Log "Docker push failed. Exit code: $($pushProcess.ExitCode)" "ERROR"
        throw "Docker push failed for subscription-service"
      }
      
      Write-Log "Image pushed successfully" "INFO"
    } catch {
      Write-Log "Docker push failed with exception: $($_.Exception.Message)" "ERROR"
      throw "Docker push failed for subscription-service"
    }
    
    # Save new version
    $NewVersion | Out-File -FilePath $VersionFile -Encoding UTF8
    
    Write-Log "Successfully built and pushed $FullImageUri" "INFO"
    
    return $FullImageUri
  } finally {
    Pop-Location
  }
}

# Deploy service using Terraform
function Deploy-Service {
  param(
    [string]$ImageUri,
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying subscription-service with image: $ImageUri" "INFO"
  
  # Update the Terraform file with new image URI (if using existing_image_uri pattern)
  $MainTfFile = "$StackPath\main.tf"
  if (Test-Path $MainTfFile) {
    $Content = Get-Content $MainTfFile -Raw
    # Check if file uses existing_image_uri pattern
    if ($Content -match 'existing_image_uri\s*=') {
      $NewContent = $Content -replace 'existing_image_uri = "[^"]*"', "existing_image_uri = `"$ImageUri`""
      Set-Content -Path $MainTfFile -Value $NewContent -Encoding UTF8
      Write-Log "Updated $MainTfFile with new image URI" "INFO"
    } else {
      Write-Log "Terraform file does not use existing_image_uri pattern. Using docker_lambda_image module." "INFO"
    }
  }
  
  # Change to repository root for Terraform operations
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for subscription-service" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for subscription-service"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for subscription-service" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile"
    } else {
      Write-Log "Running terraform apply for subscription-service" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile"
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for subscription-service"
    }
    
    Write-Log "Subscription-service deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting subscription-service build and deployment for environment: $Env" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths - script is in subscription-service directory
  $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ServicePath = $ScriptPath
  $BackendRoot = Split-Path -Parent (Split-Path -Parent $ScriptPath)
  $RepoRoot = Split-Path -Parent $BackendRoot
  $StackPath = "$RepoRoot\infra\terraform2\stacks\services\subscription-service"
  $EnvFile = "$RepoRoot\infra\terraform2\environments\$Env.tfvars"
  
  Write-Log "Script path: $ScriptPath" "INFO"
  Write-Log "Service path: $ServicePath" "INFO"
  Write-Log "Backend root: $BackendRoot" "INFO"
  Write-Log "Repo root: $RepoRoot" "INFO"
  Write-Log "Stack path: $StackPath" "INFO"
  Write-Log "Env file: $EnvFile" "INFO"
  
  # Verify paths exist
  if (-not (Test-Path $ServicePath)) {
    throw "Service path not found: $ServicePath"
  }
  if (-not (Test-Path $StackPath)) {
    Write-Log "Stack path not found: $StackPath. Terraform stack may need to be created." "WARN"
  }
  if (-not (Test-Path $EnvFile)) {
    Write-Log "Environment file not found: $EnvFile. Will use default variables." "WARN"
  }
  
  # Build and push Docker image
  $ImageUri = Build-AndPush-Image -ServicePath $ServicePath -ECRRepository "goalsguild_subscription_service" -AccountId $AWSInfo.AccountId -Region $AWSInfo.Region
  
  # Deploy service (only if stack path exists)
  if (Test-Path $StackPath) {
    Deploy-Service -ImageUri $ImageUri -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  } else {
    Write-Log "Terraform stack not found. Skipping Terraform deployment." "WARN"
    Write-Log "Image URI for manual deployment: $ImageUri" "INFO"
  }
  
  Write-Log "Subscription-service build and deployment completed successfully!" "INFO"
  Write-Host "`nSubscription-Service Deployment Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- Image URI: $ImageUri" -ForegroundColor Green
  Write-Host "- Image built and pushed to ECR" -ForegroundColor Green
  if (Test-Path $StackPath) {
    Write-Host "- Infrastructure deployed" -ForegroundColor Green
  } else {
    Write-Host "- Infrastructure deployment skipped (stack not found)" -ForegroundColor Yellow
  }
  
} catch {
  $ErrorMessage = "Error in subscription-service deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`nSubscription-service deployment failed!" -ForegroundColor Red
  throw
}

