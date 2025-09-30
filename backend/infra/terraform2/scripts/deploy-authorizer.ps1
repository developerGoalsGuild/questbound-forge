param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit
)
$ErrorActionPreference = "Stop"

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf2.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = "D:\terraformLogs\tf4.log"

# Clean up existing terraform log file
$TerraformLogFile = "D:\terraformLogs\tf4.log"
# Enable Terraform DEBUG logs to file
try {
  $logDir = Split-Path -Parent $TerraformLogFile
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  if (Test-Path $TerraformLogFile) { Clear-Content $TerraformLogFile -ErrorAction SilentlyContinue } else { New-Item -ItemType File -Path $TerraformLogFile | Out-Null }
  $env:TF_LOG = 'DEBUG'
  $env:TF_LOG_PATH = $TerraformLogFile
  Write-Host "[deploy] TF_LOG=DEBUG, TF_LOG_PATH=$TerraformLogFile" -ForegroundColor DarkGray
} catch {}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [authorizer] $Message"
  Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\authorizer" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
Write-Log "Starting authorizer stack deployment for environment: $Env" "INFO"
Push-Location $StackPath
try {
  if (-not $SkipInit) { 
    Write-Log "Running terraform init" "INFO"
    terraform init -upgrade 
  }
  if ($PlanOnly) {
    Write-Log "Running terraform plan" "INFO"
    terraform plan -var-file="$EnvFile" 
  } else {
    if ($AutoApprove) { 
      Write-Log "Running terraform apply with auto-approve" "INFO"
      terraform apply -var-file="$EnvFile" -auto-approve 
    } else { 
      Write-Log "Running terraform apply" "INFO"
      terraform apply -var-file="$EnvFile" 
    }
  }
  Write-Log "Authorizer stack deployment completed" "INFO"
} catch {
  Write-Log "Error in authorizer stack: $($_.Exception.Message)" "ERROR"
  throw
} finally { 
  Pop-Location 
}
