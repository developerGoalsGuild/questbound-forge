# Quick deployment script for messaging service with S3 bucket configuration
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [messaging-service-quick] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
}

# Get AWS information
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

# Deploy messaging service
function Deploy-MessagingService {
  param(
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying messaging service with environment configuration" "INFO"
  
  # Change to repository root for Terraform
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for messaging service" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for messaging service"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for messaging service" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile"
    } else {
      Write-Log "Running terraform apply for messaging service" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile"
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for messaging service"
    }
    
    Write-Log "Messaging service deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting messaging service deployment in environment: $Env" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $StackPath = "$RepoRoot\stacks\services\messaging-service"
  
  Write-Log "Repository root: $RepoRoot" "INFO"
  Write-Log "Stack path: $StackPath" "INFO"
  
  # Check if environment tfvars exists
  $EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
  if (-not (Test-Path $EnvFile)) {
    throw "Environment file not found: $EnvFile. Please create the environment file first."
  }
  Write-Log "Using environment file: $EnvFile" "INFO"
  
  # Deploy messaging service
  Deploy-MessagingService -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  
  Write-Log "Messaging service deployment completed successfully!" "INFO"
  Write-Host "`nMessaging Service Deployment Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Green
  Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Green
  Write-Host "- Deployment completed successfully" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in messaging service deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Host "`nMessaging service deployment failed!" -ForegroundColor Red
  throw
}
