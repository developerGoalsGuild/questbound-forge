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
$env:TF_LOG_PATH = "D:\terraformLogs\tf3.log"

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [security] $Message"
  Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\security" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
Write-Log "Starting security stack deployment for environment: $Env" "INFO"
Push-Location $StackPath
try {
  if (-not $SkipInit) { 
    Write-Log "Running terraform init" "INFO"
    terraform init -upgrade 2>&1 | Tee-Object -FilePath $LogFile -Append
  }
  if ($PlanOnly) {
    Write-Log "Running terraform plan" "INFO"
    terraform plan -var-file "$EnvFile" 2>&1 | Tee-Object -FilePath $LogFile -Append
  } else {
    Write-Log "Running terraform apply with auto-approve" "INFO"
    terraform apply -var-file "$EnvFile" -auto-approve 2>&1 | Tee-Object -FilePath $LogFile -Append
  }
  Write-Log "Security stack deployment completed" "INFO"
} catch {
  Write-Log "Error in security stack: $($_.Exception.Message)" "ERROR"
  throw
} finally { 
  Pop-Location 
}
