# PowerShell script with UTF-8 BOM encoding
# This script builds Docker images, auto-increments versions, and deploys services
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [ValidateSet("quest-service","user-service","both")] [string]$Service = "both",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [string]$TfLogPath = 'D:\terraformLogs\tf4.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-deploy.log"
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
  $LogEntry = "[$Timestamp] [$Level] [deploy-with-build] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Get AWS account ID and region
function Get-AWSInfo {
  try {
    $AccountId = (aws sts get-caller-identity --query Account --output text 2>$null)
    $Region = (aws configure get region 2>$null)
    
    if (-not $AccountId -or -not $Region) {
      throw "Failed to get AWS account ID or region"
    }
    
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
    [string]$ServiceName,
    [string]$ServicePath,
    [string]$ECRRepository,
    [string]$AccountId,
    [string]$Region
  )
  
  Write-Log "Building Docker image for $ServiceName..." "INFO"
  
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
  
  Write-Log "Building version $ImageTag for $ServiceName" "INFO"
  Write-Log "ECR Repository: $ECRUri" "INFO"
  
  # Change to service directory
  Push-Location $ServicePath
  try {
    # Build the Docker image
    Write-Log "Running docker build..." "INFO"
    docker build -t $FullImageUri .
    
    if ($LASTEXITCODE -ne 0) {
      throw "Docker build failed for $ServiceName"
    }
    
    # Login to ECR
    Write-Log "Logging in to ECR..." "INFO"
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com
    
    if ($LASTEXITCODE -ne 0) {
      throw "ECR login failed"
    }
    
    # Push the image
    Write-Log "Pushing image to ECR..." "INFO"
    docker push $FullImageUri
    
    if ($LASTEXITCODE -ne 0) {
      throw "Docker push failed for $ServiceName"
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
    [string]$ServiceName,
    [string]$ImageUri,
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying $ServiceName with image: $ImageUri" "INFO"
  
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
      Write-Log "Running terraform init for $ServiceName" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for $ServiceName"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for $ServiceName" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile"
    } else {
      Write-Log "Running terraform apply for $ServiceName" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile"
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for $ServiceName"
    }
    
    Write-Log "$ServiceName deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting deployment with build for environment: $Env, service: $Service" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  
  # Define services to deploy
  $ServicesToDeploy = @()
  if ($Service -eq "both" -or $Service -eq "quest-service") {
    $ServicesToDeploy += @{
      Name = "quest-service"
      Path = "$RepoRoot\..\services\quest-service"
      ECRRepository = "goalsguild_quest_service"
      StackPath = "$RepoRoot\stacks\services\quest-service"
    }
  }
  if ($Service -eq "both" -or $Service -eq "user-service") {
    $ServicesToDeploy += @{
      Name = "user-service"
      Path = "$RepoRoot\..\services\user-service"
      ECRRepository = "goalsguild_user_service"
      StackPath = "$RepoRoot\stacks\services\user-service"
    }
  }
  
  # Process each service
  foreach ($ServiceInfo in $ServicesToDeploy) {
    Write-Log "Processing $($ServiceInfo.Name)..." "INFO"
    
    # Build and push Docker image
    $ImageUri = Build-AndPush-Image -ServiceName $ServiceInfo.Name -ServicePath $ServiceInfo.Path -ECRRepository $ServiceInfo.ECRRepository -AccountId $AWSInfo.AccountId -Region $AWSInfo.Region
    
    # Deploy service
    $EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
    Deploy-Service -ServiceName $ServiceInfo.Name -ImageUri $ImageUri -StackPath $ServiceInfo.StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  }
  
  Write-Log "All deployments completed successfully!" "INFO"
  Write-Host "`nDeployment Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- Services: $Service" -ForegroundColor Green
  Write-Host "- All images built and pushed to ECR" -ForegroundColor Green
  Write-Host "- All infrastructure deployed" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`nDeployment failed!" -ForegroundColor Red
  throw
}
