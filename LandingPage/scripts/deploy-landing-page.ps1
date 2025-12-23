# PowerShell script to deploy Landing Page infrastructure
# Deploys S3 bucket and CloudFront distribution for static site hosting

param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit
)

$ErrorActionPreference = "Stop"

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\landing-page-deploy.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [landing-page] $Message"
  Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$TerraformPath = Resolve-Path "$Root\..\terraform" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$TerraformPath\environments\$Env.tfvars" | Select-Object -ExpandProperty Path -ErrorAction SilentlyContinue

if (-not $EnvFile) {
  Write-Log "Environment file not found: $TerraformPath\environments\$Env.tfvars" "ERROR"
  throw "Environment file not found"
}

Write-Log "Starting Landing Page deployment for environment: $Env" "INFO"
Write-Host "`n=== Landing Page Deployment ===" -ForegroundColor Cyan
Write-Host "Environment: $Env" -ForegroundColor Yellow
Write-Host "Terraform Path: $TerraformPath" -ForegroundColor Gray
Write-Host "Environment File: $EnvFile" -ForegroundColor Gray

Push-Location $TerraformPath
try {
  if (-not $SkipInit) {
    Write-Log "Running terraform init" "INFO"
    Write-Host "`nInitializing Terraform..." -ForegroundColor Cyan
    
    # Initialize Terraform (backend is configured in backend.tf)
    terraform init -upgrade
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform init failed"
    }
  }
  
  if ($PlanOnly) {
    Write-Log "Running terraform plan" "INFO"
    Write-Host "`nPlanning Terraform changes..." -ForegroundColor Cyan
    terraform plan -var-file="$EnvFile"
  } else {
    Write-Log "Running terraform apply" "INFO"
    Write-Host "`nApplying Terraform changes..." -ForegroundColor Cyan
    
    if ($AutoApprove) {
      terraform apply -var-file="$EnvFile" -auto-approve
    } else {
      terraform apply -var-file="$EnvFile"
    }
  }
  
  if ($LASTEXITCODE -ne 0) {
    throw "Terraform operation failed with exit code: $LASTEXITCODE"
  }
  
  Write-Log "Landing Page deployment completed successfully" "INFO"
  Write-Host "`n✅ Landing Page deployment completed!" -ForegroundColor Green
} catch {
  Write-Log "Error in Landing Page deployment: $($_.Exception.Message)" "ERROR"
  Write-Host "`n❌ Landing Page deployment failed: $($_.Exception.Message)" -ForegroundColor Red
  throw
} finally {
  Pop-Location
}

