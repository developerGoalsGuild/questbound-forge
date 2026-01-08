# PowerShell script to create ECR repository for messaging service
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [string]$TfLogPath = 'D:\terraformLogs\tf-messaging-service-ecr.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-messaging-service-ecr.log"
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
  $LogEntry = "[$Timestamp] [$Level] [messaging-service-ecr] $Message"
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

# Deploy ECR repository using Terraform
function Deploy-ECR {
  param(
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying ECR repository for messaging service" "INFO"
  
  # Change to repository root for Terraform
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for messaging service ECR" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for messaging service ECR"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for messaging service ECR" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service
    } else {
      Write-Log "Running terraform apply for messaging service ECR" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for messaging service ECR"
    }
    
    Write-Log "Messaging service ECR repository deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting ECR repository creation for messaging service in environment: $Env" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $StackPath = "$RepoRoot\stacks\services\messaging-service"
  $EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
  
  # Deploy ECR repository
  Deploy-ECR -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  
  Write-Log "Messaging service ECR repository creation completed successfully!" "INFO"
  Write-Host "`nMessaging Service ECR Repository Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- Repository: goalsguild_messaging_service" -ForegroundColor Green
  Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Green
  Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Green
  Write-Host "- ECR Repository created successfully" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in messaging service ECR creation: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`nMessaging service ECR creation failed!" -ForegroundColor Red
  throw
}
