# PowerShell script with UTF-8 BOM encoding
# This script deploys the quest-service Terraform stack
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
$LogFile = "$LogDir\tf4.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = "D:\terraformLogs\tf4.log"

# Clean up existing terraform log file
# Enable Terraform DEBUG logs to file
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
  $LogEntry = "[$Timestamp] [$Level] [quest-service] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\services\quest-service" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
Write-Log "Starting quest-service stack deployment for environment: $Env" "INFO"

# Change to repository root for Docker builds (required for proper context)
Push-Location $RepoRoot
Write-Log "Changed to repository root for Docker build context: $RepoRoot" "INFO"
try {
  if (-not $SkipInit) { 
    Write-Log "Running terraform init" "INFO"
    terraform -chdir="$StackPath" init -upgrade 
  }
  if ($PlanOnly) {
    Write-Log "Running terraform plan" "INFO"
    terraform -chdir="$StackPath" plan -var-file "$EnvFile" 
  } else {
    Write-Log "Running terraform apply with auto-approve" "INFO"
    terraform -chdir="$StackPath" apply -var-file "$EnvFile" -auto-approve
  }
  Write-Log "Quest-service stack deployment completed" "INFO"
} catch {
  $ErrorMessage = "Error in quest-service stack: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  throw
} finally { 
  Pop-Location 
}
