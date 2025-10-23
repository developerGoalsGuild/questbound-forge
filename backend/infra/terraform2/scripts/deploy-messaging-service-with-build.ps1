# PowerShell script with UTF-8 BOM encoding
# This script builds Docker image, auto-increments version, and deploys messaging-service
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [string]$TfLogPath = 'D:\terraformLogs\tf-messaging-service.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-messaging-service.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = $TfLogPath

# Clean up existing terraform log file
try {
  $logDir = Split-Path -Parent $TfLogPath
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
  if (Test-Path $TfLogPath) { Clear-Content $TfLogPath -ErrorAction SilentlyContinue } else { New-Item -ItemType File -Path $TfLogPath | Out-Null }
  $env:TF_LOG = 'DEBUG'
  $env:TF_LOG_PATH = $TfLogPath
  Write-Host "[deploy] TF_LOG=DEBUG, TF_LOG_PATH=$TfLogPath" -ForegroundColor DarkGray
} catch {}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [messaging-service-build-deploy] $Message"
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
  
  Write-Log "Building Docker image for messaging-service..." "INFO"
  
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
  
  Write-Log "Building version $ImageTag for messaging-service" "INFO"
  Write-Log "ECR Repository: $ECRUri" "INFO"
  
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
    $DockerfilePath = "services\messaging-service\Dockerfile"
    Write-Log "Dockerfile path: $DockerfilePath" "INFO"
    
    if (-not (Test-Path $DockerfilePath)) {
      throw "Dockerfile not found: $DockerfilePath"
    }
    
    # Build with regular docker build command using Start-Process to avoid PowerShell issues
    Write-Log "Building Docker image..." "INFO"
    $buildCmd = "docker build -f `"$DockerfilePath`" -t `"$FullImageUri`" ."
    Write-Log "Running: $buildCmd" "INFO"
    
    try {
      # Use buildx with specific flags to create a single-platform image for Lambda
      $process = Start-Process -FilePath "docker" -ArgumentList "buildx", "build", "--platform", "linux/amd64", "-f", $DockerfilePath, "-t", $FullImageUri, "--provenance=false", "--sbom=false", "--load", "." -WorkingDirectory (Get-Location) -Wait -PassThru -NoNewWindow
      
      if ($process.ExitCode -ne 0) {
        Write-Log "Docker build failed. Exit code: $($process.ExitCode)" "ERROR"
        throw "Docker build failed for messaging-service"
      }
      
      Write-Log "Docker build completed successfully" "INFO"
    } catch {
      Write-Log "Docker build failed with exception: $($_.Exception.Message)" "ERROR"
      throw "Docker build failed for messaging-service"
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
        throw "Docker push failed for messaging-service"
      }
      
      Write-Log "Image pushed successfully" "INFO"
    } catch {
      Write-Log "Docker push failed with exception: $($_.Exception.Message)" "ERROR"
      throw "Docker push failed for messaging-service"
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
  
  Write-Log "Deploying messaging-service with image: $ImageUri" "INFO"
  
  # Update the Terraform file with new image URI
  $MainTfFile = "$StackPath\main.tf"
  if (Test-Path $MainTfFile) {
    $Content = Get-Content $MainTfFile -Raw
    $NewContent = $Content -replace 'existing_image_uri = "[^"]*"', "existing_image_uri = `"$ImageUri`""
    Set-Content -Path $MainTfFile -Value $NewContent -Encoding UTF8
    Write-Log "Updated $MainTfFile with new image URI" "INFO"
  }
  
  # Change to repository root for Docker builds
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for messaging-service" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for messaging-service"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for messaging-service" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile" -var="existing_image_uri=$ImageUri"
    } else {
      Write-Log "Running terraform apply for messaging-service" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -var="existing_image_uri=$ImageUri" -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -var="existing_image_uri=$ImageUri"
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for messaging-service"
    }
    
    Write-Log "Messaging-service deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting messaging-service build and deployment for environment: $Env" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $ServicePath = "$RepoRoot\..\..\services\messaging-service"
  $StackPath = "$RepoRoot\stacks\services\messaging-service"
  $EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
  
  # Build and push Docker image
  $ImageUri = Build-AndPush-Image -ServicePath $ServicePath -ECRRepository "goalsguild_messaging_service" -AccountId $AWSInfo.AccountId -Region $AWSInfo.Region
  
  # Deploy service
  Deploy-Service -ImageUri $ImageUri -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  
  Write-Log "Messaging-service build and deployment completed successfully!" "INFO"
  Write-Host "`nMessaging-Service Deployment Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- Image URI: $ImageUri" -ForegroundColor Green
  Write-Host "- Image built and pushed to ECR" -ForegroundColor Green
  Write-Host "- Infrastructure deployed" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in messaging-service deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`nMessaging-service deployment failed!" -ForegroundColor Red
  throw
}
