# PowerShell script for deploying S3 stack
# This script deploys only the S3 stack for guild avatar storage
param(
  [ValidateSet("dev","staging","prod","local","test")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [string]$TfLogPath = 'D:\terraformLogs\tf-s3.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-s3-deploy.log"
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
  Write-Host "[deploy-s3] TF_LOG=DEBUG, TF_LOG_PATH=$TfLogPath" -ForegroundColor DarkGray
} catch {}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [deploy-s3] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Get AWS account ID and region
function Get-AWSInfo {
  try {
    $AccountId = (aws sts get-caller-identity --query Account --output text 2>$null)
    $Region = (aws configure get region 2>$null)
    
    if (-not $AccountId -or -not $Region) {
      Write-Log "Failed to get AWS account ID or region. Please check AWS credentials." "ERROR"
      throw "AWS credentials not configured properly"
    }
    
    Write-Log "AWS Account ID: $AccountId" "INFO"
    Write-Log "AWS Region: $Region" "INFO"
    
    return @{
      AccountId = $AccountId
      Region = $Region
    }
  } catch {
    Write-Log "Error getting AWS info: $($_.Exception.Message)" "ERROR"
    throw
  }
}

# Validate environment file exists
function Test-EnvironmentFile {
  param([string]$Environment)
  
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $EnvFile = Join-Path $RepoRoot "environments\$Environment.tfvars"
  
  if (-not (Test-Path $EnvFile)) {
    Write-Log "Environment file not found: $EnvFile" "ERROR"
    throw "Environment file not found: $EnvFile"
  }
  
  Write-Log "Using environment file: $EnvFile" "INFO"
  return $EnvFile
}

# Deploy S3 stack
function Deploy-S3Stack {
  param([string]$Environment, [string]$EnvFile)
  
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $S3StackPath = Join-Path $RepoRoot "stacks\s3"
  
  if (-not (Test-Path $S3StackPath)) {
    Write-Log "S3 stack directory not found: $S3StackPath" "ERROR"
    throw "S3 stack directory not found: $S3StackPath"
  }
  
  Write-Log "Starting S3 stack deployment for environment: $Environment" "INFO"
  Write-Host "`n=== S3 Stack Deployment (env: $Environment) ===" -ForegroundColor Cyan
  
  Push-Location $S3StackPath
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for S3 stack" "INFO"
      terraform init -upgrade
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed"
      }
    }

    if ($PlanOnly) {
      Write-Log "Running terraform plan for S3 stack" "INFO"
      terraform plan -var-file "$EnvFile"
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform plan failed"
      }
    } else {
      if ($AutoApprove) {
        Write-Log "Running terraform apply with auto-approve for S3 stack" "INFO"
        terraform apply -var-file "$EnvFile" -auto-approve
        if ($LASTEXITCODE -ne 0) {
          throw "Terraform apply failed"
        }
      } else {
        Write-Log "Running terraform apply for S3 stack" "INFO"
        terraform apply -var-file "$EnvFile"
        if ($LASTEXITCODE -ne 0) {
          throw "Terraform apply failed"
        }
      }
    }
    
    Write-Log "S3 stack deployment completed successfully" "INFO"
    Write-Host "`n✅ S3 stack deployment completed successfully!" -ForegroundColor Green
    
    # Display outputs
    Write-Log "Retrieving S3 stack outputs" "INFO"
    Write-Host "`n=== S3 Stack Outputs ===" -ForegroundColor Yellow
    terraform output
    if ($LASTEXITCODE -eq 0) {
      Write-Log "S3 stack outputs retrieved successfully" "INFO"
    } else {
      Write-Log "Warning: Failed to retrieve S3 stack outputs" "WARN"
    }
    
  } catch {
    Write-Log "Error in S3 stack deployment: $($_.Exception.Message)" "ERROR"
    throw
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting S3 stack deployment process" "INFO"
  Write-Host "S3 Stack Deployment Script" -ForegroundColor Cyan
  Write-Host "Environment: $Env" -ForegroundColor Green
  Write-Host "Plan Only: $PlanOnly" -ForegroundColor Green
  Write-Host "Auto Approve: $AutoApprove" -ForegroundColor Green
  Write-Host "Skip Init: $SkipInit" -ForegroundColor Green
  Write-Host ""

  # Get AWS information
  $AWSInfo = Get-AWSInfo
  
  # Validate environment file
  $EnvFile = Test-EnvironmentFile -Environment $Env
  
  # Deploy S3 stack
  Deploy-S3Stack -Environment $Env -EnvFile $EnvFile
  
  Write-Log "S3 stack deployment process completed successfully" "INFO"
  Write-Host "`n🎉 S3 stack deployment completed successfully!" -ForegroundColor Green
  
} catch {
  Write-Log "S3 stack deployment failed: $($_.Exception.Message)" "ERROR"
  Write-Host "`n❌ S3 stack deployment failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host "`nS3 stack deployment script completed." -ForegroundColor Cyan

