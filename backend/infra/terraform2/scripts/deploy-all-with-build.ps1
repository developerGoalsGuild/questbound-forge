# PowerShell script with UTF-8 BOM encoding
# Master deployment script that deploys all services and infrastructure stacks
# This script orchestrates the complete deployment of the GoalsGuild application
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit,
  [switch]$ServicesOnly,
  [switch]$InfrastructureOnly,
  [string[]]$Services = @(),  # Optional: specify which services to deploy (empty = all)
  [string[]]$Stacks = @(),     # Optional: specify which stacks to deploy (empty = all)
  [string]$TfLogPath = 'D:\terraformLogs\tf-master-deploy.log'
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-master-deploy.log"
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
  $LogEntry = "[$Timestamp] [$Level] [master-deploy] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

# Get script directory and paths
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$ScriptRoot\..\..\.." | Select-Object -ExpandProperty Path
$StacksRoot = Resolve-Path "$ScriptRoot\..\stacks" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$ScriptRoot\..\environments\$Env.tfvars" | Select-Object -ExpandProperty Path -ErrorAction SilentlyContinue

if (-not $EnvFile) {
  Write-Log "Environment file not found: $($ScriptRoot)\..\environments\$Env.tfvars" "WARN"
  Write-Log "Will use default variables or environment-specific defaults" "WARN"
}

# Define all services that can be deployed
$AllServices = @(
  @{ Name = "user-service"; Script = "deploy-user-service-with-build.ps1"; ECR = "goalsguild_user_service" },
  @{ Name = "quest-service"; Script = "deploy-quest-service-with-build.ps1"; ECR = "goalsguild_quest_service" },
  @{ Name = "subscription-service"; Script = "deploy-subscription-service-with-build.ps1"; ECR = "goalsguild_subscription_service" },
  @{ Name = "collaboration-service"; Script = "deploy-collaboration-service-with-build.ps1"; ECR = "goalsguild_collaboration_service" },
  @{ Name = "guild-service"; Script = "deploy-guild-service-with-build.ps1"; ECR = "goalsguild_guild_service" },
  @{ Name = "messaging-service"; Script = "deploy-messaging-service-with-build.ps1"; ECR = "goalsguild_messaging_service" },
  @{ Name = "gamification-service"; Script = "deploy-gamification-service-with-build.ps1"; ECR = "goalsguild_gamification_service" }
)

# Define infrastructure stacks in deployment order
$AllStacks = @(
  "database",
  "security",
  "ecr",        # ECR repositories must be created before services
  "authorizer",
  "s3",
  "appsync",
  "apigateway"
)

# Filter services if specified
$ServicesToDeploy = if ($Services.Count -gt 0) {
  $AllServices | Where-Object { $Services -contains $_.Name }
} else {
  $AllServices
}

# Filter stacks if specified
$StacksToDeploy = if ($Stacks.Count -gt 0) {
  $AllStacks | Where-Object { $Stacks -contains $_ }
} else {
  $AllStacks
}

# Function to deploy a service
function Deploy-Service {
  param(
    [hashtable]$Service,
    [string]$Environment,
    [switch]$PlanOnly,
    [switch]$AutoApprove,
    [switch]$SkipInit,
    [string]$TfLogPath
  )
  
  Write-Log "Starting deployment for service: $($Service.Name)" "INFO"
  Write-Host "`n=== Service: $($Service.Name) ===" -ForegroundColor Cyan
  
  # Check if service has a deployment script in the scripts directory
  $ServiceScript = Join-Path $ScriptRoot $Service.Script
  
  if (-not (Test-Path $ServiceScript)) {
    # Check if service has its own deploy script
    $ServiceDeployScript = Join-Path $RepoRoot "backend\services\$($Service.Name)\deploy-$($Service.Name)-with-build.ps1"
    Write-Log "Checking for service script at: $ServiceDeployScript" "INFO"
    if (Test-Path $ServiceDeployScript) {
      $ServiceScript = $ServiceDeployScript
      Write-Log "Found service script at: $ServiceScript" "INFO"
    } else {
      # Try alternative path (without backend prefix, in case RepoRoot already includes it)
      $AltServiceDeployScript = Join-Path $RepoRoot "services\$($Service.Name)\deploy-$($Service.Name)-with-build.ps1"
      Write-Log "Checking alternative path: $AltServiceDeployScript" "INFO"
      if (Test-Path $AltServiceDeployScript) {
        $ServiceScript = $AltServiceDeployScript
        Write-Log "Found service script at: $ServiceScript" "INFO"
      } else {
        Write-Log "Deployment script not found for $($Service.Name)" "WARN"
        Write-Log "  Tried: $ServiceScript" "WARN"
        Write-Log "  Tried: $ServiceDeployScript" "WARN"
        Write-Log "  Tried: $AltServiceDeployScript" "WARN"
        Write-Log "Skipping service: $($Service.Name)" "WARN"
        return $false
      }
    }
  }
  
  try {
    $scriptParams = @{
      Env = $Environment
      PlanOnly = $PlanOnly
      AutoApprove = $AutoApprove
      SkipInit = $SkipInit
      TfLogPath = $TfLogPath
    }
    
    & $ServiceScript @scriptParams
    
    if ($LASTEXITCODE -ne 0) {
      throw "$($Service.Name) deployment failed with exit code: $LASTEXITCODE"
    }
    
    Write-Log "Successfully deployed service: $($Service.Name)" "INFO"
    return $true
  } catch {
    $ErrorMsg = $_.Exception.Message
    Write-Log "Error deploying service $($Service.Name): ${ErrorMsg}" "ERROR"
    throw
  }
}

# Function to deploy an infrastructure stack
function Deploy-Stack {
  param(
    [string]$StackName,
    [string]$StackPath,
    [string]$Environment,
    [string]$EnvFile,
    [switch]$PlanOnly,
    [switch]$AutoApprove,
    [switch]$SkipInit
  )
  
  Write-Log "Starting deployment for stack: $StackName" "INFO"
  Write-Host "`n=== Stack: $StackName ===" -ForegroundColor Cyan
  
  if (-not (Test-Path $StackPath)) {
    Write-Log "Stack path not found: $StackPath" "WARN"
    Write-Log "Skipping stack: $StackName" "WARN"
    return $false
  }
  
  Push-Location $StackPath
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for $StackName" "INFO"
      terraform init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for $StackName"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for $StackName" "INFO"
      if ($EnvFile -and (Test-Path $EnvFile)) {
        terraform plan -var-file $EnvFile
      } else {
        terraform plan
      }
    } else {
      if ($AutoApprove) {
        Write-Log "Running terraform apply with auto-approve for $StackName" "INFO"
        if ($EnvFile -and (Test-Path $EnvFile)) {
          terraform apply -var-file $EnvFile -auto-approve
        } else {
          terraform apply -auto-approve
        }
      } else {
        Write-Log "Running terraform apply for $StackName" "INFO"
        if ($EnvFile -and (Test-Path $EnvFile)) {
          terraform apply -var-file $EnvFile
        } else {
          terraform apply
        }
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for $StackName"
    }
    
    Write-Log "Successfully deployed stack: $StackName" "INFO"
    return $true
  } catch {
    $ErrorMsg = $_.Exception.Message
    Write-Log "Error deploying stack ${StackName}: ${ErrorMsg}" "ERROR"
    throw
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting master deployment for environment: $Env" "INFO"
  Write-Host "`n" + ("=" * 80) -ForegroundColor Green
  Write-Host "GoalsGuild Master Deployment" -ForegroundColor Green
  Write-Host "Environment: $Env" -ForegroundColor Green
  Write-Host ("=" * 80) -ForegroundColor Green
  Write-Host ""
  
  $DeploymentResults = @{
    Services = @{}
    Stacks = @{}
  }
  
  # Phase 1: Deploy Infrastructure Stacks (if not services-only)
  if (-not $ServicesOnly) {
    Write-Host "`n" + ("=" * 80) -ForegroundColor Yellow
    Write-Host "PHASE 1: Infrastructure Stacks" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow
    
    foreach ($StackName in $StacksToDeploy) {
      $StackPath = Join-Path $StacksRoot $StackName
      
      try {
        $Success = Deploy-Stack -StackName $StackName -StackPath $StackPath -Environment $Env -EnvFile $EnvFile -PlanOnly:$PlanOnly -AutoApprove:$AutoApprove -SkipInit:$SkipInit
        $DeploymentResults.Stacks[$StackName] = $Success
      } catch {
        $ErrorMsg = $_.Exception.Message
        Write-Log "Failed to deploy stack ${StackName}: ${ErrorMsg}" "ERROR"
        $DeploymentResults.Stacks[$StackName] = $false
        
        if (-not $PlanOnly) {
          Write-Host "`n⚠️  Stack deployment failed: $StackName" -ForegroundColor Red
          Write-Host "   Continuing with remaining deployments..." -ForegroundColor Yellow
        } else {
          throw
        }
      }
    }
  } else {
    Write-Log "Skipping infrastructure stacks (ServicesOnly mode)" "INFO"
  }
  
  # Phase 2: Deploy Services (if not infrastructure-only)
  if (-not $InfrastructureOnly) {
    Write-Host "`n" + ("=" * 80) -ForegroundColor Yellow
    Write-Host "PHASE 2: Services" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow
    
    foreach ($Service in $ServicesToDeploy) {
      try {
        $Success = Deploy-Service -Service $Service -Environment $Env -PlanOnly:$PlanOnly -AutoApprove:$AutoApprove -SkipInit:$SkipInit -TfLogPath $TfLogPath
        $DeploymentResults.Services[$Service.Name] = $Success
      } catch {
        $ErrorMsg = $_.Exception.Message
        Write-Log "Failed to deploy service $($Service.Name): ${ErrorMsg}" "ERROR"
        $DeploymentResults.Services[$Service.Name] = $false
        
        if (-not $PlanOnly) {
          Write-Host "`n⚠️  Service deployment failed: $($Service.Name)" -ForegroundColor Red
          Write-Host "   Continuing with remaining deployments..." -ForegroundColor Yellow
        } else {
          throw
        }
      }
    }
  } else {
    Write-Log "Skipping services (InfrastructureOnly mode)" "INFO"
  }
  
  # Summary
  Write-Host "`n" + ("=" * 80) -ForegroundColor Green
  Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Green
  Write-Host ("=" * 80) -ForegroundColor Green
  Write-Host ""
  
  if (-not $ServicesOnly) {
    Write-Host "Infrastructure Stacks:" -ForegroundColor Cyan
    foreach ($StackName in $StacksToDeploy) {
      $Status = if ($DeploymentResults.Stacks[$StackName]) { "✅ SUCCESS" } else { "❌ FAILED" }
      Write-Host "  $StackName : $Status" -ForegroundColor $(if ($DeploymentResults.Stacks[$StackName]) { "Green" } else { "Red" })
    }
    Write-Host ""
  }
  
  if (-not $InfrastructureOnly) {
    Write-Host "Services:" -ForegroundColor Cyan
    foreach ($Service in $ServicesToDeploy) {
      $Status = if ($DeploymentResults.Services[$Service.Name]) { "✅ SUCCESS" } else { "❌ FAILED" }
      Write-Host "  $($Service.Name) : $Status" -ForegroundColor $(if ($DeploymentResults.Services[$Service.Name]) { "Green" } else { "Red" })
    }
    Write-Host ""
  }
  
  # Check if all deployments succeeded
  $AllStacksSucceeded = if ($ServicesOnly) { $true } else {
    ($StacksToDeploy | ForEach-Object { $DeploymentResults.Stacks[$_] }) -notcontains $false
  }
  
  $AllServicesSucceeded = if ($InfrastructureOnly) { $true } else {
    ($ServicesToDeploy | ForEach-Object { $DeploymentResults.Services[$_.Name] }) -notcontains $false
  }
  
  if ($AllStacksSucceeded -and $AllServicesSucceeded) {
    Write-Log "All deployments completed successfully!" "INFO"
    Write-Host "✅ All deployments completed successfully!" -ForegroundColor Green
    exit 0
  } else {
    Write-Log "Some deployments failed. Check the summary above." "WARN"
    Write-Host "⚠️  Some deployments failed. Check the summary above." -ForegroundColor Yellow
    exit 1
  }
  
} catch {
  $ErrorMessage = "Error in master deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Log "Full error details: $($_.Exception.ToString())" "ERROR"
  Write-Host "`n❌ Master deployment failed!" -ForegroundColor Red
  throw
}

