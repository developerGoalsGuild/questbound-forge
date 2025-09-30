# PowerShell script with UTF-8 BOM encoding
# This script builds and deploys both quest-service and user-service
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
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
$LogFile = "$LogDir\tf-all-services.log"
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
  $LogEntry = "[$Timestamp] [$Level] [all-services-build-deploy] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Main execution
try {
  Write-Log "Starting build and deployment for all services in environment: $Env" "INFO"
  
  # Get script directory
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  
  # Deploy quest-service
  Write-Log "Deploying quest-service..." "INFO"
  & "$Root\deploy-quest-service-with-build.ps1" -Env $Env -PlanOnly:$PlanOnly -AutoApprove:$AutoApprove -SkipInit:$SkipInit -TfLogPath $TfLogPath
  
  if ($LASTEXITCODE -ne 0) {
    throw "Quest-service deployment failed"
  }
  
  Write-Log "Quest-service deployment completed successfully" "INFO"
  
  # Deploy user-service
  Write-Log "Deploying user-service..." "INFO"
  & "$Root\deploy-user-service-with-build.ps1" -Env $Env -PlanOnly:$PlanOnly -AutoApprove:$AutoApprove -SkipInit:$SkipInit -TfLogPath $TfLogPath
  
  if ($LASTEXITCODE -ne 0) {
    throw "User-service deployment failed"
  }
  
  Write-Log "User-service deployment completed successfully" "INFO"
  
  Write-Log "All services build and deployment completed successfully!" "INFO"
  Write-Host "`nAll Services Deployment Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- Quest-service: Built and deployed" -ForegroundColor Green
  Write-Host "- User-service: Built and deployed" -ForegroundColor Green
  Write-Host "- All images built and pushed to ECR" -ForegroundColor Green
  Write-Host "- All infrastructure deployed" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in all services deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`nAll services deployment failed!" -ForegroundColor Red
  throw
}
