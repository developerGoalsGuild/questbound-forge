# Master Deployment Script - Deploys All Terraform Stacks
# This script deploys all backend infrastructure and the landing page

param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [switch]$BackendOnly,
  [switch]$LandingPageOnly
)

$ErrorActionPreference = "Stop"

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\all-stacks-deploy.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [all-stacks] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Get script directory
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendScriptsPath = Resolve-Path "$ScriptRoot\backend\infra\terraform2\scripts" | Select-Object -ExpandProperty Path
$LandingPageScriptPath = Resolve-Path "$ScriptRoot\LandingPage\scripts\deploy-landing-page.ps1" | Select-Object -ExpandProperty Path

Write-Host "`n" + ("=" * 80) -ForegroundColor Green
Write-Host "GoalsGuild - Complete Infrastructure Deployment" -ForegroundColor Green
Write-Host "Environment: $Env" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

$DeploymentResults = @{
  Backend = $false
  LandingPage = $false
}

try {
  # Phase 1: Deploy Backend Infrastructure
  if (-not $LandingPageOnly) {
    Write-Host "`n" + ("=" * 80) -ForegroundColor Yellow
    Write-Host "PHASE 1: Backend Infrastructure & Services" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow
    
    $BackendDeployScript = Join-Path $BackendScriptsPath "deploy-all-with-build.ps1"
    
    if (-not (Test-Path $BackendDeployScript)) {
      throw "Backend deployment script not found: $BackendDeployScript"
    }
    
    Write-Log "Starting backend deployment..." "INFO"
    
    $backendParams = @{
      Env = $Env
      PlanOnly = $PlanOnly
      AutoApprove = $AutoApprove
      SkipInit = $SkipInit
    }
    
    & $BackendDeployScript @backendParams
    
    if ($LASTEXITCODE -eq 0) {
      $DeploymentResults.Backend = $true
      Write-Log "Backend deployment completed successfully" "INFO"
      Write-Host "`n✅ Backend infrastructure deployed successfully!" -ForegroundColor Green
    } else {
      Write-Log "Backend deployment failed with exit code: $LASTEXITCODE" "ERROR"
      Write-Host "`n❌ Backend deployment failed!" -ForegroundColor Red
      if (-not $PlanOnly) {
        throw "Backend deployment failed"
      }
    }
  } else {
    Write-Log "Skipping backend deployment (LandingPageOnly mode)" "INFO"
  }
  
  # Phase 2: Deploy Landing Page
  if (-not $BackendOnly) {
    Write-Host "`n" + ("=" * 80) -ForegroundColor Yellow
    Write-Host "PHASE 2: Landing Page Infrastructure" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow
    
    if (-not (Test-Path $LandingPageScriptPath)) {
      Write-Log "Landing Page deployment script not found: $LandingPageScriptPath" "WARN"
      Write-Host "⚠️  Landing Page script not found, skipping..." -ForegroundColor Yellow
    } else {
      Write-Log "Starting Landing Page deployment..." "INFO"
      
      $landingPageParams = @{
        Env = $Env
        PlanOnly = $PlanOnly
        AutoApprove = $AutoApprove
        SkipInit = $SkipInit
      }
      
      & $LandingPageScriptPath @landingPageParams
      
      if ($LASTEXITCODE -eq 0) {
        $DeploymentResults.LandingPage = $true
        Write-Log "Landing Page deployment completed successfully" "INFO"
        Write-Host "`n✅ Landing Page deployed successfully!" -ForegroundColor Green
      } else {
        Write-Log "Landing Page deployment failed with exit code: $LASTEXITCODE" "ERROR"
        Write-Host "`n❌ Landing Page deployment failed!" -ForegroundColor Red
        if (-not $PlanOnly) {
          throw "Landing Page deployment failed"
        }
      }
    }
  } else {
    Write-Log "Skipping Landing Page deployment (BackendOnly mode)" "INFO"
  }
  
  # Summary
  Write-Host "`n" + ("=" * 80) -ForegroundColor Green
  Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Green
  Write-Host ("=" * 80) -ForegroundColor Green
  Write-Host ""
  
  if (-not $LandingPageOnly) {
    $BackendStatus = if ($DeploymentResults.Backend) { "✅ SUCCESS" } else { "❌ FAILED" }
    Write-Host "Backend Infrastructure: $BackendStatus" -ForegroundColor $(if ($DeploymentResults.Backend) { "Green" } else { "Red" })
  }
  
  if (-not $BackendOnly) {
    $LandingPageStatus = if ($DeploymentResults.LandingPage) { "✅ SUCCESS" } else { "❌ FAILED" }
    Write-Host "Landing Page: $LandingPageStatus" -ForegroundColor $(if ($DeploymentResults.LandingPage) { "Green" } else { "Red" })
  }
  
  Write-Host ""
  
  # Check if all deployments succeeded
  $AllSucceeded = ($DeploymentResults.Backend -or $LandingPageOnly) -and ($DeploymentResults.LandingPage -or $BackendOnly)
  
  if ($AllSucceeded) {
    Write-Log "All deployments completed successfully!" "INFO"
    Write-Host "✅ All deployments completed successfully!" -ForegroundColor Green
    exit 0
  } else {
    Write-Log "Some deployments failed. Check the summary above." "WARN"
    Write-Host "⚠️  Some deployments failed. Check the summary above." -ForegroundColor Yellow
    exit 1
  }
  
} catch {
  $ErrorMessage = "Error in deployment: $($_.Exception.Message)"
  Write-Log $ErrorMessage "ERROR"
  Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
  Write-Host $ErrorMessage -ForegroundColor Red
  exit 1
}
















